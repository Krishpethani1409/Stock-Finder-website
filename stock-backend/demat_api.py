# demat_api.py — Open Demat Account backend (FastAPI + SQLite, no extra installs)
#
#  POST /demat/otp/send        {mobile}                       -> sends OTP (DEMO: OTP is returned + printed)
#  POST /demat/otp/verify      {mobile, otp}                  -> {token}
#  POST /demat/apply           {token, ...form}               -> {application_id, status, client_id}
#  GET  /demat/status/{id}?mobile=XXXXXXXXXX                  -> status of an application
#  Admin (header  X-Admin-Key: <DEMAT_ADMIN_KEY>):
#  GET  /demat/admin/applications
#  POST /demat/admin/{id}/approve      POST /demat/admin/{id}/reject
#
#  PRIVACY: full PAN, full Aadhaar and full bank account numbers are NEVER stored.
#           We keep masked values + last 4 digits, and a salted hash of PAN (duplicate check only).
import os, re, json, time, sqlite3, secrets, hashlib, random
from datetime import datetime, date
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

router = APIRouter()

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "demat.db")
SALT = os.environ.get("DEMAT_SALT", "change-this-salt-before-launch")
ADMIN_KEY = os.environ.get("DEMAT_ADMIN_KEY", "")                       # empty = admin routes disabled
AUTO_APPROVE = os.environ.get("DEMAT_AUTO_APPROVE", "1") == "1"         # demo: approve instantly
DEMO_OTP = os.environ.get("DEMAT_DEMO_OTP", "1") == "1"                 # demo: return OTP in response

def db():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c

