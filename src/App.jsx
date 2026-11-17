import { Routes, Route } from "react-router-dom";
import Homepage          from "./Pages/HomePage.jsx";
import StockDetail       from "./Pages/StockDetail.jsx";
import ScreenerSearch    from "./Pages/ScreenerSearch.jsx";
import ScreenerResult    from "./Pages/ScreenerResult.jsx";
import MarketsPage       from "./Pages/MarketsPage2.jsx";
import OpenDemat         from "./Pages/OpenDemat.jsx";
import TradePage         from "./Pages/TradePage.jsx";
import Calculator        from "./Pages/Calculator.jsx";
import ToolsPage         from "./Pages/ToolsPage.jsx";
import Mutualfund        from "./Pages/Mutualfund.jsx";
import IpoPage           from "./Pages/IpoPage.jsx";
import TickerTape        from "./components/TickerTape.jsx";
import PortfolioPage     from "./Pages/Portfolio.jsx";
import AdminDemat from "./Pages/AdminDemat.jsx";
// import MarketsAngelOne from "./Pages/MarketsAngelOne.jsx";



export default function App() {
  return (
    <Routes>
      <Route path="/"                 element={<Homepage />}       />
      <Route path="/stock/:symbol"    element={<StockDetail />}    />
      <Route path="/admin-demat" element={<AdminDemat />} />
      <Route path="/screener"         element={<ScreenerSearch />} />
      <Route path="/screener/:symbol" element={<ScreenerResult />} />
      <Route path="/markets"          element={<MarketsPage />}    />
      <Route path="/open-demat"       element={<OpenDemat />}      />
      <Route path="/tradeone"         element={<TradePage/>}       />
      <Route path="/calculator"       element={<Calculator/>}      />
      <Route path="/Mutualfund"       element={<Mutualfund />}     />
      <Route path="/tools"            element={<ToolsPage />}      />
      <Route path="/IpoPage"          element={<IpoPage />}        />
      <Route path="/TickerTape"       element={<TickerTape />}        />
      {/* <Route path="/markets2" element={<MarketsAngelOne />} /> */}
      <Route path="/Portfolio" element={<PortfolioPage />} />
    </Routes>
  );
}