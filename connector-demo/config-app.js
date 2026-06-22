/* =========================================================
 * 配置抽屉交互逻辑 - 分步式（google-ads 风格）
 * 步骤：账户 → 维度 → 指标
 * 底部：调度设置收缩区
 * ========================================================= */

/* ---------- 状态 ---------- */
const state = {
  // 当前步骤: accounts | dimensions | metrics
  currentStep: 'accounts',
  
  // 连接器名称
  name: '',
  
  // 平台账户 ID
  platformAcctId: null,
  
  // 广告账户
  adAcctTab: 'all',  // all | list | manual | import
  selectedAdAccounts: new Set(),
  manualAdAcctInput: '',
  importFeedback: { valid: [], invalid: [] },
  
  // 字段选择
  selectedFields: new Set(),
  fieldSearchQuery: '',
  
  // 调度设置
  freq: 'daily',
  dateMode: 'relative',
  relativeDays: 30,
  absoluteStart: '',
  absoluteEnd: '',
  schedType: 'incremental',
  rerunPolicy: 'skip',
  sinkMode: 'built-in',     // built-in 默认内置 | custom 自定义数据库
  customDestId: '',         // 自定义时选中的 destination id
  sinkTable: ''             // 落库表名（内置时自动生成；自定义时手动填写）
};

/* ---------- 初始化默认值 ---------- */
function initDefaults() {
  // 默认选中最近授权的平台账户
  const latestAcct = getLatestAuthorizedAccount();
  if (latestAcct) {
    state.platformAcctId = latestAcct.id;
  }
  
  // 默认名称：平台名 + 时间戳
  state.name = `${ACTIVE_META.name} Connector ${new Date().toISOString().slice(0, 10)}`;
  
  // 默认选中常用字段
  COMMON_FIELDS.forEach(fid => state.selectedFields.add(fid));
  
  // 默认日期
  const today = new Date().toISOString().slice(0, 10);
  state.absoluteStart = today;
  state.absoluteEnd = today;
  
  // 默认表名：使用平台预设的内置表名
  state.sinkTable = ACTIVE_META.sink || `conn_${ACTIVE_PLATFORM}_data`;
}

