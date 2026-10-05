// Milestones + Finale bonuses per couple, grouped by owner.
import {
  state, save, coupleMilestone, playerMilestoneTotal, freeAgentCouple,
  coupleLabel,
} from '../state.js';
import { h, clear, sectionTitle, toggleChip, segmented } from '../ui.js';
import { playerTag } from './shared.js';
import { MILESTONE_BONUS, PLACEMENT_POINTS, PLAYER_COLORS } from '../config.js';

export function render(container) {
  clear(container);
  container.appendChild(sectionTitle('Milestones + Finale',
    'Bonuses are cumulative — a finale couple also banks Top 8 (+2) and Top 6 (+4).'));

  state.players.forEach((player, pi) => {
    const totalBadge = h('span', { class: 'pts-badge big' }, playerMilestoneTotal(player.id) + ' pts');
    const card = h('div', { class: 'card player-card pc-' + PLAYER_COLORS[pi] },
      h('div', { class: 'player-card-head' }, playerTag(player, pi), totalBadge));

    const cids = (state.roster[player.id] || []).filter(Boolean);
    if (!cids.length) {
      card.appendChild(h('div', { class: 'slot-note empty' }, 'No couples drafted yet'));
    }
    cids.forEach(cid => card.appendChild(coupleMilestoneCard(cid, player, totalBadge)));

    // Claimed free agent bonuses roll to their owner
    const fa = state.freeAgent;
    if (fa.claimed && fa.playerId === player.id) {
      const faC = freeAgentCouple();
      if (faC) {
        card.appendChild(h('div', { class: 'slot-note' }, '🔁 Free Agent bonus'));
        card.appendChild(coupleMilestoneCard(faC.id, player, totalBadge, true));
      }
    }
    container.appendChild(card);
  });

  if (!state.freeAgent.claimed) {
    const faC = freeAgentCouple();
    if (faC) {
      container.appendChild(h('div', { class: 'slot-note' },
        '🔁 The Free Agent (' + coupleLabel(faC) + ') is unclaimed — no one banks their milestone bonuses.'));
    }
  }
}

function coupleMilestoneCard(cid, player, totalBadge, isFa = false) {
  const couple = state.couples.find(c => c.id === cid);
  const m = state.milestones[cid] || (state.milestones[cid] = { top8: false, top6: false, finale: false, place: 0 });
  const badge = h('span', { class: 'pts-badge' }, coupleMilestone(cid).total + ' pts');

  const refresh = () => {
    badge.textContent = coupleMilestone(cid).total + ' pts';
    totalBadge.textContent = playerMilestoneTotal(player.id) + ' pts';
    save();
  };

  return h('div', { class: 'score-card' + (isFa ? ' fa-card' : '') },
    h('div', { class: 'score-card-head' },
      h('div', {},
        h('div', { class: 'score-card-title' }, (isFa ? '🔁 ' : '') + coupleLabel(couple)),
        h('div', { class: 'score-card-sub' }, isFa ? 'Free Agent · claimed bonus' : 'Drafted couple')),
      badge),
    h('div', { class: 'score-grid' },
      toggleChip('Makes Top 8', '+' + MILESTONE_BONUS.top8, m.top8, v => { m.top8 = v; refresh(); }),
      toggleChip('Makes Top 6', '+' + MILESTONE_BONUS.top6, m.top6, v => { m.top6 = v; refresh(); }),
      toggleChip('Makes the Finale', '+' + MILESTONE_BONUS.finale, m.finale, v => { m.finale = v; refresh(); }),
      h('div', { class: 'cell' },
        h('div', { class: 'field-head' },
          h('span', { class: 'chip-label' }, 'Final placement'),
          h('span', { class: 'chip-pts' }, 'up to +20')),
        segmented([
          { v: 0, label: '—' },
          { v: 5, label: '5th', pts: '+0' },
          { v: 4, label: '4th', pts: '+4' },
          { v: 3, label: '3rd', pts: '+7' },
          { v: 2, label: '2nd', pts: '+12' },
          { v: 1, label: '🏆', pts: '+20' },
        ], m.place || 0, v => { m.place = v; refresh(); })),
    h('p', { class: 'hint inline-hint' }, '5th place (if DWTS runs five finalists) earns the finale bonus only — no placement points.')));
}
