// ---------------------------------------------------------------
// State store: defaults, persistence, and all derived scoring math
// ---------------------------------------------------------------
import {
  NUM_PLAYERS, NUM_COUPLES, NUM_EPISODES, ROSTER_SIZE,
  LB_POINTS, MILESTONE_BONUS, PLACEMENT_POINTS, SIDE_BETS, FA_PENALTY,
  S35_CAST,
} from './config.js';

const STORAGE_KEY = 'dwts-fantasy-league-v1';

// ------------------------------ defaults ------------------------------

function blankCouples() {
  // New leagues start pre-loaded with the Season 35 (2026) cast — editable on Setup.
  return Array.from({ length: NUM_COUPLES }, (_, i) => ({
    id: 'c' + (i + 1),
    celebrity: (S35_CAST[i] && S35_CAST[i].celebrity) || '',
    pro: (S35_CAST[i] && S35_CAST[i].pro) || '',
  }));
}

export function defaultState() {
  const players = Array.from({ length: NUM_PLAYERS }, (_, i) => ({
    id: 'p' + (i + 1), name: 'Player ' + (i + 1),
  }));
  const roster = {};
  const picks = {};
  players.forEach(p => {
    roster[p.id] = Array(ROSTER_SIZE).fill(null);
    picks[p.id] = {};
  });
  return {
    v: 1,
    league: { name: 'DWTS Fantasy League 2026', subtitle: 'Season 35 · Mirrorball Edition' },
    players,
    couples: blankCouples(),
    episodes: Array.from({ length: NUM_EPISODES }, (_, i) => ({
      n: i + 1, label: 'Episode ' + (i + 1), date: '',
    })),
    roster,                          // { p1: [cid|null x3], ... }
    tracker: {},                     // { [ep]: { 'p1:0': row, ... } }
    faTracker: {},                   // { [ep]: row } — free agent weekly rows
    sideBets: { picks, actual: {} }, // picks: { p1: { firstElim: cid, ... } }, actual: { firstElim: cid }
    milestones: {},                  // { cid: { top8, top6, finale, place } }
    freeAgent: { claimed: false, playerId: null, slot: null, afterEp: null },
  };
}

function emptyRow() {
  return {
    survived: false, lb: 0, tens: 0, perfect: 0, danceOff: false,
    immunity: false, bestDance: false, booed: false, shirtOff: false,
    sexy: 0, safeLast: false, opensShow: false,
  };
}

// ------------------------------ load / save ------------------------------

export const state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const base = defaultState();
    // shallow-merge so older saves pick up new fields safely
    return Object.assign(base, parsed, {
      league: Object.assign(base.league, parsed.league || {}),
      sideBets: Object.assign(base.sideBets, parsed.sideBets || {}),
      freeAgent: Object.assign(base.freeAgent, parsed.freeAgent || {}),
    });
  } catch {
    return defaultState();
  }
}

export function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage full */ }
}

export function resetAll() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
  Object.assign(state, defaultState());
  save();
}

export function importState(obj) {
  if (!obj || !Array.isArray(obj.players) || !Array.isArray(obj.couples)) {
    throw new Error('Not a valid league file');
  }
  Object.assign(state, defaultState(), obj, {
    league: Object.assign(defaultState().league, obj.league || {}),
    sideBets: Object.assign(defaultState().sideBets, obj.sideBets || {}),
    freeAgent: Object.assign(defaultState().freeAgent, obj.freeAgent || {}),
  });
  save();
}

// ------------------------------ lookups ------------------------------

export const coupleById = id => state.couples.find(c => c.id === id) || null;
export const playerById = id => state.players.find(p => p.id === id) || null;
export const playerIndex = id => state.players.findIndex(p => p.id === id);

export function coupleLabel(c) {
  if (!c) return '—';
  const parts = [c.celebrity.trim(), c.pro.trim()].filter(Boolean);
  return parts.length ? parts.join(' & ') : 'Couple ' + (state.couples.indexOf(c) + 1);
}
export function coupleShort(c) {
  if (!c) return '—';
  return c.celebrity.trim() || 'Couple ' + (state.couples.indexOf(c) + 1);
}

// ------------------------------ draft ------------------------------

export function draftedCoupleIds() {
  return Object.values(state.roster).flat().filter(Boolean);
}
export function draftCount() { return draftedCoupleIds().length; }
export function draftComplete() { return draftCount() === NUM_PLAYERS * ROSTER_SIZE; }

export function undraftedCouples() {
  const drafted = new Set(draftedCoupleIds());
  return state.couples.filter(c => !drafted.has(c.id));
}
// The single Free Agent is defined once exactly 15 couples are drafted.
export function freeAgentCouple() {
  if (draftCount() !== NUM_PLAYERS * ROSTER_SIZE) return null;
  return undraftedCouples()[0] || null;
}

// Snake draft order: P1→P5, then P5→P1, then P1→P5
export function snakePlayer(pickIndex) {
  const round = Math.floor(pickIndex / NUM_PLAYERS);
  const pos = pickIndex % NUM_PLAYERS;
  const order = round % 2 === 0
    ? [...Array(NUM_PLAYERS).keys()]
    : [...Array(NUM_PLAYERS).keys()].reverse();
  return state.players[order[pos]];
}
export function onTheClock() {
  return draftComplete() ? null : snakePlayer(draftCount());
}
export function nextOpenSlot(pid) {
  return state.roster[pid].indexOf(null);
}
export function ownerOf(cid) {
  for (const p of state.players) {
    const slot = state.roster[p.id].indexOf(cid);
    if (slot >= 0) return { player: p, slot };
  }
  return null;
}

