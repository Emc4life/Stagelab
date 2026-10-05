// ---------------------------------------------------------------
// DOM helpers & reusable input components
// ---------------------------------------------------------------
import { state, coupleLabel } from './state.js';

// Hyperscript-style element builder
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (k === 'checked') el.checked = !!v;
    else if (k === 'disabled') { if (v) el.setAttribute('disabled', ''); }
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const child of children.flat(Infinity)) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return el;
}

export const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); };

// Toast notification
export function toast(msg, icon = '✨') {
  let t = document.querySelector('.toast');
  if (!t) { t = h('div', { class: 'toast' }); document.body.appendChild(t); }
  t.textContent = icon + ' ' + msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// Section headings
export const sectionTitle = (text, sub) =>
  h('div', { class: 'section-head' },
    h('h2', {}, text),
    sub ? h('p', { class: 'hint' }, sub) : null);

// ---------------- inputs ----------------

export function textInput(value, onInput, placeholder = '', attrs = {}) {
  return h('input', Object.assign({
    class: 'text-input', type: 'text', value: value || '', placeholder,
    oninput: e => onInput(e.target.value),
  }, attrs));
}

export function dateInput(value, onInput) {
  return h('input', {
    class: 'text-input date-input', type: 'date', value: value || '',
    onchange: e => onInput(e.target.value),
  });
}

// Toggle chip (on/off) with point label
export function toggleChip(label, ptsLabel, value, onChange) {
  const b = h('button', {
    class: 'chip' + (value ? ' on' : ''), type: 'button',
    onclick: () => { b.classList.toggle('on'); onChange(b.classList.contains('on')); },
  }, h('span', { class: 'chip-label' }, label),
     h('span', { class: 'chip-pts' }, ptsLabel));
  return b;
}

// Numeric stepper 0..max
export function stepper(label, ptsLabel, value, onChange, max = 9) {
  const val = h('span', { class: 'step-val' }, String(value || 0));
  const minus = h('button', {
    class: 'step-btn', type: 'button',
    onclick: () => set(Math.max(0, (value || 0) - 1)),
  }, '−');
  const plus = h('button', {
    class: 'step-btn', type: 'button',
    onclick: () => set(Math.min(max, (value || 0) + 1)),
  }, '+');
  function set(nv) {
    value = nv;
    val.textContent = String(nv);
    minus.disabled = nv <= 0;
    plus.disabled = nv >= max;
    onChange(nv);
  }
  minus.disabled = !value;
  plus.disabled = (value || 0) >= max;
  return h('div', { class: 'stepper-field' },
    h('div', { class: 'stepper-head' },
      h('span', { class: 'chip-label' }, label),
      h('span', { class: 'chip-pts' }, ptsLabel)),
    h('div', { class: 'stepper' }, minus, val, plus));
}

// Segmented control (used for leaderboard 1/2/3)
export function segmented(options, value, onChange) {
  const wrap = h('div', { class: 'seg' });
  options.forEach(opt => {
    const b = h('button', {
      class: 'seg-btn' + (opt.v === value ? ' on' : ''), type: 'button',
      onclick: () => {
        wrap.querySelectorAll('.seg-btn').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        onChange(opt.v);
      },
    }, opt.label, opt.pts ? h('small', {}, opt.pts) : null);
    wrap.appendChild(b);
  });
  return wrap;
}

// Couple picker <select>
export function coupleSelect(value, onChange, { emptyLabel = '—', exclude = [] } = {}) {
  const sel = h('select', { class: 'select', onchange: e => onChange(e.target.value || null) });
  sel.appendChild(h('option', { value: '' }, emptyLabel));
  state.couples.forEach(c => {
    if (exclude.includes(c.id)) return;
    sel.appendChild(h('option', { value: c.id, selected: c.id === value || undefined }, coupleLabel(c)));
  });
  sel.value = value || '';
  return sel;
}

// Player picker <select>
export function playerSelect(value, onChange, emptyLabel = '—') {
  const sel = h('select', { class: 'select', onchange: e => onChange(e.target.value || null) });
  sel.appendChild(h('option', { value: '' }, emptyLabel));
  state.players.forEach(p => {
    sel.appendChild(h('option', { value: p.id, selected: p.id === value || undefined }, p.name));
  });
  sel.value = value || '';
  return sel;
}

// Confirm helper (native)
export function confirmAction(msg) { return window.confirm(msg); }
