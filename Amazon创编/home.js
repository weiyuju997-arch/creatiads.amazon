/* ============================================================
 * 主页：订单 / 订单项 列表 + 创建入口
 * ============================================================ */

// Mock 数据
const MOCK_ORDERS = [
  {
    id: 'mock_ord_1',
    statusKey: 'NOT_RUNNING',
    name: '1',
    code: '5938057556995867 05',
    detail: '显示策略详情',
    budget: '$1.00',
    objectiveDeletion: '[object Object]',
    totalSpend: '—',
    halfHourSpend: '—',
    budgetLimit: '—',
    impressions: '—',
    points: '—',
    effective1000: '—',
    ctr: '—',
    purchaseRate: '—',
  },
];

const MOCK_LINEITEMS = [];

// 已提交保存的 list（来自批量创建页 localStorage）
function loadSubmittedOrders() {
  try { return JSON.parse(localStorage.getItem('amzdsp_orders') || '[]'); } catch (e) { return []; }
}
function loadSubmittedLineItems() {
  try { return JSON.parse(localStorage.getItem('amzdsp_lineitems') || '[]'); } catch (e) { return []; }
}

const ORDER_COLUMNS = [
  { key: 'status', label: '状态', tip: true },
  { key: 'name', label: '订单', tip: true },
  { key: 'detail', label: '策略详情', tip: true },
  { key: 'budget', label: '预算', tip: true },
  { key: 'objectiveDeletion', label: '目标删除', tip: true },
  { key: 'totalSpend', label: '总花费', tip: true },
  { key: 'halfHourSpend', label: '半小时出展力', tip: true },
  { key: 'budgetLimit', label: '预算上限', tip: true },
  { key: 'impressions', label: '展示量', tip: true },
  { key: 'points', label: '点击量', tip: true },
  { key: 'effective1000', label: '有效每千次展示费用 (eCPM)', tip: true },
  { key: 'ctr', label: 'CTR', tip: true },
  { key: 'purchaseRate', label: '购买分数', tip: true },
];

const LINEITEM_COLUMNS = [
  { key: 'status', label: '状态', tip: true },
  { key: 'name', label: '订单项', tip: true },
  { key: 'label', label: '标签', tip: true },
  { key: 'objectiveSetting', label: '目标设置', tip: true },
  { key: 'baseBid', label: '基础竞价', tip: true },
  { key: 'maxCpm', label: '最大平均每次展示成本 (CPM)', tip: true },
  { key: 'forecastSpend', label: '预计支出', tip: true },
  { key: 'objectiveMetric', label: '目标指标', tip: true },
  { key: 'totalSpend', label: '总花费', tip: true },
];

const STATUS_LABELS = {
  ACTIVE: '进行中',
  ENDED: '已结束',
  NOT_RUNNING: '未投放',
  LINEITEM_NOT_RUNNING: '订单项未运行',
  PROCESSING: '正在处理',
};
const ALL_STATUSES = Object.keys(STATUS_LABELS);

