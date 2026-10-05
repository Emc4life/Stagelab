// Setup — league name, player names, the 16 couples, episode dates, data tools.
import { state, save, resetAll, importState } from '../state.js';
import { h, clear, sectionTitle, textInput, dateInput, confirmAction, toast } from '../ui.js';
import { S35_CAST, NUM_EPISODES } from '../config.js';
import { requestRender } from '../bus.js';
import { coupleAvatar } from './shared.js';

export function render(container) {
  clear(container);
  container.appendChild(sectionTitle('League Setup',
    'Names and cast are editable any time — everything saves automatically on this device.'));

  // ---- League ----
  const league = h('div', { class: 'card' }, h('h3', { class: 'card-title' }, '🪩 League'));
  league.appendChild(field('League name', textInput(state.league.name, v => { state.league.name = v; save(); syncHeader(); })));
  league.appendChild(field('Subtitle / season', textInput(state.league.subtitle, v => { state.league.subtitle = v; save(); syncHeader(); })));
  container.appendChild(league);

  // ---- Players ----
  const players = h('div', { class: 'card' }, h('h3', { class: 'card-title' }, '👥 Players (5)'));
  state.players.forEach((p, i) => {
    players.appendChild(h('div', { class: 'player-setup-row' },
      h('span', { class: 'player-num' }, i + 1),
      textInput(p.name, v => { p.name = v; save(); }, 'Player ' + (i + 1))));
  });
  container.appendChild(players);

  // ---- Cast ----
  const cast = h('div', { class: 'card' },
    h('h3', { class: 'card-title' }, '💃 The 16 Couples'),
    h('div', { class: 'btn-row' },
      h('button', {
        class: 'btn primary small', type: 'button',
        onclick: () => {
          S35_CAST.forEach((c, i) => {
            state.couples[i].celebrity = c.celebrity;
            state.couples[i].pro = c.pro;
          });
          save(); toast('Season 35 (2026) cast loaded', '💃'); requestRender();
        },
      }, 'Load Season 35 (2026) cast'),
      h('button', {
        class: 'btn ghost small', type: 'button',
        onclick: () => {
          if (!confirmAction('Clear all 16 couple names?')) return;
          state.couples.forEach(c => { c.celebrity = ''; c.pro = ''; });
          save(); requestRender();
        },
      }, 'Clear cast')));

  state.couples.forEach((c, i) => {
    cast.appendChild(h('div', { class: 'couple-row' },
      coupleAvatar(c, i),
      textInput(c.celebrity, v => { c.celebrity = v; save(); }, 'Celebrity / star ' + (i + 1)),
      textInput(c.pro, v => { c.pro = v; save(); }, 'Pro partner')));
  });
  container.appendChild(cast);

  // ---- Episodes ----
  const eps = h('div', { class: 'card' }, h('h3', { class: 'card-title' }, '📺 Episodes (' + NUM_EPISODES + ')'));
  state.episodes.forEach(e => {
    eps.appendChild(h('div', { class: 'ep-row' },
      h('span', { class: 'ep-num' }, 'E' + e.n),
      textInput(e.label, v => { e.label = v; save(); }, 'Episode ' + e.n),
      dateInput(e.date, v => { e.date = v; save(); requestRender(); })));
  });
  container.appendChild(eps);

  // ---- Data tools ----
  const data = h('div', { class: 'card' }, h('h3', { class: 'card-title' }, '💾 League data'));
  data.appendChild(h('p', { class: 'hint' },
    'Everything lives in this browser (localStorage). Export a backup to share the league or move devices.'));
  const file = h('input', {
    type: 'file', accept: 'application/json,.json', style: 'display:none',
    onchange: e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          importState(JSON.parse(reader.result));
          toast('League imported', '📥'); requestRender();
        } catch (err) {
          toast('Could not import: ' + err.message, '⚠️');
        }
      };
      reader.readAsText(f);
      e.target.value = '';
    },
  });
  data.appendChild(h('div', { class: 'btn-row' },
    h('button', {
      class: 'btn primary small', type: 'button',
      onclick: () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = h('a', { href: URL.createObjectURL(blob), download: 'dwts-fantasy-league.json' });
        document.body.appendChild(a); a.click(); a.remove();
        toast('League exported', '📤');
      },
    }, 'Export backup (.json)'),
    h('button', { class: 'btn ghost small', type: 'button', onclick: () => file.click() }, 'Import backup'),
    h('button', {
      class: 'btn ghost small danger', type: 'button',
      onclick: () => {
        if (!confirmAction('Reset the ENTIRE league? Players, draft, scores — everything is wiped.')) return;
        resetAll(); toast('League reset', '🧹'); requestRender();
      },
    }, 'Reset league')));
  data.appendChild(file);
  container.appendChild(data);
}

function field(label, input) {
  return h('div', { class: 'field' }, h('label', { class: 'field-label' }, label), input);
}

function syncHeader() {
  const nameEl = document.getElementById('league-name');
  const subEl = document.getElementById('league-sub');
  if (nameEl) nameEl.textContent = state.league.name;
  if (subEl) subEl.textContent = state.league.subtitle;
}
