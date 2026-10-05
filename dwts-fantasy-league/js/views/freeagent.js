// The Free Agent — one-time recruitment of the undrafted couple.
import {
  state, save, draftCount, draftComplete, freeAgentCouple, coupleLabel,
  playerById, ensureFaRow, getFaRow, rowPoints, faEarningFrom, faActiveInEpisode,
  coupleMilestone, playerFaPenalty,
} from '../state.js';
import { h, clear, sectionTitle, playerSelect, coupleSelect, confirmAction, toast } from '../ui.js';
import { scoringCard } from './rowControls.js';
import { FREE_AGENT_RULES, FA_PENALTY, TOTAL_DRAFT_PICKS, PLAYER_COLORS } from '../config.js';
import { playerTag } from './shared.js';
import { requestRender } from '../bus.js';

export function render(container) {
  clear(container);
  container.appendChild(sectionTitle('The Free Agent',
    'The one undrafted couple can be recruited once per season, after Week 1, for -' + FA_PENALTY + ' points.'));

  if (!draftComplete()) {
    container.appendChild(h('div', { class: 'card empty-card' },
      h('p', {}, '🎯 Draft ' + draftCount() + ' of ' + TOTAL_DRAFT_PICKS +
        ' picks complete. The Free Agent is the one couple left over after all 15 picks are in — finish the draft on the Draft tab first.')));
    renderRules(container);
    return;
  }

  const faC = freeAgentCouple();
  const fa = state.freeAgent;

  if (!fa.claimed) {
    // -------- claim form --------
    const card = h('div', { class: 'card fa-claim-card' },
      h('div', { class: 'fa-hero' },
        h('div', { class: 'fa-hero-emoji' }, '🔁'),
        h('div', {},
          h('div', { class: 'fa-hero-name' }, coupleLabel(faC)),
          h('div', { class: 'hint' }, 'Undrafted · available after Episode 1'))));

    let owner = fa.playerId, slotCid = null, afterEp = 1;

    const replacedSelWrap = h('div', { class: 'field' });
    const afterSelWrap = h('div', { class: 'field' });

    function rebuildReplacedSel() {
      replacedSelWrap.textContent = '';
      const opts = owner ? (state.roster[owner] || []).filter(Boolean) : [];
      if (!owner) {
        replacedSelWrap.appendChild(h('p', { class: 'hint' }, 'Pick the claiming player first.'));
        return;
      }
      const sel = h('select', { class: 'select', onchange: e => { slotCid = e.target.value || null; } });
      sel.appendChild(h('option', { value: '' }, 'Which eliminated couple is replaced?'));
      opts.forEach(cid => {
        const c = state.couples.find(x => x.id === cid);
        sel.appendChild(h('option', { value: cid }, coupleLabel(c)));
      });
      replacedSelWrap.appendChild(sel);
    }

    function rebuildAfterSel() {
      afterSelWrap.textContent = '';
      const sel = h('select', { class: 'select', onchange: e => { afterEp = Number(e.target.value); } });
      state.episodes.slice(0, -1).forEach(e => {
        sel.appendChild(h('option', { value: e.n, selected: e.n === afterEp || undefined },
          'After ' + e.label + (e.date ? ' (' + e.date + ')' : '')));
      });
      afterSelWrap.appendChild(sel);
    }

    card.appendChild(h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Claimed by'),
      playerSelect(null, pid => { owner = pid; slotCid = null; rebuildReplacedSel(); }, 'Select a player…')));
    card.appendChild(replacedSelWrap);
    card.appendChild(h('div', { class: 'field' },
      h('label', { class: 'field-label' }, 'Claim made'), afterSelWrap));
    rebuildReplacedSel(); rebuildAfterSel();

    card.appendChild(h('div', { class: 'claim-summary' },
      h('div', {}, 'Recruitment penalty', h('strong', { class: 'neg' }, ' -' + FA_PENALTY + ' pts')),
      h('div', {}, 'Starts earning', h('strong', {}, ' the episode AFTER the claim'))));

    card.appendChild(h('button', {
      class: 'btn primary wide', type: 'button',
      onclick: () => {
        if (!owner) return toast('Pick the claiming player first', '⚠️');
        if (!slotCid) return toast('Pick the eliminated couple being replaced', '⚠️');
        const player = playerById(owner);
        const slot = (state.roster[owner] || []).indexOf(slotCid);
        if (slot < 0) return toast('That couple is not on this roster', '⚠️');
        state.freeAgent = { claimed: true, playerId: owner, slot, afterEp };
        save();
        toast(player.name + ' claimed the Free Agent!', '🔁');
        requestRender();
      },
    }, 'Claim the Free Agent (−' + FA_PENALTY + ' pts)'));

    container.appendChild(card);
  } else {
    // -------- claimed summary --------
    const owner = playerById(fa.playerId);
    const replaced = coupleByIdSafe((state.roster[fa.playerId] || [])[fa.slot]);
    const from = faEarningFrom();
    container.appendChild(h('div', { class: 'card fa-claim-card' },
      h('div', { class: 'fa-hero' },
        h('div', { class: 'fa-hero-emoji' }, '🔁'),
        h('div', {},
          h('div', { class: 'fa-hero-name' }, coupleLabel(faC)),
          h('div', { class: 'hint' }, owner ? 'Claimed by ' + owner.name : 'Claimed'))),
      h('div', { class: 'claim-summary' },
        h('div', {}, 'Replaced eliminated couple', h('strong', {}, ' ' + coupleLabel(replaced))),
        h('div', {}, 'Claimed after', h('strong', {}, ' Episode ' + fa.afterEp)),
        h('div', {}, 'Earning points from', h('strong', {}, ' Episode ' + from)),
        h('div', {}, 'Recruitment penalty', h('strong', { class: 'neg' }, ' −' + FA_PENALTY + ' pts')),
        h('div', {}, 'Milestone bonus so far', h('strong', {}, ' +' + coupleMilestone(faC.id).total + ' pts'))),
      h('button', {
        class: 'btn ghost small danger', type: 'button',
        onclick: () => {
          if (!confirmAction('Unclaim the free agent? This refunds the −' + FA_PENALTY + ' penalty and removes all FA scoring.')) return;
          state.freeAgent = { claimed: false, playerId: null, slot: null, afterEp: null };
          state.faTracker = {};
          save(); requestRender();
        },
      }, 'Unclaim')));

    // -------- FA weekly scoring --------
    container.appendChild(sectionTitle('Free Agent Weekly Scoring',
      'Enter results only from Episode ' + from + ' onward — no retroactive points.'));

    state.episodes.forEach(ep => {
      if (!faActiveInEpisode(ep.n)) return;
      const row = ensureFaRow(ep.n);
      container.appendChild(scoringCard({
        title: ep.label + (ep.date ? ' · ' + ep.date : ''),
        subtitle: owner ? 'Owner: ' + owner.name : '',
        row,
        onChanged: () => save(),
        toneClass: 'fa-card',
      }));
    });
  }

  renderRules(container);
}

function coupleByIdSafe(cid) {
  return state.couples.find(c => c.id === cid) || null;
}

function renderRules(container) {
  const card = h('div', { class: 'card' }, h('h3', { class: 'card-title' }, 'Free Agent rules'));
  const ul = h('ul', { class: 'rule-list' });
  FREE_AGENT_RULES.forEach(r => ul.appendChild(h('li', {}, r)));
  card.appendChild(ul);
  container.appendChild(card);
}
