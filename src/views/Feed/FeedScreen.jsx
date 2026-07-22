import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import HLSVideo from '../../components/HLSVideo';
import { notify } from '../../utils/notifications';

// Standard helpers used in feed cards
const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
const TIERS = {
    silver: { name: "Silver", color: "#c0c0c0", price: "$4.99" },
    gold: { name: "Gold", color: "#f5c518", price: "$9.99" },
    platinum: { name: "Platinum", color: "#e5e5e5", price: "$19.99" }
};
const GIFTS = [
    { icon: "🎭", name: "Bravo!", cost: 10 },
    { icon: "💐", name: "Bouquet", cost: 50 },
    { icon: "✨", name: "Star Dust", cost: 100 },
    { icon: "👑", name: "Royal Standing Ovation", cost: 500 }
];

function FeedScreen({ videos, setVideos, comments, setComments, show, onViewUser }) {
    const [cur, setCur] = useState(0);
    const [liked, setLiked] = useState({});
    const [reposted, setReposted] = useState({});
    const [modal, setModal] = useState(null);
    const touchY = useRef(null);
    // Load real posts from Supabase on mount (filtering out blocked users)
    useEffect(() => {
        (async () => {
            // Get blocked user ids first
            let blockedIds = [];
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: bl } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id);
                    blockedIds = (bl || []).map(b => b.blocked_id);
                }
            } catch (e) {}
            supabase.from("posts")
            .select("*, profiles(name,handle,avatar_url,role)")
            .eq("visibility", "public")
            .order("created_at", { ascending: false })
            .limit(30)
            .then(({ data, error }) => {
            if (error) {
                console.error("Feed load error:", error);
                return;
            }
            if (data && blockedIds.length) {
                data = data.filter(p => !blockedIds.includes(p.user_id));
            }
            if (data && data.length > 0) {
                const ACCENTS = ["#c9a84c", "#4cb8c4", "#e8a87c", "#a084e8", "#e8507c", "#50c8a8"];
                const mapped = data.map((p, i) => {
                    var _a, _b, _c, _d, _e;
                    return ({
                        // Include ALL post types - video, audio, lyrics, poster
                        id: p.id,
                        creator: ((_a = p.profiles) === null || _a === void 0 ? void 0 : _a.name) || "Unknown",
                        handle: ((_b = p.profiles) === null || _b === void 0 ? void 0 : _b.handle) || "@user",
                        role: ((_c = p.profiles) === null || _c === void 0 ? void 0 : _c.role) || "",
                        avatar: (((_d = p.profiles) === null || _d === void 0 ? void 0 : _d.name) || "U").slice(0, 2).toUpperCase(),
                        avatar_url: ((_e = p.profiles) === null || _e === void 0 ? void 0 : _e.avatar_url) || null,
                        title: p.title,
                        caption: p.caption || "",
                        type: p.type || "video",
                        category: p.category || "",
                        likes: p.likes || 0,
                        comments: 0,
                        shares: p.shares || 0,
                        reposts: 0,
                        gifts: 0,
                        media_url: p.media_url || null,
                        thumbnail_url: p.thumbnail_url || null,
                        collab_open: p.collab_open || false,
                        accent: ACCENTS[i % ACCENTS.length],
                        bg: "linear-gradient(160deg,#1a0a2e,#2d1040)",
                        note: "\u266a",
                        tier: "silver",
                    });
                });
                // Prepend DB posts before sample data
                setVideos(prev => {
                    const existingIds = new Set(prev.map(v => v.id));
                    const newPosts = mapped.filter(m => !existingIds.has(m.id));
                    return [...newPosts, ...prev];
                });
            }
        });
        })();
    }, []);
    // Load which posts current user has liked
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: likeRows } = await supabase.from("likes").select("post_id").eq("user_id", user.id);
            if (likeRows) {
                const map = {};
                likeRows.forEach(r => { map[r.post_id] = true; });
                setLiked(map);
            }
        })();
    }, []);
    const swipe = (d) => {
        if (d === "up")
            setCur(p => Math.min(p + 1, videos.length - 1));
        if (d === "down")
            setCur(p => Math.max(p - 1, 0));
    };
    const toggleLike = async (vid) => {
        const was = liked[vid.id];
        setLiked(p => (Object.assign(Object.assign({}, p), { [vid.id]: !p[vid.id] })));
        setVideos(p => p.map(v => v.id === vid.id ? Object.assign(Object.assign({}, v), { likes: v.likes + (was ? -1 : 1) }) : v));
        const { data: { user } } = await supabase.auth.getUser();
        if (!user)
            return;
        if (was) {
            supabase.from("likes").delete().eq("post_id", vid.id).eq("user_id", user.id);
        }
        else {
            supabase.from("likes").insert({ post_id: vid.id, user_id: user.id });
        }
    };
    const doRepost = (vid) => {
        if (reposted[vid.id])
            return;
        setReposted(p => (Object.assign(Object.assign({}, p), { [vid.id]: true })));
        setVideos(p => p.map(v => v.id === vid.id ? Object.assign(Object.assign({}, v), { reposts: v.reposts + 1 }) : v));
        show("\u21bb Reposted to your followers!");
    };
    const doShare = (vid) => {
        setVideos(p => p.map(v => v.id === vid.id ? Object.assign(Object.assign({}, v), { shares: v.shares + 1 }) : v));
        show("\u2197 Link copied!");
    };
    const doGift = (vid, gift) => {
        setVideos(p => p.map(v => v.id === vid.id ? Object.assign(Object.assign({}, v), { gifts: v.gifts + 1 }) : v));
        show(`${gift.emoji} Sent a ${gift.label} to ${vid.creator.split(" ")[0]}! ($${gift.amount})`);
        setModal(null);
    };
    const doSubscribe = (videoId) => {
        setVideos(p => p.map(v => v.id === videoId ? Object.assign(Object.assign({}, v), { subscribed: true }) : v));
        setTimeout(() => setModal(null), 2200);
    };
    const addComment = async (vidId, text) => {
        const nc = { id: Date.now(), user: "Alex Rivera", avatar: "AR", text, time: "now", likes: 0, liked: false };
        setComments(p => (Object.assign(Object.assign({}, p), { [vidId]: [...(p[vidId] || []), nc] })));
        setVideos(p => p.map(v => v.id === vidId ? Object.assign(Object.assign({}, v), { comments: v.comments + 1 }) : v));
        const { data: { user } } = await supabase.auth.getUser();
        if (user)
            supabase.from("comments").insert({ post_id: vidId, user_id: user.id, text });
    };
    return (React.createElement("div", { style: { height: "calc(100dvh - 72px)", position: "relative", overflow: "hidden" }, onWheel: e => { if (e.deltaY > 28)
            swipe("up"); if (e.deltaY < -28)
            swipe("down"); }, onTouchStart: e => { touchY.current = e.touches[0].clientY; }, onTouchEnd: e => { const d = touchY.current - e.changedTouches[0].clientY; if (d > 40)
            swipe("up"); if (d < -40)
            swipe("down"); } },
        videos.map((vid, idx) => {
            var _a;
            return (React.createElement(VideoCard, { key: vid.id, vid: vid, active: idx === cur, offset: idx - cur, liked: !!liked[vid.id], reposted: !!reposted[vid.id], commentCount: ((_a = comments[vid.id]) === null || _a === void 0 ? void 0 : _a.length) || 0, onLike: () => toggleLike(vid), onComment: () => setModal({ type: "comments", vid }), onShare: () => doShare(vid), onRepost: () => doRepost(vid), onGift: () => setModal({ type: "gift", vid }), onSubscribe: () => setModal({ type: "subscribe", vid }), onProfile: () => setModal({ type: "profile", vid }) }));
        }),
        React.createElement("div", { style: { position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 6 } }, videos.map((_, i) => React.createElement("div", { key: i, onClick: () => setCur(i), style: { width: 4, height: i === cur ? 20 : 4, borderRadius: 3, background: i === cur ? "#c9a84c" : "rgba(255,255,255,0.25)", cursor: "pointer", transition: "height 0.2s" } }))),
        React.createElement("div", { style: { position: "absolute", bottom: 6, left: 0, right: 0, textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.25)" } }, "Swipe up for next"),
        (modal === null || modal === void 0 ? void 0 : modal.type) === "comments" && React.createElement(CommentsModal, { vid: modal.vid, comments: comments[modal.vid.id] || [], onAdd: (t) => addComment(modal.vid.id, t), onClose: () => setModal(null) }),
        (modal === null || modal === void 0 ? void 0 : modal.type) === "gift" && React.createElement(GiftModal, { vid: modal.vid, onGift: (g) => doGift(modal.vid, g), onClose: () => setModal(null) }),
        (modal === null || modal === void 0 ? void 0 : modal.type) === "subscribe" && React.createElement(SubscribeModal, { vid: modal.vid, onSubscribe: doSubscribe, onClose: () => setModal(null) }),
        (modal === null || modal === void 0 ? void 0 : modal.type) === "profile" && React.createElement(CreatorModal, { vid: modal.vid, onSubscribe: () => setModal({ type: "subscribe", vid: modal.vid }), onClose: () => setModal(null) })));
}
function VideoCard({ vid, active, offset, liked, reposted, commentCount, onLike, onComment, onShare, onRepost, onGift, onSubscribe, onProfile }) {
    const ty = offset * 100;
    const vidRef = useRef(null);
    const audRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    // Auto-play when card becomes active
    useEffect(() => {
        if (active && vid.media_url) {
            if (vid.type === "video" && vidRef.current) {
                vidRef.current.play().catch(() => { });
                setPlaying(true);
            }
            else if (vid.type === "audio" && audRef.current) {
                audRef.current.play().catch(() => { });
                setPlaying(true);
            }
        }
        else {
            if (vidRef.current) {
                vidRef.current.pause();
            }
            if (audRef.current) {
                audRef.current.pause();
            }
            setPlaying(false);
        }
    }, [active]);
    const togglePlay = () => {
        if (vid.type === "video" && vidRef.current) {
            vidRef.current.paused ? vidRef.current.play() : vidRef.current.pause();
            setPlaying(p => !p);
        }
        else if (vid.type === "audio" && audRef.current) {
            audRef.current.paused ? audRef.current.play() : audRef.current.pause();
            setPlaying(p => !p);
        }
    };
    return (React.createElement("div", { style: { position: "absolute", inset: "7px 11px", borderRadius: 20, overflow: "hidden", background: vid.bg, transform: `translateY(${ty}%)`, transition: "transform 0.38s cubic-bezier(0.32,0.72,0,1)", willChange: "transform" } },
        React.createElement("div", { style: { position: "absolute", inset: 0 }, onClick: togglePlay },
            vid.type === "video" && vid.media_url && (React.createElement(HLSVideo, { vidRef: vidRef, src: vid.media_url, style: { width: "100%", height: "100%", objectFit: "cover", display: "block" }, playsInline: true, loop: true, muted: false, poster: vid.thumbnail_url || undefined })),
            vid.type === "audio" && vid.media_url && (React.createElement("audio", { ref: audRef, src: vid.media_url, loop: true })),
            vid.type !== "video" && vid.thumbnail_url && (React.createElement("img", { loading: "lazy", decoding: "async", src: vid.thumbnail_url, style: { width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 } }))),
        (vid.type === "audio" || !vid.media_url) && (React.createElement("div", { style: { position: "absolute", top: "30%", left: 0, right: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 3, height: 76, pointerEvents: "none" } }, Array.from({ length: 28 }).map((_, i) => (React.createElement("div", { key: i, className: active && playing ? "bar" : "", style: { width: 7, borderRadius: 4, height: `${18 + Math.sin(i * 0.7) * 14}px`, background: `linear-gradient(to top, ${vid.accent}, ${vid.accent}88)`, transformOrigin: "bottom" } }))))),
        vid.type === "video" && vid.media_url && !playing && (React.createElement("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" } },
            React.createElement("div", { style: { width: 56, height: 56, borderRadius: "50%", background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 } }, "\u25B6"))),
        React.createElement("div", { style: { position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.55)", borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.8)" } }, vid.type === "video" ? "\u25b6 VIDEO" : vid.type === "lyrics" ? "\uD83D\uDCDD LYRICS" : "\uD83C\uDFB5 AUDIO"),
        React.createElement("div", { style: { position: "absolute", bottom: 0, left: 0, right: 54, padding: "0 15px 15px", background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 100%)" } },
            React.createElement("div", { onClick: () => vid.user_id && onViewUser && onViewUser(vid.user_id), style: { display: "flex", alignItems: "center", gap: 9, marginBottom: 8, cursor: "pointer" } },
                React.createElement("div", { style: { width: 38, height: 38, borderRadius: "50%", background: vid.accent + "33", border: `2px solid ${vid.accent}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 } }, vid.avatar_url
                    ? React.createElement("img", { loading: "lazy", decoding: "async", src: vid.avatar_url, style: { width: "100%", height: "100%", objectFit: "cover" } })
                    : vid.avatar),
                React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                    React.createElement("div", { style: { fontWeight: 700, fontSize: 14, fontFamily: "'Cormorant Garamond',serif" } }, vid.creator),
                    React.createElement("div", { style: { fontSize: 11, color: "rgba(255,255,255,0.42)" } },
                        vid.handle,
                        vid.role ? " \u00b7 " + vid.role : "")),
                !vid.subscribed
                    ? React.createElement("button", { onClick: e => { e.stopPropagation(); onSubscribe(); }, style: { flexShrink: 0, padding: "5px 12px", background: vid.accent, border: "none", borderRadius: 20, color: "#1a0a2e", fontWeight: 700, fontSize: 11, cursor: "pointer" } }, "Subscribe")
                    : React.createElement("span", { style: { flexShrink: 0, fontSize: 11, fontWeight: 700, color: vid.accent } }, "\u2713 Subscribed")),
            React.createElement("div", { style: { fontSize: 14, fontWeight: 500, fontFamily: "'Cormorant Garamond',serif", lineHeight: 1.4, color: "rgba(255,255,255,0.88)" } }, vid.title),
            vid.caption ? React.createElement("div", { style: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4, lineHeight: 1.4 } }, vid.caption) : null,
            vid.collab_open && React.createElement("div", { style: { fontSize: 10, color: vid.accent, marginTop: 6, fontWeight: 700, letterSpacing: "0.05em" } }, "\uD83C\uDFAD OPEN FOR COLLAB")),
        React.createElement("div", { style: { position: "absolute", bottom: 14, right: 8, display: "flex", flexDirection: "column", gap: 14, alignItems: "center" } },
            React.createElement(Btn, { icon: liked ? "\u2665" : "\u2661", label: fmt(vid.likes), onClick: onLike, accent: vid.accent, active: liked }),
            React.createElement(Btn, { icon: "\uD83D\uDCAC", label: commentCount, onClick: onComment, accent: vid.accent }),
            React.createElement(Btn, { icon: "\u2197", label: fmt(vid.shares), onClick: onShare, accent: vid.accent }),
            React.createElement(Btn, { icon: "\u21BB", label: fmt(vid.reposts), onClick: onRepost, accent: vid.accent, active: reposted }),
            React.createElement(Btn, { icon: "\uD83C\uDF81", label: fmt(vid.gifts), onClick: onGift, accent: vid.accent }))));
}
const Btn = ({ icon, label, onClick, accent, active }) => (React.createElement("button", { onClick: onClick, style: { background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 } },
    React.createElement("div", { style: { width: 42, height: 42, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", background: active ? accent + "33" : "rgba(0,0,0,0.4)", fontSize: 20, color: active ? accent : "#fff", border: active ? `1px solid ${accent}55` : "none" } }, icon),
    React.createElement("span", { style: { fontSize: 9, color: "rgba(255,255,255,0.48)", letterSpacing: "0.04em" } }, label)));
// -- Comments Modal --------------------------------------------------
function CommentsModal({ vid, comments, onAdd, onClose }) {
    const [text, setText] = useState("");
    const [localComments, setLocalComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [me, setMe] = useState(null);
    const [myProfile, setMyProfile] = useState(null);
    const endRef = useRef(null);
    useEffect(() => { var _a; (_a = endRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" }); }, [localComments]);
    // Load user + comments for this post from Supabase
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setMe(user);
            if (user) {
                const { data: prof } = await supabase.from("profiles").select("name,handle,avatar_url").eq("id", user.id).single();
                if (prof) setMyProfile(prof);
            }
            // Only load real comments for posts that have a real DB id (not local-* or seed numeric)
            if (typeof vid.id === "string" && vid.id.length > 20) {
                const { data: rows } = await supabase.from("comments")
                    .select("*, author:user_id(name,avatar_url)")
                    .eq("post_id", vid.id)
                    .order("created_at", { ascending: true });
                if (rows) {
                    setLocalComments(rows.map(c => {
                        var _a, _b;
                        return {
                            id: c.id,
                            user: ((_a = c.author) === null || _a === void 0 ? void 0 : _a.name) || "User",
                            avatar: (((_b = c.author) === null || _b === void 0 ? void 0 : _b.name) || "U").slice(0, 2).toUpperCase(),
                            text: c.text,
                            time: new Date(c.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
                            likes: 0, liked: false,
                        };
                    }));
                }
            } else if (Array.isArray(comments)) {
                setLocalComments(comments);
            }
            setLoading(false);
        })();
    }, [vid.id]);
    const submit = async () => {
        const trimmed = text.trim();
        if (!trimmed) return;
        const tempId = "tmp-" + Date.now();
        const newComment = {
            id: tempId,
            user: (myProfile === null || myProfile === void 0 ? void 0 : myProfile.name) || "You",
            avatar: ((myProfile === null || myProfile === void 0 ? void 0 : myProfile.name) || "Y").slice(0, 2).toUpperCase(),
            text: trimmed, time: "now", likes: 0, liked: false,
        };
        setLocalComments(p => [...p, newComment]);
        onAdd(trimmed);
        setText("");
        // Save to DB if we have a user and this is a real post
        if (me && typeof vid.id === "string" && vid.id.length > 20) {
            const { data: row, error } = await supabase.from("comments").insert({
                post_id: vid.id, user_id: me.id, text: trimmed,
            });
            if (error) console.warn("Comment save failed:", error);
            else if (vid.user_id && vid.user_id !== me.id) {
                notify({ userId: vid.user_id, type: "comment", title: "New comment", body: trimmed.slice(0, 60), link: "feed" });
            }
            else if (row && row[0]) {
                setLocalComments(p => p.map(c => c.id === tempId ? Object.assign(Object.assign({}, c), { id: row[0].id }) : c));
            }
        }
    };
    const toggleLike = (id) => {
        setLocalComments(p => p.map(c => c.id === id ? Object.assign(Object.assign({}, c), { liked: !c.liked, likes: c.likes + (c.liked ? -1 : 1) }) : c));
    };
    return (React.createElement(Sheet, { onClose: onClose, height: "76vh" },
        React.createElement("div", { style: { fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 20, marginBottom: 16 } }, "Comments"),
        React.createElement("div", { style: { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingRight: 4 } },
            loading && React.createElement("div", { style: { textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 32 } }, "Loading\u2026"),
            !loading && localComments.length === 0 && React.createElement("div", { style: { textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 32 } }, "No comments yet. Be first! \u2728"),
            localComments.map(c => (React.createElement("div", { key: c.id, style: { display: "flex", gap: 10, marginBottom: 18 } },
                React.createElement("div", { style: { width: 33, height: 33, borderRadius: "50%", background: `${vid.accent}33`, border: `1.5px solid ${vid.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 } }, c.avatar),
                React.createElement("div", { style: { flex: 1 } },
                    React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 3 } },
                        React.createElement("span", { style: { fontWeight: 700, fontSize: 13 } }, c.user),
                        React.createElement("span", { style: { fontSize: 10, color: "rgba(255,255,255,0.32)" } }, c.time)),
                    React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: 1.5 } }, c.text),
                    React.createElement("button", { onClick: () => toggleLike(c.id), style: { marginTop: 5, background: "none", border: "none", color: c.liked ? vid.accent : "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer" } },
                        c.liked ? "\u2665" : "\u2661", " ", c.likes))))),
            React.createElement("div", { ref: endRef })),
        React.createElement("div", { style: { paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 10 } },
            React.createElement("input", { value: text, onChange: e => setText(e.target.value), onKeyDown: e => { if (e.key === "Enter") submit(); }, placeholder: "Add a comment\u2026", style: { flex: 1, padding: "10px 13px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, color: "#fff", fontSize: 13, outline: "none" } }),
            React.createElement("button", { onClick: submit, style: { padding: "10px 16px", background: vid.accent, color: "#1a0a2e", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: "pointer" } }, "Post"))));
}

