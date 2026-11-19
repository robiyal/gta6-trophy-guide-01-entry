// Renders the progress header and the trophy cards from the data and the state.
import { isSpoiled, KIND_LABELS } from './filters.js';

function gradeBadge(trophy) {
  const badge = document.createElement('span');
  badge.className = `grade-badge grade-${trophy.grade}`;
  badge.textContent = trophy.grade;
  return badge;
}

function tag(text, cls) {
  const el = document.createElement('span');
  el.className = `tag ${cls}`;
  el.textContent = text;
  return el;
}

function countLabel(trophy) {
  if (trophy.count === null || trophy.countTotal === null) return null;
  if (trophy.countTotal >= 1000) return `$${trophy.countTotal.toLocaleString('en-US')}`;
  return `${trophy.count} / ${trophy.countTotal}`;
}

function sourceLinks(sources, sourceMap) {
  const p = document.createElement('p');
  p.className = 'sources';
  p.append(document.createTextNode('Sources: '));
  let first = true;
  for (const key of sources) {
    const src = sourceMap[key];
    if (!src) continue;
    if (!first) p.append(document.createTextNode(' · '));
    first = false;
    if (src.url) {
      const a = document.createElement('a');
      a.href = src.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = src.name;
      p.append(a);
    } else {
      p.append(document.createTextNode(src.name));
    }
  }
  return p;
}

export function trophyCard(trophy, state, sourceMap, onToggleEarned, openByDefault) {
  const spoiled = isSpoiled(trophy, state);
  const earned = state.earned.has(trophy.id);
  const card = document.createElement('article');
  card.className = 'card' + (earned ? ' earned' : '') + (trophy.missable ? ' missable-card' : '') + (spoiled ? ' spoiled' : '');
  card.id = `trophy-${trophy.id}`;

  const check = document.createElement('label');
  check.className = 'check';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned;
  box.setAttribute('aria-label', `Mark ${spoiled ? 'this story trophy' : trophy.name} as earned`);
  box.addEventListener('change', () => onToggleEarned(trophy.id, box.checked));
  const boxFace = document.createElement('span');
  boxFace.className = 'box';
  boxFace.textContent = '✓';
  check.append(box, boxFace);
  card.append(check);

  const body = document.createElement('div');
  body.className = 'card-body';
  const head = document.createElement('div');
  head.className = 'card-head';
  head.append(gradeBadge(trophy));
  const name = document.createElement('h3');
  name.textContent = spoiled ? 'Hidden story trophy' : trophy.name;
  head.append(name);
  if (trophy.missable) head.append(tag('⚠ Missable', 'missable'));
  if (trophy.hidden) head.append(tag('Hidden', 'hidden-tag'));
  const count = countLabel(trophy);
  if (count) head.append(tag(count, 'count'));
  head.append(tag(KIND_LABELS[trophy.kind] ?? trophy.kind, 'kind-tag'));
  body.append(head);

  const desc = document.createElement('p');
  desc.className = 'desc';
  desc.textContent = spoiled
    ? 'A story trophy — its name and description stay hidden until you earn it.'
    : trophy.description;
  body.append(desc);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'guide-toggle';
  toggle.textContent = spoiled ? 'Guide hidden until earned' : 'Guide + sources';
  body.append(toggle);

  const guide = document.createElement('div');
  guide.className = 'guide';
  guide.hidden = !openByDefault;
  if (!spoiled) {
    const text = document.createElement('p');
    text.textContent = trophy.guide;
    guide.append(text);
    if (trophy.missable && trophy.missableNote) {
      const note = document.createElement('p');
      note.className = 'missable-note';
      note.textContent = `⚠ ${trophy.missableNote}`;
      guide.append(note);
    }
    guide.append(sourceLinks(trophy.sources, sourceMap));
  }
  toggle.addEventListener('click', () => {
    if (spoiled) return;
    guide.hidden = !guide.hidden;
    toggle.textContent = guide.hidden ? 'Guide + sources' : 'Hide guide';
  });
  body.append(guide);
  card.append(body);
  return card;
}

export function renderProgress(trophies, earned) {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.id)).length;
  document.getElementById('earnedCount').textContent = `${done} / ${total}`;
  document.getElementById('earnedPct').textContent = `${Math.round((done / total) * 100)}%`;
  document.getElementById('progressFill').style.width = `${(done / total) * 100}%`;
  const byGrade = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const n = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    const all = trophies.filter((t) => t.grade === g).length;
    return `${g[0].toUpperCase()} ${n}/${all}`;
  });
  document.getElementById('gradeCounts').textContent = byGrade.join(' · ');
}

export function renderCards(listEl, trophies, state, sourceMap, onToggleEarned, openId) {
  listEl.replaceChildren();
  for (const trophy of trophies) {
    listEl.append(trophyCard(trophy, state, sourceMap, onToggleEarned, trophy.id === openId));
  }
  document.getElementById('listCount').textContent = `${trophies.length} shown`;
  document.getElementById('emptyNote').hidden = trophies.length > 0;
}