const State = {
  tab: 'orders', // 'orders' | 'lineitems'
  search: '',
  statusFilter: ['ACTIVE', 'NOT_RUNNING', 'LINEITEM_NOT_RUNNING', 'PROCESSING'], // 默认勾选
  draftStatusFilter: null, // 弹窗里的临时勾选（点应用才提交）
  selectedRowIds: new Set(), // 当前 tab 选中的行 id
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

function renderTable() {
  const wrap = $('#tableWrap');
  const cols = State.tab === 'orders' ? ORDER_COLUMNS : LINEITEM_COLUMNS;
  const submitted = State.tab === 'orders' ? loadSubmittedOrders() : loadSubmittedLineItems();
  const mocks = State.tab === 'orders' ? MOCK_ORDERS : MOCK_LINEITEMS;
  const rows = [...submitted, ...mocks];
  const q = State.search.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (State.statusFilter.length && !State.statusFilter.includes(r.statusKey)) return false;
    if (q && !Object.values(r).some((v) => String(v).toLowerCase().includes(q))) return false;
    return true;
  });

  // 当前页行的 id 集合（用于全选/反选判断）
  const pageIds = filtered.map((r) => r.id).filter(Boolean);
  const allChecked = pageIds.length > 0 && pageIds.every((id) => State.selectedRowIds.has(id));
  const someChecked = !allChecked && pageIds.some((id) => State.selectedRowIds.has(id));

  const headerHtml = `
    <thead><tr>
      <th style="width:40px"><input type="checkbox" id="rowAll" ${allChecked ? 'checked' : ''} ${someChecked ? 'data-indeterminate="1"' : ''} /></th>
      ${cols.map((c) => `<th>${escapeHTML(c.label)}${c.tip ? ' <span class="ico-info">i</span>' : ''}</th>`).join('')}
    </tr></thead>
  `;

  if (!filtered.length) {
    wrap.innerHTML = `
      <div class="table-scroll">
        <table>${headerHtml}</table>
      </div>
      <div class="empty">暂无数据。点击左上角"创建${State.tab === 'orders' ? '订单' : '订单项'}"开始批量创建。</div>
    `;
    bindHeaderCheckbox(pageIds);
    return;
  }

  wrap.innerHTML = `
    <div class="table-scroll">
      <table>
        ${headerHtml}
        <tbody>
          ${filtered.map((r) => `
            <tr data-id="${escapeHTML(r.id || '')}" class="${r.id && State.selectedRowIds.has(r.id) ? 'row-selected' : ''}">
              <td><input type="checkbox" class="row-check" data-id="${escapeHTML(r.id || '')}" ${r.id && State.selectedRowIds.has(r.id) ? 'checked' : ''} /></td>
              ${cols.map((c) => `<td>${cellHtml(c.key, r)}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div class="table-footer">
      ${State.selectedRowIds.size ? `<span class="selected-count">已选 ${State.selectedRowIds.size} 项</span>` : ''}
      <span class="page-size">每页显示的结果数：<select><option>50</option><option>100</option></select></span>
      <span>1-${filtered.length} 条结果（共 ${filtered.length} 条结果）</span>
      <button class="page-btn" disabled>«</button>
      <button class="page-btn" disabled>‹</button>
      <button class="page-btn" disabled>›</button>
    </div>
  `;

  bindHeaderCheckbox(pageIds);
  // 行勾选
  $$('#tableWrap .row-check').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = cb.dataset.id;
      if (!id) return;
      if (cb.checked) State.selectedRowIds.add(id);
      else State.selectedRowIds.delete(id);
      renderTable();
      updateBulkButton();
    });
  });
  updateBulkButton();
}

function bindHeaderCheckbox(pageIds) {
  const head = $('#rowAll');
  if (!head) return;
  if (head.dataset.indeterminate === '1') head.indeterminate = true;
  head.addEventListener('change', () => {
    if (head.checked) pageIds.forEach((id) => State.selectedRowIds.add(id));
    else pageIds.forEach((id) => State.selectedRowIds.delete(id));
    renderTable();
    updateBulkButton();
  });
}

function updateBulkButton() {
  const btn = $('#btnBulkEdit');
  if (!btn) return;
  btn.disabled = State.selectedRowIds.size === 0;
  btn.textContent = State.selectedRowIds.size ? `批量操作 (${State.selectedRowIds.size}) ▾` : '批量操作 ▾';
}

