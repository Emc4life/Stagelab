// Weekly Tracker — enter episode results for every drafted couple.
import {
  state, save, getRow, ensureRow, getFaRow, ensureFaRow, rowPoints,
  slotCouple, slotIsFaReplaced, episodePlayerWeekly, freeAgentCouple,
  faActiveInEpisode, coupleLabel, playerById, coupleShort,
} from '../state.js';
import { h, clear, sectionTitle, confirmAction, toast } from '../ui.js';
import { scoringCard } from './rowControls.js';
import { PLAYER_COLORS, ROSTER_SIZE } from '../config.js';
import { playerTag } from './shared.js';

let curEp = 1;

export function render(container) {
  clear(container);
  const ep = state.episodes.find(e => e.n === curEp) || state.episodes[0];

  container.appendChild(sectionTitle('Weekly Tracker',
    'Only enter what actually happened on the show — points calculate automatically.'));

  // Episode pills
  const pills = h('div', { class: 'ep-pills' });
  state.episodes.forEach(e => {
    const p = h('button', {
      class: 'ep-pill' + (e.n === ep.n ? ' on' : ''), type: 'button',
      onclick: () => { curEp = e.n; render(container); },
    }, h('span', { class: 'ep-pill-n' }, 'E' + e.n),
       e.date ? h('span', { class: 'ep-pill-date' }, fmtDate(e.date)) : null);
    pills.appendChild(p);
  });
  container.appendChild(pills);

  const epHead = h('div', { class: 'ep-head' },
    h('div', {},
      h('h3', {}, ep.label),
      h('p', { class: 'hint' }, ep.date ? fullDate(ep.date) : 'Tap a date on Setup to add one')),
    h('button', {
      class: 'btn ghost small', type: 'button',
      onclick: () => {
        if (!confirmAction('Clear all entered scoring for ' + ep.label + '?')) return;
        delete state.tracker[ep.n];
        delete state.faTracker[ep.n];
        save(); toast(ep.label + ' cleared', '🧹'); render(container);
      },
    }, 'Clear episode'));
  container.appendChild(epHead);

  // Per-player cards
  state.players.forEach((player, pi) => {
    const totalBadge = h('span', { class: 'pts-badge big' },
      episodePlayerWeekly(ep.n, player.id) + ' pts');
    const card = h('div', { class: 'card player-card pc-' + PLAYER_COLORS[pi] },
      h('div', { class: 'player-card-head' },
        playerTag(player, pi), totalBadge));

    for (let s = 0; s < ROSTER_SIZE; s++) {
      if (slotIsFaReplaced(ep.n, player.id, s)) {
        card.appendChild(h('div', { class: 'slot-note' },
          '🔁 Slot vacated — replaced by the Free Agent starting E' + ((state.freeAgent.afterEp || 0) + 1)));
        continue;
      }
      const couple = slotCouple(ep.n, player.id, s);
      if (!couple) {
        card.appendChild(h('div', { class: 'slot-note empty' }, 'Slot ' + (s + 1) + ' — no couple drafted yet'));
        continue;
      }
      const row = ensureRow(ep.n, player.id, s);
      card.appendChild(scoringCard({
        title: coupleLabel(couple),
        subtitle: 'Slot ' + (s + 1) + ' · ' + (couple.pro ? 'w/ ' + couple.pro : ''),
        row,
        onChanged: () => {
          save();
          totalBadge.textContent = episodePlayerWeekly(ep.n, player.id) + ' pts';
        },
      }));
    }
    container.appendChild(card);
  });

  // Free agent scoring row (only while active this episode)
  const fa = state.freeAgent;
  if (fa.claimed && faActiveInEpisode(ep.n)) {
    const faC = freeAgentCouple();
    const owner = playerById(fa.playerId);
    const row = ensureFaRow(ep.n);
    container.appendChild(scoringCard({
      title: '🔁 Free Agent — ' + coupleLabel(faC),
      subtitle: 'Owner: ' + (owner ? owner.name : '—') + ' · earning since E' + ((fa.afterEp || 0) + 1),
      row,
      onChanged: () => {
        save();
        render(container); // refresh owner total badge
      },
      toneClass: 'fa-card',
    }));
  } else if (fa.claimed) {
    container.appendChild(h('div', { class: 'slot-note' },
      '🔁 Free Agent was claimed after E' + (fa.afterEp || 0) +
      ' and starts earning in E' + ((fa.afterEp || 0) + 1) + '.'));
  }

  // Night summary
  const nightTotal = state.players.reduce((t, p) => t + episodePlayerWeekly(ep.n, p.id), 0);
  container.appendChild(h('div', { class: 'night-total' },
    h('span', {}, ep.label + ' · all players combined'),
    h('strong', {}, nightTotal + ' pts')));
}

function fmtDate(d) {
  try {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch { return d; }
}
function fullDate(d) {
  try {
    const dt = new Date(d + 'T00:00:00');
    return dt.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } catch { return d; }
}
