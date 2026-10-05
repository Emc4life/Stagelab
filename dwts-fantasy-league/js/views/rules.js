// Rules tab — the full scoring key and house rules from the league sheet.
import { h, clear, sectionTitle } from '../ui.js';
import {
  WEEKLY_SCORING, MILESTONE_BONUS, PLACEMENT_POINTS, SIDE_BETS,
  HOUSE_RULES, FREE_AGENT_RULES,
} from '../config.js';

export function render(container) {
  clear(container);
  container.appendChild(sectionTitle('Scoring Key + House Rules',
    'Straight from the official league spreadsheet.'));

  // Weekly scoring
  const weekly = h('div', { class: 'card' }, h('h3', { class: 'card-title' }, '🎟 Weekly events'));
  const wl = h('div', { class: 'rule-table' });
  wl.appendChild(h('div', { class: 'rt-row rt-head' },
    h('span', {}, 'Event'), h('span', { class: 'rt-pts' }, 'Points')));
  WEEKLY_SCORING.forEach(s => {
    wl.appendChild(h('div', { class: 'rt-row' },
      h('span', {}, s.label + (s.per ? ' ' + h('em', {}, '(' + s.per + ')').textContent : '')),
      h('span', { class: 'rt-pts' }, typeof s.pts === 'number' ? '+' + s.pts : s.pts)));
  });
  weekly.appendChild(wl);
  weekly.appendChild(h('p', { class: 'hint inline-hint' },
    'Leaderboard points do not stack — a couple takes the single value for the place they were called.'));
  container.appendChild(weekly);

  // Milestones
  const mile = h('div', { class: 'card' }, h('h3', { class: 'card-title' }, '✨ Milestone + finale bonuses'));
  const ml = h('div', { class: 'rule-table' });
  ml.appendChild(h('div', { class: 'rt-row rt-head' }, h('span', {}, 'Milestone'), h('span', { class: 'rt-pts' }, 'Bonus')));
  [
    ['Makes Top 8 or better', '+' + MILESTONE_BONUS.top8],
    ['Makes Top 6 or better', '+' + MILESTONE_BONUS.top6],
    ['Makes the finale', '+' + MILESTONE_BONUS.finale],
    ['4th place', '+' + PLACEMENT_POINTS[4]],
    ['3rd place', '+' + PLACEMENT_POINTS[3]],
    ['2nd place', '+' + PLACEMENT_POINTS[2]],
    ['WINS THE MIRRORBALL 🪩', '+' + PLACEMENT_POINTS[1]],
  ].forEach(([label, pts]) => {
    ml.appendChild(h('div', { class: 'rt-row' }, h('span', {}, label), h('span', { class: 'rt-pts' }, pts)));
  });
  mile.appendChild(ml);
  container.appendChild(mile);

  // Side bets
  const bets = h('div', { class: 'card' }, h('h3', { class: 'card-title' }, '🎲 Private side bets'));
  const bl = h('div', { class: 'rule-table' });
  bl.appendChild(h('div', { class: 'rt-row rt-head' }, h('span', {}, 'Bet'), h('span', { class: 'rt-pts' }, 'Points')));
  SIDE_BETS.forEach(b => {
    bl.appendChild(h('div', { class: 'rt-row' }, h('span', {}, b.label), h('span', { class: 'rt-pts' }, '+' + b.pts)));
  });
  bets.appendChild(bl);
  container.appendChild(bets);

  // House rules
  const house = h('div', { class: 'card' }, h('h3', { class: 'card-title' }, '🏛 House rules'));
  const ul = h('ul', { class: 'rule-list' });
  HOUSE_RULES.forEach(r => ul.appendChild(h('li', {}, r)));
  house.appendChild(ul);
  container.appendChild(house);

  // Free agent rules
  const fa = h('div', { class: 'card' }, h('h3', { class: 'card-title' }, '🔁 The Free Agent'));
  const faul = h('ul', { class: 'rule-list' });
  FREE_AGENT_RULES.forEach(r => faul.appendChild(h('li', {}, r)));
  fa.appendChild(faul);
  container.appendChild(fa);
}
