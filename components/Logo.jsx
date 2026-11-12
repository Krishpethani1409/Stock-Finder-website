/* ================================
   WHAT IS THIS FILE?
   Logo.jsx — the official Stock Finder
   logo as a React SVG component.

   HOW TO USE IT?
   <Logo size="md" />          — medium (default, for navbar)
   <Logo size="lg" />          — large (for homepage hero)
   <Logo size="sm" />          — small (for footer)
   <Logo size="icon" />        — icon only, no text (for favicon)
   <Logo size="md" dark={false} /> — light background version

   WHY DO WE NEED IT?
   A professional SVG logo scales
   perfectly on all screen sizes,
   looks sharp on retina displays,
   and gives your platform identity.
================================ */

export default function Logo({ size = "md", showSlogan = false }) {

  const sizes = {
    icon: { w: 32,  h: 32,  iconW: 32,  iconH: 32,  fontSize: 0,  sloganSize: 0  },
    sm:   { w: 120, h: 32,  iconW: 28,  iconH: 28,  fontSize: 14, sloganSize: 0  },
    md:   { w: 160, h: 36,  iconW: 32,  iconH: 32,  fontSize: 16, sloganSize: 0  },
    lg:   { w: 240, h: 64,  iconW: 52,  iconH: 52,  fontSize: 22, sloganSize: 10 },
    xl:   { w: 320, h: 80,  iconW: 64,  iconH: 64,  fontSize: 28, sloganSize: 12 },
  };

  const d = sizes[size] || sizes.md;
  const gap = 10;
  const textX = d.iconW + gap;

  return (
    <svg
      width={size === "icon" ? d.iconW : d.w}
      height={d.h}
      viewBox={`0 0 ${size === "icon" ? d.iconW : d.w} ${d.h}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
    >
      <defs>
        {/* Main green-to-blue gradient for bars */}
        <linearGradient id="sfGradBar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#00D4AA" />
          <stop offset="100%" stopColor="#00b386" />
        </linearGradient>

        {/* Blue accent gradient */}
        <linearGradient id="sfGradBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#4f8fff" />
          <stop offset="100%" stopColor="#2962ff" />
        </linearGradient>

        {/* Red/orange gradient for down bar */}
        <linearGradient id="sfGradRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#ff6b6b" />
          <stop offset="100%" stopColor="#e5314a" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="sfGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Text gradient */}
        <linearGradient id="sfTextGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d1d4dc" />
        </linearGradient>
      </defs>

      {/* ── ICON MARK ── */}
      {/* Background rounded square */}
      <rect
        x="0" y={(d.h - d.iconH) / 2}
        width={d.iconH} height={d.iconH}
        rx={d.iconH * 0.2}
        fill="#131722"
        stroke="#2a2e3d"
        strokeWidth="1"
      />

      {/* Subtle inner glow */}
      <rect
        x="1" y={(d.h - d.iconH) / 2 + 1}
        width={d.iconH - 2} height={d.iconH - 2}
        rx={d.iconH * 0.18}
        fill="url(#sfGradBar)"
        opacity="0.06"
      />

      {/*
        CANDLESTICK CHART ICON
        5 bars representing a bullish stock chart
        with an upward trend line overlay
      */}
      {(() => {
        const iY    = (d.h - d.iconH) / 2;   /* icon top Y */
        const pad   = d.iconH * 0.18;         /* padding inside icon */
        const cW    = d.iconH - pad * 2;      /* chart width */
        const cH    = d.iconH - pad * 2;      /* chart height */
        const cX    = pad;                    /* chart left X */
        const cY    = iY + pad;              /* chart top Y */
        const bW    = cW / 7.5;             /* bar width */
        const gap2  = cW / 5;               /* gap between bars */

        /* Bar data: [relativeHeight, relativeBottom, isUp] */
        const bars = [
          { h:0.35, b:0.50, up:false },  /* bar 1 down */
          { h:0.45, b:0.30, up:true  },  /* bar 2 up   */
          { h:0.30, b:0.38, up:false },  /* bar 3 down */
          { h:0.55, b:0.15, up:true  },  /* bar 4 up   */
          { h:0.60, b:0.05, up:true  },  /* bar 5 up — highest, shows trend */
        ];

        /* Trend line points (top of each bar) */
        const linePoints = bars.map((b, i) => ({
          x: cX + i * gap2 + bW / 2,
          y: cY + cH - (b.b + b.h) * cH,
        }));

        const polyPts = linePoints.map(p => `${p.x},${p.y}`).join(" ");

        return (
          <g filter="url(#sfGlow)">
            {/* Candlestick bars */}
            {bars.map((b, i) => {
              const barX   = cX + i * gap2;
              const barTop = cY + cH - (b.b + b.h) * cH;
              const barBot = cY + cH - b.b * cH;
              const barH   = barBot - barTop;
              const grad   = b.up ? "url(#sfGradBar)" : "url(#sfGradRed)";

              return (
                <g key={i}>
                  {/* Wick line */}
                  <line
                    x1={barX + bW / 2} y1={barTop - 2}
                    x2={barX + bW / 2} y2={barBot + 2}
                    stroke={b.up ? "#00b38688" : "#e5314a88"}
                    strokeWidth="0.8"
                  />
                  {/* Candle body */}
                  <rect
                    x={barX} y={barTop}
                    width={bW} height={Math.max(barH, 2)}
                    rx="1"
                    fill={grad}
                  />
                </g>
              );
            })}

            {/* Trend line overlay */}
            <polyline
              points={polyPts}
              fill="none"
              stroke="url(#sfGradBlue)"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />

            {/* Dot at end of trend line */}
            <circle
              cx={linePoints[linePoints.length - 1].x}
              cy={linePoints[linePoints.length - 1].y}
              r="2"
              fill="#4f8fff"
            />
          </g>
        );
      })()}

      {/* ── WORDMARK ── (hidden in icon-only mode) */}
      {size !== "icon" && (
        <g>
          {/* "Stock" in white */}
          <text
            x={textX}
            y={d.h / 2 + (showSlogan ? -2 : d.fontSize * 0.35)}
            fontSize={d.fontSize}
            fontWeight="800"
            fontFamily="'Sora', 'Inter', -apple-system, sans-serif"
            fill="#ffffff"
            letterSpacing="-0.3"
          >
            Stock
          </text>

          {/* "Finder" in green */}
          <text
            x={textX + (size === "xl" ? 82 : size === "lg" ? 64 : size === "sm" ? 38 : 48)}
            y={d.h / 2 + (showSlogan ? -2 : d.fontSize * 0.35)}
            fontSize={d.fontSize}
            fontWeight="800"
            fontFamily="'Sora', 'Inter', -apple-system, sans-serif"
            fill="#00b386"
            letterSpacing="-0.3"
          >
            {" "}Finder
          </text>

          {/* Slogan — only shown when showSlogan=true or size is lg/xl */}
          {(showSlogan || size === "lg" || size === "xl") && d.sloganSize > 0 && (
            <text
              x={textX}
              y={d.h / 2 + d.fontSize * 0.55 + d.sloganSize + 2}
              fontSize={d.sloganSize}
              fontWeight="500"
              fontFamily="'Inter', -apple-system, sans-serif"
              fill="#787b86"
              letterSpacing="0.04em"
            >
              Invest Smarter, Every Day.
            </text>
          )}
        </g>
      )}
    </svg>
  );
}