import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import Sheet from '../../components/Sheet';

function InboxOverlay({ messages, setMessages, onClose, show }) {
    const [thread, setThread] = useState(null);
    const [input, setInput] = useState("");
    const [dbMsgs, setDbMsgs] = useState([]);
    const [userId, setUserId] = useState(null);
    const endRef = useRef(null);
    const chanRef = useRef(null);
    useEffect(() => { var _a; (_a = endRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" }); }, [thread, dbMsgs]);
    // Load user + messages from Supabase
    useEffect(() => {
        supabase.auth.getUser().then(async ({ data }) => {
            if (!data.user)
                return;
            setUserId(data.user.id);
            // Load recent messages
            const { data: rows } = await supabase.from("messages")
                .select("*, sender:sender_id(name,handle,avatar_url), receiver:receiver_id(name,handle,avatar_url)")
                .order("created_at", { ascending: false })
                .limit(50);
            if (rows) {
                // Group by conversation partner
                const convMap = {};
                rows.forEach(m => {
                    const partnerId = m.sender_id === data.user.id ? m.receiver_id : m.sender_id;
                    const partner = m.sender_id === data.user.id ? m.receiver : m.sender;
                    if (!convMap[partnerId]) {
                        convMap[partnerId] = {
                            id: partnerId,
                            user: (partner === null || partner === void 0 ? void 0 : partner.name) || "Unknown",
                            avatar: ((partner === null || partner === void 0 ? void 0 : partner.name) || "U").slice(0, 2).toUpperCase(),
                            accent: "#c9a84c",
                            unread: 0,
                            msgs: [],
                        };
                    }
                    convMap[partnerId].msgs.push({
                        from: m.sender_id === data.user.id ? "me" : (partner === null || partner === void 0 ? void 0 : partner.name) || "them",
                        text: m.text,
                        time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    });
                    if (!m.read && m.receiver_id === data.user.id)
                        convMap[partnerId].unread++;
                });
                const convList = Object.values(convMap);
                // If user is logged in, always use DB messages (even if empty)
                setMessages(convList);
                setDbMsgs(rows);
            }
            // Subscribe to realtime new messages
            chanRef.current = supabase.channel && supabase.channel("inbox-" + data.user.id);
        });
        return () => { var _a, _b; return (_b = (_a = chanRef.current) === null || _a === void 0 ? void 0 : _a.unsubscribe) === null || _b === void 0 ? void 0 : _b.call(_a); };
    }, []);
    const markRead = (id) => {
        setMessages(p => p.map(m => m.id === id ? Object.assign(Object.assign({}, m), { unread: 0 }) : m));
        supabase.from("messages").update({ read: true }).eq("receiver_id", userId).eq("sender_id", id);
    };
    const sendMsg = async (conv) => {
        if (!input.trim())
            return;
        const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        const txt = input.trim();
        setMessages(p => p.map(m => m.id === conv.id
            ? Object.assign(Object.assign({}, m), { msgs: [...m.msgs, { from: "me", text: txt, time: ts }] }) : m));
        setInput("");
        if (userId) {
            supabase.from("messages").insert({ sender_id: userId, receiver_id: conv.id, text: txt });
        }
    };
    const conv = thread ? messages.find(m => m.id === thread) : null;
    return (React.createElement("div", { style: { position: "fixed", inset: 0, background: "#08080f", zIndex: 300, display: "flex", flexDirection: "column", paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" } },
        React.createElement("div", { style: { background: "linear-gradient(180deg,rgba(18,7,36,0.99),rgba(8,4,14,0.97))", padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" } },
            React.createElement("button", { onClick: () => { if (thread) setThread(null); else onClose(); }, style: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 18, cursor: "pointer", width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 } }, "\u2190"),
            conv ? (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { width: 36, height: 36, borderRadius: "50%", background: conv.accent + "33", border: `2px solid ${conv.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 } }, conv.avatar),
                React.createElement("div", null,
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 15, fontFamily: "'Cormorant Garamond',serif" } }, conv.user),
                    React.createElement("div", { style: { fontSize: 10, color: conv.accent } }, "Online")))) : (React.createElement(React.Fragment, null,
                React.createElement("div", { style: { fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, flex: 1 } }, "Inbox"),
                React.createElement("button", { onClick: () => show("New message started"), style: { background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 10, padding: "8px 12px", color: "#c9a84c", fontWeight: 700, fontSize: 12, cursor: "pointer" } }, "+ New")))),
        conv ? (React.createElement(React.Fragment, null,
            React.createElement("div", { style: { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 } },
                conv.msgs.map((m, i) => (React.createElement("div", { key: i, style: { display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" } },
                    m.from !== "me" && React.createElement("div", { style: { width: 28, height: 28, borderRadius: "50%", background: conv.accent + "33", border: `1.5px solid ${conv.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, flexShrink: 0 } }, conv.avatar),
                    React.createElement("div", { style: { maxWidth: "74%" } },
                        React.createElement("div", { style: { padding: "10px 14px", borderRadius: m.from === "me" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: m.from === "me" ? `linear-gradient(135deg,${conv.accent},${conv.accent}cc)` : "rgba(255,255,255,0.08)", color: m.from === "me" ? "#1a0a2e" : "#fff", fontSize: 14, lineHeight: 1.4 } }, m.text),
                        React.createElement("div", { style: { fontSize: 9, color: "rgba(255,255,255,0.26)", marginTop: 3, textAlign: m.from === "me" ? "right" : "left" } }, m.time))))),
                React.createElement("div", { ref: endRef })),
            React.createElement("div", { style: { padding: "10px 14px 28px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10 } },
                React.createElement("input", { value: input, onChange: e => setInput(e.target.value), onKeyDown: e => { if (e.key === "Enter")
                        sendMsg(conv); }, placeholder: "Message\u2026", style: { flex: 1, padding: "11px 13px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fff", fontSize: 13, outline: "none" } }),
                React.createElement("button", { onClick: () => sendMsg(conv), style: { padding: "11px 16px", background: conv.accent, color: "#1a0a2e", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer" } }, "Send")))) : (React.createElement("div", { style: { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" } }, messages.map(m => {
            var _a;
            return (React.createElement("div", { key: m.id, onClick: () => { setThread(m.id); markRead(m.id); }, style: { display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" } },
                React.createElement("div", { style: { position: "relative", flexShrink: 0 } },
                    React.createElement("div", { style: { width: 46, height: 46, borderRadius: "50%", background: m.accent + "33", border: `2px solid ${m.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 } }, m.avatar),
                    m.unread > 0 && React.createElement("div", { style: { position: "absolute", top: 0, right: 0, width: 18, height: 18, background: "#c9a84c", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#1a0a2e", border: "2px solid #08080f" } }, m.unread)),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 } },
                        React.createElement("span", { style: { fontWeight: m.unread > 0 ? 700 : 500, fontSize: 14, fontFamily: "'Cormorant Garamond',serif" } }, m.user),
                        React.createElement("span", { style: { fontSize: 10, color: "rgba(255,255,255,0.32)" } }, m.time)),
                    React.createElement("div", { style: { fontSize: 12, color: m.unread > 0 ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.35)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, (_a = m.msgs[m.msgs.length - 1]) === null || _a === void 0 ? void 0 : _a.text))));
        })))));
}
// ---------------------------- CASTING --------------------------------

export default InboxOverlay;
