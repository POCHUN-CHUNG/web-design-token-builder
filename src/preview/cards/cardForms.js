/* 預覽卡片 4：表單元件（輸入框整合、滑桿、Dock 導覽列展示、12 項控制項展示） */
export function createFormsCard() {
  const card = document.createElement('div');
  card.className = 'preview-card card-col-forms';
  card.id = 'card-forms';

  card.innerHTML = `
    <div class="preview-card-body" style="display:flex; flex-direction:column; gap:14px; padding:2px; overflow:visible; flex: 1; justify-content: space-between;">
      <!-- 1. 輸入框整合區塊 (無多餘小標) -->
      <div class="form-field-group" style="overflow:visible;">
        <label class="form-field-label" style="font-weight:600;"><span class="lang-zh">輸入框</span><span class="lang-sep"> / </span><span class="lang-en">Input</span></label>
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; overflow:visible;">
          <input type="text" class="ds-input" id="sample-input-normal" value="標準" placeholder="輸入文字...">
          <input type="text" class="ds-input is-focus" id="sample-input-focus" value="聚焦" placeholder="聚焦狀態...">
          <input type="text" class="ds-input is-disabled" id="sample-input-disabled" value="停止" disabled>
          <!-- 下拉選單 -->
          <div class="ds-custom-select" id="sample-custom-select">
            <div class="ds-custom-select-trigger" tabindex="0" role="button" aria-haspopup="listbox">
              <span class="ds-custom-select-label" id="sample-select-label">選單</span>
              <span class="ds-custom-select-arrow" style="display:flex; align-items:center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </span>
            </div>
            <div class="ds-custom-select-popover" id="sample-select-popover">
              <div class="ds-custom-option" data-val="1">選項一</div>
              <div class="ds-custom-option" data-val="2">選項二</div>
              <div class="ds-custom-option" data-val="3">選項三</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 滑桿 (Slider) -->
      <div class="form-field-group">
        <label class="form-field-label" id="sample-slider-label" style="font-weight:600;"><span class="lang-zh">滑桿</span><span class="lang-sep"> / </span><span class="lang-en">Slider</span></label>
        <div style="padding: 4px 0;">
          <div id="interactive-slider" class="ds-slider" style="width:100%; height:4px; background:var(--ds-surface-raised, #f0f2f5); border-radius:var(--ds-check-radius, 4px); position:relative; cursor:pointer;">
            <div id="interactive-slider-track" class="ds-slider-track" style="position:absolute; left:0; top:0; height:100%; width:50%; background:var(--ds-color-primary-500, #2563eb); border-radius:var(--ds-check-radius, 4px); pointer-events:none;"></div>
            <div id="interactive-slider-thumb" class="ds-slider-thumb" style="position:absolute; left:50%; top:50%; transform:translate(-50%, -50%); width:16px; height:16px; background:var(--ds-color-primary-500, #2563eb); border-radius:var(--ds-check-radius, 4px); cursor:pointer;"></div>
          </div>
        </div>
      </div>

      <!-- 3. 導覽列 (Dock & Tabs) -->
      <div class="form-field-group" style="width: 100%;">
        <label class="form-field-label" style="font-weight:600;"><span class="lang-zh">導覽列</span><span class="lang-sep"> / </span><span class="lang-en">Navigation</span></label>
        <div style="display:flex; flex-direction:column; gap: 16px; padding: 4px 0; width: 100%;">
          
          <!-- 底部導覽列 (Dock) -->
          <div id="interactive-dock" style="display: flex; align-items: center; justify-content: space-around; padding: 8px 16px; background: var(--ds-surface-raised, rgba(0,0,0,0.03)); border-radius: var(--ds-btn-radius, 8px); width: 100%; box-sizing: border-box;">
            <div class="dock-item active" style="width: 36px; height: 36px; border-radius: var(--ds-btn-radius, 8px); background: var(--ds-color-primary-500, #3b82f6); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ds-color-on-primary, #ffffff); transition: all 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            </div>
            <div class="dock-item" style="width: 36px; height: 36px; border-radius: var(--ds-btn-radius, 8px); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ds-surface-text-muted, #71717a); background: transparent; transition: all 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <div class="dock-item" style="width: 36px; height: 36px; border-radius: var(--ds-btn-radius, 8px); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--ds-surface-text-muted, #71717a); background: transparent; transition: all 0.2s;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
          </div>

          <!-- 頂部標籤列 (Tabs) -->
          <div class="ds-tabs-wrapper tabs-underline" id="interactive-tabs" style="width: 100%;">
            <button class="ds-tab-btn is-active"><span class="lang-zh">首頁</span><span class="lang-sep"> / </span><span class="lang-en">Home</span></button>
            <button class="ds-tab-btn"><span class="lang-zh">搜尋</span><span class="lang-sep"> / </span><span class="lang-en">Search</span></button>
            <button class="ds-tab-btn"><span class="lang-zh">設定</span><span class="lang-sep"> / </span><span class="lang-en">Settings</span></button>
          </div>
        </div>
      </div>

      <!-- 4. 控制項陣列 -->
      <div class="form-field-group">
        <label class="form-field-label" style="font-weight:600;"><span class="lang-zh">控制項</span><span class="lang-sep"> / </span><span class="lang-en">Controls</span></label>
        <div style="display:flex; flex-direction:column; gap:10px; background:var(--ds-surface-raised, rgba(0,0,0,0.02)); padding:var(--ds-subcard-padding, 12px); border-radius:var(--ds-subcard-radius, 8px); border:var(--ds-subcard-border-width, 1px) solid var(--ds-surface-border, #e2e5ea);">
          <!-- 控制項陣列 (Toggle, Checkbox, Radio) -->
          <div style="display:grid; grid-template-columns: max-content auto auto auto; justify-content: space-between; align-items:center; column-gap: 12px; row-gap: 16px;">
            <!-- 列 1：開關 (Switch) - 6 items -->
            <span style="font-size:var(--ds-fs-label-md, 13px); font-weight:500; color:var(--ds-surface-text);"><span class="lang-zh">開關</span><span class="lang-sep"> / </span><span class="lang-en">Switch</span></span>
            <!-- Small: On, Off -->
            <div style="display:flex; align-items:center; justify-content:center; gap:12px;">
              <div class="ds-toggle checked" style="width:30px; height:16px; cursor:default;"><div class="ds-toggle-knob" style="width:12px; height:12px; top:1px; left:1px; transform:translateX(14px);"></div></div>
              <div class="ds-toggle" style="width:30px; height:16px; cursor:default;"><div class="ds-toggle-knob" style="width:12px; height:12px; top:1px; left:1px; transform:none;"></div></div>
            </div>
            <!-- Medium: On, Off -->
            <div style="display:flex; align-items:center; justify-content:center; gap:12px;">
              <div class="ds-toggle checked" style="width:36px; height:20px; cursor:default;"><div class="ds-toggle-knob" style="width:16px; height:16px; top:1px; left:1px; transform:translateX(16px);"></div></div>
              <div class="ds-toggle" style="width:36px; height:20px; cursor:default;"><div class="ds-toggle-knob" style="width:16px; height:16px; top:1px; left:1px; transform:none;"></div></div>
            </div>
            <!-- Large: On, Off -->
            <div style="display:flex; align-items:center; justify-content:center; gap:12px;">
              <div class="ds-toggle checked" style="cursor:default;"><div class="ds-toggle-knob"></div></div>
              <div class="ds-toggle" style="cursor:default;"><div class="ds-toggle-knob"></div></div>
            </div>

            <!-- 列 2：核取方塊 (Checkbox) - 6 items -->
            <span style="font-size:var(--ds-fs-label-md, 13px); font-weight:500; color:var(--ds-surface-text);"><span class="lang-zh">多選</span><span class="lang-sep"> / </span><span class="lang-en">Checkbox</span></span>
            <!-- Small: Checked, Unchecked -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
              <div class="ds-checkbox checked" style="width:14px; height:14px; cursor:default;"></div>
              <div class="ds-checkbox" style="width:14px; height:14px; cursor:default;"></div>
            </div>
            <!-- Medium: Checked, Unchecked -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
              <div class="ds-checkbox checked" style="width:18px; height:18px; cursor:default;"></div>
              <div class="ds-checkbox" style="width:18px; height:18px; cursor:default;"></div>
            </div>
            <!-- Large: Checked, Unchecked -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
              <div class="ds-checkbox checked" style="width:22px; height:22px; cursor:default;"></div>
              <div class="ds-checkbox" style="width:22px; height:22px; cursor:default;"></div>
            </div>

            <!-- 列 3：單選鈕 (Radio) - 6 items -->
            <span style="font-size:var(--ds-fs-label-md, 13px); font-weight:500; color:var(--ds-surface-text);"><span class="lang-zh">單選</span><span class="lang-sep"> / </span><span class="lang-en">Radio</span></span>
            <!-- Small: Selected, Unselected -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
              <div class="ds-radio checked" style="width:14px; height:14px; cursor:default;"><div class="ds-radio-dot" style="width:6px; height:6px;"></div></div>
              <div class="ds-radio" style="width:14px; height:14px; cursor:default;"><div class="ds-radio-dot" style="display:none;"></div></div>
            </div>
            <!-- Medium: Selected, Unselected -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
              <div class="ds-radio checked" style="width:18px; height:18px; cursor:default;"><div class="ds-radio-dot" style="width:8px; height:8px;"></div></div>
              <div class="ds-radio" style="width:18px; height:18px; cursor:default;"><div class="ds-radio-dot" style="display:none;"></div></div>
            </div>
            <!-- Large: Selected, Unselected -->
            <div style="display:flex; align-items:center; justify-content:center; gap:16px;">
              <div class="ds-radio checked" style="width:22px; height:22px; cursor:default;"><div class="ds-radio-dot" style="width:10px; height:10px;"></div></div>
              <div class="ds-radio" style="width:22px; height:22px; cursor:default;"><div class="ds-radio-dot" style="display:none;"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  /* 自訂下拉選單互動事件 */
  const customSelect = card.querySelector('#sample-custom-select');
  const selectTrigger = card.querySelector('.ds-custom-select-trigger');
  const selectPopover = card.querySelector('#sample-select-popover');
  const selectLabel = card.querySelector('#sample-select-label');
  const options = card.querySelectorAll('.ds-custom-option');

  if (selectTrigger && selectPopover) {
    selectTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = selectPopover.classList.toggle('is-open');
      selectTrigger.classList.toggle('is-active', isOpen);
    });

    options.forEach(opt => {
      opt.addEventListener('click', (e) => {
        e.stopPropagation();
        options.forEach(o => o.classList.remove('is-selected'));
        opt.classList.add('is-selected');
        if (selectLabel) selectLabel.textContent = opt.textContent;
        selectPopover.classList.remove('is-open');
        selectTrigger.classList.remove('is-active');
      });
    });

    document.addEventListener('click', (e) => {
      if (!customSelect.contains(e.target)) {
        selectPopover.classList.remove('is-open');
        selectTrigger.classList.remove('is-active');
      }
    });

    window.addEventListener('app:reset', () => {
      options.forEach(o => o.classList.remove('is-selected'));
      selectPopover.classList.remove('is-open');
      selectTrigger.classList.remove('is-active');
      if (selectLabel) {
        const previewRoot = document.getElementById('preview-root');
        const isZh = previewRoot ? previewRoot.dataset.locale === 'zh-TW' : true;
        selectLabel.textContent = isZh ? "選單" : "Select";
      }
    });
  }

  /* 滑桿互動 */
  const slider = card.querySelector('#interactive-slider');
  const sliderTrack = card.querySelector('#interactive-slider-track');
  const sliderThumb = card.querySelector('#interactive-slider-thumb');
  if (slider && sliderTrack && sliderThumb) {
    let isDragging = false;
    const updateSlider = (clientX) => {
      const rect = slider.getBoundingClientRect();
      let percent = (clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      const percentage = (percent * 100).toFixed(2) + '%';
      sliderTrack.style.width = percentage;
      sliderThumb.style.left = percentage;
    };
    slider.addEventListener('mousedown', (e) => {
      isDragging = true;
      updateSlider(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      if (isDragging) updateSlider(e.clientX);
    });
    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
    window.addEventListener('app:reset', () => {
      sliderTrack.style.width = '50%';
      sliderThumb.style.left = '50%';
    });
  }

  /* 底部導覽列 (Dock) 互動 */
  const dock = card.querySelector('#interactive-dock');
  if (dock) {
    const dockItems = dock.querySelectorAll('.dock-item');
    dockItems.forEach(item => {
      item.addEventListener('click', () => {
        dockItems.forEach(d => {
          d.classList.remove('active');
          d.style.background = 'transparent';
          d.style.color = 'var(--ds-surface-text-muted, #71717a)';
        });
        item.classList.add('active');
        item.style.background = 'var(--ds-color-primary-500, #3b82f6)';
        item.style.color = 'var(--ds-color-on-primary, #ffffff)';
      });
    });
    window.addEventListener('app:reset', () => {
      dockItems.forEach((d, idx) => {
        if (idx === 0) {
          d.classList.add('active');
          d.style.background = 'var(--ds-color-primary-500, #3b82f6)';
          d.style.color = 'var(--ds-color-on-primary, #ffffff)';
        } else {
          d.classList.remove('active');
          d.style.background = 'transparent';
          d.style.color = 'var(--ds-surface-text-muted, #71717a)';
        }
      });
    });
  }

  /* 頂部標籤列 (Tabs) 互動 */
  const tabs = card.querySelector('#interactive-tabs');
  if (tabs) {
    const tabBtns = tabs.querySelectorAll('.ds-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
      });
    });
    window.addEventListener('app:reset', () => {
      tabBtns.forEach((b, idx) => {
        if (idx === 0) b.classList.add('is-active');
        else b.classList.remove('is-active');
      });
    });
  }

  const inpNormal = card.querySelector("#sample-input-normal");
  const inpFocus = card.querySelector("#sample-input-focus");
  const inpDisabled = card.querySelector("#sample-input-disabled");

  function update(state) {
    const locale = state?.meta?.locale || "zh-TW";
    const isZh = locale === "zh-TW";
    const isEn = locale === "en";

    if (inpNormal) {
      inpNormal.value = isZh ? "標準" : (isEn ? "Standard" : "標準 / Standard");
    }
    if (inpFocus) {
      inpFocus.value = isZh ? "聚焦" : (isEn ? "Focus" : "聚焦 / Focus");
    }
    if (inpDisabled) {
      inpDisabled.value = isZh ? "停止" : (isEn ? "Disabled" : "停止 / Disabled");
    }
    if (options.length >= 3) {
      options[0].textContent = isZh ? "選項一" : (isEn ? "Option 1" : "選項一 / Option 1");
      options[1].textContent = isZh ? "選項二" : (isEn ? "Option 2" : "選項二 / Option 2");
      options[2].textContent = isZh ? "選項三" : (isEn ? "Option 3" : "選項三 / Option 3");
      const selectedOpt = card.querySelector('.ds-custom-option.is-selected');
      if (selectedOpt && selectLabel) {
        selectLabel.textContent = selectedOpt.textContent;
      } else if (selectLabel) {
        selectLabel.textContent = isZh ? "選單" : "Select";
      }
    }
  }

  return { card, update };
}