def init():
    with db() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS otps(mobile TEXT PRIMARY KEY, otp_hash TEXT, expires REAL, attempts INTEGER, sent_log TEXT);
        CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, mobile TEXT, expires REAL);
        CREATE TABLE IF NOT EXISTS applications(
            id TEXT PRIMARY KEY, mobile TEXT, name TEXT, email TEXT, dob TEXT, gender TEXT,
            pan_masked TEXT, pan_hash TEXT UNIQUE, aadhaar_last4 TEXT,
            profile TEXT, bank TEXT, nominee TEXT, segments TEXT,
            status TEXT, client_id TEXT, created_at TEXT, updated_at TEXT, note TEXT);
        """)
init()

def h(x: str) -> str:
    return hashlib.sha256((SALT + x).encode()).hexdigest()

# ───────── validation ─────────
PAN_RE = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]$")
IFSC_RE = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")
MOBILE_RE = re.compile(r"^[6-9][0-9]{9}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def age_of(dob: str) -> int:
    try:
        d = datetime.strptime(dob, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(422, "Date of birth must be YYYY-MM-DD")
    t = date.today()
    return t.year - d.year - ((t.month, t.day) < (d.month, d.day))

# ───────── OTP ─────────
class OtpSend(BaseModel):
    mobile: str

class OtpVerify(BaseModel):
    mobile: str
    otp: str

@router.post("/demat/otp/send")
def otp_send(b: OtpSend):
    if not MOBILE_RE.match(b.mobile):
        raise HTTPException(422, "Enter a valid 10-digit Indian mobile number")
    now = time.time()
    with db() as c:
        row = c.execute("SELECT * FROM otps WHERE mobile=?", (b.mobile,)).fetchone()
        log = [t for t in json.loads(row["sent_log"]) if now - t < 3600] if row else []
        if len(log) >= 5:
            raise HTTPException(429, "Too many OTP requests. Try again in an hour.")
        if log and now - log[-1] < 25:
            raise HTTPException(429, "Please wait a few seconds before requesting another OTP.")
        otp = f"{random.SystemRandom().randint(0, 999999):06d}"
        log.append(now)
        c.execute("INSERT OR REPLACE INTO otps VALUES(?,?,?,?,?)", (b.mobile, h(otp), now + 300, 0, json.dumps(log)))
    # TODO (production): send `otp` with an SMS provider (MSG91 / Twilio / Fast2SMS) here.
    print(f"[DEMAT OTP] {b.mobile} -> {otp}")
    out = {"sent": True, "expires_in": 300}
    if DEMO_OTP:
        out["demo_otp"] = otp
    return out

@router.post("/demat/otp/verify")
def otp_verify(b: OtpVerify):
    now = time.time()
    with db() as c:
        row = c.execute("SELECT * FROM otps WHERE mobile=?", (b.mobile,)).fetchone()
        if not row or row["expires"] < now:
            raise HTTPException(400, "OTP expired. Please request a new one.")
        if row["attempts"] >= 5:
            raise HTTPException(429, "Too many wrong attempts. Request a new OTP.")
        if not secrets.compare_digest(row["otp_hash"], h(b.otp.strip())):
            c.execute("UPDATE otps SET attempts=attempts+1 WHERE mobile=?", (b.mobile,))
            raise HTTPException(400, "Incorrect OTP")
        c.execute("DELETE FROM otps WHERE mobile=?", (b.mobile,))
        token = secrets.token_urlsafe(32)
        c.execute("INSERT INTO sessions VALUES(?,?,?)", (token, b.mobile, now + 3600))
    return {"verified": True, "token": token}

# ───────── application ─────────
class Address(BaseModel):
    line1: str
    line2: str = ""
    city: str
    state: str
    pincode: str

class Bank(BaseModel):
    ifsc: str
    bank_name: str = ""
    branch: str = ""
    account_number: str
    account_type: str = "SAVINGS"

class Nominee(BaseModel):
    name: str
    relation: str
    dob: str

class Apply(BaseModel):
    token: str
    name: str
    email: str
    dob: str
    gender: str
    marital_status: str = ""
    father_name: str
    occupation: str
    income: str
    address: Address
    pan: str
    aadhaar: str
    pep: bool = False
    bank: Bank
    nominee: Optional[Nominee] = None
    segments: List[str] = ["EQUITY"]
    esign_name: str
    accept_terms: bool
    accept_risk: bool

def _mask(s: str, keep: int = 4) -> str:
    return "X" * max(0, len(s) - keep) + s[-keep:]

@router.post("/demat/apply")
def apply(a: Apply):
    now = time.time()
    with db() as c:
        sess = c.execute("SELECT * FROM sessions WHERE token=?", (a.token,)).fetchone()
        if not sess or sess["expires"] < now:
            raise HTTPException(401, "Session expired. Please verify your mobile number again.")
        mobile = sess["mobile"]
        pan = a.pan.strip().upper()
        aad = re.sub(r"\D", "", a.aadhaar)
        acct = re.sub(r"\D", "", a.bank.account_number)
        ifsc = a.bank.ifsc.strip().upper()

        errs = []
        if len(a.name.strip()) < 3: errs.append("Enter your full name")
        if not EMAIL_RE.match(a.email.strip()): errs.append("Enter a valid email")
        if age_of(a.dob) < 18: errs.append("You must be 18 or older")
        if not PAN_RE.match(pan): errs.append("PAN format is invalid (e.g. ABCDE1234F)")
        if len(aad) != 12: errs.append("Aadhaar must be 12 digits")
        if not IFSC_RE.match(ifsc): errs.append("IFSC code is invalid")
        if not (9 <= len(acct) <= 18): errs.append("Bank account number must be 9-18 digits")
        if not re.fullmatch(r"[1-9][0-9]{5}", a.address.pincode): errs.append("Pincode must be 6 digits")
        if not (a.accept_terms and a.accept_risk): errs.append("Please accept the terms and risk disclosure")
        if a.esign_name.strip().lower() != a.name.strip().lower(): errs.append("E-sign name must match your full name")
        if a.nominee and age_of(a.nominee.dob) < 0: errs.append("Nominee date of birth is invalid")
        if errs:
            raise HTTPException(422, "; ".join(errs))

        if c.execute("SELECT 1 FROM applications WHERE pan_hash=?", (h(pan),)).fetchone():
            raise HTTPException(409, "An application with this PAN already exists. Use 'Check status' instead.")

        app_id = "SF" + datetime.now().strftime("%y%m%d") + secrets.token_hex(3).upper()
        status, client_id = "UNDER_REVIEW", None
        if AUTO_APPROVE:
            status, client_id = "APPROVED", "SFD" + str(random.SystemRandom().randint(10**7, 10**8 - 1))
        ts = datetime.now().isoformat(timespec="seconds")
        profile = {"marital_status": a.marital_status, "father_name": a.father_name, "occupation": a.occupation,
                   "income": a.income, "address": a.address.dict(), "pep": a.pep}
        bank = {"ifsc": ifsc, "bank_name": a.bank.bank_name, "branch": a.bank.branch,
                "account_masked": _mask(acct), "account_type": a.bank.account_type}
        c.execute("INSERT INTO applications VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (
            app_id, mobile, a.name.strip(), a.email.strip(), a.dob, a.gender,
            pan[:2] + "XXXXX" + pan[7:], h(pan), aad[-4:],
            json.dumps(profile), json.dumps(bank), json.dumps(a.nominee.dict() if a.nominee else None),
            json.dumps(a.segments), status, client_id, ts, ts, ""))
        c.execute("DELETE FROM sessions WHERE token=?", (a.token,))
    return {"application_id": app_id, "status": status, "client_id": client_id, "name": a.name.strip()}

@router.get("/demat/status/{app_id}")
def status(app_id: str, mobile: str):
    with db() as c:
        r = c.execute("SELECT * FROM applications WHERE id=? AND mobile=?", (app_id.strip().upper(), mobile)).fetchone()
    if not r:
        raise HTTPException(404, "No application found for this ID and mobile number")
    return {"application_id": r["id"], "name": r["name"], "status": r["status"], "client_id": r["client_id"],
            "created_at": r["created_at"], "updated_at": r["updated_at"], "note": r["note"],
            "pan": r["pan_masked"], "aadhaar": "XXXX XXXX " + r["aadhaar_last4"],
            "bank": json.loads(r["bank"]).get("account_masked")}

# ───────── admin ─────────
def _admin(key: Optional[str]):
    if not ADMIN_KEY:
        raise HTTPException(403, "Admin is disabled. Set the DEMAT_ADMIN_KEY environment variable.")
    if not key or not secrets.compare_digest(key, ADMIN_KEY):
        raise HTTPException(401, "Bad admin key")

@router.get("/demat/admin/applications")
def admin_list(x_admin_key: Optional[str] = Header(None)):
    _admin(x_admin_key)
    with db() as c:
        rows = c.execute("SELECT id,mobile,name,email,pan_masked,status,client_id,created_at FROM applications ORDER BY created_at DESC").fetchall()
    return {"count": len(rows), "applications": [dict(r) for r in rows]}

def _set(app_id, status, x_admin_key):
    _admin(x_admin_key)
    with db() as c:
        r = c.execute("SELECT id FROM applications WHERE id=?", (app_id,)).fetchone()
        if not r:
            raise HTTPException(404, "Not found")
        cid = "SFD" + str(random.SystemRandom().randint(10**7, 10**8 - 1)) if status == "APPROVED" else None
        c.execute("UPDATE applications SET status=?, client_id=COALESCE(client_id,?), updated_at=? WHERE id=?",
                  (status, cid, datetime.now().isoformat(timespec="seconds"), app_id))
    return {"ok": True, "status": status}

@router.post("/demat/admin/{app_id}/approve")
def admin_approve(app_id: str, x_admin_key: Optional[str] = Header(None)):
    return _set(app_id, "APPROVED", x_admin_key)

@router.post("/demat/admin/{app_id}/reject")
def admin_reject(app_id: str, x_admin_key: Optional[str] = Header(None)):
    return _set(app_id, "REJECTED", x_admin_key)
