// Renders the platinum roadmap: the three stages, the missable warning and the
// save advice, with each stage's trophy count drawn from the data.
export function renderRoadmap(roadmapEl, introEl, noteEl, stagesEl, roadmap, trophies) {
  document.getElementById('roadmapTitle').textContent = roadmap.title;
  introEl.textContent = roadmap.intro;
  noteEl.textContent = `${roadmap.missableWarning} ${roadmap.saveAdvice}`;
  stagesEl.replaceChildren();
  for (const stage of roadmap.stages) {
    const count = trophies.filter((t) => t.roadmap === stage.stage).length;
    const card = document.createElement('div');
    card.className = 'stage';
    const h = document.createElement('h3');
    const step = document.createElement('span');
    step.className = 'step';
    step.textContent = `Step ${stage.stage}`;
    h.append(step, document.createTextNode(stage.title));
    const hours = document.createElement('p');
    hours.className = 'hours';
    hours.textContent = `${stage.hours} · ${count} trophies`;
    const text = document.createElement('p');
    text.textContent = stage.text;
    const note = document.createElement('p');
    note.className = 'trophy-note';
    note.textContent = stage.trophyNote;
    card.append(h, hours, text, note);
    stagesEl.append(card);
  }
}
