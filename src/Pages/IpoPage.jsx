import React, { useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import { 
  ChevronRight, X, Clock, AlertCircle, Info, CheckCircle2, 
  ArrowRight, ShieldCheck, Tag, Building2, Calendar, FileText
} from 'lucide-react';

const IpoPage = () => {
  const [activeTab, setActiveTab] = useState('open-upcoming'); // 'open-upcoming' | 'applications'
  const [selectedIpo, setSelectedIpo] = useState(null); // Selected IPO for details drawer
  const [investorType, setInvestorType] = useState('retail'); // 'retail' | 'hni' | 'employee'

  // Open IPOs Data
  const openIpos = [
    {
      id: 'indo-mim',
      name: 'Indo-MIM Ltd',
      type: 'MAINBOARD',
      closesOn: '27 Jul 2026',
      subscription: '0.65x',
      biddingClosesIn: 'Bidding closes in 4 days',
      priceRange: '₹461.00 - ₹485.00',
      lotSize: '30 Shares',
      retailDiscount: '₹0.00',
      issueSize: '₹3,812.11 Cr',
      offerType: 'Mainboard',
      ipoType: 'Book Building',
      minInvestment: '₹13,830.00 / 1 Lot',
      maxInvestment: '₹1,89,150.00 / 13 Lots',
      dates: {
        starts: '23 Jul 2026',
        ends: '27 Jul 2026',
        allotment: '28 Jul 2026',
        listing: '30 Jul 2026',
      },
      about: 'We provide end-to-end solutions for the manufacture of precision engineering components using metal injection molding ("MIM") technology. Our capabilities include mold designing and tooling, coupled with finishing and assembly operations.',
      history: 'Our Company was originally incorporated as "A F Technologies India Private Limited" on April 12, 1996 at Hyderabad, Andhra Pradesh.'
    },
    {
      id: 'lohia-corp',
      name: 'Lohia Corp Ltd',
      type: 'MAINBOARD',
      closesOn: '27 Jul 2026',
      subscription: '0.18x',
      biddingClosesIn: 'Bidding closes in 4 days',
      priceRange: '₹440.00 - ₹470.00',
      lotSize: '30 Shares',
      retailDiscount: '₹0.00',
      issueSize: '₹1,250.00 Cr',
      offerType: 'Mainboard',
      ipoType: 'Book Building',
      minInvestment: '₹14,140.00 / 1 Lot',
      maxInvestment: '₹1,97,960.00 / 14 Lots',
      dates: {
        starts: '23 Jul 2026',
        ends: '27 Jul 2026',
        allotment: '28 Jul 2026',
        listing: '30 Jul 2026',
      },
      about: 'Lohia Corp Limited is a global leader in providing end-to-end solutions for technical textiles machinery manufacturing.',
      history: 'Incorporated in 1981, Lohia Corp has established a global presence in over 85 countries.'
    },
    {
      id: 'metalic-technoforge',
      name: 'Metalic Technoforge Ltd',
      type: 'SME',
      badge: 'Closing Today',
      closesOn: '23 Jul 2026',
      subscription: '2.08x',
      biddingClosesIn: 'Bidding closes today!',
      priceRange: '₹102.00 - ₹108.00',
      lotSize: '1200 Shares',
      retailDiscount: '₹0.00',
      issueSize: '₹45.20 Cr',
      offerType: 'SME',
      ipoType: 'Book Building',
      minInvestment: '₹1,29,600.00 / 1 Lot',
      maxInvestment: '₹1,29,600.00 / 1 Lot',
      dates: {
        starts: '21 Jul 2026',
        ends: '23 Jul 2026',
        allotment: '24 Jul 2026',
        listing: '28 Jul 2026',
      },
      about: 'Metalic Technoforge is engaged in manufacturing forged and machined components for automotive and industrial segments.',
      history: 'Founded in 2008 in Gujarat, India.'
    },
    {
      id: 'shree-balaji',
      name: 'Shree Balaji (Mala) Textiles Ltd',
      type: 'SME',
      closesOn: '24 Jul 2026',
      subscription: '12.33x',
      biddingClosesIn: 'Bidding closes tomorrow',
      priceRange: '₹75.00 - ₹80.00',
      lotSize: '1600 Shares',
      retailDiscount: '₹0.00',
      issueSize: '₹32.00 Cr',
      offerType: 'SME',
      ipoType: 'Book Building',
      minInvestment: '₹1,28,000.00 / 1 Lot',
      maxInvestment: '₹1,28,000.00 / 1 Lot',
      dates: {
        starts: '22 Jul 2026',
        ends: '24 Jul 2026',
        allotment: '27 Jul 2026',
        listing: '29 Jul 2026',
      },
      about: 'Shree Balaji Textiles specializes in high-quality synthetic yarn processing and fabric manufacturing.',
      history: 'Established in 2012 as a textile processing house.'
    }
  ];

  // Upcoming IPOs Data
  const upcomingIpos = [
    { name: 'Bonfiglioli Transmissions Ltd', type: 'MAINBOARD', offerStarts: 'To be announced', bidPrice: '₹0.00 - ₹0.00' },
    { name: 'Dhoot Transmission Ltd', type: 'MAINBOARD', offerStarts: 'To be announced', bidPrice: '₹0.00 - ₹0.00' },
    { name: 'Flipkart', type: 'MAINBOARD', offerStarts: 'To be announced', bidPrice: '₹0.00 - ₹0.00' },
    { name: 'Horizon Industrial Parks Ltd', type: 'MAINBOARD', offerStarts: 'To be announced', bidPrice: '₹0.00 - ₹0.00' },
    { name: 'Integris Medtech Ltd', type: 'MAINBOARD', offerStarts: 'To be announced', bidPrice: '₹0.00 - ₹0.00' },
    { name: 'National Stock Exchange (NSE)', type: 'MAINBOARD', offerStarts: 'To be announced', bidPrice: '₹0.00 - ₹0.00' },
    { name: 'Moneyview Ltd', type: 'MAINBOARD', offerStarts: 'To be announced', bidPrice: '₹0.00 - ₹0.00' },
    { name: 'PayU', type: 'MAINBOARD', offerStarts: 'To be announced', bidPrice: '₹0.00 - ₹0.00' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 font-sans pb-16 selection:bg-blue-600 selection:text-white">
      
      {/* 1. OFFICIAL WEBSITE NAVBAR */}
      <Navbar />

      {/* 2. HEADER TABS */}
      <div className="border-b border-slate-800/80 bg-[#0E1320] sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-8 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('open-upcoming')}
            className={`py-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'open-upcoming'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Open & Upcoming
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`py-4 border-b-2 transition-all cursor-pointer ${
              activeTab === 'applications'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Your Applications
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-8">
        {activeTab === 'open-upcoming' ? (
          <>
            {/* 1. OPEN IPOs SECTION */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-5">
                <h2 className="text-xl font-bold text-white tracking-wide">Open IPOs</h2>
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center border border-red-500/30">
                  {openIpos.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openIpos.map((ipo) => (
                  <div
                    key={ipo.id}
                    onClick={() => setSelectedIpo(ipo)}
                    className="bg-[#131927] border border-slate-800/90 hover:border-blue-500/40 rounded-xl p-5 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#1A2234] border border-slate-700/60 flex items-center justify-center text-[9px] font-bold text-slate-300 uppercase text-center p-1">
                            {ipo.name.substring(0, 6)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                {ipo.name}
                              </h3>
                              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-purple-300 bg-purple-900/40 border border-purple-500/30 px-1.5 py-0.5 rounded uppercase">
                                {ipo.type}
                              </span>
                              {ipo.badge && (
                                <span className="text-[10px] font-bold text-amber-300 bg-amber-900/40 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">
                                  {ipo.badge}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIpo(ipo);
                          }}
                          className="px-4 py-1.5 border border-blue-500/50 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                        >
                          APPLY
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-800/60">
                        <div>
                          <span className="text-slate-400 text-[11px] block">Closes On</span>
                          <span className="font-semibold text-slate-200">{ipo.closesOn}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[11px] block">Subscription</span>
                          <span className="font-bold text-emerald-400">{ipo.subscription}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* PROMO / REFERRAL BANNER */}
            <div className="my-8 bg-[#131927] border border-slate-800/80 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ₹
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Refer & Earn ₹2000</h4>
                  <p className="text-[11px] text-slate-400">Invite friends and earn after they sign up and start trading.</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>

            {/* 2. UPCOMING IPOs SECTION */}
            <section className="mt-10">
              <div className="flex items-center gap-2 mb-5">
                <h2 className="text-xl font-bold text-white tracking-wide">Upcoming IPOs</h2>
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center border border-slate-700">
                  {upcomingIpos.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {upcomingIpos.map((ipo, idx) => (
                  <div key={idx} className="bg-[#131927] border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="text-xs font-bold text-white">{ipo.name}</h3>
                          <span className="inline-block mt-1 text-[9px] font-bold text-purple-300 bg-purple-900/30 border border-purple-500/20 px-1.5 py-0.5 rounded uppercase">
                            {ipo.type}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-3 border-t border-slate-800/60">
                        <div>
                          <span className="text-slate-500 block">Offer Starts On</span>
                          <span className="font-semibold text-slate-300">{ipo.offerStarts}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 block">Bid Price Range</span>
                          <span className="font-semibold text-slate-300">{ipo.bidPrice}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* YOUR APPLICATIONS TAB */
          <div className="bg-[#131927] border border-slate-800/80 rounded-2xl p-12 text-center max-w-lg mx-auto my-12">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No Active IPO Applications</h3>
            <p className="text-xs text-slate-400 mb-6">
              When you apply for an active IPO, your application status and allotment details will appear here.
            </p>
            <button
              onClick={() => setActiveTab('open-upcoming')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Explore Open IPOs
            </button>
          </div>
        )}
      </div>

      {/* 3. SIDE DRAWER / MODAL FOR SELECTED IPO */}
      {selectedIpo && (
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn">
          {/* Backdrop click to close */}
          <div className="flex-1" onClick={() => setSelectedIpo(null)} />

          {/* Drawer Container */}
          <div className="w-full max-w-xl bg-[#0E1320] border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedIpo.name}</h2>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-900/40 border border-purple-500/30 px-2 py-0.5 rounded uppercase mt-1 inline-block">
                    {selectedIpo.type}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-blue-600/20 cursor-pointer">
                    APPLY NOW
                  </button>
                  <button
                    onClick={() => setSelectedIpo(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Investor Type Switcher */}
              <div className="mb-6">
                <span className="text-xs text-slate-400 block mb-2">Investor Type</span>
                <div className="flex bg-[#131927] p-1 rounded-xl border border-slate-800 w-fit">
                  {['retail', 'hni', 'employee'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setInvestorType(type)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg uppercase transition-all cursor-pointer ${
                        investorType === type ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing & Lot Info Grid */}
              <div className="grid grid-cols-3 gap-4 bg-[#131927] border border-slate-800/80 rounded-xl p-4 mb-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Bid Price Range</span>
                  <span className="font-bold text-white">{selectedIpo.priceRange}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Lot Size</span>
                  <span className="font-bold text-white">{selectedIpo.lotSize}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Retail Discount</span>
                  <span className="font-bold text-slate-300">{selectedIpo.retailDiscount}</span>
                </div>
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-slate-400 block mb-1">Issue Size</span>
                  <span className="font-bold text-white">{selectedIpo.issueSize}</span>
                </div>
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-slate-400 block mb-1">Offer Type</span>
                  <span className="font-bold text-white">{selectedIpo.offerType}</span>
                </div>
                <div className="pt-3 border-t border-slate-800">
                  <span className="text-slate-400 block mb-1">IPO Type</span>
                  <span className="font-bold text-white">{selectedIpo.ipoType}</span>
                </div>
              </div>

              {/* Investment Limits */}
              <div className="flex items-center justify-between text-xs bg-[#131927] border border-slate-800/80 rounded-xl p-3 mb-4">
                <div>
                  <span className="text-slate-400">Minimum Investment</span>
                  <div className="font-bold text-white mt-0.5">{selectedIpo.minInvestment}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Maximum Investment</span>
                  <div className="font-bold text-white mt-0.5">{selectedIpo.maxInvestment}</div>
                </div>
              </div>

              {/* Timer Alert */}
              <div className="flex items-center gap-2 bg-red-950/40 border border-red-800/50 text-red-400 text-xs px-3 py-2 rounded-xl mb-6">
                <Clock className="w-4 h-4 shrink-0" />
                <span>{selectedIpo.biddingClosesIn}</span>
              </div>

              {/* Important Dates Timeline */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-white mb-3">Important Dates</h3>
                <div className="grid grid-cols-4 gap-2 text-center bg-[#131927] border border-slate-800/80 rounded-xl p-4 text-[11px]">
                  <div>
                    <span className="text-slate-400 block mb-1">Offer Starts</span>
                    <span className="font-semibold text-slate-200">{selectedIpo.dates.starts}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Offer Ends</span>
                    <span className="font-semibold text-slate-200">{selectedIpo.dates.ends}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Allotment</span>
                    <span className="font-semibold text-slate-200">{selectedIpo.dates.allotment}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Listing</span>
                    <span className="font-semibold text-slate-200">{selectedIpo.dates.listing}</span>
                  </div>
                </div>
              </div>

              {/* Subscription Detail */}
              <div className="bg-[#131927] border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs mb-6">
                <span className="text-slate-400">Day 1 Overall Subscription</span>
                <span className="font-bold text-emerald-400">{selectedIpo.subscription}</span>
              </div>

              {/* About Company */}
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">About the Company</h3>
                  <p className="text-slate-400 leading-relaxed">{selectedIpo.about}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Company History</h3>
                  <p className="text-slate-400 leading-relaxed">{selectedIpo.history}</p>
                </div>
              </div>
            </div>

            {/* Bottom Apply Bar inside Drawer */}
            <div className="pt-6 border-t border-slate-800/80 mt-6">
              <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-blue-600/20 cursor-pointer">
                APPLY FOR IPO
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default IpoPage