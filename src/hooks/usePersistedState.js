import { useState } from 'react';

export default function usePersistedState(key, init) {
    const [val, setVal] = useState(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : init;
        }
        catch (_a) {
            return init;
        }
    });
    const set = (next) => {
        setVal(p => {
            const resolved = typeof next === "function" ? next(p) : next;
            try {
                localStorage.setItem(key, JSON.stringify(resolved));
            }
            catch (_a) { }
            return resolved;
        });
    };
    return [val, set];
}
