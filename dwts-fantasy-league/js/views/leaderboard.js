// Leaderboard — grand standings, leader banner, and per-episode grid.
import {
  state, standings, playerWeeklyByEpisode, currentLeader,
  playerFaPenalty,
} from '../state.js';
import { h, clear, sectionTitle } from '../ui.js';
import { playerTag } from './shared.js';
import { PLAYER_COLORS, FA_PENALTY } from '../config.js';

export function render(container) {
  clear(container);
  const rows = standings();
  const leader = currentLeader();

  // Leader banner
  if (leader) {
    container.appendChild(h('div', { class: 'leader-banner pc-' + PLAYER_COLORS[state.players.indexOf(leader.player)] },
      h('div', { class: 'leader-ball' }, '🪩'),
      h('div', {},
        h('div', { class: 'leader-label' }, 'Current leader'),
        h('div', { class: 'leader-name' }, leader.player.name)),
      h('div', { class: 'leader-pts' }, String(leader.total), h('small', {}, ' pts'))));
  } else {
    container.appendChild(h('div', { class: 'leader-banner idle' },
      h('div', { class: 'leader-ball' }, '🪩'),
      h('div', {},
        h('div', { class: 'leader-label' }, state.league.name),
        h('div', { class: 'leader-name small' }, state.league.subtitle || 'Let the dancing begin'))));
  }

  // Standings table
  container.appendChild(sectionTitle('Standings', 'Weekly + Milestones & Finale + Side Bets − Free Agent penalty'));
  const table = h('div', { class: 'card table-card' });
  const head = h('div', { class: 't-row t-head' },
    h('span', { class: 't-rank' }, '#'),
    h('span', { class: 't-player' }, 'Player'),
    h('span', { class: 't-num' }, 'Weekly', h('small', {}, 'pts')),
    h('span', { class: 't-num' }, 'Mile.', h('small', {}, '+fin')),
    h('span', { class: 't-num' }, 'Bets'),
    h('span', { class: 't-num' }, 'FA'),
    h('span', { class: 't-num t-total' }, 'Total'));
  table.appendChild(head);

  rows.forEach(r => {
    const pi = state.players.indexOf(r.player);
    const isLeader = leader && r.player.id === leader.player.id && r.rank === 1;
    table.appendChild(h('div', { class: 't-row' + (isLeader ? ' t-leader' : '') },
      h('span', { class: 't-rank' }, isLeader ? '👑' : r.rank),
      h('span', { class: 't-player' }, playerTag(r.player, pi)),
      h('span', { class: 't-num' }, r.weekly),
      h('span', { class: 't-num' }, r.milestone),
      h('span', { class: 't-num' }, r.bets),
      h('span', { class: 't-num' + (r.faPen ? ' neg' : '') }, r.faPen || '—'),
      h('span', { class: 't-num t-total' }, h('strong', {}, r.total))));
  });
  container.appendChild(table);

  // Episode-by-episode grid
  container.appendChild(sectionTitle('Weekly points by episode', 'Includes Free Agent points once claimed.'));
  const grid = h('div', { class: 'card ep-grid-card' });
  const gw = h('div', { class: 'ep-grid' });
  gw.appendChild(h('div', { class: 'eg-cell eg-head' }, 'Player'));
  state.episodes.forEach(e => gw.appendChild(h('div', { class: 'eg-cell eg-head' }, 'E' + e.n)));
  gw.appendChild(h('div', { class: 'eg-cell eg-head' }, 'Σ'));

  state.players.forEach((p, pi) => {
    const byEp = playerWeeklyByEpisode(p.id);
    const total = byEp.reduce((a, b) => a + b, 0);
    gw.appendChild(h('div', { class: 'eg-cell eg-name' }, playerTag(p, pi)));
    byEp.forEach(v => gw.appendChild(h('div', { class: 'eg-cell' + (v ? ' has' : '') }, v || '·')));
    gw.appendChild(h('div', { class: 'eg-cell eg-total' }, total));
  });
  grid.appendChild(gw);
  container.appendChild(grid);

  // Tiebreak note
  container.appendChild(h('p', { class: 'hint center' },
    'Ties: highest-finishing drafted couple → most correct side bets → split the glory.'));
}