// ===== 批量操作抽屉 =====
function openBulkDrawer() {
  if (State.selectedRowIds.size === 0) return;
  const isOrders = State.tab === 'orders';
  $('#drawerTitle').textContent = isOrders
    ? `批量编辑订单（${State.selectedRowIds.size} 项）`
    : `批量编辑订单项（${State.selectedRowIds.size} 项）`;

  const body = isOrders
    ? `
      <div class="drawer-section">
        <div class="drawer-section-title">预算和投放</div>
        <div class="drawer-flight-list" id="drawerFlightList"></div>
        <button type="button" class="drawer-add-row" id="drawerAddFlight">+ 添加投放的广告活动</button>
        <div class="drawer-hint">每行覆盖一条投放（预算 + 时间 + 名称）；留空表示该字段不变更。</div>
      </div>
    `
    : `
      <div class="drawer-section">
        <div class="drawer-section-title">投放</div>
        <div class="drawer-field">
          <label>开始时间</label>
          <input type="datetime-local" data-bulk-field="startDate" />
        </div>
        <div class="drawer-field">
          <label>结束时间</label>
          <input type="datetime-local" data-bulk-field="endDate" />
        </div>
      </div>
      <div class="drawer-section">
        <div class="drawer-section-title">竞价</div>
        <div class="drawer-field">
          <label>基础竞价 CPM ($)</label>
          <input type="number" data-bulk-field="baseBid" min="0" step="0.01" placeholder="如 2.50" />
        </div>
        <div class="drawer-hint">填写值的字段会被批量覆盖；留空保持原值不变。</div>
      </div>
    `;
  $('#drawerBody').innerHTML = body;
  $('#drawerMask').hidden = false;
  $('#bulkDrawer').hidden = false;
  // 订单 tab：初始化一条投放行
  if (isOrders) {
    State.drawerFlights = [{ budget: '', start: '', end: '', name: '' }];
    renderDrawerFlights();
    $('#drawerAddFlight')?.addEventListener('click', () => {
      State.drawerFlights.push({ budget: '', start: '', end: '', name: '' });
      renderDrawerFlights();
    });
  } else {
    State.drawerFlights = null;
  }
}

function renderDrawerFlights() {
  const box = $('#drawerFlightList');
  if (!box) return;
  const rows = State.drawerFlights || [];
  const showDel = rows.length > 1;
  box.innerHTML = rows.map((r, i) => `
    <div class="drawer-flight-row" data-idx="${i}">
      <div class="drawer-flight-grid">
        ${State.tab === 'orders' ? `
          <div class="drawer-field">
            <label>预算 $</label>
            <input type="number" data-fl="budget" min="0" placeholder="输入预算" value="${escapeHTML(r.budget || '')}" />
          </div>
          <div class="drawer-field">
            <label>投放名称（可选）</label>
            <input type="text" data-fl="name" placeholder="投放名称" value="${escapeHTML(r.name || '')}" />
          </div>
        ` : ''}
        <div class="drawer-field">
          <label>开始</label>
          <input type="datetime-local" data-fl="start" value="${escapeHTML(r.start || '')}" />
        </div>
        <div class="drawer-field">
          <label>结束</label>
          <input type="datetime-local" data-fl="end" value="${escapeHTML(r.end || '')}" />
        </div>
      </div>
      ${showDel ? '<button type="button" class="drawer-flight-del" title="删除">×</button>' : ''}
    </div>
  `).join('');
  box.querySelectorAll('.drawer-flight-row').forEach((row) => {
    const idx = +row.dataset.idx;
    row.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', () => {
        State.drawerFlights[idx][inp.dataset.fl] = inp.value;
      });
    });
    row.querySelector('.drawer-flight-del')?.addEventListener('click', () => {
      if (State.drawerFlights.length <= 1) return;
      State.drawerFlights.splice(idx, 1);
      renderDrawerFlights();
    });
  });
}

function closeBulkDrawer() {
  $('#drawerMask').hidden = true;
  $('#bulkDrawer').hidden = true;
  State.drawerFlights = null;
}

