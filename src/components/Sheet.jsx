import React from 'react';

export default function Sheet({ children, onClose, height = "72vh" }) {
    return (React.createElement("div", { onClick: onClose, style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.76)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" } },
        React.createElement("div", { onClick: e => e.stopPropagation(), className: "overlay-enter", style: { background: "#120920", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, height, display: "flex", flexDirection: "column", padding: "16px 20px", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none" } },
            React.createElement("div", { style: { width: 36, height: 4, background: "rgba(255,255,255,0.02)", borderRadius: 2, margin: "0 auto 16px" } }),
            children)));
}
