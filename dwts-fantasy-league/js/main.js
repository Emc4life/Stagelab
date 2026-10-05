// App entry: header, tab navigation, view router.
import { state, currentLeader, playerIndex } from './state.js';
import { h, clear } from './ui.js';
import { onRender, requestRender } from './bus.js';
import { TABS, PLAYER_COLORS } from './config.js';

import * as leaderboard from './views/leaderboard.js';
import * as tracker from './views/tracker.js';
import * as draft from './views/draft.js';
import * as freeagent from './views/freeagent.js';
import * as sidebets from './views/sidebets.js';
import * as milestones from './views/milestones.js';
import * as setup from './views/setup.js';
import * as rules from './views/rules.js';

const VIEWS = { leaderboard, tracker, draft, freeagent, sidebets, milestones, setup, rules };
const SESSION_TAB_KEY = 'dwts-fantasy-tab';
let activeTab = sessionStorage.getItem(SESSION_TAB_KEY) || 'leaderboard';
if (!VIEWS[activeTab]) activeTab = 'leaderboard';

function buildShell() {
  const app = document.getElementById('app');
  clear(app);

  const leader = currentLeader();
  const header = h('header', { class: 'app-header' },
    h('div', { class: 'header-ball' }, '🪩'),
    h('div', { class: 'header-text' },
      h('h1', { id: 'league-name' }, state.league.name),
      h('p', { id: 'league-sub', class: 'sub' }, state.league.subtitle)),
    leader ? h('div', { class: 'header-leader' },
      h('span', { class: 'hl-crown' }, '👑'),
      h('span', { class: 'hl-name' }, leader.player.name),
      h('span', { class: 'hl-pts' }, leader.total + ' pts')) : null);
  app.appendChild(header);

  const main = h('main', { class: 'view', id: 'view' });
  app.appendChild(main);

  const nav = h('nav', { class: 'tabbar' });
  TABS.forEach(t => {
    nav.appendChild(h('button', {
      class: 'tab' + (t.id === activeTab ? ' on' : ''), type: 'button', 'data-tab': t.id,
      onclick: () => {
        activeTab = t.id;
        sessionStorage.setItem(SESSION_TAB_KEY, t.id);
        requestRender();
        window.scrollTo({ top: 0 });
      },
    }, h('span', { class: 'tab-icon' }, t.icon), h('span', { class: 'tab-label' }, t.label)));
  });
  app.appendChild(nav);
  app.appendChild(h('footer', { class: 'app-footer' },
    'Built for the league · scores follow the official spreadsheet · unofficial fan app'));
  return main;
}

function render() {
  const main = buildShell();
  const view = VIEWS[activeTab];
  if (view && view.render) view.render(main);
}

onRender(render);
render();