function applyBulkEdit() {
  // 收集投放行（过滤掉完全空的行）
  const flights = (State.drawerFlights || []).filter((r) =>
    (r.budget && String(r.budget).trim()) ||
    (r.start && r.start.trim()) ||
    (r.end && r.end.trim()) ||
    (r.name && r.name.trim())
  );
  // 收集独立字段（如基础竞价）
  const updates = {};
  $$('#drawerBody [data-bulk-field]').forEach((input) => {
    const key = input.dataset.bulkField;
    const v = input.value?.trim();
    if (v) updates[key] = v;
  });
  if (flights.length === 0 && Object.keys(updates).length === 0) {
    alert('请至少填写一个要批量修改的字段');
    return;
  }

  const ids = State.selectedRowIds;
  if (State.tab === 'orders') {
    const list = loadSubmittedOrders();
    list.forEach((r) => {
      if (!ids.has(r.id)) return;
      if (flights.length) {
        // 整组覆盖到 flights，并把第一行映射到顶层 startDate/endDate/budget 用于列表展示
        r.flights = flights.map((f) => ({
          budget: f.budget ? Number(f.budget) : null,
          start: f.start || null,
          end: f.end || null,
          name: f.name || null,
        }));
        const f0 = flights[0];
        if (f0.start) r.startDate = f0.start.replace('T', ' ');
        if (f0.end) r.endDate = f0.end.replace('T', ' ');
        // 列表显示的预算 = 所有行预算合计
        const total = flights.reduce((s, f) => s + (Number(f.budget) || 0), 0);
        if (total > 0) r.budget = '$' + total.toFixed(2);
      }
    });
    localStorage.setItem('amzdsp_orders', JSON.stringify(list));
  } else {
    const list = loadSubmittedLineItems();
    list.forEach((r) => {
      if (!ids.has(r.id)) return;
      if (updates.startDate) r.startDate = updates.startDate.replace('T', ' ');
      if (updates.endDate) r.endDate = updates.endDate.replace('T', ' ');
      if (updates.baseBid) r.baseBid = '$' + Number(updates.baseBid).toFixed(2);
    });
    localStorage.setItem('amzdsp_lineitems', JSON.stringify(list));
  }

  alert(`已批量更新 ${ids.size} 条`);
  closeBulkDrawer();
  renderTable();
}

