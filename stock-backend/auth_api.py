# auth_api.py — Login + per-user portfolio storage  (FastAPI + SQLite, no extra installs)
#
#  POST /auth/register    {name, email, password}             -> create practice account + log in   [NO OTP, NO KYC]
#  POST /auth/guest                                           -> instant guest account + log in
#  POST /auth/login       {user_id, password}                 -> {token, client_id, name}      (user_id = Client ID or email)
#  GET  /auth/me          (Authorization: Bearer <token>)     -> who am I
#  POST /auth/logout
#  GET  /portfolio/state  (Bearer)                            -> this user's saved portfolio (or null)
#  PUT  /portfolio/state  (Bearer)  {state: {...}}            -> save this user's portfolio
#
#  Passwords are stored ONLY as salted scrypt hashes. Login tokens are stored only as SHA-256 hashes.
import json, time, hmac, secrets, hashlib, re
from datetime import datetime
from typing import Optional, Any, Dict
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import os, sqlite3

DB_PATH = os.environ.get("SF_DB_PATH", os.path.join(os.path.dirname(os.path.abspath(__file__)), "stockfinder.db"))

def db():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c

router = APIRouter()
SESSION_DAYS = 7
MAX_FAILS = 5
LOCK_SECONDS = 15 * 60

with db() as c:
    c.executescript("""
    CREATE TABLE IF NOT EXISTS users(
        client_id TEXT PRIMARY KEY, mobile TEXT UNIQUE, name TEXT, app_id TEXT,
        pw_hash TEXT, fails INTEGER DEFAULT 0, locked_until REAL DEFAULT 0, created_at TEXT);
    CREATE TABLE IF NOT EXISTS auth_sessions(token_hash TEXT PRIMARY KEY, client_id TEXT, expires REAL);
    CREATE TABLE IF NOT EXISTS portfolios(client_id TEXT PRIMARY KEY, state TEXT, updated_at TEXT);
    """)

