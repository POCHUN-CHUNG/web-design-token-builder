/* 預覽卡片：段落展示（主標題、副標題、內文、有序清單、無序清單、程式碼區塊、APA參考連結） */
export function createParagraphCard() {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-paragraph';
  card.id = 'card-paragraph';

  card.innerHTML = `
    <div class="preview-card-body paragraph-body" style="display:flex; flex-direction:column; max-height:100%; overflow-y:auto; padding-right:4px;">
      <!-- 1. 主標題 -->
      <h3 class="paragraph-heading" style="margin:0; font-family:var(--ds-font-heading); font-size:var(--ds-fs-headline-lg, 24px); font-weight:var(--ds-fw-headline-lg, 700); color:var(--ds-surface-text); line-height:var(--ds-lh-headline-lg, 1.15); letter-spacing:var(--ds-ls-headline-lg, -0.02em);">
        <span class="lang-zh">多層次設計語言與空間節奏</span>
        <span class="lang-sep"> / </span>
        <span class="lang-en">Multi-Tier Design Language & Spatial Rhythm</span>
      </h3>

      <!-- 2. 內文 (第一段落) -->
      <p class="paragraph-text" style="margin:0 0 12px 0; font-family:var(--ds-font-body); font-size:var(--ds-fs-body-md, 15px); line-height:1.6; color:var(--ds-surface-text);">
        <span class="lang-zh">現代設計系統不僅是元件的集合，更是一套嚴密的視覺語法與決策模型。透過精準的數學比例推導，系統能在不同尺寸階層維持一致的感知對比，使介面在多樣裝置下皆呈現平衡穩定的空間律動。</span>
        <span class="lang-sep"><br><br></span>
        <span class="lang-en">A modern design system is not merely a collection of components, but a cohesive visual grammar and decision framework. Through modular mathematical ratios, it maintains optical harmony and spatial rhythm across platforms.</span>
      </p>

      <!-- 列表與程式碼區塊並排 -->
      <div style="display:flex; gap:20px;">
        
        <!-- 左側：清單與段落 -->
        <div style="flex:1; display:flex; flex-direction:column;">
          <!-- 3. 有序清單 (>= 2項) -->
          <ol class="paragraph-olist" style="margin:0 0 12px 0; padding-left:22px; font-family:var(--ds-font-body); font-size:var(--ds-fs-body-md, 15px); line-height:1.6; color:var(--ds-surface-text);">
            <li><span class="lang-zh">定義語意化基礎 Token 與多層級變數</span><span class="lang-sep"> / </span><span class="lang-en">Establish semantic tokens and multi-tier variable hierarchy</span></li>
            <li><span class="lang-zh">建立自適應排版網格與參數化間距系統</span><span class="lang-sep"> / </span><span class="lang-en">Implement responsive grids and parametric spatial scales</span></li>
            <li><span class="lang-zh">落實無障礙標準與跨元件互動規範</span><span class="lang-sep"> / </span><span class="lang-en">Enforce accessibility compliance and cohesive component ergonomics</span></li>
          </ol>

          <!-- 4. 副標題 (移至此處，並改為主要文字顏色) -->
          <h4 class="paragraph-subheading" style="margin:0; font-family:var(--ds-font-heading); font-size:var(--ds-fs-headline-md, 20px); font-weight:var(--ds-fw-headline-md, 600); color:var(--ds-surface-text); line-height:var(--ds-lh-headline-md, 1.25); letter-spacing:var(--ds-ls-headline-md, -0.01em);">
            <span class="lang-zh">建構一致性與高延展性的數位產品基礎</span>
            <span class="lang-sep"> / </span>
            <span class="lang-en">Building Consistent & Scalable Digital Foundations</span>
          </h4>

          <!-- 5. 內文 (第二段落) -->
          <p class="paragraph-text" style="margin:0 0 12px 0; font-family:var(--ds-font-body); font-size:var(--ds-fs-body-md, 15px); line-height:1.6; color:var(--ds-surface-text);">
            <span class="lang-zh">我們將各種繁複的設定收斂至直觀的操作介面上。設計師只需調整核心意圖，系統便會自動衍生出相應的層級結構。</span>
            <span class="lang-sep"><br><br></span>
            <span class="lang-en">We converge complex configurations into intuitive interfaces. By adjusting core intents, the system automatically derives the corresponding hierarchical structures.</span>
          </p>

          <!-- 6. 無序清單 (>= 2項) -->
          <ul class="paragraph-list" style="margin:0; padding-left:22px; font-family:var(--ds-font-body); font-size:var(--ds-fs-body-md, 15px); line-height:1.6; color:var(--ds-surface-text);">
            <li><span class="lang-zh">感知均勻色彩演算與智慧對比防護</span><span class="lang-sep"> / </span><span class="lang-en">Perceptually uniform color derivation with contrast guard</span></li>
            <li><span class="lang-zh">多階圓角聯動與層級深度陰影策略</span><span class="lang-sep"> / </span><span class="lang-en">Cascading radius layers and calibrated elevation depths</span></li>
            <li><span class="lang-zh">流暢微交互與無阻礙鍵盤焦點循環</span><span class="lang-sep"> / </span><span class="lang-en">Fluid state transitions and accessible focus ring cycles</span></li>
          </ul>
        </div>

        <!-- 右側：程式碼區塊 -->
        <div style="flex:0 0 max-content; margin-left:auto; position:relative;">
          <span style="position:absolute; top:12px; right:16px; font-size:12px; font-family:var(--ds-font-body); font-weight:400; color:var(--ds-surface-text-muted, #71717a); user-select:none;">CSS</span>
          <pre class="paragraph-code-block" style="margin:0; height:100%; padding:16px 64px 16px 16px; box-sizing:border-box; background:var(--ds-surface-raised, rgba(0,0,0,0.03)); border:1px solid var(--ds-surface-border, #e2e5ea); border-radius:var(--ds-subcard-radius, var(--ds-radius-md, 8px)); overflow-x:hidden; white-space:pre;"><code class="ds-code" style="font-family:var(--ds-font-body); font-size:var(--ds-fs-body-sm, 13px); color:var(--ds-surface-text); line-height:1.5;">:root {
  --ds-color-primary: #8D5B30;
  --ds-spacing-base: 10px;
  --ds-gutter: 20px;
}

.preview-card {
  border-radius: var(--ds-radius-md);
}</code></pre>
        </div>
      </div>

      <!-- 7. 參考資料連結 (APA 格式假連結，恢復 hover) -->
      <div class="paragraph-reference" style="font-family:var(--ds-font-body); font-size:var(--ds-fs-body-sm, 13px); line-height:1.5; color:var(--ds-surface-text-muted, #71717a); border-top:1px solid var(--ds-surface-border, #e2e5ea); padding-top:8px;">
        <span class="lang-zh">參考資料：</span><span class="lang-en">Reference: </span>
        <span>Frost, B. (2016). </span><a href="javascript:void(0)" class="ds-link">Atomic design: Methodology for creating design systems</a><span>. Brad Frost Collection, 4(1), 42–89.</span>
      </div>
    </div>
  `;

  function update(state) {}

  return {
    card,
    update
  };
}
