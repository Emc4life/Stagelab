// Private side bets — each player locks a pick, commissioner records the actuals.
import { state, save, sideBetPoints, coupleLabel, playerIndex } from '../state.js';
import { h, clear, sectionTitle, coupleSelect, toast } from '../ui.js';
import { playerTag } from './shared.js';
import { SIDE_BETS, PLAYER_COLORS } from '../config.js';

export function render(container) {
  clear(container);
  container.appendChild(sectionTitle('Private Side Bets',
    'Each player secretly picks all four before the season. Reveal picks after everyone has locked in!'));

  SIDE_BETS.forEach(bet => {
    const actual = state.sideBets.actual[bet.key] || null;
    const card = h('div', { class: 'card bet-card' },
      h('div', { class: 'bet-head' },
        h('div', { class: 'bet-title' }, bet.label),
        h('span', { class: 'pts-badge' }, '+' + bet.pts + ' pts')));

    // Actual result
    card.appendChild(h('div', { class: 'bet-actual' },
      h('label', { class: 'field-label' }, 'Actual result'),
      coupleSelect(actual, cid => {
        if (cid) state.sideBets.actual[bet.key] = cid;
        else delete state.sideBets.actual[bet.key];
        save(); toast('Result saved', '🎲'); render(container);
      }, { emptyLabel: 'Not yet decided' })));

    // Player picks
    const rows = h('div', { class: 'bet-picks' });
    state.players.forEach((p, pi) => {
      const pick = (state.sideBets.picks[p.id] || {})[bet.key] || null;
      const hit = actual && pick && pick === actual;
      const row = h('div', { class: 'bet-row' + (hit ? ' hit' : actual && pick ? ' miss' : '') },
        playerTag(p, pi),
        coupleSelect(pick, cid => {
          if (cid) state.sideBets.picks[p.id][bet.key] = cid;
          else delete state.sideBets.picks[p.id][bet.key];
          save(); render(container);
        }, { emptyLabel: 'No pick' }),
        h('span', { class: 'bet-status' },
          hit ? '✓ +' + bet.pts : actual && pick ? '✗' : ''));
      rows.appendChild(row);
    });
    card.appendChild(rows);
    container.appendChild(card);
  });

  // Totals
  const totals = h('div', { class: 'card' }, h('h3', { class: 'card-title' }, 'Side bet points'));
  state.players.forEach((p, pi) => {
    totals.appendChild(h('div', { class: 'total-row' },
      playerTag(p, pi),
      h('strong', { class: PLAYER_COLORS[pi] ? '' : '' }, sideBetPoints(p.id) + ' pts')));
  });
  container.appendChild(totals);
}
