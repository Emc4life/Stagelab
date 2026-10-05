// ---------------------------------------------------------------
// DWTS Fantasy League — scoring configuration & league constants
// Mirrors the official league spreadsheet rules exactly.
// ---------------------------------------------------------------

// Weekly scoring events (per drafted couple, per episode)
export const WEEKLY_SCORING = [
  { key: 'survived',  label: 'Survives an elimination',        pts: 1, type: 'toggle' },
  { key: 'lb',        label: "Judges' leaderboard position",   pts: '3 / 2 / 1', type: 'lb' },
  { key: 'tens',      label: 'Dance with at least one 10',     pts: 1, type: 'count', per: 'per dance' },
  { key: 'perfect',   label: 'Perfect score',                  pts: 3, type: 'count', per: 'per dance' },
  { key: 'danceOff',  label: 'Wins dance-off / relay',         pts: 2, type: 'toggle' },
  { key: 'immunity',  label: 'Earns immunity',                 pts: 2, type: 'toggle' },
  { key: 'bestDance', label: '"Best dance / best performance"',pts: 2, type: 'toggle' },
  { key: 'booed',     label: 'Judge gets audibly booed',       pts: 2, type: 'toggle' },
  { key: 'shirtOff',  label: 'Celebrity shirt comes off',      pts: 2, type: 'toggle' },
  { key: 'sexy',      label: 'Judge uses "sexy"',              pts: 1, type: 'count', per: 'per dance' },
  { key: 'safeLast',  label: 'Announced safe last',            pts: 1, type: 'toggle' },
  { key: 'opensShow', label: 'Opens the show',                 pts: 1, type: 'toggle' },
];

export const LB_POINTS = { 0: 0, 1: 3, 2: 2, 3: 1 };

// Milestone / finale bonuses (cumulative)
export const MILESTONE_BONUS = { top8: 2, top6: 4, finale: 7 };

// Final placement points (single value for the place reached)
export const PLACEMENT_POINTS = { 0: 0, 1: 20, 2: 12, 3: 7, 4: 4, 5: 0 };
export const PLACEMENT_LABELS = {
  0: '—',
  1: '1st · Wins the Mirrorball (+20)',
  2: '2nd place (+12)',
  3: '3rd place (+7)',
  4: '4th place (+4)',
  5: '5th place (+0)',
};

// Free agent
export const FA_PENALTY = 5; // deducted from the claiming player, once

// Private side bets
export const SIDE_BETS = [
  { key: 'firstElim',    label: 'First eliminated couple (first one called out)', pts: 6 },
  { key: 'first10',      label: 'First couple to receive a 10',                   pts: 7 },
  { key: 'firstCry',     label: 'First celebrity to cry on camera',               pts: 4 },
  { key: 'firstPerfect', label: 'First couple to get a perfect score',            pts: 8 },
];

export const NUM_PLAYERS = 5;
export const NUM_COUPLES = 16;
export const NUM_EPISODES = 14;
export const ROSTER_SIZE = 3;
export const TOTAL_DRAFT_PICKS = NUM_PLAYERS * ROSTER_SIZE; // 15 picks, 1 undrafted -> Free Agent

// Dancing with the Stars — Season 35 (2026) cast, announced on GMA Sept 2, 2026
export const S35_CAST = [
  { celebrity: 'Jenna Dewan',         pro: 'Val Chmerkovskiy' },
  { celebrity: 'Julia Stiles',        pro: 'Ezra Sosa' },
  { celebrity: 'Harry Shum Jr.',      pro: 'Jenna Johnson' },
  { celebrity: 'Tatyana Ali',         pro: 'Jan Ravnik' },
  { celebrity: 'Tyler Cameron',       pro: 'Sharna Burgess' },
  { celebrity: 'Giada De Laurentiis', pro: 'Alan Bersten' },
  { celebrity: 'Ezra Frech',          pro: 'Daniella Karagach' },
  { celebrity: 'Amber Glenn',         pro: 'Pasha Pashkov' },
  { celebrity: 'Taylor Hanson',       pro: 'Britt Stewart' },
  { celebrity: 'Maura Higgins',       pro: 'Mark Ballas' },
  { celebrity: 'Conner Leavitt',      pro: 'Adele Zaikman' },
  { celebrity: 'Ciara Miller',        pro: 'Brandon Armstrong' },
  { celebrity: 'Sarah Jane Nader',    pro: 'Hailey Bills' },
  { celebrity: 'Jackson Olson',       pro: 'Emma Slater' },
  { celebrity: 'Guillermo Rodriguez', pro: 'Witney Carson' },
  { celebrity: 'Connor Wood',         pro: 'Rylee Arnold' },
];

export const HOUSE_RULES = [
  'Milestone bonuses are cumulative. Finale couples also earn Top 8 and Top 6 bonuses.',
  'If a special episode format does not clearly fit a scoring category, it earns no bonus unless everyone agrees before the episode.',
  'If DWTS has five finalists, 5th place receives the +7 finale bonus only.',
  'Final fantasy ties: highest-finishing drafted couple, then most correct side bets, then split the glory.',
  'If there is a scoring/result dispute, the score or result officially published/announced by DWTS controls.',
  'Leaderboard points do not stack. Other weekly categories can stack.',
];

export const FREE_AGENT_RULES = [
  'One couple remains undrafted after the initial draft. Beginning after Week 1, that couple becomes available as a one-time free agent.',
  'You may recruit the free agent ONLY if one of your three drafted couples has been eliminated. You may not voluntarily swap an active couple for the free agent.',
  `Recruiting the free agent costs -${FA_PENALTY} fantasy points.`,
  'The free agent must still be in the competition and unclaimed at the time of recruitment. Once claimed, they are unavailable to everyone else.',
  'The free agent begins earning points for their new owner starting with the NEXT episode. No retroactive points are awarded.',
  `Because there is only one undrafted couple, the -${FA_PENALTY} point recruitment can happen only once during the season.`,
];

export const TABS = [
  { id: 'leaderboard', label: 'Standings',  icon: '🏆' },
  { id: 'tracker',     label: 'Tracker',    icon: '📋' },
  { id: 'draft',       label: 'Draft',      icon: '🎯' },
  { id: 'freeagent',   label: 'Free Agent', icon: '🔁' },
  { id: 'sidebets',    label: 'Side Bets',  icon: '🎲' },
  { id: 'milestones',  label: 'Milestones', icon: '✨' },
  { id: 'setup',       label: 'Setup',      icon: '⚙️' },
  { id: 'rules',       label: 'Rules',      icon: '📖' },
];

export const PLAYER_COLORS = ['gold', 'rose', 'teal', 'violet', 'sky'];
