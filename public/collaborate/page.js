/* global document, navigator, fetch */
const list = document.querySelector('#prompt-list');
const text = document.querySelector('#prompt-text');
const copy = document.querySelector('#copy');
const status = document.querySelector('#copy-status');
const search = document.querySelector('#search');
const collaborator = document.querySelector('#collaborator');
const task = document.querySelector('#task');
let prompts = [];
let selected;
let category = 'All';

function updateText() {
  if (!selected) return;
  text.value = selected.body
    .replaceAll('{{collaborator}}', () => collaborator.value.trim() || '[your name]')
    .replaceAll('{{task}}', () => task.value.trim() || '[assigned task or issue]');
  status.textContent = 'Read the prompt, then copy it to your agent.';
}

function selectPrompt(prompt) {
  selected = prompt;
  document.querySelector('#selected-category').textContent = prompt.category.toUpperCase();
  document.querySelector('#selected-title').textContent = prompt.title;
  document.querySelector('#selected-description').textContent = prompt.description;
  copy.disabled = false;
  updateText();
}

function render() {
  const query = search.value.trim().toLowerCase();
  const shown = prompts.filter(
    (p) =>
      (category === 'All' || p.category === category) &&
      `${p.title} ${p.description} ${p.body}`.toLowerCase().includes(query),
  );
  list.replaceChildren();
  document.querySelector('#empty').hidden = shown.length !== 0;
  document.querySelector('#result-count').textContent =
    `${shown.length} of ${prompts.length} prompts`;
  if (shown.length > 0 && !shown.includes(selected)) selectPrompt(shown[0]);
  for (const prompt of shown) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'prompt-card';
    button.dataset.prompt = prompt.id;
    button.setAttribute('aria-pressed', String(selected === prompt));
    for (const [tag, className, value] of [
      ['span', 'card-tag', prompt.duration],
      ['strong', '', prompt.title],
      ['span', 'card-description', prompt.description],
    ]) {
      const part = document.createElement(tag);
      part.className = className;
      part.textContent = value;
      button.append(part);
    }
    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.textContent = '↗';
    arrow.setAttribute('aria-hidden', 'true');
    button.append(arrow);
    button.addEventListener('click', () => {
      selectPrompt(prompt);
      for (const card of list.querySelectorAll('button'))
        card.setAttribute('aria-pressed', String(card === button));
    });
    list.append(button);
  }
}

for (const button of document.querySelectorAll('[data-category]')) {
  button.addEventListener('click', () => {
    category = button.dataset.category;
    for (const filter of document.querySelectorAll('[data-category]'))
      filter.setAttribute('aria-pressed', String(filter === button));
    render();
  });
}
search.addEventListener('input', render);
collaborator.addEventListener('input', updateText);
task.addEventListener('input', updateText);
copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(text.value);
    status.textContent = 'Prompt copied. Paste it into your agent’s chat.';
  } catch {
    text.focus();
    text.select();
    status.textContent =
      'Automatic copy is unavailable. The prompt is selected; use your device’s Copy command.';
  }
});

try {
  const response = await fetch('./prompts.json');
  if (!response.ok) throw new Error('Prompt request failed.');
  const data = await response.json();
  if (
    !Array.isArray(data.prompts) ||
    data.prompts.length === 0 ||
    !data.prompts.every((p) =>
      ['id', 'title', 'description', 'category', 'duration', 'body'].every(
        (field) => typeof p[field] === 'string' && p[field].length > 0,
      ),
    )
  )
    throw new Error('Invalid prompts.');
  prompts = data.prompts;
  selectPrompt(prompts[0]);
  render();
} catch {
  document.querySelector('#load-error').hidden = false;
  document.querySelector('#result-count').textContent = 'Prompts unavailable';
}
