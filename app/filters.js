// Filters, search and the spoiler rule: which trophies a view shows, and which
// story trophies stay hidden until they are earned.
export const KIND_FILTERS = [
  ['all', 'All'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectibles', 'Collectibles'],
  ['activities', 'Activities'],
  ['side', 'Side quests'],
  ['robbery', 'Robberies'],
  ['misc', 'One-offs'],
  ['online', 'Online'],
];

export const KIND_LABELS = {
  story: 'Story',
  side: 'Side quest',
  collectibles: 'Collectible',
  activities: 'Activity',
  robbery: 'Robbery',
  misc: 'One-off',
  platinum: 'Platinum',
};

// A story trophy is spoiled when the spoiler setting is on and it is not earned yet.
export function isSpoiled(trophy, state) {
  return state.spoilersHidden && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

export function trophyMatchesFilter(trophy, state) {
  if (state.kind === 'missable' && !trophy.missable) return false;
  if (state.kind === 'online') return false; // No online trophies: the whole list is offline.
  if (state.kind !== 'all' && state.kind !== 'missable' && trophy.kind !== state.kind) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.earnedOnly && !state.earned.has(trophy.id)) return false;
  if (state.query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

export function visibleTrophies(trophies, state) {
  return trophies.filter((t) => trophyMatchesFilter(t, state));
}