/* ---------- 步骤切换 ---------- */
function switchStep(step) {
  state.currentStep = step;
  
  // 更新步骤按钮状态
  document.querySelectorAll('.config-step-button').forEach(btn => {
    if (btn.dataset.step === step) {
      btn.setAttribute('aria-current', 'step');
    } else {
      btn.removeAttribute('aria-current');
    }
  });
  
  // 显示/隐藏步骤面板
  document.querySelectorAll('.config-step-pane').forEach(pane => {
    if (pane.id === `pane-${step}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
  
  // 更新底部按钮
  updateFooterButtons();
  updateFooterSummary();
}

function prevStep() {
  const steps = ['accounts', 'dimensions', 'metrics'];
  const idx = steps.indexOf(state.currentStep);
  if (idx > 0) {
    switchStep(steps[idx - 1]);
  }
}

function nextStep() {
  const steps = ['accounts', 'dimensions', 'metrics'];
  const idx = steps.indexOf(state.currentStep);
  if (idx < steps.length - 1) {
    switchStep(steps[idx + 1]);
  }
}

function updateFooterButtons() {
  const steps = ['accounts', 'dimensions', 'metrics'];
  const idx = steps.indexOf(state.currentStep);
  
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const btnApply = document.getElementById('btnApply');
  
  // 上一步按钮
  if (idx === 0) {
    btnPrev.disabled = true;
  } else {
    btnPrev.disabled = false;
  }
  
  // 下一步 / 应用按钮
  if (idx === steps.length - 1) {
    btnNext.style.display = 'none';
    btnApply.style.display = 'inline-flex';
  } else {
    btnNext.style.display = 'inline-flex';
    btnApply.style.display = 'none';
  }
}

function updateFooterSummary() {
  const acctCount = state.adAcctTab === 'all' 
    ? (state.platformAcctId ? getPlatformAccount(state.platformAcctId).adAccounts.length : 0)
    : state.selectedAdAccounts.size;
  
  const dims = Array.from(state.selectedFields).filter(fid => {
    const f = FIELD_INDEX[fid];
    return f && f.kind === 'dim';
  }).length;
  
  const metrics = Array.from(state.selectedFields).filter(fid => {
    const f = FIELD_INDEX[fid];
    return f && f.kind === 'metric';
  }).length;
  
  document.getElementById('footerSummary').innerHTML = 
    `已选择 <b>${acctCount}</b> 个账户，<b>${dims}</b> 个维度，<b>${metrics}</b> 个指标`;
}

/* ---------- 渲染步骤 1: 账户 ---------- */
function renderAccountsStep() {
  const left = document.getElementById('accountsLeft');
  const right = document.getElementById('accountsRight');
  
  // 左侧：连接器名称 + 平台账户 + 广告账户
  left.innerHTML = `
    <div class="field">
      <label class="field-label">
        <span>连接器名称</span>
        <span class="req">*</span>
      </label>
      <input type="text" class="text-input" id="connectorName" value="${escapeHtml(state.name)}" 
        placeholder="输入连接器名称" onchange="state.name = this.value; updateFooterSummary();">
      <div class="field-hint">为这个数据源起个名字，方便在列表中识别</div>
    </div>
    
    <div class="field">
      <label class="field-label">
        <span>平台账户</span>
        <span class="req">*</span>
        <svg class="help-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-tip="选择已授权的平台账户（登录号），将采集该账户下的广告数据">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
        </svg>
      </label>
      ${renderPlatformAccountSelect()}
    </div>
    
    <div class="field">
      <label class="field-label">
        <span>广告账户</span>
        <span class="req">*</span>
      </label>
      ${renderAdAccountTabs()}
    </div>
  `;
  
  // 右侧：已选账户汇总
  right.innerHTML = renderAccountsSummary();
  
  // 绑定事件
  mountPlatformAccountSelect();
  mountAdAccountTabs();
}

/* ---------- 渲染步骤 2: 维度 ---------- */
function renderDimensionsStep() {
  const left = document.getElementById('dimensionsLeft');
  const right = document.getElementById('dimensionsRight');
  
  left.innerHTML = `
    <div class="field-search-wrap">
      <input type="text" class="field-search" id="dimSearch" placeholder="搜索维度..." 
        oninput="state.fieldSearchQuery = this.value; renderDimensionsStep();">
    </div>
    ${renderFieldCategories('dim')}
  `;
  
  right.innerHTML = renderFieldsSummary('dim');
}

function renderFieldCategories(kind) {
  const categories = FIELD_CATEGORIES.map(cat => {
    const fields = cat.fields.filter(f => {
      if (f.kind !== kind) return false;
      if (state.fieldSearchQuery) {
        const q = state.fieldSearchQuery.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q);
      }
      return true;
    });
    return { ...cat, fields };
  }).filter(cat => cat.fields.length > 0);
  
  return categories.map(cat => {
    const selectedCount = cat.fields.filter(f => state.selectedFields.has(f.id)).length;
    
    return `
      <div class="field-category">
        <div class="field-category-header">
          <div class="field-category-name">${cat.name}</div>
          <div class="field-category-count"><b>${selectedCount}</b> / ${cat.fields.length}</div>
        </div>
        <div class="field-grid">
          ${cat.fields.map(f => {
            const selected = state.selectedFields.has(f.id);
            return `
              <button class="field-chip ${f.kind} ${selected ? '' : 'off'}" 
                onclick="toggleField('${f.id}')">
                <span class="dot"></span>
                <span>${escapeHtml(f.name)}</span>
                ${selected ? '<span class="check-icon">✓</span>' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function toggleField(fid) {
  if (state.selectedFields.has(fid)) {
    state.selectedFields.delete(fid);
  } else {
    state.selectedFields.add(fid);
  }
  
  // 重新渲染当前步骤
  if (state.currentStep === 'dimensions') {
    renderDimensionsStep();
  } else if (state.currentStep === 'metrics') {
    renderMetricsStep();
  }
  
  updateFooterSummary();
}

function renderFieldsSummary(kind) {
  const kindLabel = kind === 'dim' ? '维度' : '指标';
  const fields = Array.from(state.selectedFields)
    .map(fid => FIELD_INDEX[fid])
    .filter(f => f && f.kind === kind);
  
  if (fields.length === 0) {
    return `
      <div class="summary-header">
        <div class="summary-title">已选${kindLabel}</div>
        <div class="summary-count"><b>0</b></div>
      </div>
      <div class="summary-subtitle">从左侧选择${kindLabel}字段</div>
      <div class="summary-empty">暂未选择</div>
    `;
  }
  
  return `
    <div class="summary-header">
      <div class="summary-title">已选${kindLabel}</div>
      <div class="summary-count"><b>${fields.length}</b> 个</div>
    </div>
    <div class="summary-subtitle">数据报表将包含这些字段</div>
    <div class="summary-list">
      ${fields.map(f => `
        <div class="summary-item">
          <div class="summary-item-name">${escapeHtml(f.name)}</div>
          <button class="summary-item-remove" onclick="toggleField('${f.id}')" title="移除">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

/* ---------- 渲染步骤 3: 指标 ---------- */
function renderMetricsStep() {
  const left = document.getElementById('metricsLeft');
  const right = document.getElementById('metricsRight');
  
  left.innerHTML = `
    <div class="field-search-wrap">
      <input type="text" class="field-search" id="metricSearch" placeholder="搜索指标..." 
        oninput="state.fieldSearchQuery = this.value; renderMetricsStep();">
    </div>
    ${renderFieldCategories('metric')}
  `;
  
  right.innerHTML = renderFieldsSummary('metric');
}

/* ---------- 渲染调度设置 ---------- */
function renderScheduleSettings() {
  const content = document.getElementById('scheduleContent');
  
  const freqOpt = FREQ_OPTIONS.find(f => f.id === state.freq);
  
  content.innerHTML = `
    <div class="field">
      <label class="field-label">
        同步频率
        <svg class="help-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-tip="定时拉取数据的频率，每天一次适合大部分场景">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
        </svg>
      </label>
      <select class="select-field" onchange="state.freq = this.value; updateScheduleSummary();">
        ${FREQ_OPTIONS.map(opt => `
          <option value="${opt.id}" ${state.freq === opt.id ? 'selected' : ''}>
            ${opt.label} (${opt.times})
          </option>
        `).join('')}
      </select>
    </div>
    
    <div class="field">
      <label class="field-label">
        日期范围模式
        <svg class="help-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-tip="相对日期：滚动窗口，始终拉取最近N天。绝对日期：固定时间段，适合回溯历史">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
        </svg>
      </label>
      <div class="seg">
        <button class="seg-btn ${state.dateMode === 'relative' ? 'active' : ''}" 
          onclick="state.dateMode = 'relative'; renderScheduleSettings(); updateScheduleSummary();">相对日期</button>
        <button class="seg-btn ${state.dateMode === 'absolute' ? 'active' : ''}" 
          onclick="state.dateMode = 'absolute'; renderScheduleSettings(); updateScheduleSummary();">绝对日期</button>
      </div>
      ${state.dateMode === 'relative' ? `
        <div class="rel-row">
          <span>最近</span>
          <input type="number" class="num-input" value="${state.relativeDays}" min="1" max="365" 
            onchange="state.relativeDays = parseInt(this.value) || 30; updateScheduleSummary();">
          <span>天</span>
        </div>
      ` : `
        <div class="abs-row">
          <input type="date" class="date-input" value="${state.absoluteStart}" 
            onchange="state.absoluteStart = this.value; updateScheduleSummary();">
          <span class="abs-sep">至</span>
          <input type="date" class="date-input" value="${state.absoluteEnd}" 
            onchange="state.absoluteEnd = this.value; updateScheduleSummary();">
        </div>
      `}
    </div>
    
    <div class="field">
      <label class="field-label">
        调度类型
        <svg class="help-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-tip="增量：每次只追加新数据，速度快。全量：每次覆盖全部数据，适合维度变化的场景">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
        </svg>
      </label>
      <select class="select-field" onchange="state.schedType = this.value; updateScheduleSummary();">
        <option value="incremental" ${state.schedType === 'incremental' ? 'selected' : ''}>增量（追加新数据）</option>
        <option value="full" ${state.schedType === 'full' ? 'selected' : ''}>全量（覆盖重写）</option>
      </select>
    </div>
    
    <div class="field">
      <label class="field-label">
        重跑策略
        <svg class="help-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-tip="定义任务失败后是否可以手动重新运行">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
        </svg>
      </label>
      <select class="select-field" onchange="state.rerunPolicy = this.value;">
        <option value="skip" ${state.rerunPolicy === 'skip' ? 'selected' : ''}>跳过已运行的任务</option>
        <option value="replace" ${state.rerunPolicy === 'replace' ? 'selected' : ''}>替换已运行的任务</option>
        <option value="append" ${state.rerunPolicy === 'append' ? 'selected' : ''}>追加到已运行的任务</option>
      </select>
    </div>
    
    <div class="field">
      <label class="field-label">
        落库模式
        <svg class="help-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" data-tip="内置数据库：开箱即用，使用 Creatiads 默认存储。自定义：写入你在 Destinations 中配置的数据库">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
        </svg>
      </label>
      <select class="select-field" onchange="state.sinkMode = this.value; renderScheduleSettings();">
        <option value="built-in" ${state.sinkMode === 'built-in' ? 'selected' : ''}>内置数据库</option>
        <option value="custom" ${state.sinkMode === 'custom' ? 'selected' : ''}>自定义目标库</option>
      </select>
      ${state.sinkMode === 'built-in' ? `
        <div style="margin-top: 8px; padding: 8px 12px; background: hsl(210 40% 98%); border: 1px solid hsl(214.3 31.8% 91.4%); border-radius: 6px; font-size: 12px; color: hsl(215.4 16.3% 46.9%);">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>落库表</span>
            <code style="font-family: ui-monospace, monospace; color: hsl(222.2 84% 4.9%); font-weight: 500;">${state.sinkTable}</code>
          </div>
        </div>
      ` : `
        <select class="select-field" style="margin-top: 8px;" onchange="state.customDestId = this.value;">
          <option value="">选择目标数据库...</option>
          ${DESTINATIONS.map(d => `
            <option value="${d.id}" ${state.customDestId === d.id ? 'selected' : ''}>
              ${d.name} (${d.type})
            </option>
          `).join('')}
        </select>
        <input type="text" class="text-input mono" placeholder="输入落库表名，如：fb_ad_insights_daily" 
          value="${state.sinkTable}" 
          oninput="state.sinkTable = this.value;"
          style="margin-top: 8px;">
        <div class="field-hint" style="margin-top: 6px;">请确保该表已在目标数据库中创建，或开启自动建表权限</div>
      `}
    </div>
  `;
}

function updateScheduleSummary() {
  const freqOpt = FREQ_OPTIONS.find(f => f.id === state.freq);
  const freqLabel = freqOpt ? freqOpt.label : '每天';
  const dateLabel = state.dateMode === 'relative' ? '相对日期' : '绝对日期';
  const schedLabel = state.schedType === 'incremental' ? '追加数据' : '覆盖数据';
  
  document.getElementById('scheduleSummary').textContent = 
    `${freqLabel} · ${dateLabel} · ${schedLabel}`;
}

/* ---------- 应用配置 ---------- */
function applyConfig() {
  // 验证
  if (!state.name.trim()) {
    alert('请输入连接器名称');
    return;
  }
  
  if (state.adAcctTab !== 'all' && state.selectedAdAccounts.size === 0) {
    alert('请至少选择一个广告账户');
    return;
  }
  
  const dims = Array.from(state.selectedFields).filter(fid => {
    const f = FIELD_INDEX[fid];
    return f && f.kind === 'dim';
  });
  
  const metrics = Array.from(state.selectedFields).filter(fid => {
    const f = FIELD_INDEX[fid];
    return f && f.kind === 'metric';
  });
  
  if (dims.length === 0) {
    alert('请至少选择一个维度');
    return;
  }
  
  if (metrics.length === 0) {
    alert('请至少选择一个指标');
    return;
  }
  
  // 自定义落库模式下必须选择目标库和填写表名
  if (state.sinkMode === 'custom') {
    if (!state.customDestId) {
      alert('请选择自定义目标数据库');
      return;
    }
    if (!state.sinkTable.trim()) {
      alert('请输入落库表名');
      return;
    }
  }
  
  // 构建配置对象
  const config = {
    name: state.name,
    platform: ACTIVE_PLATFORM,
    platformAccountId: state.platformAcctId,
    adAccounts: state.adAcctTab === 'all' 
      ? { mode: 'all' }
      : { mode: 'selected', ids: Array.from(state.selectedAdAccounts) },
    fields: Array.from(state.selectedFields),
    schedule: {
      frequency: state.freq,
      dateMode: state.dateMode,
      relativeDays: state.relativeDays,
      absoluteStart: state.absoluteStart,
      absoluteEnd: state.absoluteEnd,
      scheduleType: state.schedType,
      rerunPolicy: state.rerunPolicy
    },
    sink: state.sinkMode === 'built-in' 
      ? { mode: 'built-in', table: state.sinkTable }
      : { mode: 'custom', destinationId: state.customDestId, table: state.sinkTable }
  };
  
  console.log('配置已生成:', config);
  alert('配置成功！\n\n' + JSON.stringify(config, null, 2));
  closeDrawer();
}

/* ---------- 抽屉开关 ---------- */
const IS_EMBED = (function() {
  try { return window.self !== window.top; } 
  catch(e) { return true; }
})();

function openDrawer() {
  if (IS_EMBED) return;
  
  const mask = document.getElementById('drawerMask');
  const drawer = document.getElementById('configDrawer');
  
  mask.classList.remove('hidden');
  void drawer.offsetWidth; // force reflow
  mask.classList.add('show');
  drawer.classList.add('open');
}

function closeDrawer() {
  if (IS_EMBED) {
    try { 
      window.parent.postMessage({ type: 'connector-config-close' }, '*'); 
    } catch(e) {}
    return;
  }
  
  const mask = document.getElementById('drawerMask');
  const drawer = document.getElementById('configDrawer');
  
  mask.classList.remove('show');
  drawer.classList.remove('open');
  
  setTimeout(() => {
    mask.classList.add('hidden');
  }, 300);
}

/* ---------- Tooltip ---------- */
function setupGlobalTip() {
  const tip = document.getElementById('globalTip');
  if (!tip) return;
  
  document.addEventListener('mouseover', e => {
    const ic = e.target.closest('.help-ic');
    if (!ic) return;
    
    const text = ic.getAttribute('data-tip');
    if (!text) return;
    
    tip.textContent = text;
    tip.classList.add('show');
    
    const r = ic.getBoundingClientRect();
    tip.classList.remove('above', 'below');
    
    const tipH = tip.offsetHeight;
    let top, place;
    
    if (r.top - tipH - 10 > 0) {
      top = r.top - tipH - 10;
      place = 'above';
    } else {
      top = r.bottom + 10;
      place = 'below';
    }
    
    tip.classList.add(place);
    
    let left = r.left + r.width / 2 - tip.offsetWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tip.offsetWidth - 8));
    
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
  });
  
  document.addEventListener('mouseout', e => {
    if (e.target.closest('.help-ic')) {
      tip.classList.remove('show');
    }
  });
}

/* ---------- 工具函数 ---------- */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ---------- 初始化 ---------- */
function init() {
  // 设置标题和图标
  document.getElementById('drawerIcon').textContent = ACTIVE_META.short;
  document.getElementById('drawerIcon').style.background = ACTIVE_META.color;
  document.getElementById('drawerTitle').textContent = ACTIVE_META.title;
  document.getElementById('drawerSubtitle').textContent = ACTIVE_META.api;
  
  // 初始化默认值
  initDefaults();
  
  // 渲染各步骤
  renderAccountsStep();
  renderDimensionsStep();
  renderMetricsStep();
  renderScheduleSettings();
  
  // 更新汇总
  updateFooterSummary();
  updateScheduleSummary();
  
  // 设置 tooltip
  setupGlobalTip();
  
  // 嵌入模式
  if (IS_EMBED) {
    document.body.classList.add('embed');
  } else {
    // 独立模式：默认打开抽屉
    openDrawer();
  }
}

// 启动
init();

function renderPlatformAccountSelect() {
  const selected = PLATFORM_ACCOUNTS.find(p => p.id === state.platformAcctId) || PLATFORM_ACCOUNTS[0];
  if (!state.platformAcctId) state.platformAcctId = selected.id;
  
  return `
    <div class="acct-select" id="platformAcctSelect">
      <button class="acct-select-trigger" type="button">
        <div class="pa-info">
          <div class="pa-name">${escapeHtml(selected.name)}</div>
          <div class="pa-login">${escapeHtml(selected.login)}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <div class="acct-select-menu">
        ${PLATFORM_ACCOUNTS.map(pa => `
          <div class="acct-select-opt ${pa.id === state.platformAcctId ? 'active' : ''}" data-id="${pa.id}">
            <div class="pa-info">
              <div class="pa-name">${escapeHtml(pa.name)}</div>
              <div class="pa-login">${escapeHtml(pa.login)} · ${pa.adAccounts.length} 个广告账户</div>
            </div>
            ${pa.id === state.platformAcctId ? `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function mountPlatformAccountSelect() {
  const sel = document.getElementById('platformAcctSelect');
  const trigger = sel.querySelector('.acct-select-trigger');
  
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    sel.classList.toggle('open');
  });
  
  sel.querySelectorAll('.acct-select-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      state.platformAcctId = opt.dataset.id;
      sel.classList.remove('open');
      // 切换平台账户后重置广告账户选择
      state.selectedAdAccounts.clear();
      renderAccountsStep();
    });
  });
  
  document.addEventListener('click', () => {
    sel.classList.remove('open');
  });
}

function renderAdAccountTabs() {
  return `
    <div class="acct-tabs">
      <button class="acct-tab ${state.adAcctTab === 'all' ? 'active' : ''}" data-tab="all">全选</button>
      <button class="acct-tab ${state.adAcctTab === 'list' ? 'active' : ''}" data-tab="list">列表选择</button>
      <button class="acct-tab ${state.adAcctTab === 'manual' ? 'active' : ''}" data-tab="manual">手动输入</button>
      <button class="acct-tab ${state.adAcctTab === 'import' ? 'active' : ''}" data-tab="import">导入</button>
    </div>
    <div class="acct-tab-panel ${state.adAcctTab === 'all' ? 'active' : ''}" id="tab-all">
      ${renderAdAccountTabAll()}
    </div>
    <div class="acct-tab-panel ${state.adAcctTab === 'list' ? 'active' : ''}" id="tab-list">
      ${renderAdAccountTabList()}
    </div>
    <div class="acct-tab-panel ${state.adAcctTab === 'manual' ? 'active' : ''}" id="tab-manual">
      ${renderAdAccountTabManual()}
    </div>
    <div class="acct-tab-panel ${state.adAcctTab === 'import' ? 'active' : ''}" id="tab-import">
      ${renderAdAccountTabImport()}
    </div>
  `;
}

function mountAdAccountTabs() {
  document.querySelectorAll('.acct-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.adAcctTab = tab.dataset.tab;
      renderAccountsStep();
    });
  });
  
  // 挂载搜索功能
  const searchInput = document.getElementById('adAcctSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('.panel-row[data-search]');
      rows.forEach(row => {
        const searchText = row.getAttribute('data-search');
        if (searchText.includes(query)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }
}

function renderAdAccountTabAll() {
  const pa = getPlatformAccount(state.platformAcctId);
  if (!pa) return '<div class="panel-empty">请先选择平台账户</div>';
  
  const pausedCount = pa.adAccounts.filter(a => a.status === 'paused').length;
  
  return `
    <div class="panel-all">
      <div class="panel-all-row">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>将采集该平台账户下的 <b>全部 ${pa.adAccounts.length} 个</b> 广告账户数据${pausedCount ? `（含 ${pausedCount} 个已暂停）` : ''}</span>
      </div>
    </div>
  `;
}

function renderAdAccountTabList() {
  const pa = getPlatformAccount(state.platformAcctId);
  if (!pa) return '<div class="panel-empty">请先选择平台账户</div>';
  
  const allChecked = pa.adAccounts.every(a => state.selectedAdAccounts.has(a.id));
  
  return `
    <input type="text" class="panel-search" id="adAcctSearch" placeholder="搜索名称或 ID…">
    <label class="panel-check-all">
      <input type="checkbox" ${allChecked ? 'checked' : ''} onchange="toggleAllAdAccounts(this.checked)">
      全选全部账户（${pa.adAccounts.length}）
    </label>
    <div class="panel-list" id="adAcctList">
      ${pa.adAccounts.map(a => `
        <label class="panel-row ${a.status === 'paused' ? 'paused' : ''}" data-search="${a.name.toLowerCase()} ${a.id.toLowerCase()}">
          <input type="checkbox" ${state.selectedAdAccounts.has(a.id) ? 'checked' : ''} 
            onchange="toggleAdAccount('${a.id}', this.checked)">
          <div class="pr-main">
            <div class="pr-name">${escapeHtml(a.name)}</div>
            <div class="pr-id">${a.id}</div>
          </div>
          <span class="pr-status ${a.status}">${a.status === 'active' ? '启用' : '已暂停'}</span>
        </label>
      `).join('')}
    </div>
  `;
}

function renderAdAccountTabManual() {
  return `
    <div class="panel-tip">
      每行输入一个广告账户 ID，用逗号、空格或换行分隔，下方实时统计
    </div>
    <textarea class="panel-textarea" id="manualAdAcctInput" placeholder="act_123456789
act_987654321
..." 
      oninput="handleManualInput(this.value)">${state.manualAdAcctInput}</textarea>
    ${state.importFeedback.valid.length + state.importFeedback.invalid.length > 0 ? `
      <div class="panel-feedback">
        ${state.importFeedback.valid.length > 0 ? `
          <div class="fb-ok">✓ 已输入 ${state.importFeedback.valid.length} 个有效账户</div>
        ` : ''}
        ${state.importFeedback.invalid.length > 0 ? `
          <div class="fb-err">✗ ${state.importFeedback.invalid.length} 个无效: ${state.importFeedback.invalid.join(', ')}</div>
        ` : ''}
      </div>
    ` : ''}
  `;
}

function handleManualInput(text) {
  state.manualAdAcctInput = text;
  
  if (!text.trim()) {
    state.importFeedback = { valid: [], invalid: [] };
    state.selectedAdAccounts.clear();
    updateFooterSummary();
    document.getElementById('accountsRight').innerHTML = renderAccountsSummary();
    return;
  }
  
  // 实时解析并验证
  const ids = text.split(/[\s,;]+/).map(s => s.trim()).filter(Boolean);
  const pa = getPlatformAccount(state.platformAcctId);
  const validIds = pa ? pa.adAccounts.map(a => a.id) : [];
  
  state.importFeedback.valid = [...new Set(ids.filter(id => validIds.includes(id)))];
  state.importFeedback.invalid = [...new Set(ids.filter(id => !validIds.includes(id)))];
  
  state.selectedAdAccounts.clear();
  state.importFeedback.valid.forEach(id => state.selectedAdAccounts.add(id));
  
  // 只更新反馈区和右侧汇总，不重渲整个面板以保持输入焦点
  const panel = document.getElementById('tab-manual');
  const feedback = panel ? panel.querySelector('.panel-feedback') : null;
  if (feedback) {
    feedback.innerHTML = `
      ${state.importFeedback.valid.length > 0 ? `
        <div class="fb-ok">✓ 已输入 ${state.importFeedback.valid.length} 个有效账户</div>
      ` : ''}
      ${state.importFeedback.invalid.length > 0 ? `
        <div class="fb-err">✗ ${state.importFeedback.invalid.length} 个无效: ${state.importFeedback.invalid.join(', ')}</div>
      ` : ''}
    `;
  }
  
  updateFooterSummary();
  document.getElementById('accountsRight').innerHTML = renderAccountsSummary();
}

function renderAdAccountTabImport() {
  return `
    <div class="panel-tip">
      上传包含账户 ID 的 CSV / TXT 文件，每行一个 ID，或 CSV 第一列为 ID
    </div>
    <div class="panel-dropzone" onclick="document.getElementById('fileInput').click()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
      </svg>
      <div class="dz-title">点击上传或拖拽文件</div>
      <div class="dz-sub">支持 CSV、TXT 格式</div>
    </div>
    <input type="file" id="fileInput" accept=".csv,.txt" style="display:none;" onchange="handleFileImport(this)">
    <div style="margin-top: 10px; font-size: 12px; color: hsl(215.4 16.3% 46.9%); display: flex; gap: 5px; align-items: center;">
      <span>没有模板？</span>
      <button style="color: hsl(222.2 84% 4.9%); font-weight: 600; text-decoration: underline; background: none; border: none; cursor: pointer; padding: 0;" onclick="downloadCsvTemplate()">下载 CSV 模板</button>
    </div>
    ${state.importFeedback.valid.length + state.importFeedback.invalid.length > 0 ? `
      <div class="panel-feedback">
        ${state.importFeedback.valid.length > 0 ? `
          <div class="fb-ok">✓ 已导入 ${state.importFeedback.valid.length} 个有效账户</div>
        ` : ''}
        ${state.importFeedback.invalid.length > 0 ? `
          <div class="fb-err">✗ ${state.importFeedback.invalid.length} 个无效 ID</div>
        ` : ''}
      </div>
    ` : ''}
  `;
}

function downloadCsvTemplate() {
  const rows = [
    'account_id,account_name',
    'act_1729384756,Brand Main · US',
    'act_8273645102,Performance · EU',
    'act_5647382910,App Install · APAC'
  ];
  const csv = '\uFEFF' + rows.join('\r\n') + '\r\n';
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '广告账户导入模板.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toggleAllAdAccounts(checked) {
  const pa = getPlatformAccount(state.platformAcctId);
  if (!pa) return;
  
  if (checked) {
    pa.adAccounts.forEach(a => state.selectedAdAccounts.add(a.id));
  } else {
    state.selectedAdAccounts.clear();
  }
  
  renderAccountsStep();
}

function toggleAdAccount(id, checked) {
  if (checked) {
    state.selectedAdAccounts.add(id);
  } else {
    state.selectedAdAccounts.delete(id);
  }
  updateFooterSummary();
  document.getElementById('accountsRight').innerHTML = renderAccountsSummary();
}

function parseManualAdAccounts() {
  const input = state.manualAdAcctInput.trim();
  if (!input) return;
  
  const ids = input.split('\n').map(l => l.trim()).filter(l => l);
  const pa = getPlatformAccount(state.platformAcctId);
  const validIds = pa ? pa.adAccounts.map(a => a.id) : [];
  
  state.importFeedback.valid = ids.filter(id => validIds.includes(id));
  state.importFeedback.invalid = ids.filter(id => !validIds.includes(id));
  
  state.selectedAdAccounts.clear();
  state.importFeedback.valid.forEach(id => state.selectedAdAccounts.add(id));
  
  renderAccountsStep();
}

function handleFileImport(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result;
    const lines = text.split(/\r?\n/).map(l => l.split(',')[0].trim()).filter(l => l);
    
    const pa = getPlatformAccount(state.platformAcctId);
    const validIds = pa ? pa.adAccounts.map(a => a.id) : [];
    
    state.importFeedback.valid = lines.filter(id => validIds.includes(id));
    state.importFeedback.invalid = lines.filter(id => !validIds.includes(id));
    
    state.selectedAdAccounts.clear();
    state.importFeedback.valid.forEach(id => state.selectedAdAccounts.add(id));
    
    renderAccountsStep();
  };
  reader.readAsText(file);
}

function renderAccountsSummary() {
  let accounts = [];
  
  if (state.adAcctTab === 'all') {
    const pa = getPlatformAccount(state.platformAcctId);
    if (pa) accounts = pa.adAccounts;
  } else {
    const pa = getPlatformAccount(state.platformAcctId);
    if (pa) {
      accounts = pa.adAccounts.filter(a => state.selectedAdAccounts.has(a.id));
    }
  }
  
  if (accounts.length === 0) {
    return `
      <div class="summary-header">
        <div class="summary-title">已选账户</div>
        <div class="summary-count"><b>0</b></div>
      </div>
      <div class="summary-subtitle">从左侧选择广告账户</div>
      <div class="summary-empty">暂未选择</div>
    `;
  }
  
  return `
    <div class="summary-header">
      <div class="summary-title">已选账户</div>
      <div class="summary-count"><b>${accounts.length}</b> 个</div>
    </div>
    <div class="summary-subtitle">将采集以下账户的数据</div>
    <div class="summary-list">
      ${accounts.slice(0, 10).map(a => `
        <div class="summary-item">
          <div class="summary-item-name">${escapeHtml(a.name)}</div>
        </div>
      `).join('')}
      ${accounts.length > 10 ? `
        <div class="summary-item">
          <div class="summary-item-name" style="color: hsl(215.4 16.3% 46.9%);">
            + 另外 ${accounts.length - 10} 个账户...
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