function cellHtml(key, row) {
  const v = row[key];
  if (key === 'status') {
    const sKey = row.statusKey;
    const lbl = STATUS_LABELS[sKey] || '—';
    const cls = sKey === 'ACTIVE' ? 'live' : 'warn';
    return `<span class="status ${cls}">${escapeHTML(lbl)}</span>`;
  }
  if (v == null || v === '') return '—';
  if (key === 'name') return `
    <div><a class="link">${escapeHTML(v)}</a></div>
    <div style="color:var(--text-muted);font-size:12px;margin-top:2px;">${escapeHTML(row.code || '')}</div>
  `;
  if (key === 'detail') return `<a class="link">${escapeHTML(v)}</a>`;
  if (key === 'budget') return `<div>${escapeHTML(v)}</div><div style="color:var(--text-muted);font-size:12px;margin-top:2px;">${escapeHTML(row.budgetType || '营销订单')}</div>`;
  if (key === 'productCount') return v ? `${v} 个类别` : '—';
  return escapeHTML(v);
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

function setTab(tab) {
  if (State.tab !== tab) State.selectedRowIds = new Set();
  State.tab = tab;
  $$('.top-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  $('#createSuffix').textContent = tab === 'orders' ? '订单' : '订单项';
  $('#searchInput').placeholder = tab === 'orders' ? '搜索订单' : '搜索订单项';
  renderTable();
}

// 跳转到批量创建页面
function goCreate() {
  // 用 query 参数把当前 tab 带过去，index.html 可以读取（虽然现阶段不依赖）
  const target = State.tab === 'orders' ? 'index.html?from=orders' : 'index.html?from=lineitems';
  window.location.href = target;
}

function updateFilterSummary() {
  const el = $('#filterSummary');
  if (!el) return;
  const n = State.statusFilter.length;
  if (n === 0) el.textContent = ': 无';
  else if (n === ALL_STATUSES.length) el.textContent = ': 全部';
  else if (n === 1) el.textContent = `: ${STATUS_LABELS[State.statusFilter[0]]}`;
  else el.textContent = `: ${n} 项`;
}

function syncFilterCheckboxes() {
  const list = State.draftStatusFilter || State.statusFilter;
  $$('#filterPopover input[type="checkbox"]').forEach((cb) => {
    cb.checked = list.includes(cb.value);
  });
}

function openFilter() {
  State.draftStatusFilter = [...State.statusFilter];
  syncFilterCheckboxes();
  $('#filterPopover').hidden = false;
}

function closeFilter() {
  $('#filterPopover').hidden = true;
  State.draftStatusFilter = null;
}

function applyFilter() {
  State.statusFilter = State.draftStatusFilter ? [...State.draftStatusFilter] : [];
  closeFilter();
  updateFilterSummary();
  renderTable();
}

function bindFilter() {
  $('#btnFilter').addEventListener('click', (e) => {
    e.stopPropagation();
    if ($('#filterPopover').hidden) openFilter();
    else closeFilter();
  });
  $$('#filterPopover input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const draft = State.draftStatusFilter || (State.draftStatusFilter = []);
      if (cb.checked) {
        if (!draft.includes(cb.value)) draft.push(cb.value);
      } else {
        const i = draft.indexOf(cb.value);
        if (i >= 0) draft.splice(i, 1);
      }
    });
  });
  $('#filterSelectAll').addEventListener('click', (e) => {
    e.preventDefault();
    State.draftStatusFilter = [...ALL_STATUSES];
    syncFilterCheckboxes();
  });
  $('#filterClear').addEventListener('click', () => {
    State.draftStatusFilter = [];
    syncFilterCheckboxes();
  });
  $('#filterCancel').addEventListener('click', closeFilter);
  $('#filterApply').addEventListener('click', applyFilter);
  document.addEventListener('click', (e) => {
    const pop = $('#filterPopover');
    if (pop.hidden) return;
    if (!pop.contains(e.target) && e.target.id !== 'btnFilter') closeFilter();
  });
}

function boot() {
  $$('.top-tab').forEach((t) => t.addEventListener('click', () => setTab(t.dataset.tab)));
  $('#btnCreate').addEventListener('click', goCreate);
  $('#searchInput').addEventListener('input', (e) => { State.search = e.target.value; renderTable(); });
  bindFilter();
  updateFilterSummary();
  // 批量操作按钮 + 下拉菜单 + 抽屉
  $('#btnBulkEdit')?.addEventListener('click', (e) => {
    if ($('#btnBulkEdit').disabled) return;
    e.stopPropagation();
    const m = $('#bulkMenu');
    if (m) m.hidden = !m.hidden;
  });
  $$('#bulkMenu .bulk-menu-item').forEach((item) => {
    item.addEventListener('click', () => {
      if (item.disabled) return;
      const a = item.dataset.action;
      $('#bulkMenu').hidden = true;
      if (a === 'edit-budget') openBulkDrawer();
    });
  });
  document.addEventListener('click', (e) => {
    const wrap = e.target.closest('.bulk-wrap');
    if (!wrap) {
      const m = $('#bulkMenu');
      if (m && !m.hidden) m.hidden = true;
    }
  });
  $('#drawerClose')?.addEventListener('click', closeBulkDrawer);
  $('#drawerCancel')?.addEventListener('click', closeBulkDrawer);
  $('#drawerMask')?.addEventListener('click', closeBulkDrawer);
  $('#drawerApply')?.addEventListener('click', applyBulkEdit);
  // 从提交跳回时按 hash 切换 tab
  const hash = window.location.hash.replace('#', '');
  if (hash === 'lineitems' || hash === 'orders') State.tab = hash;
  setTab(State.tab);
}

document.addEventListener('DOMContentLoaded', boot);