// -- Gift Modal ------------------------------------------------------
function GiftModal({ vid, onGift, onClose }) {
    const [sent, setSent] = useState(null);
    const handleGift = (g) => { setSent(g); setTimeout(() => onGift(g), 900); };
    return (React.createElement(Sheet, { onClose: onClose, height: "auto" }, sent ? (React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0" } },
        React.createElement("div", { style: { fontSize: 56, marginBottom: 12 } }, sent.emoji),
        React.createElement("div", { style: { fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 } }, "Gift Sent! \u2728"),
        React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.45)", textAlign: "center" } },
            sent.label,
            " \u00B7 $",
            sent.amount))) : (React.createElement(React.Fragment, null,
        React.createElement("div", { style: { fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 22, marginBottom: 6 } }, "Send a Gift"),
        React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 } },
            "Support ",
            vid.creator.split(" ")[0],
            "'s work directly"),
        React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 11 } }, GIFTS.map(g => (React.createElement("button", { key: g.label, onClick: () => handleGift(g), style: { background: `${vid.accent}12`, border: `1px solid ${vid.accent}44`, borderRadius: 16, padding: "16px 8px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 } },
            React.createElement("span", { style: { fontSize: 28 } }, g.emoji),
            React.createElement("span", { style: { fontSize: 12, fontWeight: 700, color: "#fff" } }, g.label),
            React.createElement("span", { style: { fontSize: 11, color: vid.accent, fontWeight: 700 } },
                "$",
                g.amount)))))))));
}
// -- Subscribe Modal -------------------------------------------------
function SubscribeModal({ vid, onSubscribe, onClose }) {
    const [done, setDone] = useState(null);
    const handle = (tier) => { setDone(tier); onSubscribe(vid.id, tier); };
    return (React.createElement(Sheet, { onClose: onClose, height: "88vh" }, done ? (React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0" } },
        React.createElement("div", { style: { fontSize: 54 } }, "\u2726"),
        React.createElement("div", { style: { fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, margin: "14px 0 8px" } }, "You're subscribed!"),
        React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.45)", textAlign: "center" } },
            "You now have ",
            TIERS[done].label,
            " access to ",
            vid.creator.split(" ")[0],
            "'s content."))) : (React.createElement(React.Fragment, null,
        React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 18 } },
            React.createElement("div", { style: { width: 48, height: 48, borderRadius: "50%", background: vid.accent + "33", border: `2px solid ${vid.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 } }, vid.avatar),
            React.createElement("div", null,
                React.createElement("div", { style: { fontWeight: 700, fontSize: 16, fontFamily: "'Cormorant Garamond',serif" } }, vid.creator),
                React.createElement("div", { style: { fontSize: 11, color: "rgba(255,255,255,0.38)" } }, vid.handle))),
        React.createElement("div", { style: { fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 700, marginBottom: 6 } }, "Choose a Tier"),
        React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.42)", marginBottom: 18 } }, "Support their work and get exclusive access"),
        Object.entries(TIERS).map(([key, t]) => (React.createElement("div", { key: key, style: { border: `1px solid ${t.color}44`, borderRadius: 16, padding: "16px", marginBottom: 12 } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 } },
                React.createElement("span", { style: { background: t.color + "22", color: t.color, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 700 } }, t.label),
                React.createElement("span", { style: { color: t.color, fontSize: 16, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif" } }, t.price)),
            t.perks.map(p => React.createElement("div", { key: p, style: { fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 } },
                "\u2713 ",
                p)),
            React.createElement("button", { onClick: () => handle(key), style: { width: "100%", marginTop: 10, padding: "11px", background: t.color, border: "none", borderRadius: 12, color: "#1a0a2e", fontWeight: 700, fontSize: 13, cursor: "pointer" } },
                "Subscribe \u2014 ",
                t.price))))))));
}
// -- Creator Profile Modal -------------------------------------------
function CreatorModal({ vid, onSubscribe, onClose }) {
    var _a;
    return (React.createElement("div", { style: { position: "absolute", inset: 0, background: "#08080f", zIndex: 60, overflowY: "auto", WebkitOverflowScrolling: "touch" }, className: "fade-in" },
        React.createElement("button", { onClick: onClose, style: { position: "sticky", top: 14, left: 14, zIndex: 70, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "6px 14px", color: "#fff", fontSize: 12, cursor: "pointer" } }, "\u2190 Back"),
        React.createElement("div", { style: { height: 180, background: vid.bg, display: "flex", alignItems: "flex-end", justifyContent: "center", marginTop: -40 } },
            React.createElement("div", { style: { width: 80, height: 80, borderRadius: "50%", background: vid.accent + "33", border: `3px solid ${vid.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 24, transform: "translateY(40px)" } }, vid.avatar)),
        React.createElement("div", { style: { padding: "52px 20px 40px" } },
            React.createElement("div", { style: { fontSize: 26, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", marginBottom: 4 } }, vid.creator),
            React.createElement("div", { style: { fontSize: 12, color: "rgba(255,255,255,0.38)", marginBottom: 10 } }, vid.handle),
            React.createElement("div", { style: { display: "inline-block", background: vid.accent + "22", border: `1px solid ${vid.accent}44`, borderRadius: 20, padding: "3px 12px", fontSize: 11, color: vid.accent, fontWeight: 700, marginBottom: 16 } }, (_a = TIERS[vid.tier]) === null || _a === void 0 ? void 0 :
                _a.label,
                " Creator"),
            React.createElement("div", { style: { display: "flex", gap: 24, marginBottom: 14 } }, [["14.2K", "FOLLOWERS"], ["83", "WORKS"], ["4.9\u2605", "RATING"]].map(([n, l]) => (React.createElement("div", { key: l },
                React.createElement("div", { style: { fontSize: 20, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif" } }, n),
                React.createElement("div", { style: { fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" } }, l))))),
            React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.58)", lineHeight: 1.65, marginBottom: 20 } }, "Broadway composer & lyricist. Creating new works at the intersection of jazz and contemporary musical theatre."),
            React.createElement("button", { onClick: onSubscribe, style: { width: "100%", padding: "14px", background: vid.accent, border: "none", borderRadius: 14, color: "#1a0a2e", fontWeight: 700, fontSize: 14, cursor: "pointer", marginBottom: 20 } },
                "Subscribe to ",
                vid.creator.split(" ")[0]),
            React.createElement("div", { style: { fontSize: 10, fontWeight: 700, letterSpacing: "0.13em", color: "rgba(255,255,255,0.3)", marginBottom: 12 } }, "RECENT WORKS"),
            [vid.title, "Workshop session - Act I finale", "Chord progressions for 'The Last Light'"].map((w, i) => (React.createElement("div", { key: i, style: { display: "flex", alignItems: "center", padding: "11px 13px", background: "rgba(255,255,255,0.04)", borderRadius: 12, marginBottom: 8, gap: 10 } },
                React.createElement("span", { style: { color: vid.accent, fontSize: 16 } }, vid.note),
                React.createElement("span", { style: { fontSize: 13 } }, w),
                i === 0 && React.createElement("span", { style: { marginLeft: "auto", background: vid.accent + "22", color: vid.accent, borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 700 } }, "NEW")))))));
}
// --------------------------- CREATE ---------------------------------

export default FeedScreen;
