// Draft board — tap-to-pick snake draft, 15 picks, 1 couple left as Free Agent.
import {
  state, save, draftCount, draftComplete, onTheClock, nextOpenSlot,
  ownerOf, freeAgentCouple, coupleLabel, playerIndex, snakePlayer,
} from '../state.js';
import { h, clear, sectionTitle, confirmAction, toast } from '../ui.js';
import { playerTag, coupleAvatar } from './shared.js';
import { PLAYER_COLORS, TOTAL_DRAFT_PICKS, NUM_PLAYERS } from '../config.js';

const history = []; // session-only undo stack of { pid, cid }

export function render(container) {
  clear(container);
  container.appendChild(sectionTitle('The Draft',
    'Snake order: pick 1–5, then 5–1, then 1–5. Tap a couple to draft them; tap again to send them back.'));

  const clock = onTheClock();
  const done = draftCount();

  // On the clock banner
  if (clock) {
    container.appendChild(h('div', { class: 'clock-banner' },
      h('div', {},
        h('div', { class: 'clock-label' }, 'On the clock · pick ' + (done + 1) + ' of ' + TOTAL_DRAFT_PICKS),
        playerTag(clock, playerIndex(clock.id), 'big')),
      h('div', { class: 'clock-actions' },
        h('button', {
          class: 'btn ghost small', type: 'button', disabled: !history.length || undefined,
          onclick: () => {
            const last = history.pop();
            if (!last) return;
            const slots = state.roster[last.pid];
            const i = slots.indexOf(last.cid);
            if (i >= 0) slots[i] = null;
            save(); render(container);
          },
        }, '↩ Undo'),
        h('button', {
          class: 'btn ghost small danger', type: 'button', disabled: !done || undefined,
          onclick: () => {
            if (!confirmAction('Reset the whole draft board?')) return;
            state.players.forEach(p => { state.roster[p.id] = [null, null, null]; });
            history.length = 0; save(); toast('Draft reset', '🎯'); render(container);
          },
        }, 'Reset'))));
  } else {
    const fa = freeAgentCouple();
    container.appendChild(h('div', { class: 'clock-banner done' },
      h('div', {},
        h('div', { class: 'clock-label' }, 'Draft complete ✨'),
        h('div', { class: 'fa-note' },
          'Undrafted Free Agent: ', h('strong', {}, coupleLabel(fa))))));
  }

  // Roster slots summary
  const rosterGrid = h('div', { class: 'roster-grid' });
  state.players.forEach((p, pi) => {
    const slots = state.roster[p.id].map((cid, si) =>
      h('div', { class: 'roster-slot' + (cid ? ' filled' : '') },
        cid ? coupleLabel(state.couples.find(c => c.id === cid)) : 'Pick ' + pickNumbers(pi)[si]));
    rosterGrid.appendChild(h('div', { class: 'roster-col pc-' + PLAYER_COLORS[pi] },
      h('div', { class: 'roster-col-name' }, p.name), ...slots));
  });
  container.appendChild(rosterGrid);

  // Couple board
  const board = h('div', { class: 'draft-board' });
  state.couples.forEach((c, ci) => {
    const own = ownerOf(c.id);
    const chip = h('button', {
      class: 'draft-chip' + (own ? ' drafted pc-' + PLAYER_COLORS[playerIndex(own.player.id)] : ''),
      type: 'button',
      onclick: () => {
        if (own) {
          state.roster[own.player.id][own.slot] = null;
          const hi = history.findIndex(x => x.cid === c.id);
          if (hi >= 0) history.splice(hi, 1);
          save(); render(container);
          return;
        }
        const picker = onTheClock();
        if (!picker) return;
        const slot = nextOpenSlot(picker.id);
        if (slot < 0) return;
        state.roster[picker.id][slot] = c.id;
        history.push({ pid: picker.id, cid: c.id });
        save(); render(container);
        if (draftComplete()) toast('Draft complete — meet your Free Agent!', '🎉');
      },
    },
      coupleAvatar(c, ci),
      h('div', { class: 'draft-chip-text' },
        h('div', { class: 'draft-chip-name' }, c.celebrity.trim() || 'Couple ' + (ci + 1)),
        h('div', { class: 'draft-chip-pro' }, c.pro.trim() ? 'w/ ' + c.pro : 'Add cast on Setup')),
      own ? h('span', { class: 'draft-chip-owner' },
        shortName(own.player.name) + ' · R' + (own.slot + 1)) : null);
    board.appendChild(chip);
  });
  container.appendChild(board);
}

function shortName(name) {
  const w = name.split(/\s+/)[0] || name;
  return w.length > 9 ? w.slice(0, 8) + '…' : w;
}

// Which overall pick numbers belong to a player (for empty-slot labels)
function pickNumbers(playerIdx) {
  const picks = [];
  for (let i = 0; i < TOTAL_DRAFT_PICKS; i++) {
    if (playerIndex(snakePlayer(i).id) === playerIdx) picks.push(i + 1);
  }
  return picks.map(n => '#' + n);
}
