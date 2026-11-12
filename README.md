# 📈 Stock Finder

An all-in-one Indian stock market platform with live stock tracking, interactive charts, market insights, stock screeners, IPO updates, mutual funds, trading tools and investment calculators, all in one place.

## ✨ Features

- Live stock tracking with a scrolling ticker tape
- Real-time market indices in the navbar
- Interactive TradingView charts
- Stock screeners to find stocks quickly
- IPO updates
- Mutual funds information
- Investment calculators
- Responsive, modern UI

## 🛠️ Tech Stack

| Area | Technology |
|------|------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js |
| Charts | TradingView widgets |
| Tools | Git, GitHub, npm |

## 📁 Project Structure

```
Stock-Finder-website/
├── public/          # Static assets
├── src/             # React source code
├── components/      # Reusable UI components
├── stock-backend/   # Backend server
├── index.html
├── package.json
└── vite.config.js
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

### 1. Clone the repository
```bash
git clone https://github.com/Krishpethani1409/Stock-Finder-website.git
cd Stock-Finder-website
```

### 2. Run the frontend
```bash
npm install
npm run dev
```
Open the link shown in the terminal (usually `http://localhost:5173`).

### 3. Run the backend
Open a second terminal:
```bash
cd stock-backend
npm install
npm start
```

## 🔐 Environment Variables

If the backend needs API keys, create a `.env` file inside `stock-backend/` (never upload this file to GitHub):

```
API_KEY=your_api_key_here
PORT=5000
```

## 🔮 Future Improvements

- User login and watchlists
- Portfolio tracking
- Price alerts
- Dark/light theme toggle

## 👤 Author

**Krish Pethani**
GitHub: [@Krishpethani1409](https://github.com/Krishpethani1409)

⭐ If you like this project, give it a star!