// ------------------------------ weekly scoring ------------------------------

export function rowPoints(r) {
  if (!r) return 0;
  return (
    (r.survived ? 1 : 0) +
    (LB_POINTS[r.lb || 0] || 0) +
    (r.tens || 0) +
    3 * (r.perfect || 0) +
    (r.danceOff ? 2 : 0) +
    (r.immunity ? 2 : 0) +
    (r.bestDance ? 2 : 0) +
    (r.booed ? 2 : 0) +
    (r.shirtOff ? 2 : 0) +
    (r.sexy || 0) +
    (r.safeLast ? 1 : 0) +
    (r.opensShow ? 1 : 0)
  );
}

export function getRow(ep, pid, slot) {
  return (state.tracker[ep] || {})[pid + ':' + slot] || null;
}
export function ensureRow(ep, pid, slot) {
  if (!state.tracker[ep]) state.tracker[ep] = {};
  const key = pid + ':' + slot;
  if (!state.tracker[ep][key]) state.tracker[ep][key] = emptyRow();
  return state.tracker[ep][key];
}
export function getFaRow(ep) { return state.faTracker[ep] || null; }
export function ensureFaRow(ep) {
  if (!state.faTracker[ep]) state.faTracker[ep] = emptyRow();
  return state.faTracker[ep];
}

// Which couple scores for a player's slot in a given episode?
export function slotCouple(ep, pid, slot) {
  const fa = state.freeAgent;
  if (fa.claimed && fa.playerId === pid && fa.slot === slot && ep > (fa.afterEp || 0)) {
    return freeAgentCouple();
  }
  return coupleById(state.roster[pid]?.[slot]);
}
export function slotIsFaReplaced(ep, pid, slot) {
  const fa = state.freeAgent;
  return !!(fa.claimed && fa.playerId === pid && fa.slot === slot && ep > (fa.afterEp || 0));
}
export function faEarningFrom() {
  const fa = state.freeAgent;
  return fa.claimed ? (fa.afterEp || 0) + 1 : null;
}
export function faActiveInEpisode(ep) {
  const from = faEarningFrom();
  return from !== null && ep >= from;
}

export function episodePlayerWeekly(ep, pid) {
  let total = 0;
  for (let s = 0; s < ROSTER_SIZE; s++) {
    if (slotIsFaReplaced(ep, pid, s)) continue; // FA points counted below, not via old row
    total += rowPoints(getRow(ep, pid, s));
  }
  const fa = state.freeAgent;
  if (fa.claimed && fa.playerId === pid && faActiveInEpisode(ep)) {
    total += rowPoints(getFaRow(ep));
  }
  return total;
}
export function playerWeeklyTotal(pid) {
  let t = 0;
  for (const ep of state.episodes) t += episodePlayerWeekly(ep.n, pid);
  return t;
}
export function playerWeeklyByEpisode(pid) {
  return state.episodes.map(ep => episodePlayerWeekly(ep.n, pid));
}

// ------------------------------ milestones ------------------------------

export function coupleMilestone(cid) {
  const m = state.milestones[cid] || {};
  const ms = (m.top8 ? MILESTONE_BONUS.top8 : 0)
    + (m.top6 ? MILESTONE_BONUS.top6 : 0)
    + (m.finale ? MILESTONE_BONUS.finale : 0);
  const pl = PLACEMENT_POINTS[m.place || 0] || 0;
  return { milestone: ms, placement: pl, total: ms + pl };
}
export function playerMilestoneTotal(pid) {
  let t = 0;
  for (const cid of state.roster[pid] || []) {
    if (cid) t += coupleMilestone(cid).total;
  }
  const fa = state.freeAgent;
  if (fa.claimed && fa.playerId === pid) {
    const c = freeAgentCouple();
    if (c) t += coupleMilestone(c.id).total;
  }
  return t;
}

// ------------------------------ side bets ------------------------------

export function sideBetPoints(pid) {
  const picks = state.sideBets.picks[pid] || {};
  let t = 0;
  for (const bet of SIDE_BETS) {
    const actual = state.sideBets.actual[bet.key];
    if (actual && picks[bet.key] && picks[bet.key] === actual) t += bet.pts;
  }
  return t;
}

// ------------------------------ standings ------------------------------

export function playerFaPenalty(pid) {
  const fa = state.freeAgent;
  return fa.claimed && fa.playerId === pid ? -FA_PENALTY : 0;
}

export function standings() {
  const rows = state.players.map(p => ({
    player: p,
    weekly: playerWeeklyTotal(p.id),
    milestone: playerMilestoneTotal(p.id),
    bets: sideBetPoints(p.id),
    faPen: playerFaPenalty(p.id),
    total: 0,
    rank: 1,
  }));
  rows.forEach(r => { r.total = r.weekly + r.milestone + r.bets + r.faPen; });
  rows.sort((a, b) => b.total - a.total);
  rows.forEach((r, i) => {
    r.rank = i > 0 && r.total === rows[i - 1].total ? rows[i - 1].rank : i + 1;
  });
  return rows;
}

export function currentLeader() {
  const s = standings();
  if (!s.length || s[0].total <= 0) return null;
  return s[0];
}
