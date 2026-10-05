// Shared weekly-scoring input grid, used by the Tracker and the Free Agent tab.
import { h, toggleChip, stepper, segmented } from '../ui.js';
import { rowPoints } from '../state.js';

// `row` is a mutable state row object; `onChanged(row)` fires after every edit.
export function scoringControls(row, onChanged) {
  const grid = h('div', { class: 'score-grid' });

  grid.appendChild(toggleChip('Survived elimination', '+1', row.survived, v => { row.survived = v; onChanged(row); }));

  grid.appendChild(h('div', { class: 'cell' },
    h('div', { class: 'field-head' },
      h('span', { class: 'chip-label' }, "Judges' leaderboard"),
      h('span', { class: 'chip-pts' }, '3 / 2 / 1')),
    segmented([
      { v: 0, label: '—' }, { v: 1, label: '#1', pts: '+3' },
      { v: 2, label: '#2', pts: '+2' }, { v: 3, label: '#3', pts: '+1' },
    ], row.lb, v => { row.lb = v; onChanged(row); })));

  grid.appendChild(stepper('Dance scored a 10', '+1 each', row.tens, v => { row.tens = v; onChanged(row); }));
  grid.appendChild(stepper('Perfect dances', '+3 each', row.perfect, v => { row.perfect = v; onChanged(row); }));
  grid.appendChild(toggleChip('Dance-off / relay win', '+2', row.danceOff, v => { row.danceOff = v; onChanged(row); }));
  grid.appendChild(toggleChip('Immunity', '+2', row.immunity, v => { row.immunity = v; onChanged(row); }));
  grid.appendChild(toggleChip('"Best dance" called', '+2', row.bestDance, v => { row.bestDance = v; onChanged(row); }));
  grid.appendChild(toggleChip('Judge got booed', '+2', row.booed, v => { row.booed = v; onChanged(row); }));
  grid.appendChild(toggleChip('Shirt came off', '+2', row.shirtOff, v => { row.shirtOff = v; onChanged(row); }));
  grid.appendChild(stepper('"Sexy" count', '+1 each', row.sexy, v => { row.sexy = v; onChanged(row); }));
  grid.appendChild(toggleChip('Safe called last', '+1', row.safeLast, v => { row.safeLast = v; onChanged(row); }));
  grid.appendChild(toggleChip('Opened the show', '+1', row.opensShow, v => { row.opensShow = v; onChanged(row); }));

  return grid;
}

// A couple's full scoring card for one episode: header + controls + live points badge.
export function scoringCard({ title, subtitle, row, onChanged, toneClass = '' }) {
  const ptsBadge = h('span', { class: 'pts-badge' }, String(rowPoints(row)) + ' pts');
  const card = h('div', { class: 'score-card ' + toneClass },
    h('div', { class: 'score-card-head' },
      h('div', {},
        h('div', { class: 'score-card-title' }, title),
        subtitle ? h('div', { class: 'score-card-sub' }, subtitle) : null),
      ptsBadge));
  card.appendChild(scoringControls(row, r => {
    ptsBadge.textContent = String(rowPoints(r)) + ' pts';
    onChanged(r);
  }));
  card._ptsBadge = ptsBadge;
  return card;
}
