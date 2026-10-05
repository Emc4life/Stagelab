// Tiny render-event bus so views can request a re-render without circular imports.
let handler = null;
export function onRender(fn) { handler = fn; }
export function requestRender() { if (handler) handler(); }
