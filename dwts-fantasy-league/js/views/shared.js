// Small shared view helpers.
import { h } from '../ui.js';
import { PLAYER_COLORS } from '../config.js';

export function playerTag(player, index, extraClass = '') {
  return h('span', { class: 'player-tag pc-' + PLAYER_COLORS[index] + ' ' + extraClass },
    h('span', { class: 'player-dot' }), player.name);
}

export function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
}

export function coupleAvatar(couple, index) {
  const grad = 'avatar-' + (index % 6);
  return h('div', { class: 'couple-avatar ' + grad }, initials(couple.celebrity || 'C'));
}
