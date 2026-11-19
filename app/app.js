// Leonida Trophy Guide — bootstrap: loads the trophy and roadmap data, reads
// deep-link parameters, wires the controls and renders the tracker.
import { KIND_FILTERS, visibleTrophies } from './filters.js';
import { renderCards, renderProgress } from './render.js';
import { renderRoadmap } from './roadmap.js';
import {
  loadEarned, saveEarned, loadSpoilersHidden, saveSpoilersHidden,
  downloadProgress, parseProgressFile,
} from './tracker.js';

const data = await (await fetch('data/trophies.json')).json();
const roadmapData = await (await fetch('data/roadmap.json')).json();
const trophies = [...data.trophies].sort((a, b) => a.id - b.id);
const sourceMap = data.sources;

const params = new URLSearchParams(location.search);
const state = {
  earned: loadEarned(),
  spoilersHidden: params.get('spoilers') === 'off' ? false : params.get('spoilers') === 'on' ? true : loadSpoilersHidden(),
  kind: params.get('filter') ?? 'all',
  grade: params.get('grade') ?? 'all',
  earnedOnly: params.get('earned') === '1',
  query: (params.get('q') ?? '').toLowerCase().trim(),
};
const openId = params.get('open') ? Number(params.get('open')) : null;

const cardsEl = document.getElementById('cards');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('gradeFilter');
const earnedOnlyEl = document.getElementById('earnedOnly');
const spoilerEl = document.getElementById('spoilerToggle');

function renderAll() {
  renderProgress(trophies, state.earned);
  renderCards(cardsEl, visibleTrophies(trophies, state), state, sourceMap, onToggleEarned, openId);
}

function onToggleEarned(id, checked) {
  if (checked) state.earned.add(id);
  else state.earned.delete(id);
  saveEarned(state.earned);
  renderAll();
}

// Kind filter chips.
const chipsEl = document.getElementById('kindChips');
for (const [value, label] of KIND_FILTERS) {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.textContent = label;
  chip.setAttribute('aria-pressed', String(state.kind === value));
  chip.addEventListener('click', () => {
    state.kind = value;
    for (const c of chipsEl.children) c.setAttribute('aria-pressed', String(c === chip));
    renderAll();
  });
  chipsEl.append(chip);
}

searchEl.value = state.query;
searchEl.addEventListener('input', () => {
  state.query = searchEl.value.toLowerCase().trim();
  renderAll();
});
gradeEl.value = state.grade;
gradeEl.addEventListener('change', () => {
  state.grade = gradeEl.value;
  renderAll();
});
earnedOnlyEl.checked = state.earnedOnly;
earnedOnlyEl.addEventListener('change', () => {
  state.earnedOnly = earnedOnlyEl.checked;
  renderAll();
});
spoilerEl.checked = state.spoilersHidden;
spoilerEl.addEventListener('change', () => {
  state.spoilersHidden = spoilerEl.checked;
  saveSpoilersHidden(state.spoilersHidden);
  renderAll();
});

document.getElementById('exportBtn').addEventListener('click', () => downloadProgress(state.earned));
document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const next = parseProgressFile(await file.text(), new Set(trophies.map((t) => t.id)));
    state.earned = next;
    saveEarned(state.earned);
    renderAll();
  } catch {
    alert('That file is not a trophy-progress export from this guide.');
  }
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned ticks?')) return;
  state.earned = new Set();
  saveEarned(state.earned);
  renderAll();
});

renderRoadmap(
  document.getElementById('roadmap'),
  document.getElementById('roadmapIntro'),
  document.getElementById('roadmapNote'),
  document.getElementById('roadmapStages'),
  roadmapData,
  trophies,
);
renderAll();

if (params.get('view') === 'roadmap') {
  document.getElementById('roadmap').scrollIntoView();
} else if (params.get('view') === 'list') {
  document.querySelector('.list').scrollIntoView();
} else if (openId) {
  const el = document.getElementById(`trophy-${openId}`);
  el?.scrollIntoView({ block: 'start' });
  // When the opened card is not the first one shown, tuck the scroll a
  // little further: otherwise the card above it stays half-visible under
  // the sticky bar, its guide toggle peeking out with no card around it.
  // (When it is the first card, no tuck: its section heading above it
  // must stay visible below the bar.)
  const firstVisible = visibleTrophies(trophies, state)[0];
  if (el && firstVisible && firstVisible.id !== openId) window.scrollBy(0, 28);
}