def _hash_pw(pw: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.scrypt(pw.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32)
    return f"scrypt${salt.hex()}${dk.hex()}"

def _check_pw(pw: str, stored: str) -> bool:
    try:
        _, salt, want = stored.split("$")
        dk = hashlib.scrypt(pw.encode(), salt=bytes.fromhex(salt), n=2 ** 14, r=8, p=1, dklen=32)
        return hmac.compare_digest(dk.hex(), want)
    except Exception:
        return False

def _th(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def _user_from(authorization: Optional[str]):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Please log in")
    token = authorization.split(" ", 1)[1].strip()
    with db() as c:
        s = c.execute("SELECT * FROM auth_sessions WHERE token_hash=?", (_th(token),)).fetchone()
        if not s or s["expires"] < time.time():
            raise HTTPException(401, "Session expired. Please log in again.")
        u = c.execute("SELECT * FROM users WHERE client_id=?", (s["client_id"],)).fetchone()
    if not u:
        raise HTTPException(401, "Account not found")
    return u

class Login(BaseModel):
    user_id: str
    password: str

class StateBody(BaseModel):
    state: Dict[str, Any]

class Register(BaseModel):
    name: str
    email: str
    password: str

def _new_client_id(c) -> str:
    while True:
        cid = "SFD" + "".join(str(secrets.randbelow(10)) for _ in range(8))
        if not c.execute("SELECT 1 FROM users WHERE client_id=?", (cid,)).fetchone():
            return cid

def _issue(c, client_id: str) -> str:
    token = secrets.token_urlsafe(32)
    c.execute("INSERT INTO auth_sessions VALUES(?,?,?)", (_th(token), client_id, time.time() + SESSION_DAYS * 86400))
    return token

@router.post("/auth/register")
def register(b: Register):
    """Demo practice account: just name + email + password. The email is kept in the `mobile` column (it is only a login ID)."""
    name = re.sub(r"\s+", " ", b.name).strip()
    email = b.email.strip().lower()
    if not (2 <= len(name) <= 40):
        raise HTTPException(422, "Enter your name (2 to 40 letters)")
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email) or len(email) > 80:
        raise HTTPException(422, "Enter a valid email")
    if len(b.password) < 6:
        raise HTTPException(422, "Password must be at least 6 characters")
    with db() as c:
        if c.execute("SELECT 1 FROM users WHERE mobile=?", (email,)).fetchone():
            raise HTTPException(409, "This email already has an account. Please log in.")
        cid = _new_client_id(c)
        c.execute("INSERT INTO users(client_id,mobile,name,app_id,pw_hash,created_at) VALUES(?,?,?,?,?,?)",
                  (cid, email, name, "PRACTICE", _hash_pw(b.password), datetime.now().isoformat(timespec="seconds")))
        token = _issue(c, cid)
    return {"token": token, "client_id": cid, "name": name}

@router.post("/auth/guest")
def guest():
    """One-click guest account (no details). Old guests are deleted after 7 days."""
    cutoff = datetime.fromtimestamp(time.time() - SESSION_DAYS * 86400).isoformat(timespec="seconds")
    with db() as c:
        old = [r["client_id"] for r in c.execute("SELECT client_id FROM users WHERE app_id='GUEST' AND created_at<?", (cutoff,)).fetchall()]
        for cid in old:
            for tbl in ("auth_sessions", "portfolios", "users"):
                c.execute(f"DELETE FROM {tbl} WHERE client_id=?", (cid,))
        cid = _new_client_id(c)
        c.execute("INSERT INTO users(client_id,mobile,name,app_id,pw_hash,created_at) VALUES(?,?,?,?,?,?)",
                  (cid, f"guest-{secrets.token_hex(5)}@guest.local", "Guest", "GUEST", _hash_pw(secrets.token_urlsafe(16)), datetime.now().isoformat(timespec="seconds")))
        token = _issue(c, cid)
    return {"token": token, "client_id": cid, "name": "Guest"}

@router.post("/auth/login")
def login(b: Login):
    raw = b.user_id.strip()
    uid = raw.lower() if "@" in raw else (raw if raw.isdigit() else raw.upper())
    now = time.time()
    with db() as c:
        u = c.execute("SELECT * FROM users WHERE client_id=? OR mobile=?", (uid, uid)).fetchone()
        if not u:
            _check_pw(b.password, "scrypt$00$00")                         # keep timing similar
            raise HTTPException(401, "Wrong ID or password")
        if u["locked_until"] > now:
            raise HTTPException(429, f"Too many wrong attempts. Try again in {int((u['locked_until'] - now) // 60) + 1} minutes.")
        if not _check_pw(b.password, u["pw_hash"]):
            fails = u["fails"] + 1
            if fails >= MAX_FAILS:
                c.execute("UPDATE users SET fails=0, locked_until=? WHERE client_id=?", (now + LOCK_SECONDS, u["client_id"]))
                c.commit()   # save the lock BEFORE raising (an error inside `with` would roll it back)
                raise HTTPException(429, "Too many wrong attempts. Account locked for 15 minutes.")
            c.execute("UPDATE users SET fails=? WHERE client_id=?", (fails, u["client_id"]))
            c.commit()
            raise HTTPException(401, "Wrong ID or password")
        c.execute("UPDATE users SET fails=0 WHERE client_id=?", (u["client_id"],))
        token = _issue(c, u["client_id"])
    return {"token": token, "client_id": u["client_id"], "name": u["name"]}

@router.get("/auth/me")
def me(authorization: Optional[str] = Header(None)):
    u = _user_from(authorization)
    return {"client_id": u["client_id"], "name": u["name"], "contact": ("" if u["mobile"].endswith("@guest.local") else u["mobile"])}

@router.post("/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.lower().startswith("bearer "):
        with db() as c:
            c.execute("DELETE FROM auth_sessions WHERE token_hash=?", (_th(authorization.split(" ", 1)[1].strip()),))
    return {"ok": True}

@router.get("/portfolio/state")
def get_state(authorization: Optional[str] = Header(None)):
    u = _user_from(authorization)
    with db() as c:
        r = c.execute("SELECT state, updated_at FROM portfolios WHERE client_id=?", (u["client_id"],)).fetchone()
    return {"state": json.loads(r["state"]) if r else None, "updated_at": r["updated_at"] if r else None}

@router.put("/portfolio/state")
def put_state(b: StateBody, authorization: Optional[str] = Header(None)):
    u = _user_from(authorization)
    raw = json.dumps(b.state)
    if len(raw) > 800_000:
        raise HTTPException(413, "Portfolio too large")
    if "holdings" not in b.state or "cashBalance" not in b.state:
        raise HTTPException(422, "Not a portfolio")
    with db() as c:
        c.execute("INSERT OR REPLACE INTO portfolios VALUES(?,?,?)", (u["client_id"], raw, datetime.now().isoformat(timespec="seconds")))
    return {"ok": True}
