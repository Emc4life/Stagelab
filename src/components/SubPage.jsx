import React from 'react';

export default function SubPage({ title, onBack, children }) {
    return (React.createElement("div", { style: { height: "calc(100dvh - 72px)", display: "flex", flexDirection: "column" }, className: "fade-in" },
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)" } },
            React.createElement("button", { onClick: onBack, style: { background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 18, cursor: "pointer" } }, "\u2190"),
            React.createElement("div", { style: { fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 20 } }, title)),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "20px 18px 40px" } }, children)));
}
