/* 預覽卡片 5：陰影區塊（單列橫向排列、帶圓角、label-md 字型） */
export function createElevationCard() {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-elevation';
  card.id = 'card-elevation';

  card.innerHTML = `
    <div class="preview-card-body elevation-boxes">
      <div class="elevation-box ds-elevation-1"><span class="lang-zh">小陰影</span><span class="lang-sep"> / </span><span class="lang-en">Small Shadow</span></div>
      <div class="elevation-box ds-elevation-2"><span class="lang-zh">中陰影</span><span class="lang-sep"> / </span><span class="lang-en">Medium Shadow</span></div>
      <div class="elevation-box ds-elevation-3"><span class="lang-zh">大陰影</span><span class="lang-sep"> / </span><span class="lang-en">Large Shadow</span></div>
    </div>
  `;
  return card;
}