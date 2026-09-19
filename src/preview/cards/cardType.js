import { TYPE_SCALE_TABLE } from '../../tokens/derive.js';
export function createTypeCard() {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-type';
  card.id = 'card-type';

  card.innerHTML = `
    <div class="preview-card-body type-ladder" id="type-ladder-container"></div>
  `;

  const container = card.querySelector('#type-ladder-container');

  for (const step of Object.keys(TYPE_SCALE_TABLE)) {
    const row = document.createElement('div');
    row.className = 'type-ladder-row';

    const sample = document.createElement('span');
    sample.className = 'type-ladder-sample';
    sample.innerHTML = '<span class="lang-zh">範例文字</span><span class="lang-sep"> / </span><span class="lang-en">Example Text</span>';
    sample.style.fontFamily = step.startsWith('headline')
      ? 'var(--ds-font-heading)'
      : step.startsWith('label')
      ? 'var(--ds-font-label)'
      : 'var(--ds-font-body)';
    sample.style.fontSize = `var(--ds-fs-${step})`;
    sample.style.fontWeight = `var(--ds-fw-${step})`;
    sample.style.lineHeight = `var(--ds-lh-${step})`;
    sample.style.letterSpacing = `var(--ds-ls-${step})`;

    const meta = document.createElement('span');
    meta.className = 'type-ladder-meta';
    meta.dataset.step = step;
    meta.textContent = step;

    row.appendChild(sample);
    row.appendChild(meta);
    container.appendChild(row);
  }

  return card;
}