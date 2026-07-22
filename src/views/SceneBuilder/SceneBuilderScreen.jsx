import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';

const clamp = (text) => text.length > 20 ? 22 : text.length > 14 ? 26 : 32;

function SceneBuilderScreen({ show }) {
    const [scenes, setScenes] = useState([]);
    const [activeScene, setActiveScene] = useState(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [loading, setLoading] = useState(true);
    // Load scenes from Supabase
    useEffect(() => {
        (async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }
            const { data } = await supabase.from("scenes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
            if (data) setScenes(data);
            setLoading(false);
        })();
    }, []);
    const createScene = async (name, show_name, setting) => {
        const { data: { user } } = await supabase.auth.getUser();
        const newScene = {
            name, show_name, setting,
            characters: [],
            beats: [],
            notes: "",
        };
        if (user) {
            const { data, error } = await supabase.from("scenes").insert({
                user_id: user.id, name, show_name, setting,
                characters: [], beats: [], notes: "",
            });
            if (error) { console.warn("Save failed:", error); show("\u26a0\ufe0f Sign in to save"); }
            const localId = "local-" + Date.now();
            const localScene = { ...newScene, id: data?.[0]?.id || localId, created_at: new Date().toISOString() };
            setScenes(p => [localScene, ...p]);
            setActiveScene(localScene);
        } else {
            const localScene = { ...newScene, id: "local-" + Date.now(), created_at: new Date().toISOString() };
            setScenes(p => [localScene, ...p]);
            setActiveScene(localScene);
        }
        setShowNewModal(false);
        show("\uD83C\uDFAD Scene created");
    };
    const updateScene = async (sceneId, updates) => {
        setScenes(p => p.map(s => s.id === sceneId ? { ...s, ...updates } : s));
        setActiveScene(prev => prev?.id === sceneId ? { ...prev, ...updates } : prev);
        if (typeof sceneId === "string" && sceneId.startsWith("local-")) return;
        await supabase.from("scenes").update(updates).eq("id", sceneId);
    };
    const deleteScene = async (sceneId) => {
        setScenes(p => p.filter(s => s.id !== sceneId));
        if (activeScene?.id === sceneId) setActiveScene(null);
        if (typeof sceneId === "string" && sceneId.startsWith("local-")) return;
        await supabase.from("scenes").delete().eq("id", sceneId);
        show("Scene deleted");
    };
    if (activeScene) {
        return React.createElement(SceneEditor, {
            scene: activeScene,
            onUpdate: (updates) => updateScene(activeScene.id, updates),
            onBack: () => setActiveScene(null),
            onDelete: () => { deleteScene(activeScene.id); },
            show,
        });
    }
    return React.createElement("div", { style: { padding: "20px 16px 80px", overflowY: "auto", WebkitOverflowScrolling: "touch", height: "100%" } },
        React.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 } },
            React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif" } }, "Scene Builder"),
                React.createElement("div", { style: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 } }, "Block, plan, and organize your scenes")
            ),
            React.createElement("button", { onClick: () => setShowNewModal(true), style: { padding: "10px 16px", background: "linear-gradient(135deg,#c9a84c,#e8a87c)", border: "none", borderRadius: 10, color: "#1a0a2e", fontSize: 13, fontWeight: 700, cursor: "pointer" } }, "+ New Scene")
        ),
        loading
            ? React.createElement("div", { style: { textAlign: "center", padding: 40, color: "rgba(255,255,255,0.4)" } }, "Loading scenes\u2026")
            : scenes.length === 0
                ? React.createElement("div", { style: { textAlign: "center", padding: 60, background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 16 } },
                    React.createElement("div", { style: { fontSize: 48, marginBottom: 12, opacity: 0.4 } }, "\uD83C\uDFAD"),
                    React.createElement("div", { style: { fontSize: 15, fontWeight: 700, marginBottom: 6 } }, "No scenes yet"),
                    React.createElement("div", { style: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 20, lineHeight: 1.5 } }, "Build out scenes for your show. Add characters, plan blocking, write director notes."),
                    React.createElement("button", { onClick: () => setShowNewModal(true), style: { padding: "12px 24px", background: "linear-gradient(135deg,#c9a84c,#e8a87c)", border: "none", borderRadius: 10, color: "#1a0a2e", fontSize: 13, fontWeight: 700, cursor: "pointer" } }, "Create First Scene")
                )
                : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
                    scenes.map(s =>
                        React.createElement("div", { key: s.id, onClick: () => setActiveScene(s), style: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 14, cursor: "pointer" } },
                            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 } },
                                React.createElement("div", { style: { fontSize: 16, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif" } }, s.name),
                                React.createElement("div", { style: { fontSize: 10, color: "rgba(255,255,255,0.4)" } }, (s.created_at || "").slice(0, 10))
                            ),
                            s.show_name && React.createElement("div", { style: { fontSize: 12, color: "#c9a84c", marginBottom: 4 } }, s.show_name),
                            s.setting && React.createElement("div", { style: { fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 8 } }, "\uD83D\uDCCD " + s.setting),
                            React.createElement("div", { style: { display: "flex", gap: 12, fontSize: 11, color: "rgba(255,255,255,0.5)" } },
                                React.createElement("span", null, "\uD83D\uDC65 " + (s.characters?.length || 0) + " characters"),
                                React.createElement("span", null, "\uD83D\uDCDD " + (s.beats?.length || 0) + " beats")
                            )
                        )
                    )
                ),
        showNewModal && React.createElement(NewSceneModal, { onCreate: createScene, onClose: () => setShowNewModal(false) })
    );
}
function NewSceneModal({ onCreate, onClose }) {
    const [name, setName] = useState("");
    const [showName, setShowName] = useState("");
    const [setting, setSetting] = useState("");
    const submit = () => {
        if (!name.trim()) return;
        onCreate(name.trim(), showName.trim(), setting.trim());
    };
    return React.createElement("div", { onClick: onClose, style: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "flex-end", justifyContent: "center" } },
        React.createElement("div", { onClick: (e) => e.stopPropagation(), style: { width: "100%", maxWidth: 500, background: "#1a0a2e", borderRadius: "20px 20px 0 0", padding: "24px 20px 32px", paddingBottom: "calc(32px + env(safe-area-inset-bottom))" } },
            React.createElement("div", { style: { width: 40, height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, margin: "0 auto 18px" } }),
            React.createElement("div", { style: { fontSize: 19, fontWeight: 700, marginBottom: 18, fontFamily: "'Cormorant Garamond',serif" } }, "New Scene"),
            React.createElement("div", { style: { fontSize: 9, color: "rgba(255,255,255,0.32)", letterSpacing: "0.1em", marginBottom: 6 } }, "SCENE NAME"),
            React.createElement("input", { value: name, onChange: e => setName(e.target.value), placeholder: "e.g. Act 1, Scene 3", style: { width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", marginBottom: 14 } }),
            React.createElement("div", { style: { fontSize: 9, color: "rgba(255,255,255,0.32)", letterSpacing: "0.1em", marginBottom: 6 } }, "SHOW (OPTIONAL)"),
            React.createElement("input", { value: showName, onChange: e => setShowName(e.target.value), placeholder: "e.g. Hamilton, Wicked", style: { width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", marginBottom: 14 } }),
            React.createElement("div", { style: { fontSize: 9, color: "rgba(255,255,255,0.32)", letterSpacing: "0.1em", marginBottom: 6 } }, "SETTING (OPTIONAL)"),
            React.createElement("input", { value: setting, onChange: e => setSetting(e.target.value), placeholder: "e.g. Hamilton's office, evening", style: { width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff", marginBottom: 22 } }),
            React.createElement("button", { onClick: submit, disabled: !name.trim(), style: { width: "100%", padding: "13px", background: name.trim() ? "linear-gradient(135deg,#c9a84c,#e8a87c)" : "rgba(255,255,255,0.06)", border: "none", borderRadius: 10, color: name.trim() ? "#1a0a2e" : "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 700, cursor: name.trim() ? "pointer" : "not-allowed" } }, "Create Scene"),
            React.createElement("button", { onClick: onClose, style: { width: "100%", padding: "13px", background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 6, cursor: "pointer" } }, "Cancel")
        )
    );
}
function SceneEditor({ scene, onUpdate, onBack, onDelete, show }) {
    const [tab, setTab] = useState("stage");
    const [characters, setCharacters] = useState(scene.characters || []);
    const [beats, setBeats] = useState(scene.beats || []);
    const [notes, setNotes] = useState(scene.notes || "");
    const [draggingId, setDraggingId] = useState(null);
    const stageRef = useRef(null);
    // Save changes to parent
    const persist = () => {
        onUpdate({ characters, beats, notes });
        show("\u2713 Saved");
    };
    // Add character
    const addCharacter = () => {
        const name = prompt("Character name:");
        if (!name?.trim()) return;
        const colors = ["#c9a84c", "#e8a87c", "#4cb8c4", "#a87cc4", "#7cc48d", "#c47c8d"];
        const newChar = {
            id: "ch-" + Date.now(),
            name: name.trim(),
            color: colors[characters.length % colors.length],
            x: 50, y: 50, // center stage as percentages
        };
        const updated = [...characters, newChar];
        setCharacters(updated);
        onUpdate({ characters: updated, beats, notes });
    };
    const removeCharacter = (id) => {
        const updated = characters.filter(c => c.id !== id);
        setCharacters(updated);
        onUpdate({ characters: updated, beats, notes });
    };
    // Drag handler
    const startDrag = (id) => (e) => {
        e.preventDefault();
        setDraggingId(id);
    };
    useEffect(() => {
        if (!draggingId) return;
        const move = (e) => {
            if (!stageRef.current) return;
            const rect = stageRef.current.getBoundingClientRect();
            const point = e.touches ? e.touches[0] : e;
            const x = Math.max(5, Math.min(95, ((point.clientX - rect.left) / rect.width) * 100));
            const y = Math.max(5, Math.min(95, ((point.clientY - rect.top) / rect.height) * 100));
            setCharacters(p => p.map(c => c.id === draggingId ? { ...c, x, y } : c));
        };
        const stop = () => {
            setDraggingId(null);
            onUpdate({ characters, beats, notes });
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("touchmove", move, { passive: false });
        window.addEventListener("mouseup", stop);
        window.addEventListener("touchend", stop);
        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("touchmove", move);
            window.removeEventListener("mouseup", stop);
            window.removeEventListener("touchend", stop);
        };
    }, [draggingId, characters, beats, notes, onUpdate]);
    // Add beat
    const addBeat = () => {
        const text = prompt("Describe the beat (action, line, blocking):");
        if (!text?.trim()) return;
        const updated = [...beats, { id: "b-" + Date.now(), text: text.trim(), time: beats.length + 1 }];
        setBeats(updated);
        onUpdate({ characters, beats: updated, notes });
    };
    const removeBeat = (id) => {
        const updated = beats.filter(b => b.id !== id);
        setBeats(updated);
        onUpdate({ characters, beats: updated, notes });
    };
    return React.createElement("div", { style: { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" } },
        // Header
        React.createElement("div", { style: { padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12 } },
            React.createElement("button", { onClick: onBack, style: { background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", padding: 4 } }, "\u2190"),
            React.createElement("div", { style: { flex: 1, minWidth: 0 } },
                React.createElement("div", { style: { fontSize: 15, fontWeight: 700, fontFamily: "'Cormorant Garamond',serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }, scene.name),
                scene.show_name && React.createElement("div", { style: { fontSize: 11, color: "#c9a84c" } }, scene.show_name)
            ),
            React.createElement("button", { onClick: () => { if (confirm("Delete this scene?")) onDelete(); }, style: { background: "none", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5", padding: "6px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer" } }, "Delete")
        ),
        // Tabs
        React.createElement("div", { style: { display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)" } },
            [["stage", "\uD83C\uDFAD Stage"], ["beats", "\uD83D\uDCDD Beats"], ["notes", "\u270D\uFE0F Notes"]].map(([k, l]) =>
                React.createElement("button", { key: k, onClick: () => setTab(k), style: { flex: 1, padding: "11px 0", background: "none", border: "none", borderBottom: tab === k ? "2px solid #c9a84c" : "2px solid transparent", color: tab === k ? "#c9a84c" : "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: tab === k ? 700 : 500, cursor: "pointer" } }, l)
            )
        ),
        // Content
        React.createElement("div", { style: { flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "16px" } },
            // STAGE TAB
            tab === "stage" && React.createElement("div", null,
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
                    React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.5)" } }, "Drag characters to block the scene"),
                    React.createElement("button", { onClick: addCharacter, style: { padding: "7px 12px", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 8, color: "#c9a84c", fontSize: 11, fontWeight: 700, cursor: "pointer" } }, "+ Character")
                ),
                // Stage diagram
                React.createElement("div", { ref: stageRef, style: { position: "relative", aspectRatio: "16/10", background: "linear-gradient(180deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02))", border: "2px solid rgba(201,168,76,0.3)", borderRadius: 8, marginBottom: 14, overflow: "hidden", touchAction: "none" } },
                    // Stage area labels (theatre conventions)
                    React.createElement("div", { style: { position: "absolute", top: 4, left: 0, right: 0, textAlign: "center", fontSize: 9, letterSpacing: "0.2em", color: "rgba(201,168,76,0.5)" } }, "UPSTAGE"),
                    React.createElement("div", { style: { position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center", fontSize: 9, letterSpacing: "0.2em", color: "rgba(201,168,76,0.5)" } }, "DOWNSTAGE \u00B7 AUDIENCE"),
                    React.createElement("div", { style: { position: "absolute", left: 4, top: "50%", transform: "translateY(-50%) rotate(-90deg)", fontSize: 9, letterSpacing: "0.2em", color: "rgba(201,168,76,0.5)", transformOrigin: "center" } }, "STAGE LEFT"),
                    React.createElement("div", { style: { position: "absolute", right: 4, top: "50%", transform: "translateY(-50%) rotate(90deg)", fontSize: 9, letterSpacing: "0.2em", color: "rgba(201,168,76,0.5)", transformOrigin: "center" } }, "STAGE RIGHT"),
                    // Center mark
                    React.createElement("div", { style: { position: "absolute", left: "50%", top: "50%", width: 12, height: 12, transform: "translate(-50%,-50%)", border: "1px dashed rgba(201,168,76,0.3)", borderRadius: "50%" } }),
                    // Characters
                    characters.map(c =>
                        React.createElement("div", { key: c.id, onMouseDown: startDrag(c.id), onTouchStart: startDrag(c.id), style: { position: "absolute", left: c.x + "%", top: c.y + "%", transform: "translate(-50%,-50%)", width: 44, height: 44, background: c.color, color: "#1a0a2e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, cursor: "grab", border: "2px solid rgba(255,255,255,0.9)", boxShadow: "0 2px 8px rgba(0,0,0,0.4)", userSelect: "none", touchAction: "none" } }, c.name.slice(0, 2).toUpperCase())
                    )
                ),
                // Character list
                characters.length === 0
                    ? React.createElement("div", { style: { textAlign: "center", padding: 20, color: "rgba(255,255,255,0.4)", fontSize: 12 } }, "No characters yet. Add one to start blocking.")
                    : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 6 } },
                        characters.map(c =>
                            React.createElement("div", { key: c.id, style: { display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 8 } },
                                React.createElement("div", { style: { width: 28, height: 28, background: c.color, borderRadius: "50%", color: "#1a0a2e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11 } }, c.name.slice(0, 2).toUpperCase()),
                                React.createElement("div", { style: { flex: 1, fontSize: 13, fontWeight: 600 } }, c.name),
                                React.createElement("button", { onClick: () => removeCharacter(c.id), style: { background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16, padding: 4 } }, "\u00D7")
                            )
                        )
                    )
            ),
            // BEATS TAB
            tab === "beats" && React.createElement("div", null,
                React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 } },
                    React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.5)" } }, "Plan the moments of your scene"),
                    React.createElement("button", { onClick: addBeat, style: { padding: "7px 12px", background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: 8, color: "#c9a84c", fontSize: 11, fontWeight: 700, cursor: "pointer" } }, "+ Beat")
                ),
                beats.length === 0
                    ? React.createElement("div", { style: { textAlign: "center", padding: 40, background: "rgba(255,255,255,0.04)", borderRadius: 10, color: "rgba(255,255,255,0.4)", fontSize: 13 } }, "No beats yet. Add one to start mapping out the scene.")
                    : React.createElement("div", { style: { display: "flex", flexDirection: "column", gap: 8 } },
                        beats.map((b, i) =>
                            React.createElement("div", { key: b.id, style: { display: "flex", gap: 12, padding: 12, background: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" } },
                                React.createElement("div", { style: { width: 28, height: 28, borderRadius: "50%", background: "rgba(201,168,76,0.2)", color: "#c9a84c", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 } }, i + 1),
                                React.createElement("div", { style: { flex: 1, fontSize: 13, lineHeight: 1.5 } }, b.text),
                                React.createElement("button", { onClick: () => removeBeat(b.id), style: { background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 16 } }, "\u00D7")
                            )
                        )
                    )
            ),
            // NOTES TAB
            tab === "notes" && React.createElement("div", null,
                React.createElement("div", { style: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 10 } }, "Director notes, intentions, design ideas\u2026"),
                React.createElement("textarea", {
                    value: notes,
                    onChange: e => setNotes(e.target.value),
                    onBlur: () => onUpdate({ characters, beats, notes }),
                    rows: 14,
                    placeholder: "Write your notes here\u2026",
                    style: { width: "100%", padding: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "#fff", fontSize: 14, lineHeight: 1.6, resize: "none", fontFamily: "inherit" }
                })
            )
        )
    );
}



  

export default SceneBuilderScreen;
