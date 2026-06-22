/* ============================================================
 * Amazon DSP 批量创编 Demo - 核心脚本
 * 模块组织：
 *   1) State        全局状态
 *   2) Utils        工具
 *   3) MockAPI      模拟 Amazon DSP API（含限流、随机错误）
 *   4) Templates    模板与变量展开
 *   5) UI           导航/表单/表格/广告主
 *   6) Engine       批量任务编排引擎（并发、QPS、重试、暂停续建）
 *   7) Boot         初始化绑定
 * ============================================================ */

/* ===== 1) State ===== */
const State = {
  region: 'NA',
  profileId: '1234567890',
  selectedAdvertiser: null,
  selectedAdvertisers: [],   // 多选广告主
  orderMode: 'NEW',          // NEW=每行新建订单 / EXISTING=沿用已有订单
  selectedExistingOrder: null, // 沿用模式下选定的已有订单
  existingOrders: [],        // 已加载的该广告主下已有订单列表
  // Order 组合（类型+目标+KPI+KPI值），每个组合 = 1 个 Order
  orderCombos: [],
  activeComboIdx: null,      // 当前右侧表单正在编辑的类型索引
  // 投放（预算和投放），与类型叉乘生成 Order
  flightCombos: [],
  activeFlightIdx: null,     // 当前右侧表单正在编辑的投放索引
  // 媒体类型（LineItem 配置），与 Order 叉乘各生成一个 LineItem
  mediaCombos: [],
  activeMediaIdx: null,      // 当前右侧表单正在编辑的媒体类型索引
  productCategories: [],     // 当前编辑组的产品和服务类别（多选，存 "大类 / 子类"）
  expandedCategories: [],    // 当前编辑组展开的大类名称
  // 产品和服务组（每组一份类别选择），与 Order/媒体类型 叉乘生成 LineItem
  productCombos: [],
  activeProductIdx: null,
  // 库存组（每组一份库存配置），与 Order/媒体/产品 叉乘生成 LineItem
  inventoryCombos: [],
  activeInvIdx: null,
  // 入口模式（home.html 跳转携带 ?from=orders|lineitems）
  entryMode: null,
  // 定向策略：已启用的维度 key 列表 + 各维度的值
  targetingEnabled: [],
  targetingValues: {},
  // 三个独立变体表（叉乘核心）
  lineItemRows: [],          // L 行 → 每个 Order 下挂 L 个
  creativeRows: [],          // C 行 → 创建 C 个 Creative，共用挂到每个 LineItem
  tasks: [],                 // 批量任务列表
  running: false,
  paused: false,
  stats: { total: 0, ok: 0, fail: 0, run: 0, calls: 0, retry: 0 },
};

// 各层变体表列定义（只放该层模板真正会变的变量）
const LINEITEM_COLS = ['mediaType', 'geoCountry', 'audienceId', 'baseBidCpm'];
const CREATIVE_COLS = ['creativeType', 'asins', 'headline', 'landingUrl'];

// 列中文表头
const COL_LABELS = {
  brand: '品牌', quarter: '季度', goal: '目标(goal)', kpiType: 'KPI类型', kpiValue: 'KPI值',
  budget: '预算', amazonPromotion: '亚马逊促销(yes/no)', poNumber: 'PO编号',
  mediaType: '媒体类型', geoCountry: '位置/国家', audienceId: '受众ID', baseBidCpm: '基础竞价CPM',
  creativeType: '创意大类', asins: 'ASIN列表', headline: 'Headline', landingUrl: '落地页URL',
};

// 变体表标签别名
const VARIANT_LABELS = COL_LABELS;

// 三个变体表的定义（驱动通用渲染器）
const VARIANT_DEFS = {
  lineItem: { name: 'LineItem', stateKey: 'lineItemRows', cols: LINEITEM_COLS, tbody: '#li_varTbody',   count: '#li_rowCount',  demo: () => DEMO_LINEITEM_ROWS },
  creative: { name: 'Creative', stateKey: 'creativeRows', cols: CREATIVE_COLS, tbody: '#cr_varTbody',   count: '#cr_rowCount',  demo: () => DEMO_CREATIVE_ROWS },
};

// 名称模板可插入的变量（Order 名称构建器）
const ORDER_NAME_VARS = [
  { key: 'mediaType', label: 'MEDIA类型' },
  { key: 'goal', label: '目标' },
  { key: 'kpiType', label: 'KPI' },
  { key: 'flightName', label: '投放名称' },
  { key: 'quarter', label: '季度' },
];

// 名称模板可插入的变量（LineItem 名称构建器）
const LINEITEM_NAME_VARS = [
  { key: 'mediaType', label: 'MEDIA类型' },
  { key: 'goal', label: '目标' },
  { key: 'kpiType', label: 'KPI' },
  { key: 'productCategory', label: '产品类别' },
  { key: 'inventoryType', label: '库存类型' },
  { key: 'geoCountry', label: '地区' },
];

// 定向策略维度定义（参考 Amazon DSP「添加投放目标」分组）
// type: 'field' 文本 / 'select' 下拉 / 'checks' 多选 / 'note' 仅说明
const TARGETING_DIMS = [
  // 行为
  { key: 'audience', group: '行为', label: '受众', type: 'field', placeholder: '受众 ID（支持 {{audienceId}}）', def: '{{audienceId}}' },
  { key: 'location', group: '行为', label: '位置', type: 'field', placeholder: '国家/地区（支持 {{geoCountry}}）', def: '{{geoCountry}}' },
  { key: 'daypart', group: '行为', label: '时段', type: 'select', options: [['ALL_DAY', '全天候'], ['CUSTOM', '自定义时段']], def: 'ALL_DAY' },
  // 上下文
  { key: 'products', group: '上下文', label: '商品', type: 'field', placeholder: 'ASIN，逗号分隔' },
  { key: 'inMarket', group: '上下文', label: '场内客群类别', type: 'field', placeholder: '场内客群类别，逗号分隔' },
  { key: 'keywords', group: '上下文', label: '关键词', type: 'field', placeholder: '关键词，逗号分隔' },
  { key: 'domains', group: '上下文', label: '域名', type: 'select', options: [['ALL', '所有域名'], ['INCLUDE', '指定域名']], def: 'ALL' },
  // 技术
  { key: 'mobileOs', group: '技术', label: 'Mobile OS', type: 'checks', options: [['IOS', 'iOS'], ['ANDROID', 'Android'], ['FIRE_OS', 'Fire OS']], def: ['IOS', 'ANDROID', 'FIRE_OS'] },
  { key: 'devices', group: '技术', label: '设备', type: 'checks', options: [['DESKTOP', '电脑端'], ['MOBILE', '移动端'], ['TABLET', '平板'], ['CTV', '联网电视']], def: ['DESKTOP', 'MOBILE'] },
  { key: 'orientation', group: '技术', label: '方向', type: 'checks', options: [['PORTRAIT', '竖屏'], ['LANDSCAPE', '横屏']], def: ['PORTRAIT', 'LANDSCAPE'] },
  { key: 'foldPosition', group: '技术', label: '折叠位置', type: 'checks', options: [['ABOVE_FOLD', '首屏'], ['BELOW_FOLD', '非首屏']], def: ['ABOVE_FOLD', 'BELOW_FOLD'], note: '亚马逊库存目前不支持折叠位置定位。' },
  { key: 'nativePlacement', group: '技术', label: '原生内容广告位置', type: 'checks', options: [['IN_ARTICLE', '文章中'], ['IN_FEED', '信息流中'], ['PERIPHERAL', '外围设备']], def: [], note: '亚马逊库存目前不支持原生内容位置定位。' },
  { key: 'mobileApps', group: '技术', label: '移动应用', type: 'select', options: [['ALL', '所有移动应用'], ['INCLUDE', '指定应用']], def: 'ALL' },
  { key: 'thirdPartyViewability', group: '技术', label: '第三方竞价前', type: 'field', placeholder: '可见度供应商（可空）' },
  { key: 'brandSuitability', group: '技术', label: '品牌适用性', type: 'select', options: [['STANDARD', '标准 - 库存层级'], ['STRICT', '严格'], ['LIMITED', '宽松']], def: 'STANDARD' },
  { key: 'viewability', group: '技术', label: '可见度', type: 'select', options: [['ALLOW_ALL', '允许所有（最大覆盖面）'], ['VIEWABLE_70', '70%+ 可见'], ['VIEWABLE_50', '50%+ 可见']], def: 'ALLOW_ALL' },
];

// 库存：手动出版商（三大类树形，参考 Amazon DSP）
const INVENTORY_PUBLISHERS = [
  { name: '亚马逊自有自营网络', children: ['Alexa', 'Amazon', 'Amazon Digital Signage', 'Fire Tablet', 'Fire TV', 'Goodreads', 'IMDb', 'Prime Video', 'Twitch'] },
  { name: 'Amazon Publisher Direct', children: ['Amazon Publisher Direct'] },
  { name: '第三方广告交易平台', children: ['Ad Generation', 'AJA', 'Equativ', 'Equativ Sharethrough', 'Exte', 'Fluct', 'Google AdX (Authorized Buyers)', 'GumGum', 'Improve Digital', 'Index', 'InMobi', 'ironSource', 'Kargo'] },
];

// 库存：交易（deals，代表性清单）
const INVENTORY_DEALS = [
  { id: 'MGNI-AP-34166', name: '3PS_Magnite_70%_VCR_OLV_MX', type: '私人竞拍', avail: '23万' },
  { id: 'MGNI-AP-34165', name: '3PS_Magnite_RON_Display_MX', type: '私人竞拍', avail: '1358万' },
  { id: 'MGNI-AP-34164', name: '3PS_Magnite_70%_Viewability_Display_MX', type: '私人竞拍', avail: '816万' },
  { id: 'MGNI-AP-34160', name: '3PS_Magnite_Lifestyle_Display_US', type: '私人竞拍', avail: '2亿' },
  { id: 'MGNI-AP-34161', name: '3PS_Magnite_Food&Recipe_Display_US', type: '私人竞拍', avail: '3451万' },
  { id: 'MGNI-AP-34162', name: '3PS_Magnite_Food&Recipe_OLV_US', type: '私人竞拍', avail: '3119万' },
  { id: 'MGNI-AP-34163', name: '3PS_Magnite_Spanish_Language_Display_US', type: '私人竞拍', avail: '1293万' },
  { id: 'tlx-85995', name: 'Marvis UK - Prime Video Retargeting Q2', type: '私人竞拍', avail: '879万' },
];

// 库存：库存组（inventory groups，代表性清单）
const INVENTORY_GROUPS = [
  { id: '586202473373028834', name: 'Spanish Language Display', curated: true },
  { id: '617375706969843748', name: 'Minority Owned Publishers Display', curated: true },
  { id: '611484202487283315', name: 'Entertainment (no News) Display', curated: true },
  { id: '616418396578217265', name: 'High CTR Display', curated: true },
  { id: '579300189464417677', name: '70%+ Viewability Display', curated: true },
  { id: '621801383408964946', name: 'Display RON', curated: true },
  { id: '634298315174811319', name: 'NA Comscore 100 Display', curated: true },
  { id: '636557783328733629', name: 'NA Comscore 200 Display', curated: true },
  { id: '605132371975495632', name: 'Display - Low Floor Supply', curated: true },
  { id: '592589556839084172', name: 'Display Holiday Content', curated: true },
  { id: '583906920529223989', name: 'Native RON', curated: true },
];

// 产品和服务类别（两级树形，参考 Amazon DSP，代表性清单）
const PRODUCT_CATEGORIES = [
  { name: 'Automotive', children: ['Audio, Video & Gadgets', 'Boats & Watercraft', 'Buying, New', 'Buying, Used', 'Motorcycles', 'Parts & Service', 'Repair'] },
  { name: 'Beauty & Fashion', children: ['Apparel', 'Cosmetics', 'Fragrances', 'Hair Care', 'Jewelry & Watches', 'Skin Care'] },
  { name: 'Business', children: ['Advertising & Marketing', 'B2B Services', 'Office Supplies', 'Small Business'] },
  { name: 'Consumer Electronics', children: ['Audio', 'Cameras', 'Computers', 'Mobile Phones', 'TV & Video', 'Wearables'] },
  { name: 'Dating', children: ['Online Dating', 'Matchmaking'] },
  { name: 'Education', children: ['Higher Education', 'K-12', 'Online Courses', 'Test Prep'] },
  { name: 'Entertainment', children: ['Movies', 'Music', 'Streaming', 'Gaming', 'Events & Tickets'] },
  { name: 'Family', children: ['Baby & Toddler', 'Kids', 'Parenting'] },
  { name: 'Finance, Commercial', children: ['Banking', 'Insurance', 'Investing', 'Payments'] },
  { name: 'Finance, Personal', children: ['Credit Cards', 'Loans', 'Personal Banking', 'Tax'] },
  { name: 'Food & Dining', children: ['Beverages', 'Groceries', 'Restaurants', 'Snacks'] },
  { name: 'Government', children: ['Agencies', 'Public Programs'] },
  { name: 'Health', children: ['Fitness', 'Medical', 'Nutrition', 'Pharmacy', 'Wellness'] },
  { name: 'Holiday, Events', children: ['Holidays', 'Seasonal', 'Weddings'] },
  { name: 'Home & Garden', children: ['Appliances', 'Decor', 'Furniture', 'Gardening', 'Tools'] },
  { name: 'Interests', children: ['Arts & Crafts', 'Collecting', 'Outdoors', 'Photography'] },
  { name: 'Jobs', children: ['Job Search', 'Recruiting', 'Career Services'] },
  { name: 'Media', children: ['News', 'Publishing', 'Radio', 'Social Media'] },
  { name: 'Military', children: ['Active Duty', 'Veterans'] },
  { name: 'Other', children: ['Miscellaneous'] },
  { name: 'Pets', children: ['Adoption & Rescue', 'Breeding', 'Food & Supplies', 'General', 'Services'] },
  { name: 'Public Services', children: ['Charities', 'Community', 'Emergency Services'] },
  { name: 'Public Utilities', children: ['Electricity', 'Gas', 'Water', 'Waste'] },
  { name: 'Real Estate', children: ['Buying', 'Renting', 'Commercial', 'Property Management'] },
  { name: 'Sensitive', children: ['Alcohol', 'Gambling', 'Tobacco'] },
  { name: 'Shopping', children: ['Apparel', 'Department Stores', 'Marketplaces', 'Coupons & Deals'] },
  { name: 'Society', children: ['Community', 'Religion', 'Social Issues'] },
  { name: 'Sports', children: ['Equipment', 'Fan Gear', 'Leagues', 'Fitness'] },
  { name: 'Tech B2B', children: ['Cloud', 'Hardware', 'SaaS', 'Security'] },
  { name: 'Telecom', children: ['Broadband', 'Mobile Carriers', 'TV Providers'] },
  { name: 'Travel', children: ['Airlines', 'Cruises', 'Hotels', 'Car Rental', 'Vacation Packages'] },
];

// goal → 候选 KPI 类型（与对照表 §3.4 一致）
const GOAL_KPI_MAP = {
  AWARENESS:     ['REACH', 'FREQUENCY', 'INCREMENTAL_TV_REACH'],
  CONSIDERATION: ['CTR', 'CPC', 'CPVC', 'VCR', 'CPDPV', 'DPVR'],
  CONVERSIONS:   ['ROAS', 'T_ROAS', 'CPA', 'C_ROAS', 'CPSU', 'CPFAO'],
};
// goal → 中文标签
const ORDER_GOAL_LABELS = {
  AWARENESS: '认知度', CONSIDERATION: '购买意向', CONVERSIONS: '转化量',
};
// KPI → 单位（前端派生展示）
const KPI_UNIT = {
  REACH: '',                FREQUENCY: 'times/week', INCREMENTAL_TV_REACH: '',
  CTR: '%',                 CPC: '$',                CPVC: '$',
  VCR: '%',                 CPDPV: '$',              DPVR: '%',
  ROAS: 'x',                T_ROAS: 'x',             CPA: '$',
  C_ROAS: 'x',              CPSU: '$',               CPFAO: '$',
};

// 三层示例数据：3 LineItem × 2 Creative
const DEMO_LINEITEM_ROWS = [
  { mediaType: 'DISPLAY', geoCountry: 'US', audienceId: 'aud_inmarket_home_001', baseBidCpm: '2.50' },
  { mediaType: 'ONLINE_VIDEO', geoCountry: 'US', audienceId: 'aud_lifestyle_002', baseBidCpm: '5.00' },
  { mediaType: 'AUDIO', geoCountry: 'JP', audienceId: 'aud_lookalike_004', baseBidCpm: '3.00' },
];
const DEMO_CREATIVE_ROWS = [
  { creativeType: 'DISPLAY', asins: 'B07XYZ001,B07XYZ002', headline: 'Upgrade your home today', landingUrl: 'https://www.brandx.com/holiday' },
  { creativeType: 'VIDEO', asins: 'B07XYZ004,B07XYZ005', headline: 'Find your perfect match', landingUrl: 'https://www.brandx.com/lifestyle' },
];

/* ===== 2) Utils ===== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toLocaleTimeString('zh-CN', { hour12: false });
const fmtJSON = (obj) => JSON.stringify(obj, null, 2);

function log(level, msg) {
  const box = $('#logBox');
  const line = document.createElement('div');
  line.className = `log-line ${level}`;
  line.innerHTML = `<span class="log-time">${now()}</span>${msg}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

/* ===== 3) MockAPI 模拟 Amazon DSP API ===== */
const MockAPI = {
  errorRate: 0.15,
  qps: 5,
  _windowStart: 0,
  _windowCount: 0,

  // 限流：滑动窗口
  async _throttle() {
    const now = Date.now();
    if (now - this._windowStart >= 1000) {
      this._windowStart = now;
      this._windowCount = 0;
    }
    if (this._windowCount >= this.qps) {
      const wait = 1000 - (now - this._windowStart);
      await sleep(wait > 0 ? wait : 50);
      return this._throttle();
    }
    this._windowCount++;
  },

  async _call(name, payload, opts = {}) {
    await this._throttle();
    State.stats.calls++;
    UI.refreshStats();
    // 模拟 80~250ms 网络延迟
    await sleep(80 + Math.random() * 170);
    // 模拟随机错误（429 限流 / 5xx / 422 业务校验）
    if (Math.random() < this.errorRate) {
      const dice = Math.random();
      if (dice < 0.4) throw mkErr(429, 'RATE_LIMITED', '限流，请退避后重试');
      if (dice < 0.7) throw mkErr(503, 'SERVICE_UNAVAILABLE', 'Amazon 侧暂不可用');
      throw mkErr(422, 'VALIDATION_FAILED', `字段校验失败: ${pickRandomField(payload)}`);
    }
    return { id: `${opts.idPrefix || 'res'}_${uid()}`, ...payload, status: opts.status || 'DRAFT' };
  },

  // ---- DSP 写接口（mock）----
  createOrder(payload)    { return this._call('order', payload, { idPrefix: 'ord' }); },
  createLineItem(payload) { return this._call('lineItem', payload, { idPrefix: 'li' }); },
  createCreative(payload) { return this._call('creative', payload, { idPrefix: 'crea', status: 'PENDING_REVIEW' }); },
  attachCreative(lineItemId, creativeId) {
    return this._call('attach', { lineItemId, creativeId }, { idPrefix: 'att' });
  },

  // ---- DSP 读接口 ----
  async listAdvertisers() {
    await sleep(300);
    return [
      { advertiserId: 'adv_001', name: 'BrandX US', currency: 'USD', country: 'US', timezone: 'America/Los_Angeles' },
      { advertiserId: 'adv_002', name: 'BrandY UK', currency: 'GBP', country: 'UK', timezone: 'Europe/London' },
      { advertiserId: 'adv_003', name: 'BrandZ JP', currency: 'JPY', country: 'JP', timezone: 'Asia/Tokyo' },
    ];
  },

  async listOrders(advertiserId) {
    await sleep(400);
    // Mock 该广告主下已有的订单（真实场景需支持搜索/分页）
    const mockOrders = {
      'adv_001': [
        { orderId: 'ord_existing_001', name: '2026 Q2 品牌曝光', budget: 100000, status: 'ACTIVE', startDate: '2026-04-01', endDate: '2026-06-30' },
        { orderId: 'ord_existing_002', name: '夏季促销主订单', budget: 250000, status: 'ACTIVE', startDate: '2026-06-15', endDate: '2026-08-31' },
        { orderId: 'ord_existing_003', name: '新品上市测试', budget: 50000, status: 'PAUSED', startDate: '2026-05-01', endDate: '2026-07-15' },
      ],
      'adv_002': [
        { orderId: 'ord_existing_004', name: 'UK Spring Campaign', budget: 80000, status: 'ACTIVE', startDate: '2026-03-01', endDate: '2026-05-31' },
      ],
      'adv_003': [
        { orderId: 'ord_existing_005', name: 'Japan Summer Sale', budget: 15000000, status: 'ACTIVE', startDate: '2026-07-01', endDate: '2026-09-30' },
      ],
    };
    const advName = (State.selectedAdvertiser?.name) || '';
    // 主页提交保存的订单也算进来（按广告主名匹配；budget 字段从 "$xx" 解析）
    let submitted = [];
    try { submitted = JSON.parse(localStorage.getItem('amzdsp_orders') || '[]'); } catch (e) {}
    const submittedFiltered = submitted
      .filter((o) => !advName || o.advertiser === advName)
      .map((o) => ({
        orderId: o.id,
        name: o.name,
        budget: parseFloat(String(o.budget).replace(/[^0-9.]/g, '')) || 0,
        status: o.statusKey === 'ACTIVE' ? 'ACTIVE' : 'PAUSED',
        startDate: '—', endDate: '—',
      }));
    return [...submittedFiltered, ...(mockOrders[advertiserId] || [])];
  },
};

function mkErr(http, code, message) {
  const e = new Error(message);
  e.http = http; e.code = code;
  return e;
}
function pickRandomField(obj) {
  const keys = Object.keys(obj || {});
  return keys[Math.floor(Math.random() * keys.length)] || 'unknown';
}

/* ===== 4) Templates 模板与变量展开 ===== */
const Templates = {
  // 把 "{{var}}" 替换为变量表格里的值
  render(tpl, vars) {
    if (tpl == null) return tpl;
    return String(tpl).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) =>
      vars[k] != null ? vars[k] : ''
    );
  },

  // 根据投放开始时间推导季度，如 2026Q3
  quarterOf(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return `${d.getFullYear()}Q${Math.floor(d.getMonth() / 3) + 1}`;
  },

  // 计算名称模板专用变量（mediaType/goal/kpiType/flightName/quarter）
  orderNameVars(vars, fl) {
    vars = vars || {};
    fl = fl || {};
    const amazonPromotion = (vars.amazonPromotion != null)
      ? !!vars.amazonPromotion
      : ($('#ord_amazonPromotion')?.checked || false);
    const mediaTypes = vars.mediaTypes || $$('#ord_mediaTypes input:checked').map((c) => c.value);
    const firstRow = fl.rows && fl.rows[0];
    return {
      ...vars,
      mediaType: amazonPromotion ? 'PROMO' : (mediaTypes[0] || ''),
      goal: vars.goal || $('#ord_goal').value || '',
      kpiType: vars.kpiType || $('#ord_kpiType').value || '',
      flightName: (firstRow && firstRow.name) || '',
      quarter: this.quarterOf(firstRow && firstRow.start),
    };
  },

  // 渲染 Order 名称
  orderName(vars, fl) {
    return this.render($('#ord_name').value, this.orderNameVars(vars, fl));
  },

  // 计算 LineItem 名称专用变量
  lineItemNameVars(vars, md, pd) {
    vars = vars || {};
    md = md || {};
    pd = pd || { categories: [] };
    const inv = State.inventoryCombos[State.activeInvIdx] || State.inventoryCombos[0] || { type: 'ALL_PUBLISHERS' };
    const firstCat = (pd.categories && pd.categories[0]) || '';
    const productCategory = firstCat ? firstCat.split(' / ').pop() : '';
    const geoCountry = (State.targetingEnabled && State.targetingEnabled.includes('location'))
      ? this.render(State.targetingValues.location || '', vars)
      : '';
    return {
      ...vars,
      mediaType: md.mediaType || vars.mediaType || '',
      goal: vars.goal || $('#ord_goal').value || '',
      kpiType: vars.kpiType || $('#ord_kpiType').value || '',
      productCategory,
      inventoryType: inv.type === 'MANUAL_PUBLISHERS' ? 'MANUAL' : 'ALL',
      geoCountry,
    };
  },

  // 渲染 LineItem 名称
  lineItemName(vars, md, pd) {
    return this.render($('#li_name').value, this.lineItemNameVars(vars, md, pd));
  },

  buildOrder(vars, flight) {
    // 投放配置（来自所选投放，回退到第一个）
    const fl = flight || State.flightCombos[State.activeFlightIdx] || State.flightCombos[0] || {};
    // 读取频次上限数组（仅在勾选「频率」时启用）
    const freqEnabled = $('#ord_freqCapEnabled')?.checked;
    const freqRows = $$('#freqCapRows .freq-row');
    const frequencyCaps = !freqEnabled ? [] : freqRows.map((row) => ({
      maxImpressions: Number(row.querySelector('[data-freq-impressions]')?.value) || 0,
      timeValue: Number(row.querySelector('[data-freq-timevalue]')?.value) || 1,
      timeUnit: row.querySelector('[data-freq-timeunit]')?.value || 'DAY',
      scope: row.querySelector('[data-freq-scope]')?.value || 'USER',
    })).filter((cap) => cap.maxImpressions > 0);

    // goalKpi（按组合变量优先，否则表单全局）
    const goalVal = vars.goal || $('#ord_goal').value;
    const kpiTypeVal = vars.kpiType || $('#ord_kpiType').value;
    const kpiNoTarget = (vars.kpiNoTarget != null) ? vars.kpiNoTarget : $('#ord_kpiNoTarget')?.checked;
    const kpiValueRaw = this.render((vars.kpiValue != null ? String(vars.kpiValue) : $('#ord_kpiValue').value), vars);

    let goalKpi = null;
    if (kpiTypeVal && kpiTypeVal !== '') {
      goalKpi = {
        type: kpiTypeVal,
        value: (kpiNoTarget || !kpiValueRaw) ? null : Number(kpiValueRaw),
        unit: KPI_UNIT[kpiTypeVal] || '',
        noTarget: kpiNoTarget || false,
      };
    }

    // 媒体类型 / 亚马逊促销（按组合变量优先）
    const amazonPromotion = (vars.amazonPromotion != null)
      ? !!vars.amazonPromotion
      : ($('#ord_amazonPromotion')?.checked || false);
    const mediaTypes = vars.mediaTypes
      ? vars.mediaTypes
      : $$('#ord_mediaTypes input:checked').map((c) => c.value);

    return {
      advertiserId: State.selectedAdvertiser?.advertiserId,
      name: this.orderName(vars, fl),
      poNumber: this.render($('#ord_poNumber').value, vars) || null,
      advertiserDomain: $('#ord_advertiserDomain').value || null,
      notes: $('#ord_notes').value || null,
      amazonPromotion: amazonPromotion,
      mediaTypes: mediaTypes,
      flights: (fl.rows && fl.rows.length ? fl.rows : [{}]).map((r) => ({
        budget: { amount: Number(this.render(String(r.budget != null ? r.budget : ''), vars)) || 0, currencyCode: 'USD' },
        startDateTime: r.start || null,
        endDateTime: r.end || null,
        name: r.name || null,
      })),
      unusedBudgetAction: fl.unusedBudget || 'NO_CHANGE',
      budgetCap: fl.budgetCapEnabled ? {
        type: fl.budgetCapType || null,
        amount: Number(fl.budgetCapAmount) || null,
      } : null,
      agencyFee: fl.agencyFeeEnabled ? {
        type: fl.agencyFeeType || null,
        value: Number(fl.agencyFeeValue) || null,
      } : null,
      goal: goalVal,
      goalKpi,
      optimization: {
        priority: vars.optimizationPriority || $('#ord_optimizationPriority').value || 'SPEND_FULL_BUDGET',
        budgetAllocation: vars.budgetAllocation || $('#ord_budgetAllocation').value || 'AUTO',
      },
      frequencyCaps,
      includeLinearTVInFrequency: (freqEnabled && $('#ord_includeLinearTV')?.checked) || false,
      frequencyGroupId: ($('#ord_freqGroupEnabled')?.checked && $('#ord_frequencyGroupId').value) || null,
      products: [], // 暂时mock为空数组，真实场景需解析ASIN录入区
      offAmazonConversions: [],
      commitments: [],
    };
  },

  buildLineItem(vars, orderId, media, product, inventoryArg) {
    // 媒体类型配置（来自所选媒体类型，回退到第一个）
    const md = media || State.mediaCombos[State.activeMediaIdx] || State.mediaCombos[0] || {};
    const mediaTypeVal = md.mediaType || vars.mediaType || $('#li_mediaType').value;
    // 产品和服务类别（来自所选组，回退到当前编辑缓冲）
    const pd = product || State.productCombos[State.activeProductIdx] || { categories: State.productCategories };
    // 库存配置（来自所选库存组，回退到第一个）
    const iv = inventoryArg || State.inventoryCombos[State.activeInvIdx] || State.inventoryCombos[0] || { type: 'ALL_PUBLISHERS' };

    // 媒体类型分支配置
    const mediaConfig = {};
    if (mediaTypeVal === 'DISPLAY') {
      mediaConfig.devices = md.devices || $$('#li_media_devices input:checked').map((c) => c.value);
      mediaConfig.mobileEnvironments = md.mobileEnv || $$('#li_media_mobileEnv input:checked').map((c) => c.value);
    } else if (mediaTypeVal === 'STREAMING_TV') {
      mediaConfig.streamingTvPlan = md.streamingPlan || $('#li_media_streamingPlan').value;
    } else if (mediaTypeVal === 'DIGITAL_OUT_OF_HOME') {
      mediaConfig.doohProductLocation = md.doohLocation || $('#li_media_doohLocation').value;
    }

    // 库存配置
    const inventory = {
      type: iv.type || 'ALL_PUBLISHERS',
      publishers: iv.type === 'MANUAL_PUBLISHERS' ? [...(iv.publishers || [])] : [],
      deals: [...(iv.deals || [])],
      groups: [...(iv.groups || [])],
    };

    // 定向（按用户启用的维度，未启用 = 不下发）
    const tEnabled = State.targetingEnabled || [];
    const tVal = (k) => State.targetingValues[k];
    const tHas = (k) => tEnabled.includes(k);
    const splitCsv = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
    const targeting = {};
    if (tHas('audience')) targeting.audiences = { include: [this.render(tVal('audience') || '', vars)].filter(Boolean), exclude: [] };
    if (tHas('location')) targeting.geo = { include: [{ type: 'COUNTRY', value: this.render(tVal('location') || '', vars) }], exclude: [] };
    if (tHas('daypart')) targeting.daypart = tVal('daypart');
    if (tHas('products')) targeting.products = splitCsv(this.render(tVal('products') || '', vars));
    if (tHas('inMarket')) targeting.inMarketSegments = splitCsv(tVal('inMarket'));
    if (tHas('keywords')) targeting.keywords = splitCsv(tVal('keywords'));
    if (tHas('domains')) targeting.domains = { mode: tVal('domains'), include: [], exclude: [] };
    if (tHas('mobileOs')) targeting.mobileOs = [...(tVal('mobileOs') || [])];
    if (tHas('devices')) targeting.devices = [...(tVal('devices') || [])];
    if (tHas('orientation')) targeting.orientation = [...(tVal('orientation') || [])];
    if (tHas('foldPosition')) targeting.foldPosition = [...(tVal('foldPosition') || [])];
    if (tHas('nativePlacement')) targeting.nativePlacement = [...(tVal('nativePlacement') || [])];
    if (tHas('mobileApps')) targeting.mobileApps = { mode: tVal('mobileApps'), include: [], exclude: [] };
    if (tHas('thirdPartyViewability')) targeting.thirdPartyViewability = tVal('thirdPartyViewability') || null;
    if (tHas('viewability')) targeting.viewability = tVal('viewability');
    if (tHas('brandSuitability')) targeting.brandSuitability = tVal('brandSuitability');

    // 投放配置
    const delivery = {
      startDateTime: $('#li_delivery_start').value,
      endDateTime: $('#li_delivery_end').value,
      budgetAllocation: $('#li_delivery_budgetAlloc').value || 'AUTO',
      spendLimits: {
        dailyOrMonthly: Number($('#li_delivery_spendLimit').value) || null,
        dailyMinimum: Number($('#li_delivery_spendMin').value) || null,
      },
      pacing: {
        type: $('#li_delivery_pacing').value || 'EVEN',
      },
      frequencyCaps: $('#li_delivery_freqCap')?.checked
        ? $$('#li_freqCapRows .freq-row').map((row) => ({
            maxImpressions: Number(row.querySelector('[data-freq-impressions]')?.value) || 0,
            timeValue: Number(row.querySelector('[data-freq-timevalue]')?.value) || 1,
            timeUnit: row.querySelector('[data-freq-timeunit]')?.value || 'DAY',
            scope: row.querySelector('[data-freq-scope]')?.value || 'USER',
          })).filter((cap) => cap.maxImpressions > 0)
        : [],
    };

    // 竞价配置（竞价优先级从 Order 继承，不在此设）
    const baseBidVal = this.render($('#li_bidding_baseBid').value, vars);
    const maxCpmMode = $('#li_bidding_maxCpmMode').value;
    const bidding = {
      baseBidCpm: Number(baseBidVal) || 0,
      maxCpmMode: maxCpmMode || 'AUTO',
      maxCpmValue: maxCpmMode === 'MANUAL' ? Number($('#li_bidding_maxCpmValue').value) || null : null,
      adjustments: null,
    };

    return {
      orderId,
      name: this.lineItemName(vars, md, pd),
      externalId: this.render($('#li_externalId').value, vars) || null,
      notes: $('#li_notes').value || null,
      status: 'PAUSED',
      mediaType: mediaTypeVal,
      mediaConfig,
      productCategories: [...(pd.categories || [])], // 产品和服务类别（多选）
      inventory,
      targeting,
      delivery,
      bidding,
    };
  },

  buildCreative(vars) {
    // 创意大类（按行变量优先，否则表单）
    const creativeType = vars.creativeType || $('#cr_type').value;
    const subtype = $('#cr_subtype').value;
    const clickType = $('#cr_clickType').value;

    // 点击跳转分支
    const clickThrough = { type: clickType };
    if (clickType === 'AMAZON_PRODUCT') {
      const asin = String(this.render($('#cr_click_asin').value, vars)).split(',')[0]?.trim() || '';
      clickThrough.asin = asin;
    } else if (clickType === 'BRAND_STORE') {
      clickThrough.storeId = $('#cr_click_storeId').value || null;
      clickThrough.pageId = $('#cr_click_pageId').value || null;
    } else if (clickType === 'OTHER_WEBSITE') {
      clickThrough.url = this.render($('#cr_click_url').value, vars);
    }

    // 各大类专属配置
    let typeConfig = {};
    if (creativeType === 'DISPLAY') {
      if (subtype === 'STANDARD_DISPLAY') {
        typeConfig = {
          adExperience: $('#cr_disp_adExperience').value,
          supplyOpportunities: { sizes: $$('#cr_disp_sizes input:checked').map((c) => c.value) },
          assets: { images: [], html5ZipAssetId: null, backupImageAssetId: null }, // mock 素材占位
          settings: { adChoicesPosition: 'TOP_RIGHT', border: false },
        };
      } else { // THIRD_PARTY_DISPLAY
        typeConfig = {
          tagSource: $('#cr_disp_tagSource').value || '',
          size: $('#cr_disp_3pSize').value,
        };
      }
    } else if (creativeType === 'VIDEO') {
      if (subtype === 'STANDARD_VIDEO') {
        typeConfig = {
          videoAsset: { assetId: null }, // mock 素材占位
          adExperience: $$('#cr_vid_adExperience input:checked').map((c) => c.value),
          vastThirdPartyVerificationUrl: $('#cr_vid_vastVerifyUrl').value || null,
          creativeCategories: $$('#cr_vid_categories input:checked').map((c) => c.value),
        };
      } else { // THIRD_PARTY_VIDEO
        typeConfig = { vastTagUrl: $('#cr_vid_vastTagUrl').value || '' };
      }
    } else if (creativeType === 'AUDIO') {
      typeConfig = {
        audioAsset: { assetId: null }, // mock 素材占位（MP3/WAV/OGG, 10-30秒）
        title: this.render($('#cr_aud_title').value, vars) || null,
        coverImage: subtype === 'INTERACTIVE_AUDIO' ? null : { assetId: null },
      };
      if (subtype === 'INTERACTIVE_AUDIO') {
        typeConfig.brandName = this.render($('#cr_aud_brandName').value, vars);
        typeConfig.ctaType = $('#cr_aud_ctaType').value;
        typeConfig.products = $('#cr_aud_ctaType').value === 'ADD_TO_CART'
          ? [{ asin: String(this.render('{{asins}}', vars)).split(',')[0]?.trim() || '' }]
          : [];
        typeConfig.containsAiGeneratedPersons = false;
      }
    } else if (creativeType === 'COMPONENT_BASED') {
      // clickThrough.type 决定素材区结构（3 分支）
      const headlines = String(this.render($('#cr_cb_headlines').value, vars))
        .split('|').map((s) => s.trim()).filter(Boolean);
      typeConfig = {
        headlines,
        disclaimer: null,
        containsAiGeneratedPersons: $('#cr_cb_aiPersons')?.checked || false,
        adPlacement: {
          mode: $('#cr_cb_placementMode').value,
          sizes: $('#cr_cb_placementMode').value === 'SPECIFIC' ? ['300x250', '728x90'] : [],
        },
        logoAsset: { assetId: null }, // mock 素材占位
      };
      if (clickType === 'AMAZON_PRODUCT') {
        typeConfig.products = [];
        typeConfig.videoAssets = [];   // 最多 2
        typeConfig.imageAssets = [];   // 建议 15
        typeConfig.multiLanguageSupport = false;
        typeConfig.optimization = false;
      } else if (clickType === 'OTHER_WEBSITE') {
        typeConfig.brandName = this.render($('#cr_cb_brandName').value, vars);
        typeConfig.nativeVideo = false;
        typeConfig.imageAssets = [];   // 15
        typeConfig.imageContainsProduct = false;
        typeConfig.bodyTexts = [$('#cr_cb_bodyText').value].filter(Boolean); // ≤100, 最多5
        typeConfig.ctas = [$('#cr_cb_cta').value].filter(Boolean);           // 最多5
      } else if (clickType === 'BRAND_STORE') {
        typeConfig.brandName = this.render($('#cr_cb_brandName').value, vars);
        typeConfig.allowBrandPromotion = false;
        typeConfig.customImage = { assetId: null }; // 单张
        typeConfig.imageContainsProduct = false;
        typeConfig.bodyText = $('#cr_cb_bodyText').value || null; // ≤200
        typeConfig.cta = $('#cr_cb_cta').value || null;            // 单选
      }
    }

    // 第三方跟踪（音频/组件无 clickUrls）
    const thirdPartyTracking = {
      impressionUrls: String($('#cr_3pImpressionUrls').value || '').split(',').map((s) => s.trim()).filter(Boolean),
    };
    if (creativeType === 'DISPLAY' || creativeType === 'VIDEO') {
      thirdPartyTracking.clickUrls = String($('#cr_3pClickUrls').value || '').split(',').map((s) => s.trim()).filter(Boolean);
    }

    const payload = {
      advertiserId: State.selectedAdvertiser?.advertiserId,
      name: this.render($('#cr_name').value, vars),
      creativeType,
      subtype,
      language: $('#cr_language').value,
      externalId: this.render($('#cr_externalId').value, vars) || null,
      clickThrough,
      ...typeConfig,
      thirdPartyTracking,
      otherHtml: $('#cr_otherHtml').value || null,
      status: 'PENDING_REVIEW',
    };
    // 第三方类型带站点
    if (subtype === 'THIRD_PARTY_DISPLAY' || subtype === 'THIRD_PARTY_VIDEO') {
      payload.site = $('#cr_site').value;
    }
    return payload;
  },

  // 用各层第一行变量做预览
  refreshPreviews() {
    const crVars = { ...(State.creativeRows[0] || DEMO_CREATIVE_ROWS[0]), idx: 1 };
    const ordVars = State.orderCombos[State.activeComboIdx] || State.orderCombos[0] || {};
    const mediaVars = State.mediaCombos[State.activeMediaIdx] || State.mediaCombos[0] || {};
    const prodVars = State.productCombos[State.activeProductIdx] || State.productCombos[0] || { categories: State.productCategories };
    const invVars = State.inventoryCombos[State.activeInvIdx] || State.inventoryCombos[0] || { type: 'ALL_PUBLISHERS' };
    $('#ord_preview').textContent = fmtJSON(this.buildOrder(ordVars));
    $('#li_preview').textContent  = fmtJSON(this.buildLineItem({ mediaType: mediaVars.mediaType }, 'ord_<待生成>', mediaVars, prodVars, invVars));
    $('#cr_preview').textContent  = fmtJSON(this.buildCreative(crVars));
  },
};

function sampleVars() {
  return { ...DEMO_LINEITEM_ROWS[0], ...DEMO_CREATIVE_ROWS[0] };
}

/* ===== 5) UI ===== */
const UI = {
  goStep(n) {
    $$('.step').forEach((el) => el.classList.toggle('active', +el.dataset.step === n));
    $$('.panel').forEach((el) => el.classList.toggle('active', +el.dataset.panel === n));
    if (n === 2) {
      // 步骤2：根据订单模式显隐提示
      $('#ord_modeHint').style.display = State.orderMode === 'EXISTING' ? '' : 'none';
      this.ensureOrderCombo();
      this.renderOrderCombos();
      this.ensureFlight();
      this.renderFlights();
      this.updateFlightTotal();
    }
    if (n === 3) { this.ensureMedia(); this.renderMediaList(); this.ensureProduct(); this.renderProductList(); this.ensureInventory(); this.renderInventoryList(); this.ensureTargetingDefaults(); this.renderTargetingRows(); this.renderTargetingMenu(); }
    if (n === 4) this.renderVariantTable('creative');
    if (n >= 2 && n <= 4) Templates.refreshPreviews();
    if (n === 5) this.renderCombinationPreview();
    if (n === 6) this.refreshStats();
  },

  // 广告主多选选择器
  renderAdvertisers(list) {
    State._advAll = list;
    if (!Array.isArray(State.selectedAdvertisers)) State.selectedAdvertisers = [];
    this.renderAdvList();
    this.renderAdvSelected();
  },

  renderAdvList(filter) {
    const box = $('#advList');
    if (!box) return;
    const list = State._advAll || [];
    const q = (filter || '').trim().toLowerCase();
    const filtered = !q ? list : list.filter((a) =>
      a.name.toLowerCase().includes(q) || a.advertiserId.toLowerCase().includes(q));
    if (!filtered.length) {
      box.innerHTML = '<div class="adv-empty">暂无数据</div>';
      return;
    }
    box.innerHTML = filtered.map((a) => {
      const on = State.selectedAdvertisers.some((s) => s.advertiserId === a.advertiserId);
      return `
        <div class="adv-row ${on ? 'on' : ''}" data-id="${a.advertiserId}">
          <input type="checkbox" ${on ? 'checked' : ''} />
          <div class="adv-row-body">
            <div class="adv-row-name">${escapeHTML(a.name)}</div>
            <div class="adv-row-meta">${escapeHTML(a.advertiserId)} · ${escapeHTML(a.currency)} · ${escapeHTML(a.country)}</div>
          </div>
        </div>`;
    }).join('');
    box.querySelectorAll('.adv-row').forEach((row) => {
      row.addEventListener('click', () => UI.toggleAdv(row.dataset.id));
    });
  },

  renderAdvSelected() {
    const box = $('#advSelectedList');
    const cnt = $('#advSelectedCount');
    if (cnt) cnt.textContent = String(State.selectedAdvertisers.length);
    if (!box) return;
    if (!State.selectedAdvertisers.length) {
      box.innerHTML = '<div class="adv-empty">未选择任何广告主</div>';
    } else {
      box.innerHTML = State.selectedAdvertisers.map((a) => `
        <div class="adv-chip" data-id="${a.advertiserId}">
          <div class="adv-chip-body">
            <div class="adv-chip-name">${escapeHTML(a.name)}</div>
            <div class="adv-chip-meta">${escapeHTML(a.advertiserId)} · ${escapeHTML(a.currency)} · ${escapeHTML(a.country)}</div>
          </div>
          <button type="button" class="adv-chip-del" title="移除">×</button>
        </div>`).join('');
      box.querySelectorAll('.adv-chip-del').forEach((b) => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          UI.toggleAdv(b.closest('.adv-chip').dataset.id);
        });
      });
    }
    // 主选中（用于流程后续逻辑）= 第一个选中的
    State.selectedAdvertiser = State.selectedAdvertisers[0] || null;
    const nextBtn = $('.panel[data-panel="1"] .btn.next');
    if (nextBtn) nextBtn.disabled = State.selectedAdvertisers.length === 0;
    UI.updateSidebar();
  },

  toggleAdv(id) {
    const list = State._advAll || [];
    const adv = list.find((a) => a.advertiserId === id);
    if (!adv) return;
    const idx = State.selectedAdvertisers.findIndex((s) => s.advertiserId === id);
    if (idx >= 0) {
      State.selectedAdvertisers.splice(idx, 1);
    } else {
      if (State.selectedAdvertisers.length >= 10) { alert('最多选择 10 个广告主'); return; }
      State.selectedAdvertisers.push(adv);
      log('info', `选中广告主：${adv.name}`);
    }
    this.renderAdvList($('#advSearch')?.value);
    this.renderAdvSelected();
  },

  // 通用变体表渲染器：一套逻辑渲染各层级表
  // layer: 'lineItem' | 'creative'
  renderVariantTable(layer) {
    const def = VARIANT_DEFS[layer];
    const tbody = $(def.tbody);
    if (!tbody) return;
    const rows = State[def.stateKey];
    tbody.innerHTML = rows.map((row, i) => `
      <tr data-idx="${i}">
        <td class="idx">${i + 1}</td>
        ${def.cols.map((c) => `<td><input data-col="${c}" value="${escapeHTML(row[c] || '')}" placeholder="${escapeHTML(VARIANT_LABELS[c] || c)}" /></td>`).join('')}
        <td class="op">
          <button class="row-clone" title="复制此行">⧉</button>
          <button class="row-del" title="删除">×</button>
        </td>
      </tr>
    `).join('');
    const countEl = $(def.count);
    if (countEl) countEl.textContent = `${rows.length} 行`;

    tbody.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', (e) => {
        const idx = +e.target.closest('tr').dataset.idx;
        rows[idx][e.target.dataset.col] = e.target.value;
        UI.updateSidebar();
      });
    });
    tbody.querySelectorAll('.row-del').forEach((b) => {
      b.addEventListener('click', (e) => {
        const idx = +e.target.closest('tr').dataset.idx;
        rows.splice(idx, 1);
        UI.renderVariantTable(layer);
      });
    });
    tbody.querySelectorAll('.row-clone').forEach((b) => {
      b.addEventListener('click', (e) => {
        const idx = +e.target.closest('tr').dataset.idx;
        rows.splice(idx + 1, 0, JSON.parse(JSON.stringify(rows[idx])));
        UI.renderVariantTable(layer);
        log('info', `已复制${def.name}第 ${idx + 1} 行`);
      });
    });
    this.updateSidebar();
  },

  renderAllTables() {
    this.renderVariantTable('creative');
  },

  // ===== 名称模板构建器（点击变量插入/取消，作用于已选中的 token 切换）=====
  // 通用渲染：传入 chip 容器、目标 input、变量定义列表
  renderChipBuilder(chipsSel, inputSel, vars) {
    const box = $(chipsSel);
    const input = $(inputSel);
    if (!box || !input) return;
    const cur = input.value || '';
    box.innerHTML = vars.map((v) => {
      const active = cur.includes(`{{${v.key}}}`);
      return `<button type="button" class="name-chip ${active ? 'active' : ''}" data-var="${v.key}">${active ? '✓ ' : '+ '}${escapeHTML(v.label)}</button>`;
    }).join('');
    box.querySelectorAll('.name-chip').forEach((b) => {
      b.addEventListener('click', () => UI.toggleChipVar(inputSel, chipsSel, vars, b.dataset.var));
    });
  },

  toggleChipVar(inputSel, chipsSel, vars, key) {
    const input = $(inputSel);
    if (!input) return;
    const token = `{{${key}}}`;
    let val = input.value;
    if (val.includes(token)) {
      val = val.replace(token, '');
      val = val.replace(/_{2,}/g, '_').replace(/^_+|_+$/g, '');
    } else {
      if (val && !/[_\-/ ]$/.test(val)) val += '_';
      val += token;
    }
    input.value = val;
    this.renderChipBuilder(chipsSel, inputSel, vars);
    Templates.refreshPreviews();
  },

  renderNameChips() {
    this.renderChipBuilder('#ord_nameChips', '#ord_name', ORDER_NAME_VARS);
  },

  renderLiNameChips() {
    this.renderChipBuilder('#li_nameChips', '#li_name', LINEITEM_NAME_VARS);
  },

  // ===== Order 类型（类型+目标+KPI+KPI值），每个类型 = 1 个 Order =====
  // 从右侧表单读取当前配置
  readComboForm() {
    const kpiNoTarget = $('#ord_kpiNoTarget')?.checked || false;
    return {
      goal: $('#ord_goal').value,
      kpiType: $('#ord_kpiType').value,
      kpiValue: kpiNoTarget ? '' : $('#ord_kpiValue').value.trim(),
      kpiNoTarget,
      amazonPromotion: $('#ord_amazonPromotion')?.checked || false,
      mediaTypes: $$('#ord_mediaTypes input:checked').map((c) => c.value),
      optimizationPriority: $('#ord_optimizationPriority').value,
      budgetAllocation: $('#ord_budgetAllocation').value,
    };
  },

  // 把某个类型的配置写入右侧表单
  loadComboToForm(combo) {
    $('#ord_amazonPromotion').checked = !!combo.amazonPromotion;
    $('#ord_mediaTypesWrap').style.display = combo.amazonPromotion ? 'none' : '';
    $$('#ord_mediaTypes input').forEach((c) => (c.checked = (combo.mediaTypes || []).includes(c.value)));
    $('#ord_goal').value = combo.goal || 'AWARENESS';
    // 重建 KPI 下拉（联动 goal），再回填选中值（无则默认首个）
    const candidates = GOAL_KPI_MAP[combo.goal] || [];
    $('#ord_kpiType').innerHTML = candidates.map((k) => `<option value="${k}">${k}</option>`).join('');
    const kpiVal = combo.kpiType && candidates.includes(combo.kpiType) ? combo.kpiType : (candidates[0] || '');
    $('#ord_kpiType').value = kpiVal;
    combo.kpiType = kpiVal;
    $('#ord_kpiNoTarget').checked = !!combo.kpiNoTarget;
    $('#ord_kpiValue').value = combo.kpiValue || '';
    $('#ord_optimizationPriority').value = combo.optimizationPriority || 'SPEND_FULL_BUDGET';
    $('#ord_budgetAllocation').value = combo.budgetAllocation || 'AUTO';
  },

  // 新增一个类型并选中
  addOrderCombo() {
    const combo = { goal: 'AWARENESS', kpiType: 'REACH', kpiValue: '{{kpiValue}}', kpiNoTarget: false, amazonPromotion: false, mediaTypes: ['DISPLAY'] };
    State.orderCombos.push(combo);
    State.activeComboIdx = State.orderCombos.length - 1;
    this.loadComboToForm(combo);
    this.renderOrderCombos();
    Templates.refreshPreviews();
    log('ok', `已添加类型 ${State.orderCombos.length}`);
  },

  // 确保至少有一个类型（默认创建一个并选中）
  ensureOrderCombo() {
    if (State.orderCombos.length === 0) {
      State.orderCombos.push({ goal: 'AWARENESS', kpiType: 'REACH', kpiValue: '{{kpiValue}}', kpiNoTarget: false, amazonPromotion: false, mediaTypes: ['DISPLAY'] });
    }
    if (State.activeComboIdx == null || State.activeComboIdx >= State.orderCombos.length) {
      State.activeComboIdx = 0;
    }
    this.loadComboToForm(State.orderCombos[State.activeComboIdx]);
  },

  // 选中某个类型进行编辑
  selectOrderCombo(idx) {
    if (idx < 0 || idx >= State.orderCombos.length) return;
    State.activeComboIdx = idx;
    this.loadComboToForm(State.orderCombos[idx]);
    this.renderOrderCombos();
    Templates.refreshPreviews();
  },

  // 表单改动 → 实时写回当前选中的类型
  commitComboForm() {
    const idx = State.activeComboIdx;
    if (idx == null || idx < 0 || idx >= State.orderCombos.length) return;
    State.orderCombos[idx] = this.readComboForm();
    this.renderOrderCombos();
    UI.updateSidebar();
  },

  deleteOrderCombo(idx) {
    // 至少保留一个类型，剩一个时不可删除
    if (State.orderCombos.length <= 1) {
      log('info', '至少需要保留一个类型，无法删除');
      return;
    }
    State.orderCombos.splice(idx, 1);
    State.activeComboIdx = Math.min(idx, State.orderCombos.length - 1);
    this.loadComboToForm(State.orderCombos[State.activeComboIdx]);
    this.renderOrderCombos();
    Templates.refreshPreviews();
    UI.updateSidebar();
  },

  comboLabel(c, i) {
    const parts = [ORDER_GOAL_LABELS[c.goal] || c.goal || '未设目标'];
    if (c.kpiType) parts.push(c.kpiType);
    return `类型 ${i + 1} · ${parts.join('/')}`;
  },

  renderOrderCombos() {
    const list = $('#ord_comboList');
    const detail = $('#ord_comboDetail');
    const empty = $('#ord_comboEmpty');
    const combos = State.orderCombos;
    const countEl = $('#ord_comboCount');
    if (countEl) countEl.textContent = `${combos.length} 个类型`;

    // 空态：隐藏右侧表单
    if (detail && empty) {
      const hasActive = State.activeComboIdx != null && combos.length > 0;
      detail.style.display = hasActive ? '' : 'none';
      empty.style.display = hasActive ? 'none' : '';
    }
    const titleEl = $('#ord_comboDetailTitle');
    if (titleEl && State.activeComboIdx != null) titleEl.textContent = `类型 ${State.activeComboIdx + 1}`;

    if (!list) return;
    const showDel = combos.length > 1;
    list.innerHTML = combos.map((c, i) => `
      <div class="combo-list-item ${i === State.activeComboIdx ? 'active' : ''}" data-idx="${i}">
        <span class="combo-list-name">${escapeHTML(this.comboLabel(c, i))}</span>
        ${showDel ? '<button type="button" class="combo-list-del" title="删除">×</button>' : ''}
      </div>
    `).join('');

    list.querySelectorAll('.combo-list-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('combo-list-del')) return;
        UI.selectOrderCombo(+el.dataset.idx);
      });
    });
    list.querySelectorAll('.combo-list-del').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.deleteOrderCombo(+e.target.closest('.combo-list-item').dataset.idx);
      });
    });
  },

  // ===== 投放（预算和投放），与类型叉乘生成 Order =====
  // 读取右侧表单中「未使用预算 / 高级设置」等公共字段（行数据单独维护在 f.rows）
  readFlightForm() {
    const f = State.flightCombos[State.activeFlightIdx] || {};
    return {
      rows: f.rows ? f.rows.map((r) => ({ ...r })) : [this.newFlightRow()],
      unusedBudget: $('input[name="ord_unusedBudget"]:checked')?.value || 'NO_CHANGE',
      budgetCapEnabled: $('#ord_budgetCapEnabled').checked,
      budgetCapType: $('#ord_budgetCapType').value,
      budgetCapAmount: $('#ord_budgetCapAmount').value,
      agencyFeeEnabled: $('#ord_agencyFeeEnabled').checked,
      agencyFeeType: $('#ord_agencyFeeType').value,
      agencyFeeValue: $('#ord_agencyFeeValue').value,
    };
  },

  loadFlightToForm(f) {
    this.renderFlightRows();
    $$('input[name="ord_unusedBudget"]').forEach((r) => (r.checked = r.value === (f.unusedBudget || 'NO_CHANGE')));
    $('#ord_budgetCapEnabled').checked = !!f.budgetCapEnabled;
    $('#ord_budgetCapFields').style.display = f.budgetCapEnabled ? '' : 'none';
    $('#ord_budgetCapType').value = f.budgetCapType || 'DAILY';
    $('#ord_budgetCapAmount').value = f.budgetCapAmount || '';
    $('#ord_agencyFeeEnabled').checked = !!f.agencyFeeEnabled;
    $('#ord_agencyFeeFields').style.display = f.agencyFeeEnabled ? '' : 'none';
    $('#ord_agencyFeeType').value = f.agencyFeeType || 'PERCENTAGE';
    $('#ord_agencyFeeValue').value = f.agencyFeeValue || '';
  },

  newFlightRow() {
    return { budget: '{{budget}}', name: '', start: '2026-07-01T00:00', end: '2026-09-30T23:59' };
  },

  newFlight() {
    return { rows: [this.newFlightRow()],
      unusedBudget: 'NO_CHANGE', budgetCapEnabled: false, budgetCapType: 'DAILY', budgetCapAmount: '',
      agencyFeeEnabled: false, agencyFeeType: 'PERCENTAGE', agencyFeeValue: '' };
  },

  // 渲染当前投放下的多条「预算+开始+结束+名称」广告活动行
  renderFlightRows() {
    const box = $('#ord_fl_rows');
    if (!box) return;
    const f = State.flightCombos[State.activeFlightIdx];
    if (!f) { box.innerHTML = ''; return; }
    if (!f.rows || !f.rows.length) f.rows = [this.newFlightRow()];
    const showDel = f.rows.length > 1;
    box.innerHTML = f.rows.map((r, i) => `
      <div class="flight-row" data-idx="${i}">
        <div class="field"><label>预算 $</label><input type="number" data-fl="budget" value="${escapeHTML(r.budget != null ? String(r.budget) : '')}" min="0" placeholder="输入预算" /></div>
        <div class="field"><label>投放名称（可选）</label><input data-fl="name" value="${escapeHTML(r.name || '')}" placeholder="投放名称" /></div>
        <div class="field"><label>开始</label><input type="datetime-local" data-fl="start" value="${escapeHTML(r.start || '')}" /></div>
        <div class="field"><label>结束</label><input type="datetime-local" data-fl="end" value="${escapeHTML(r.end || '')}" /></div>
        <button type="button" class="flight-del" title="删除" ${showDel ? '' : 'style="visibility:hidden"'}>×</button>
      </div>
    `).join('');

    box.querySelectorAll('.flight-row').forEach((row) => {
      const i = +row.dataset.idx;
      row.querySelectorAll('input').forEach((inp) => {
        inp.addEventListener('input', () => {
          f.rows[i][inp.dataset.fl] = inp.value;
          UI.renderFlights();
          UI.updateFlightTotal();
          Templates.refreshPreviews();
        });
      });
      row.querySelector('.flight-del')?.addEventListener('click', () => {
        if (f.rows.length <= 1) return;
        f.rows.splice(i, 1);
        UI.renderFlightRows();
        UI.renderFlights();
        UI.updateFlightTotal();
        Templates.refreshPreviews();
      });
    });
  },

  addFlightRow() {
    const f = State.flightCombos[State.activeFlightIdx];
    if (!f) return;
    if (!f.rows) f.rows = [];
    f.rows.push(this.newFlightRow());
    this.renderFlightRows();
    this.renderFlights();
    this.updateFlightTotal();
    Templates.refreshPreviews();
  },

  addFlight() {
    const f = this.newFlight();
    State.flightCombos.push(f);
    State.activeFlightIdx = State.flightCombos.length - 1;
    this.loadFlightToForm(f);
    this.renderFlights();
    this.updateFlightTotal();
    Templates.refreshPreviews();
    log('ok', `已添加投放 ${State.flightCombos.length}`);
  },

  ensureFlight() {
    if (State.flightCombos.length === 0) State.flightCombos.push(this.newFlight());
    if (State.activeFlightIdx == null || State.activeFlightIdx >= State.flightCombos.length) State.activeFlightIdx = 0;
    this.loadFlightToForm(State.flightCombos[State.activeFlightIdx]);
  },

  selectFlight(idx) {
    if (idx < 0 || idx >= State.flightCombos.length) return;
    State.activeFlightIdx = idx;
    this.loadFlightToForm(State.flightCombos[idx]);
    this.renderFlights();
    Templates.refreshPreviews();
  },

  // 写回右侧公共字段（行数据已实时写入 f.rows）
  commitFlightForm() {
    const idx = State.activeFlightIdx;
    if (idx == null || idx < 0 || idx >= State.flightCombos.length) return;
    State.flightCombos[idx] = this.readFlightForm();
    this.renderFlights();
    this.updateFlightTotal();
    UI.updateSidebar();
  },

  deleteFlight(idx) {
    if (State.flightCombos.length <= 1) { log('info', '至少需要保留一个投放，无法删除'); return; }
    State.flightCombos.splice(idx, 1);
    State.activeFlightIdx = Math.min(idx, State.flightCombos.length - 1);
    this.loadFlightToForm(State.flightCombos[State.activeFlightIdx]);
    this.renderFlights();
    this.updateFlightTotal();
    Templates.refreshPreviews();
    UI.updateSidebar();
  },

  // 单个投放的预算合计
  flightSum(f) {
    return (f.rows || []).reduce((s, r) => s + (parseFloat(r.budget) || 0), 0);
  },

  flightLabel(f, i) {
    return `投放 ${i + 1} · $${this.flightSum(f).toFixed(2)}`;
  },

  updateFlightTotal() {
    let total = 0, minStart = null, maxEnd = null;
    State.flightCombos.forEach((f) => {
      (f.rows || []).forEach((r) => {
        total += parseFloat(r.budget) || 0;
        if (r.start && (!minStart || r.start < minStart)) minStart = r.start;
        if (r.end && (!maxEnd || r.end > maxEnd)) maxEnd = r.end;
      });
    });
    const fmt = (d) => d ? new Date(d).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    const tEl = $('#ord_flightTotal'); if (tEl) tEl.textContent = total.toFixed(2);
    const rEl = $('#ord_flightRange'); if (rEl) rEl.textContent = minStart && maxEnd ? `${fmt(minStart)} 至 ${fmt(maxEnd)}` : '添加投放后显示时间范围';
  },

  renderFlights() {
    const list = $('#ord_flightList');
    const detail = $('#ord_flightDetail');
    const empty = $('#ord_flightEmpty');
    const flights = State.flightCombos;
    const countEl = $('#ord_flightCount');
    if (countEl) countEl.textContent = `${flights.length} 个投放`;

    if (detail && empty) {
      const hasActive = State.activeFlightIdx != null && flights.length > 0;
      detail.style.display = hasActive ? '' : 'none';
      empty.style.display = hasActive ? 'none' : '';
    }
    const titleEl = $('#ord_flightDetailTitle');
    if (titleEl && State.activeFlightIdx != null) titleEl.textContent = `投放 ${State.activeFlightIdx + 1}`;

    if (!list) return;
    const showDel = flights.length > 1;
    list.innerHTML = flights.map((f, i) => `
      <div class="combo-list-item ${i === State.activeFlightIdx ? 'active' : ''}" data-idx="${i}">
        <span class="combo-list-name">${escapeHTML(this.flightLabel(f, i))}</span>
        ${showDel ? '<button type="button" class="combo-list-del" title="删除">×</button>' : ''}
      </div>
    `).join('');

    list.querySelectorAll('.combo-list-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('combo-list-del')) return;
        UI.selectFlight(+el.dataset.idx);
      });
    });
    list.querySelectorAll('.combo-list-del').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.deleteFlight(+e.target.closest('.combo-list-item').dataset.idx);
      });
    });
  },

  // ===== 媒体类型（LineItem 配置），与 Order 叉乘各生成一个 LineItem =====
  newMedia() {
    return { mediaType: 'DISPLAY', devices: ['DESKTOP', 'MOBILE'], mobileEnv: ['WEB', 'APP'],
      streamingPlan: 'ALL_CONTENT', doohLocation: 'SOLD_IN_STORE' };
  },

  // 读取右侧媒体类型表单
  readMediaForm() {
    return {
      mediaType: $('#li_mediaType').value,
      devices: $$('#li_media_devices input:checked').map((c) => c.value),
      mobileEnv: $$('#li_media_mobileEnv input:checked').map((c) => c.value),
      streamingPlan: $('#li_media_streamingPlan').value,
      doohLocation: $('#li_media_doohLocation').value,
    };
  },

  // 把媒体类型写入右侧表单 + 切换分支显隐
  loadMediaToForm(m) {
    $('#li_mediaType').value = m.mediaType || 'DISPLAY';
    $$('#li_media_devices input').forEach((c) => (c.checked = (m.devices || []).includes(c.value)));
    $$('#li_media_mobileEnv input').forEach((c) => (c.checked = (m.mobileEnv || []).includes(c.value)));
    $('#li_media_streamingPlan').value = m.streamingPlan || 'ALL_CONTENT';
    $('#li_media_doohLocation').value = m.doohLocation || 'SOLD_IN_STORE';
    this.refreshMediaBranch();
  },

  // 根据当前媒体类型显示对应分支
  refreshMediaBranch() {
    const t = $('#li_mediaType').value;
    $('#li_branch_DISPLAY').style.display = t === 'DISPLAY' ? '' : 'none';
    $('#li_branch_DISPLAY_mobileEnv').style.display = t === 'DISPLAY' ? '' : 'none';
    $('#li_branch_STREAMING_TV').style.display = t === 'STREAMING_TV' ? '' : 'none';
    $('#li_branch_DIGITAL_OUT_OF_HOME').style.display = t === 'DIGITAL_OUT_OF_HOME' ? '' : 'none';
  },

  addMedia() {
    const m = this.newMedia();
    State.mediaCombos.push(m);
    State.activeMediaIdx = State.mediaCombos.length - 1;
    this.loadMediaToForm(m);
    this.renderMediaList();
    Templates.refreshPreviews();
    log('ok', `已添加媒体类型 ${State.mediaCombos.length}`);
  },

  ensureMedia() {
    if (State.mediaCombos.length === 0) State.mediaCombos.push(this.newMedia());
    if (State.activeMediaIdx == null || State.activeMediaIdx >= State.mediaCombos.length) State.activeMediaIdx = 0;
    this.loadMediaToForm(State.mediaCombos[State.activeMediaIdx]);
  },

  selectMedia(idx) {
    if (idx < 0 || idx >= State.mediaCombos.length) return;
    State.activeMediaIdx = idx;
    this.loadMediaToForm(State.mediaCombos[idx]);
    this.renderMediaList();
    Templates.refreshPreviews();
  },

  commitMediaForm() {
    const idx = State.activeMediaIdx;
    if (idx == null || idx < 0 || idx >= State.mediaCombos.length) return;
    State.mediaCombos[idx] = this.readMediaForm();
    this.renderMediaList();
    UI.updateSidebar();
  },

  deleteMedia(idx) {
    if (State.mediaCombos.length <= 1) { log('info', '至少需要保留一个媒体类型，无法删除'); return; }
    State.mediaCombos.splice(idx, 1);
    State.activeMediaIdx = Math.min(idx, State.mediaCombos.length - 1);
    this.loadMediaToForm(State.mediaCombos[State.activeMediaIdx]);
    this.renderMediaList();
    Templates.refreshPreviews();
    UI.updateSidebar();
  },

  mediaLabel(m, i) {
    const MT = { DISPLAY: '展示', STREAMING_TV: '流媒体电视', ONLINE_VIDEO: '在线视频', AUDIO: '音频', DIGITAL_OUT_OF_HOME: '数字户外' };
    return `媒体类型 ${i + 1} · ${MT[m.mediaType] || m.mediaType}`;
  },

  renderMediaList() {
    const list = $('#li_mediaList');
    const detail = $('#li_mediaDetail');
    const empty = $('#li_mediaEmpty');
    const medias = State.mediaCombos;
    const countEl = $('#li_mediaCount');
    if (countEl) countEl.textContent = `${medias.length} 个媒体类型`;

    if (detail && empty) {
      const hasActive = State.activeMediaIdx != null && medias.length > 0;
      detail.style.display = hasActive ? '' : 'none';
      empty.style.display = hasActive ? 'none' : '';
    }
    const titleEl = $('#li_mediaDetailTitle');
    if (titleEl && State.activeMediaIdx != null) titleEl.textContent = `媒体类型 ${State.activeMediaIdx + 1}`;

    if (!list) return;
    const showDel = medias.length > 1;
    list.innerHTML = medias.map((m, i) => `
      <div class="combo-list-item ${i === State.activeMediaIdx ? 'active' : ''}" data-idx="${i}">
        <span class="combo-list-name">${escapeHTML(this.mediaLabel(m, i))}</span>
        ${showDel ? '<button type="button" class="combo-list-del" title="删除">×</button>' : ''}
      </div>
    `).join('');

    list.querySelectorAll('.combo-list-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('combo-list-del')) return;
        UI.selectMedia(+el.dataset.idx);
      });
    });
    list.querySelectorAll('.combo-list-del').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.deleteMedia(+e.target.closest('.combo-list-item').dataset.idx);
      });
    });
  },

  // ===== 产品和服务类别（两级树形，可展开 + 多选）=====
  renderProductCategories(filter) {
    const box = $('#li_productCategories');
    if (!box) return;
    const q = (filter || '').trim().toLowerCase();

    let html = '';
    PRODUCT_CATEGORIES.forEach((cat) => {
      // 过滤：匹配大类名 或 任一子类名
      const childMatches = cat.children.filter((ch) => !q || ch.toLowerCase().includes(q) || cat.name.toLowerCase().includes(q));
      const catMatches = !q || cat.name.toLowerCase().includes(q) || childMatches.length > 0;
      if (!catMatches) return;

      // 搜索时自动展开命中的大类
      const expanded = State.expandedCategories.includes(cat.name) || (q && childMatches.length > 0);
      const selectedCount = cat.children.filter((ch) => State.productCategories.includes(`${cat.name} / ${ch}`)).length;

      html += `
        <div class="cat-group">
          <div class="cat-parent ${expanded ? 'open' : ''}" data-cat="${escapeHTML(cat.name)}">
            <span class="cat-caret">${expanded ? '⌄' : '›'}</span>
            <input type="checkbox" class="cat-parent-check" data-cat="${escapeHTML(cat.name)}"
              ${selectedCount === cat.children.length ? 'checked' : ''} />
            <span class="cat-parent-name">${escapeHTML(cat.name)}</span>
            ${selectedCount ? `<span class="cat-count">${selectedCount} selected</span>` : ''}
          </div>`;
      if (expanded) {
        const children = q ? childMatches : cat.children;
        html += '<div class="cat-children">';
        children.forEach((ch) => {
          const key = `${cat.name} / ${ch}`;
          const on = State.productCategories.includes(key);
          html += `<label class="cat-child"><input type="checkbox" data-key="${escapeHTML(key)}" ${on ? 'checked' : ''} />${escapeHTML(ch)}</label>`;
        });
        html += '</div>';
      }
      html += '</div>';
    });
    box.innerHTML = html || '<div class="category-empty">无匹配类别</div>';

    // 大类复选框半选态（部分子类选中）
    box.querySelectorAll('.cat-parent-check').forEach((cb) => {
      const cat = PRODUCT_CATEGORIES.find((c) => c.name === cb.dataset.cat);
      if (!cat) return;
      const sel = cat.children.filter((ch) => State.productCategories.includes(`${cat.name} / ${ch}`)).length;
      cb.indeterminate = sel > 0 && sel < cat.children.length;
    });

    // 展开/收起大类（点击行，但点复选框时不触发）
    box.querySelectorAll('.cat-parent').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('cat-parent-check')) return;
        const name = el.dataset.cat;
        if (State.expandedCategories.includes(name)) {
          State.expandedCategories = State.expandedCategories.filter((n) => n !== name);
        } else {
          State.expandedCategories.push(name);
        }
        UI.commitProductForm();
        UI.renderProductCategories($('#li_productSearch')?.value);
      });
    });
    // 勾选大类 → 选中/取消该大类下全部子类
    box.querySelectorAll('.cat-parent-check').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        const cat = PRODUCT_CATEGORIES.find((c) => c.name === cb.dataset.cat);
        if (!cat) return;
        const keys = cat.children.map((ch) => `${cat.name} / ${ch}`);
        if (cb.checked) {
          keys.forEach((k) => { if (!State.productCategories.includes(k)) State.productCategories.push(k); });
        } else {
          State.productCategories = State.productCategories.filter((v) => !keys.includes(v));
        }
        UI.commitProductForm();
        UI.renderProductCategories($('#li_productSearch')?.value);
        Templates.refreshPreviews();
      });
    });
    // 勾选子类
    box.querySelectorAll('.cat-child input').forEach((cb) => {
      cb.addEventListener('change', () => {
        const key = cb.dataset.key;
        if (cb.checked) {
          if (!State.productCategories.includes(key)) State.productCategories.push(key);
        } else {
          State.productCategories = State.productCategories.filter((v) => v !== key);
        }
        UI.commitProductForm();
        UI.renderProductCategories($('#li_productSearch')?.value);
        Templates.refreshPreviews();
      });
    });
    this.updateProductSelected();
  },

  updateProductSelected() {
    const el = $('#li_productSelected');
    if (!el) return;
    const n = State.productCategories.length;
    el.textContent = n ? `已选 ${n} 个类别：${State.productCategories.join('、')}` : '未选择任何类别';
  },

  // ===== 产品和服务组（批量配置）=====
  newProduct() {
    return { categories: [], expanded: [] };
  },

  addProduct() {
    State.productCombos.push(this.newProduct());
    State.activeProductIdx = State.productCombos.length - 1;
    this.loadProductToForm();
    this.renderProductList();
    Templates.refreshPreviews();
    log('ok', `已添加产品和服务组 ${State.productCombos.length}`);
  },

  ensureProduct() {
    if (State.productCombos.length === 0) State.productCombos.push(this.newProduct());
    if (State.activeProductIdx == null || State.activeProductIdx >= State.productCombos.length) State.activeProductIdx = 0;
    this.loadProductToForm();
  },

  selectProduct(idx) {
    if (idx < 0 || idx >= State.productCombos.length) return;
    State.activeProductIdx = idx;
    this.loadProductToForm();
    this.renderProductList();
    Templates.refreshPreviews();
  },

  // 把当前组的类别载入编辑缓冲并渲染
  loadProductToForm() {
    const p = State.productCombos[State.activeProductIdx] || this.newProduct();
    State.productCategories = [...(p.categories || [])];
    State.expandedCategories = [...(p.expanded || [])];
    this.renderProductCategories($('#li_productSearch')?.value);
  },

  // 编辑缓冲写回当前组
  commitProductForm() {
    const idx = State.activeProductIdx;
    if (idx == null || idx < 0 || idx >= State.productCombos.length) return;
    State.productCombos[idx] = {
      categories: [...State.productCategories],
      expanded: [...State.expandedCategories],
    };
    this.renderProductList();
    UI.updateSidebar();
  },

  deleteProduct(idx) {
    if (State.productCombos.length <= 1) { log('info', '至少需要保留一组产品和服务，无法删除'); return; }
    State.productCombos.splice(idx, 1);
    State.activeProductIdx = Math.min(idx, State.productCombos.length - 1);
    this.loadProductToForm();
    this.renderProductList();
    Templates.refreshPreviews();
    UI.updateSidebar();
  },

  productLabel(p, i) {
    const n = (p.categories || []).length;
    return `产品和服务 ${i + 1} · ${n ? n + ' 类别' : '未选'}`;
  },

  renderProductList() {
    const list = $('#li_productList');
    const detail = $('#li_productDetail');
    const empty = $('#li_productEmpty');
    const combos = State.productCombos;
    const countEl = $('#li_productCount');
    if (countEl) countEl.textContent = `${combos.length} 组`;

    if (detail && empty) {
      const hasActive = State.activeProductIdx != null && combos.length > 0;
      detail.style.display = hasActive ? '' : 'none';
      empty.style.display = hasActive ? 'none' : '';
    }
    const titleEl = $('#li_productDetailTitle');
    if (titleEl && State.activeProductIdx != null) titleEl.textContent = `产品和服务 ${State.activeProductIdx + 1}`;

    if (!list) return;
    const showDel = combos.length > 1;
    list.innerHTML = combos.map((p, i) => `
      <div class="combo-list-item ${i === State.activeProductIdx ? 'active' : ''}" data-idx="${i}">
        <span class="combo-list-name">${escapeHTML(this.productLabel(p, i))}</span>
        ${showDel ? '<button type="button" class="combo-list-del" title="删除">×</button>' : ''}
      </div>
    `).join('');

    list.querySelectorAll('.combo-list-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('combo-list-del')) return;
        UI.selectProduct(+el.dataset.idx);
      });
    });
    list.querySelectorAll('.combo-list-del').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.deleteProduct(+e.target.closest('.combo-list-item').dataset.idx);
      });
    });
  },

  // ===== 库存组（批量配置）=====
  newInventory() {
    return { type: 'ALL_PUBLISHERS', publishers: [], pubExpanded: [], deals: [], groups: [] };
  },

  addInventory() {
    State.inventoryCombos.push(this.newInventory());
    State.activeInvIdx = State.inventoryCombos.length - 1;
    this.loadInventoryToForm();
    this.renderInventoryList();
    Templates.refreshPreviews();
    log('ok', `已添加库存组 ${State.inventoryCombos.length}`);
  },

  ensureInventory() {
    if (State.inventoryCombos.length === 0) State.inventoryCombos.push(this.newInventory());
    if (State.activeInvIdx == null || State.activeInvIdx >= State.inventoryCombos.length) State.activeInvIdx = 0;
    this.loadInventoryToForm();
  },

  selectInventory(idx) {
    if (idx < 0 || idx >= State.inventoryCombos.length) return;
    State.activeInvIdx = idx;
    this.loadInventoryToForm();
    this.renderInventoryList();
    Templates.refreshPreviews();
  },

  curInventory() {
    return State.inventoryCombos[State.activeInvIdx] || null;
  },

  // 载入当前库存组到右侧表单
  loadInventoryToForm() {
    const inv = this.curInventory() || this.newInventory();
    $$('input[name="li_inv_type"]').forEach((r) => (r.checked = r.value === (inv.type || 'ALL_PUBLISHERS')));
    $('#li_inv_manualWrap').style.display = inv.type === 'MANUAL_PUBLISHERS' ? '' : 'none';
    this.renderInvPublishers($('#li_inv_pubSearch')?.value);
    this.renderInvDeals($('#li_inv_dealSearch')?.value);
    this.renderInvGroups($('#li_inv_groupSearch')?.value);
  },

  commitInventoryForm() {
    this.renderInventoryList();
    UI.updateSidebar();
  },

  deleteInventory(idx) {
    if (State.inventoryCombos.length <= 1) { log('info', '至少需要保留一组库存配置，无法删除'); return; }
    State.inventoryCombos.splice(idx, 1);
    State.activeInvIdx = Math.min(idx, State.inventoryCombos.length - 1);
    this.loadInventoryToForm();
    this.renderInventoryList();
    Templates.refreshPreviews();
    UI.updateSidebar();
  },

  invLabel(inv, i) {
    if (inv.type === 'ALL_PUBLISHERS') return `库存 ${i + 1} · 所有出版商`;
    const n = (inv.publishers || []).length + (inv.deals || []).length + (inv.groups || []).length;
    return `库存 ${i + 1} · 手动 ${n} 项`;
  },

  renderInventoryList() {
    const list = $('#li_invList');
    const detail = $('#li_invDetail');
    const empty = $('#li_invEmpty');
    const combos = State.inventoryCombos;
    const countEl = $('#li_invCount');
    if (countEl) countEl.textContent = `${combos.length} 组`;

    if (detail && empty) {
      const hasActive = State.activeInvIdx != null && combos.length > 0;
      detail.style.display = hasActive ? '' : 'none';
      empty.style.display = hasActive ? 'none' : '';
    }
    const titleEl = $('#li_invDetailTitle');
    if (titleEl && State.activeInvIdx != null) titleEl.textContent = `库存 ${State.activeInvIdx + 1}`;

    if (!list) return;
    const showDel = combos.length > 1;
    list.innerHTML = combos.map((inv, i) => `
      <div class="combo-list-item ${i === State.activeInvIdx ? 'active' : ''}" data-idx="${i}">
        <span class="combo-list-name">${escapeHTML(this.invLabel(inv, i))}</span>
        ${showDel ? '<button type="button" class="combo-list-del" title="删除">×</button>' : ''}
      </div>
    `).join('');

    list.querySelectorAll('.combo-list-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('combo-list-del')) return;
        UI.selectInventory(+el.dataset.idx);
      });
    });
    list.querySelectorAll('.combo-list-del').forEach((b) => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.deleteInventory(+e.target.closest('.combo-list-item').dataset.idx);
      });
    });
  },

  // 手动出版商树（两级，大类可全选）
  renderInvPublishers(filter) {
    const box = $('#li_inv_publishers');
    const inv = this.curInventory();
    if (!box || !inv) return;
    const q = (filter || '').trim().toLowerCase();
    let html = '';
    INVENTORY_PUBLISHERS.forEach((grp) => {
      const childMatches = grp.children.filter((ch) => !q || ch.toLowerCase().includes(q) || grp.name.toLowerCase().includes(q));
      if (q && childMatches.length === 0 && !grp.name.toLowerCase().includes(q)) return;
      const expanded = inv.pubExpanded.includes(grp.name) || (q && childMatches.length > 0);
      const sel = grp.children.filter((ch) => inv.publishers.includes(`${grp.name} / ${ch}`)).length;
      html += `
        <div class="cat-group">
          <div class="cat-parent ${expanded ? 'open' : ''}" data-grp="${escapeHTML(grp.name)}">
            <span class="cat-caret">${expanded ? '⌄' : '›'}</span>
            <input type="checkbox" class="inv-pub-parent" data-grp="${escapeHTML(grp.name)}" ${sel === grp.children.length ? 'checked' : ''} />
            <span class="cat-parent-name">${escapeHTML(grp.name)}</span>
            ${sel ? `<span class="cat-count">${sel} selected</span>` : ''}
          </div>`;
      if (expanded) {
        const children = q ? childMatches : grp.children;
        html += '<div class="cat-children">';
        children.forEach((ch) => {
          const key = `${grp.name} / ${ch}`;
          html += `<label class="cat-child"><input type="checkbox" class="inv-pub-child" data-key="${escapeHTML(key)}" ${inv.publishers.includes(key) ? 'checked' : ''} />${escapeHTML(ch)}</label>`;
        });
        html += '</div>';
      }
      html += '</div>';
    });
    box.innerHTML = html || '<div class="category-empty">无匹配出版商</div>';

    box.querySelectorAll('.inv-pub-parent').forEach((cb) => {
      const grp = INVENTORY_PUBLISHERS.find((g) => g.name === cb.dataset.grp);
      const sel = grp.children.filter((ch) => inv.publishers.includes(`${grp.name} / ${ch}`)).length;
      cb.indeterminate = sel > 0 && sel < grp.children.length;
    });
    box.querySelectorAll('.cat-parent').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('inv-pub-parent')) return;
        const name = el.dataset.grp;
        inv.pubExpanded = inv.pubExpanded.includes(name) ? inv.pubExpanded.filter((n) => n !== name) : [...inv.pubExpanded, name];
        UI.renderInvPublishers($('#li_inv_pubSearch')?.value);
      });
    });
    box.querySelectorAll('.inv-pub-parent').forEach((cb) => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        const grp = INVENTORY_PUBLISHERS.find((g) => g.name === cb.dataset.grp);
        const keys = grp.children.map((ch) => `${grp.name} / ${ch}`);
        if (cb.checked) keys.forEach((k) => { if (!inv.publishers.includes(k)) inv.publishers.push(k); });
        else inv.publishers = inv.publishers.filter((v) => !keys.includes(v));
        UI.afterInvChange();
      });
    });
    box.querySelectorAll('.inv-pub-child').forEach((cb) => {
      cb.addEventListener('change', () => {
        const key = cb.dataset.key;
        if (cb.checked) { if (!inv.publishers.includes(key)) inv.publishers.push(key); }
        else inv.publishers = inv.publishers.filter((v) => v !== key);
        UI.afterInvChange();
      });
    });
    const cnt = $('#li_inv_pubCount');
    if (cnt) cnt.textContent = inv.publishers.length ? `已选 ${inv.publishers.length}` : '';
  },

  // 交易列表（添加/移除）
  renderInvDeals(filter) {
    const box = $('#li_inv_deals');
    const inv = this.curInventory();
    if (!box || !inv) return;
    const q = (filter || '').trim().toLowerCase();
    const list = INVENTORY_DEALS.filter((d) => !q || d.name.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
    box.innerHTML = list.map((d) => {
      const on = inv.deals.includes(d.id);
      return `
        <div class="inv-row ${on ? 'on' : ''}" data-id="${escapeHTML(d.id)}">
          <button type="button" class="inv-row-btn">${on ? '已添加' : '添加'}</button>
          <div class="inv-row-main"><div class="inv-row-name">${escapeHTML(d.name)}</div><div class="inv-row-sub">${escapeHTML(d.id)} · ${escapeHTML(d.type)} · 可用量 ${escapeHTML(d.avail)}</div></div>
        </div>`;
    }).join('') || '<div class="category-empty">无匹配交易</div>';
    box.querySelectorAll('.inv-row .inv-row-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.closest('.inv-row').dataset.id;
        if (inv.deals.includes(id)) inv.deals = inv.deals.filter((v) => v !== id);
        else inv.deals.push(id);
        UI.renderInvDeals($('#li_inv_dealSearch')?.value);
        UI.afterInvChange();
      });
    });
    const cnt = $('#li_inv_dealCount');
    if (cnt) cnt.textContent = inv.deals.length ? `已选 ${inv.deals.length}` : '无';
  },

  // 库存组列表（添加/移除）
  renderInvGroups(filter) {
    const box = $('#li_inv_groups');
    const inv = this.curInventory();
    if (!box || !inv) return;
    const q = (filter || '').trim().toLowerCase();
    const list = INVENTORY_GROUPS.filter((g) => !q || g.name.toLowerCase().includes(q) || g.id.toLowerCase().includes(q));
    box.innerHTML = list.map((g) => {
      const on = inv.groups.includes(g.id);
      return `
        <div class="inv-row ${on ? 'on' : ''}" data-id="${escapeHTML(g.id)}">
          <button type="button" class="inv-row-btn">${on ? '已添加' : '添加'}</button>
          <div class="inv-row-main"><div class="inv-row-name">${escapeHTML(g.name)} ${g.curated ? '<span class="inv-tag">Amazon Curated</span>' : ''}</div><div class="inv-row-sub">${escapeHTML(g.id)}</div></div>
        </div>`;
    }).join('') || '<div class="category-empty">无匹配库存组</div>';
    box.querySelectorAll('.inv-row .inv-row-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.closest('.inv-row').dataset.id;
        if (inv.groups.includes(id)) inv.groups = inv.groups.filter((v) => v !== id);
        else inv.groups.push(id);
        UI.renderInvGroups($('#li_inv_groupSearch')?.value);
        UI.afterInvChange();
      });
    });
    const cnt = $('#li_inv_groupCount');
    if (cnt) cnt.textContent = inv.groups.length ? `已选 ${inv.groups.length}` : '无';
  },

  afterInvChange() {
    this.renderInventoryList();
    Templates.refreshPreviews();
    UI.updateSidebar();
  },

  // ===== 定向策略（按需添加 + 勾选才展示）=====
  // 首次进入步骤3 时，默认启用一组常用维度
  ensureTargetingDefaults() {
    if (State._targetingInited) return;
    State._targetingInited = true;
    const defaults = ['products', 'inMarket', 'keywords', 'audience', 'location', 'domains', 'devices', 'mobileApps', 'brandSuitability'];
    defaults.forEach((key) => {
      if (!State.targetingEnabled.includes(key)) State.targetingEnabled.push(key);
      const dim = TARGETING_DIMS.find((d) => d.key === key);
      if (dim && State.targetingValues[key] == null) {
        State.targetingValues[key] = dim.def != null ? (Array.isArray(dim.def) ? [...dim.def] : dim.def) : (dim.type === 'checks' ? [] : '');
      }
    });
  },

  renderTargetingMenu() {
    const menu = $('#targetingAddMenu');
    if (!menu) return;
    const groups = {};
    TARGETING_DIMS.forEach((d) => { (groups[d.group] = groups[d.group] || []).push(d); });
    let html = `<div class="targeting-add-search"><input id="targetingAddSearch" placeholder="搜索投放…" /></div>`;
    Object.keys(groups).forEach((g) => {
      html += `<div class="targeting-add-group">${escapeHTML(g)}</div>`;
      groups[g].forEach((d) => {
        const on = State.targetingEnabled.includes(d.key);
        html += `<label class="targeting-add-item" data-key="${d.key}"><input type="checkbox" ${on ? 'checked' : ''} />${escapeHTML(d.label)}</label>`;
      });
    });
    menu.innerHTML = html;
    menu.querySelectorAll('.targeting-add-item input').forEach((cb) => {
      cb.addEventListener('change', () => {
        const key = cb.closest('.targeting-add-item').dataset.key;
        UI.toggleTargetingDim(key, cb.checked);
      });
    });
    $('#targetingAddSearch')?.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      menu.querySelectorAll('.targeting-add-item').forEach((el) => {
        const dim = TARGETING_DIMS.find((d) => d.key === el.dataset.key);
        const match = !q || dim.label.toLowerCase().includes(q) || dim.group.toLowerCase().includes(q);
        el.style.display = match ? '' : 'none';
      });
      menu.querySelectorAll('.targeting-add-group').forEach((g) => {
        const groupName = g.textContent;
        const anyVisible = Array.from(menu.querySelectorAll(`.targeting-add-item`)).some((el) => {
          const dim = TARGETING_DIMS.find((d) => d.key === el.dataset.key);
          return dim.group === groupName && el.style.display !== 'none';
        });
        g.style.display = anyVisible ? '' : 'none';
      });
    });
  },

  toggleTargetingDim(key, on) {
    if (on) {
      if (!State.targetingEnabled.includes(key)) {
        State.targetingEnabled.push(key);
        const dim = TARGETING_DIMS.find((d) => d.key === key);
        if (dim && State.targetingValues[key] == null) {
          State.targetingValues[key] = dim.def != null ? (Array.isArray(dim.def) ? [...dim.def] : dim.def) : (dim.type === 'checks' ? [] : '');
        }
      }
    } else {
      State.targetingEnabled = State.targetingEnabled.filter((k) => k !== key);
    }
    this.renderTargetingRows();
    Templates.refreshPreviews();
  },

  renderTargetingRows() {
    const box = $('#li_targetingRows');
    const empty = $('#li_targetingEmpty');
    if (!box) return;
    if (!State.targetingEnabled.length) {
      box.innerHTML = '';
      if (empty) empty.style.display = '';
      return;
    }
    if (empty) empty.style.display = 'none';

    // 按定义顺序展示已启用的维度
    const enabled = TARGETING_DIMS.filter((d) => State.targetingEnabled.includes(d.key));
    box.innerHTML = enabled.map((d) => {
      let body = '';
      const v = State.targetingValues[d.key];
      if (d.type === 'field') {
        body = `<input data-tg-key="${d.key}" type="text" value="${escapeHTML(v == null ? '' : String(v))}" placeholder="${escapeHTML(d.placeholder || '')}" />`;
      } else if (d.type === 'select') {
        body = `<select data-tg-key="${d.key}">${d.options.map(([val, lbl]) => `<option value="${val}" ${v === val ? 'selected' : ''}>${escapeHTML(lbl)}</option>`).join('')}</select>`;
      } else if (d.type === 'checks') {
        const arr = Array.isArray(v) ? v : [];
        body = `<div class="checks">${d.options.map(([val, lbl]) => `<label><input type="checkbox" data-tg-key="${d.key}" value="${val}" ${arr.includes(val) ? 'checked' : ''} />${escapeHTML(lbl)}</label>`).join('')}</div>`;
      }
      return `
        <div class="targeting-row" data-key="${d.key}">
          <div class="targeting-row-label">${escapeHTML(d.label)}</div>
          <div class="targeting-row-body">${body}${d.note ? `<div class="targeting-row-note">⚠ ${escapeHTML(d.note)}</div>` : ''}</div>
          <button type="button" class="targeting-row-del" title="移除">删除</button>
        </div>`;
    }).join('');

    // 文本/下拉
    box.querySelectorAll('input[data-tg-key][type="text"], select[data-tg-key]').forEach((el) => {
      el.addEventListener('input', () => { State.targetingValues[el.dataset.tgKey] = el.value; Templates.refreshPreviews(); });
      el.addEventListener('change', () => { State.targetingValues[el.dataset.tgKey] = el.value; Templates.refreshPreviews(); });
    });
    // 多选
    box.querySelectorAll('input[type="checkbox"][data-tg-key]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const key = cb.dataset.tgKey;
        const cur = Array.isArray(State.targetingValues[key]) ? State.targetingValues[key] : [];
        if (cb.checked) { if (!cur.includes(cb.value)) cur.push(cb.value); }
        else { State.targetingValues[key] = cur.filter((v) => v !== cb.value); return Templates.refreshPreviews(); }
        State.targetingValues[key] = cur;
        Templates.refreshPreviews();
      });
    });
    // 移除维度
    box.querySelectorAll('.targeting-row-del').forEach((b) => {
      b.addEventListener('click', () => {
        const key = b.closest('.targeting-row').dataset.key;
        UI.toggleTargetingDim(key, false);
        UI.renderTargetingMenu();
      });
    });
  },

  addVariantRow(layer, n = 1) {
    const def = VARIANT_DEFS[layer];
    const rows = State[def.stateKey];
    for (let k = 0; k < n; k++) {
      const empty = {};
      def.cols.forEach((c) => (empty[c] = ''));
      rows.push(empty);
    }
    UI.renderVariantTable(layer);
    if (n > 1) log('info', `${def.name}新增 ${n} 个空行`);
  },

  // 步骤5：组合预览（叉乘汇总 + 树状展开）
  renderCombinationPreview() {
    const box = $('#comboPreview');
    if (!box) return;
    const typeList = State.orderCombos.length ? State.orderCombos : [{}];
    const flightList = State.flightCombos.length ? State.flightCombos : [{}];
    const orderVarsList = [];
    typeList.forEach((tv) => flightList.forEach((fv) => orderVarsList.push({ ...tv, _flight: fv })));
    const mediaList = State.mediaCombos.length ? State.mediaCombos : [];
    const productList = State.productCombos.length ? State.productCombos : [{ categories: [] }];
    const inventoryList = State.inventoryCombos.length ? State.inventoryCombos : [{ type: 'ALL_PUBLISHERS' }];
    const MT = { DISPLAY: '展示', STREAMING_TV: '流媒体电视', ONLINE_VIDEO: '在线视频', AUDIO: '音频', DIGITAL_OUT_OF_HOME: '数字户外' };
    const O = State.orderMode === 'EXISTING' ? 1 : orderVarsList.length;
    const L = mediaList.length * productList.length * inventoryList.length;
    const C = State.creativeRows.length;
    const liTotal = O * L;
    const attachTotal = liTotal * C;

    const isOrdersOnly = State.entryMode === 'orders';
    const isLineItemsExisting = State.entryMode === 'lineitems' && State.orderMode === 'EXISTING';

    const summary = isOrdersOnly
      ? `<div class="combo-summary">
           <div class="combo-stat primary"><div class="combo-num">${O}</div><div class="combo-lbl">Order 总数</div></div>
         </div>`
      : `<div class="combo-summary">
           <div class="combo-stat"><div class="combo-num">${State.orderMode === 'EXISTING' ? '沿用' : O}</div><div class="combo-lbl">Order${State.orderMode === 'EXISTING' ? '（已有）' : ''}</div></div>
           <div class="combo-stat primary"><div class="combo-num">${liTotal}</div><div class="combo-lbl">LineItem 总数</div></div>
         </div>`;

    // 表格预览（一行 = 一个 Order × LineItem 组合）
    const liCombos = [];
    mediaList.forEach((mv) => productList.forEach((pv) => inventoryList.forEach((iv) => liCombos.push({ mv, pv, iv }))));

    const orderRowsList = State.orderMode === 'EXISTING'
      ? [{
          name: State.selectedExistingOrder ? `（沿用）${State.selectedExistingOrder.name || State.selectedExistingOrder.orderId}` : '（沿用已有订单）',
          goal: '', kpiType: '', budget: '',
          _flight: null, _ov: {},
        }]
      : orderVarsList.map((ov, oi) => ({
          name: Templates.orderName(ov, ov._flight) || `Order ${oi + 1}`,
          goal: ov.goal ? (ORDER_GOAL_LABELS[ov.goal] || ov.goal) : '',
          kpiType: ov.kpiType || '',
          budget: ov._flight ? UI.flightSum(ov._flight).toFixed(2) : '',
          _flight: ov._flight, _ov: ov,
        }));

    // 行数据
    const MAX_ROWS = 100;
    const rows = [];
    orderRowsList.forEach((or) => {
      liCombos.forEach((c) => {
        rows.push({
          orderName: or.name,
          goal: or.goal,
          kpi: or.kpiType,
          budget: or.budget,
          liName: Templates.lineItemName({ mediaType: c.mv.mediaType }, c.mv, c.pv) || '',
          mediaType: MT[c.mv.mediaType] || c.mv.mediaType || '—',
          products: (c.pv.categories || []).length,
          inventory: c.iv.type === 'ALL_PUBLISHERS' ? '所有出版商' : `手动 ${(c.iv.publishers || []).length + (c.iv.deals || []).length + (c.iv.groups || []).length} 项`,
          creative: C,
        });
      });
    });
    const showRows = rows.slice(0, MAX_ROWS);

    let tree = '';
    if (isOrdersOnly) {
      // 仅创建订单：只展示 Order 列表
      if (!orderRowsList.length) {
        tree = '<div class="combo-empty-table">请先添加 Order 配置。</div>';
      } else {
        tree = `
          <div class="combo-table-wrap">
            <table class="combo-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Order 名称</th>
                  <th>目标</th>
                  <th>KPI</th>
                  <th>预算 $</th>
                </tr>
              </thead>
              <tbody>
                ${orderRowsList.map((or, i) => `
                  <tr>
                    <td class="combo-table-idx">${i + 1}</td>
                    <td>${escapeHTML(or.name)}</td>
                    <td>${escapeHTML(or.goal || '—')}</td>
                    <td>${escapeHTML(or.kpiType || '—')}</td>
                    <td>${or.budget ? '$' + escapeHTML(or.budget) : '—'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>`;
      }
    } else if (!L) {
      tree = '<div class="combo-empty-table">请先在 媒体类型 / 产品和服务 / 库存 步骤添加配置。</div>';
    } else {
      tree = `
        <div class="combo-table-wrap">
          <table class="combo-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Order 名称</th>
                <th>目标</th>
                <th>KPI</th>
                <th>预算 $</th>
                <th>LineItem 名称</th>
                <th>媒体类型</th>
                <th>产品类别</th>
                <th>库存</th>
                <th>Creative</th>
              </tr>
            </thead>
            <tbody>
              ${showRows.map((r, i) => `
                <tr>
                  <td class="combo-table-idx">${i + 1}</td>
                  <td>${escapeHTML(r.orderName)}</td>
                  <td>${escapeHTML(r.goal)}</td>
                  <td>${escapeHTML(r.kpi)}</td>
                  <td>${r.budget ? '$' + escapeHTML(r.budget) : '—'}</td>
                  <td>${escapeHTML(r.liName)}</td>
                  <td>${escapeHTML(r.mediaType)}</td>
                  <td>${r.products ? r.products + ' 个' : '—'}</td>
                  <td>${escapeHTML(r.inventory)}</td>
                  <td>${r.creative ? '+' + r.creative : '—'}</td>
                </tr>`).join('')}
            </tbody>
          </table>
          ${rows.length > MAX_ROWS ? `<div class="combo-table-more">仅展示前 ${MAX_ROWS} 行，共 ${rows.length} 行</div>` : ''}
        </div>`;
    }

    box.innerHTML = summary + tree;
    this.updateSidebar();
  },

  refreshStats() {
    $('#stTotal').textContent = State.stats.total;
    $('#stOk').textContent = State.stats.ok;
    $('#stFail').textContent = State.stats.fail;
    $('#stRun').textContent = State.stats.run;
    $('#stCalls').textContent = State.stats.calls;
    $('#stRetry').textContent = State.stats.retry;
    const total = State.stats.total || 1;
    const done = State.stats.ok + State.stats.fail;
    $('#progFill').style.width = `${(done / total) * 100}%`;
    $('#progText').textContent = State.running
      ? `执行中… ${done}/${State.stats.total}（成功 ${State.stats.ok} / 失败 ${State.stats.fail}）`
      : (done > 0 ? `已完成：${done}/${State.stats.total}` : '就绪');
    this.updateSidebar();
  },

  // 右侧 sidebar 实时联动
  updateSidebar() {
    const regionMap = { NA: '北美', EU: '欧洲', FE: '远东' };
    const adv = State.selectedAdvertiser;
    const advEl = $('#sb_advertiser');
    if (advEl) {
      advEl.textContent = adv ? adv.name : '未选择';
      advEl.classList.toggle('empty', !adv);
    }
    const set = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    set('#sb_region', regionMap[State.region] || State.region);
    set('#sb_orderMode', State.orderMode === 'EXISTING' ? '沿用已有订单' : '新建订单');
    set('#sb_currency', adv?.currency || 'USD');

    // 叉乘预估：Order=类型数 × 投放数 / LineItem=O×媒体×产品×库存 / Creative=C
    const O = (State.orderCombos.length || 1) * (State.flightCombos.length || 1);
    const L = (State.mediaCombos.length || 0) * (State.productCombos.length || 1) * (State.inventoryCombos.length || 1);
    const C = State.creativeRows.length;
    const orderEst = State.orderMode === 'EXISTING' ? 0 : O;
    const liEst = O * L;
    set('#sb_liRows', `${L} 行`);
    set('#sb_crRows', `${C} 行`);
    set('#sb_orderEst', orderEst);
    set('#sb_liEst', liEst);
    set('#sb_crEst', C);
    const conc = $('#cfg_concurrency')?.value || 3;
    const qps = $('#cfg_qps')?.value || 5;
    set('#sb_concurrency', `${conc} / ${qps}`);

    // 已创建数量（从任务结果统计）
    let madeOrder = 0, madeLi = 0, madeCr = 0;
    (State.tasks || []).forEach((t) => {
      if (t.kind === 'order' && t.result?.orderId) madeOrder++;
      if (t.kind === 'lineitem' && t.result?.lineItemId) madeLi++;
      if (t.kind === 'creative' && t.result?.creativeId) madeCr++;
    });
    set('#sb_madeOrder', madeOrder);
    set('#sb_madeLi', madeLi);
    set('#sb_madeCr', madeCr);
  },

  renderTask(task) {
    let row = $(`#task_${task.id}`);
    if (!row) {
      row = document.createElement('div');
      row.className = 'result-row';
      row.id = `task_${task.id}`;
      row.innerHTML = `
        <div class="r-idx">#${task.idx + 1}</div>
        <div>
          <div class="r-name">${escapeHTML(task.name)}</div>
          <div class="r-sub" data-sub></div>
        </div>
        <div class="r-status" data-status>pending</div>
      `;
      $('#resultRows').appendChild(row);
    }
    row.querySelector('[data-status]').textContent = task.status;
    row.querySelector('[data-status]').className = `r-status ${task.status}`;
    row.querySelector('[data-sub]').textContent = task.subText || '';
  },

  resetTaskList() {
    $('#resultRows').innerHTML = '';
    $('#logBox').innerHTML = '';
  },
};

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

/* ===== 6) Engine 批量任务编排引擎 =====
 * 每个 task 有 4 个步骤：order → lineItem → creative → attach
 * 失败时按指数退避重试；429/5xx 自动重试；422 直接失败（业务错误）
 * 支持并发数、QPS 上限（在 MockAPI._throttle 实现）、暂停、续建失败项
 */
const Engine = {
  abortFlag: false,

  async run(retryOnly = false) {
    if (State.running) return;

    // 校验各层变体表
    if (!retryOnly) {
      if (!State.mediaCombos.length) { alert('请先在媒体类型步骤添加至少一个媒体类型'); UI.goStep(3); return; }
      if (!State.creativeRows.length) { alert('请先在 Creative 步骤添加至少一行变体'); UI.goStep(4); return; }
    }

    State.running = true;
    State.paused = false;
    this.abortFlag = false;
    $('#btnRun').disabled = true;
    $('#btnPause').disabled = false;
    $('#btnResume').disabled = true;

    if (!retryOnly) {
      this._buildTasks();
    } else {
      State.tasks.forEach((t) => {
        if (t.status === 'fail') { t.status = 'pending'; t.subText = '续建中…'; }
      });
      State.stats.fail = 0;
    }
    UI.resetTaskList();
    State.tasks.forEach(UI.renderTask);
    UI.refreshStats();

    MockAPI.errorRate = Number($('#cfg_errorRate').value) || 0;
    MockAPI.qps = Number($('#cfg_qps').value) || 5;
    const concurrency = Math.max(1, Number($('#cfg_concurrency').value) || 3);
    const maxRetry = Number($('#cfg_maxRetry').value) || 3;

    const O = State.orderMode === 'NEW' ? ((State.orderCombos.length || 1) * (State.flightCombos.length || 1)) : 0;
    const L = (State.mediaCombos.length || 0) * (State.productCombos.length || 1) * (State.inventoryCombos.length || 1);
    const C = State.creativeRows.length;
    log('info', `开始批量任务 · 叉乘：${O} Order（类型 × 投放）× ${L} LineItem = ${O * L} LineItem，${C} Creative 共用 · 并发 ${concurrency} · QPS ${MockAPI.qps}`);

    // Phase 1: 先建 Creative（共用）+ Order（独立，可并行）
    const phase1 = State.tasks.filter((t) => (t.kind === 'creative' || t.kind === 'order') && t.status !== 'ok');
    log('info', `▷ 阶段1：创建 ${State.creativeRows.length} 个 Creative + ${O} 个 Order`);
    await this._runPool(phase1, maxRetry, concurrency);

    // 阶段1 有失败则中止（LineItem 依赖 Order/Creative）
    const phase1Failed = State.tasks.some((t) => (t.kind === 'creative' || t.kind === 'order') && t.status === 'fail');
    if (phase1Failed && !this.abortFlag) {
      log('fail', '✗ 阶段1 存在失败项（Order/Creative），LineItem 阶段跳过。请修复后点「续建失败项」。');
    } else if (!this.abortFlag) {
      // Phase 2: 叉乘创建 LineItem 并挂接全部 Creative
      const phase2 = State.tasks.filter((t) => t.kind === 'lineitem' && t.status !== 'ok');
      log('info', `▷ 阶段2：叉乘创建 ${phase2.length} 个 LineItem，各挂接 ${State._createdCreativeIds.length} 个 Creative`);
      await this._runPool(phase2, maxRetry, concurrency);
    }

    State.running = false;
    $('#btnRun').disabled = false;
    $('#btnPause').disabled = true;
    $('#btnResume').disabled = State.stats.fail === 0;
    UI.refreshStats();
    log(State.stats.fail ? 'fail' : 'ok',
      `批量任务结束 · 成功 ${State.stats.ok} / 失败 ${State.stats.fail}`);
  },

  // 构建三类任务：creative / order / lineitem(叉乘)
  _buildTasks() {
    const tasks = [];
    let idx = 0;
    State._createdCreativeIds = [];
    State._createdOrderIds = [];

    // Creative 任务（共用）
    State.creativeRows.forEach((cv, ci) => {
      const vars = { ...cv, idx: ci + 1 };
      tasks.push({
        id: uid(), idx: idx++, kind: 'creative', cIndex: ci, vars,
        name: Templates.render($('#cr_name').value, vars) || `Creative ${ci + 1}`,
        status: 'pending', subText: '', attempts: 0, result: {},
      });
    });

    // Order 任务（仅 NEW 模式）：类型 × 投放 叉乘，每个组合 = 1 个 Order
    let orderVarsList = [];
    if (State.orderMode === 'NEW') {
      const typeList = State.orderCombos.length ? State.orderCombos : [{}];
      const flightList = State.flightCombos.length ? State.flightCombos : [{}];
      typeList.forEach((tv) => {
        flightList.forEach((fv) => {
          orderVarsList.push({ vars: { ...tv }, flight: { ...fv } });
        });
      });
      orderVarsList.forEach((ov, oi) => {
        tasks.push({
          id: uid(), idx: idx++, kind: 'order', oIndex: oi, vars: ov.vars, flight: ov.flight,
          name: Templates.orderName(ov.vars, ov.flight) || `Order ${oi + 1}`,
          status: 'pending', subText: '', attempts: 0, result: {},
        });
      });
    }

    // LineItem 任务（Order × 媒体类型 叉乘）
    // LineItem 任务（Order × 媒体类型 × 产品和服务 叉乘）
    const orderCount = State.orderMode === 'NEW' ? orderVarsList.length : 1;
    const mediaList = State.mediaCombos.length ? State.mediaCombos : [{}];
    const productList = State.productCombos.length ? State.productCombos : [{ categories: [] }];
    const inventoryList = State.inventoryCombos.length ? State.inventoryCombos : [{ type: 'ALL_PUBLISHERS' }];
    for (let oi = 0; oi < orderCount; oi++) {
      const ov = (orderVarsList[oi] && orderVarsList[oi].vars) || {};
      let li = 0;
      mediaList.forEach((mv) => {
        productList.forEach((pv) => {
          inventoryList.forEach((iv) => {
            const merged = { ...ov, mediaType: mv.mediaType };
            tasks.push({
              id: uid(), idx: idx++, kind: 'lineitem', oIndex: oi, lIndex: li++, vars: merged, media: mv, product: pv, inventory: iv,
              name: Templates.lineItemName(merged, mv, pv) || `LineItem O${oi + 1}-L${li}`,
              status: 'pending', subText: '', attempts: 0, result: {},
            });
          });
        });
      });
    }

    State.tasks = tasks;
    State.stats = { total: tasks.length, ok: 0, fail: 0, run: 0, calls: 0, retry: 0 };
  },

  // 通用工作池：处理一批任务
  async _runPool(taskList, maxRetry, concurrency) {
    const queue = [...taskList];
    const workers = Array.from({ length: concurrency }, (_, i) => this._worker(i + 1, queue, maxRetry));
    await Promise.all(workers);
  },

  async _worker(wid, queue, maxRetry) {
    while (queue.length && !this.abortFlag) {
      while (State.paused) await sleep(200);
      const task = queue.shift();
      if (!task) break;
      await this._runTask(wid, task, maxRetry);
    }
  },

  async _runTask(wid, task, maxRetry) {
    task.status = 'running';
    State.stats.run++;
    UI.renderTask(task); UI.refreshStats();
    log('info', `[W${wid}] ▶ #${task.idx + 1} [${task.kind}] ${task.name}`);

    try {
      if (task.kind === 'creative') {
        const crPayload = Templates.buildCreative(task.vars);
        const cr = await this._withRetry(task, maxRetry, () => MockAPI.createCreative(crPayload), 'POST /dsp/creatives');
        task.result.creativeId = cr.id;
        State._createdCreativeIds[task.cIndex] = cr.id;
        task.status = 'ok';
        task.subText = `Creative ${cr.id}`;
        State.stats.ok++;
        log('ok', `[W${wid}] ✓ Creative 创建 → ${cr.id}`);

      } else if (task.kind === 'order') {
        const orderPayload = Templates.buildOrder(task.vars, task.flight);
        const order = await this._withRetry(task, maxRetry, () => MockAPI.createOrder(orderPayload), 'POST /dsp/orders');
        task.result.orderId = order.id;
        State._createdOrderIds[task.oIndex] = order.id;
        task.status = 'ok';
        task.subText = `Order ${order.id}`;
        State.stats.ok++;
        log('ok', `[W${wid}] ✓ Order 创建 → ${order.id}`);

      } else if (task.kind === 'lineitem') {
        // 解析所属 Order
        const orderId = State.orderMode === 'NEW'
          ? State._createdOrderIds[task.oIndex]
          : (State.selectedExistingOrder?.orderId);
        if (!orderId) throw mkErr(400, 'MISSING_ORDER_ID', '所属 Order 未成功创建或未选定');
        task.result.orderId = orderId;

        // 创建 LineItem
        task.subText = '创建 LineItem…';
        UI.renderTask(task);
        const liPayload = Templates.buildLineItem(task.vars, orderId, task.media, task.product, task.inventory);
        const li = await this._withRetry(task, maxRetry, () => MockAPI.createLineItem(liPayload), 'POST /dsp/lineItems');
        task.result.lineItemId = li.id;

        // 挂接全部共用 Creative
        const creativeIds = State._createdCreativeIds.filter(Boolean);
        for (const crId of creativeIds) {
          await this._withRetry(task, maxRetry, () => MockAPI.attachCreative(li.id, crId), 'POST /dsp/lineItems/{id}/creatives');
        }
        task.result.attachedCount = creativeIds.length;
        task.status = 'ok';
        task.subText = `Order ${orderId} · LineItem ${li.id} · 挂接 ${creativeIds.length} Creative`;
        State.stats.ok++;
        log('ok', `[W${wid}] ✓ LineItem ${li.id} 挂接 ${creativeIds.length} 个 Creative`);
      }
    } catch (e) {
      task.status = 'fail';
      task.subText = `失败：${e.code || ''} ${e.message}`;
      State.stats.fail++;
      log('fail', `[W${wid}] ✗ #${task.idx + 1} [${task.kind}] ${task.subText}`);
    } finally {
      State.stats.run--;
      UI.renderTask(task); UI.refreshStats();
    }
  },

  // 带指数退避的重试封装
  async _withRetry(task, maxRetry, fn, apiTag) {
    let attempt = 0;
    while (true) {
      try {
        attempt++; task.attempts++;
        log('api', `→ ${apiTag} (#${task.idx + 1}, try ${attempt})`);
        const res = await fn();
        return res;
      } catch (e) {
        const retriable = e.http === 429 || (e.http >= 500 && e.http < 600);
        if (retriable && attempt <= maxRetry) {
          State.stats.retry++;
          const backoff = Math.min(2000, 200 * Math.pow(2, attempt - 1)) + Math.random() * 100;
          task.status = 'retry';
          task.subText = `${apiTag} 第 ${attempt} 次失败 (${e.code})，${Math.round(backoff)}ms 后重试`;
          UI.renderTask(task); UI.refreshStats();
          log('retry', `↻ ${apiTag} #${task.idx + 1} ${e.http} ${e.code} → 退避 ${Math.round(backoff)}ms`);
          await sleep(backoff);
          continue;
        }
        throw e;
      }
    }
  },

  pause() {
    if (!State.running) return;
    State.paused = true;
    $('#btnPause').disabled = true;
    $('#btnResume').disabled = false;
    log('info', '⏸ 已暂停');
  },

  resume() {
    if (State.running && State.paused) {
      State.paused = false;
      $('#btnPause').disabled = false;
      $('#btnResume').disabled = true;
      log('info', '▶ 继续执行');
      return;
    }
    // 仅续建失败项
    if (State.stats.fail > 0 && !State.running) {
      this.run(true);
    }
  },
};

/* ===== 7) Boot ===== */
// 入口模式：'orders' = 创建订单（不需要 LineItem 步骤）
//          'lineitems' = 创建订单项（保留所有步骤；已有订单模式跳过 Order）
//          null = 完整流程（默认）
function getEntryMode() {
  const m = new URLSearchParams(window.location.search).get('from');
  return m === 'orders' || m === 'lineitems' ? m : null;
}

// 计算当前应显示的步骤列表（按面板编号 [1..6]）
function visibleSteps() {
  const mode = State.entryMode;
  // 默认：1, 2, 3, 5（Creative 步骤4 已隐藏；6 已隐藏）
  if (mode === 'orders') return [1, 2, 5]; // 选广告主 / Order / 组合预览
  if (mode === 'lineitems') {
    if (State.orderMode === 'EXISTING') return [1, 3, 5];   // 选广告主 / LineItem / 组合预览
    return [1, 2, 3, 5];                                     // 选广告主 / Order / LineItem / 组合预览
  }
  return [1, 2, 3, 5];
}

// 根据可见步骤刷新左侧导航编号 + actions 上下一步指向
function applyFlowMode() {
  const visible = visibleSteps();
  // 左侧步骤导航
  $$('.step').forEach((el) => {
    const n = +el.dataset.step;
    const i = visible.indexOf(n);
    if (i < 0) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
      const span = el.querySelector('span');
      if (span) span.textContent = String(i + 1);
    }
  });
  // 隐藏不在 visible 列表里的 panel（避免错位跳转）
  $$('.panel').forEach((el) => {
    const n = +el.dataset.panel;
    if (![1, 2, 3, 4, 5, 6].includes(n)) return;
    if (!visible.includes(n) && el.style.display !== 'none') {
      el.dataset.hiddenByFlow = '1';
    } else if (visible.includes(n) && el.dataset.hiddenByFlow) {
      delete el.dataset.hiddenByFlow;
    }
  });
  // 更新每个可见 panel 的「上一步 / 下一步」目标 + 标题序号
  visible.forEach((n, i) => {
    const panel = $(`.panel[data-panel="${n}"]`);
    if (!panel) return;
    const prevBtn = panel.querySelector('[data-prev]');
    const nextBtn = panel.querySelector('.btn.next, #btnSubmit');
    if (prevBtn) {
      if (i === 0) prevBtn.style.display = 'none';
      else { prevBtn.style.display = ''; prevBtn.dataset.prev = String(visible[i - 1]); }
    }
    if (nextBtn) {
      const isLast = i === visible.length - 1;
      const isSubmitBtn = nextBtn.id === 'btnSubmit';
      if (isLast) {
        // 最后一步：保留 #btnSubmit；如果是普通 next 按钮，改成提交
        if (!isSubmitBtn) {
          nextBtn.textContent = '提交';
          nextBtn.classList.add('submit-from-next');
          nextBtn.removeAttribute('data-next');
          nextBtn.id = nextBtn.id || 'btnSubmitInline';
        }
      } else {
        if (isSubmitBtn) {
          // 不应该出现，因为 btnSubmit 只在 panel 5；忽略
        } else {
          nextBtn.textContent = '下一步';
          nextBtn.classList.remove('submit-from-next');
          nextBtn.dataset.next = String(visible[i + 1]);
        }
      }
    }
    // 更新 panel-head 的 h2 序号
    const h2 = panel.querySelector('.panel-head h2');
    if (h2) {
      const text = h2.textContent.replace(/^\s*\d+\.\s*/, '');
      h2.textContent = `${i + 1}. ${text}`;
    }
  });
}

function bindStepNav() {
  $$('.step').forEach((el) => {
    el.addEventListener('click', () => UI.goStep(+el.dataset.step));
  });
  $$('.btn.next').forEach((b) => {
    b.addEventListener('click', () => {
      if (b.classList.contains('submit-from-next')) {
        // 末步「下一步」已被改成「提交」，触发提交逻辑
        const submitBtn = $('#btnSubmit') || b;
        submitBtn.click();
        return;
      }
      const next = +b.dataset.next;
      if (next) UI.goStep(next);
    });
  });
  $$('[data-prev]').forEach((b) => {
    b.addEventListener('click', () => UI.goStep(+b.dataset.prev));
  });
}

function bindAdvertiser() {
  // 进入页面立即加载广告主列表（不再需要按钮）
  (async () => {
    log('info', `GET /dsp/advertisers (region=${$('#region').value})`);
    const list = await MockAPI.listAdvertisers();
    UI.renderAdvertisers(list);
    log('ok', `广告主已加载，共 ${list.length} 个`);
    // 仅在「创建订单项」入口显示订单模式
    $('#orderModeWrap').style.display = State.entryMode === 'lineitems' ? '' : 'none';
  })();

  // 搜索过滤
  $('#advSearch')?.addEventListener('input', (e) => UI.renderAdvList(e.target.value));

  // 订单模式切换
  $$('input[name="orderMode"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      State.orderMode = e.target.value;
      $('#existingOrderWrap').style.display = e.target.value === 'EXISTING' ? '' : 'none';
      log('info', `订单模式切换为：${e.target.value === 'NEW' ? '新建订单' : '沿用已有订单'}`);
      applyFlowMode();
      UI.updateSidebar();
    });
  });

  // 已有订单：下拉选择器（点击触发器打开 → 自动加载 → 搜索 + 选中）
  $('#orderSelectTrigger')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    const panel = $('#orderSelectPanel');
    if (!panel) return;
    if (!panel.hidden) { panel.hidden = true; return; }
    if (!State.selectedAdvertiser) { alert('请先选择广告主'); return; }
    // 先把面板打开，如果还在加载就显示 loading
    panel.hidden = false;
    const list = $('#orderDropdown');
    if (!State.existingOrders.length) {
      if (list) list.innerHTML = '<div class="order-select-empty">加载中…</div>';
      log('info', `GET /dsp/orders?advertiserId=${State.selectedAdvertiser.advertiserId}`);
      const orders = await MockAPI.listOrders(State.selectedAdvertiser.advertiserId);
      State.existingOrders = orders;
      log('ok', `已加载 ${orders.length} 个已有订单`);
    }
    renderOrderDropdown(State.existingOrders);
    $('#orderSearch')?.focus();
  });

  // 订单搜索输入
  $('#orderSearch')?.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = State.existingOrders.filter((o) =>
      o.name.toLowerCase().includes(query) || o.orderId.toLowerCase().includes(query)
    );
    renderOrderDropdown(filtered);
  });

  // 点击外部关闭下拉
  document.addEventListener('click', (e) => {
    const sel = $('#orderSelect');
    if (sel && !sel.contains(e.target)) $('#orderSelectPanel').hidden = true;
  });

  $('#region').addEventListener('change', (e) => { State.region = e.target.value; UI.updateSidebar(); });
  $('#profileId').addEventListener('input', (e) => (State.profileId = e.target.value));
}

function renderOrderDropdown(orders) {
  const list = $('#orderDropdown');
  if (!list) return;
  if (!orders.length) {
    list.innerHTML = '<div class="order-select-empty">无匹配订单</div>';
    return;
  }
  list.innerHTML = orders.map((o) => `
    <div class="order-select-item ${State.selectedExistingOrder?.orderId === o.orderId ? 'on' : ''}" data-order-id="${o.orderId}">
      <div class="order-item-name">${o.name}</div>
      <div class="order-item-meta">${o.orderId} · ${o.status} · $${o.budget.toLocaleString()} · ${o.startDate} ~ ${o.endDate}</div>
    </div>
  `).join('');
  list.querySelectorAll('.order-select-item').forEach((item) => {
    item.addEventListener('click', () => {
      const orderId = item.dataset.orderId;
      const order = State.existingOrders.find((o) => o.orderId === orderId);
      if (!order) return;
      State.selectedExistingOrder = order;
      $('#orderSelectValue').textContent = `${order.name} (${order.orderId})`;
      $('#orderSelectPanel').hidden = true;
      log('info', `已选订单：${order.name} (${order.orderId})`);
      UI.updateSidebar();
    });
  });
}

function bindTemplates() {
  // goal → KPI 联动
  $('#ord_goal').addEventListener('change', (e) => {
    const goal = e.target.value;
    const kpiSelect = $('#ord_kpiType');
    const candidates = GOAL_KPI_MAP[goal] || [];
    kpiSelect.innerHTML = candidates.map((k) => `<option value="${k}">${k}</option>`).join('');
    UI.commitComboForm();
    Templates.refreshPreviews();
  });

  // 亚马逊促销 → 隐藏/显示 MEDIA 类型
  $('#ord_amazonPromotion').addEventListener('change', (e) => {
    $('#ord_mediaTypesWrap').style.display = e.target.checked ? 'none' : '';
    UI.commitComboForm();
    Templates.refreshPreviews();
  });

  // 添加一个类型
  $('#btnAddOrderCombo')?.addEventListener('click', () => UI.addOrderCombo());

  // 名称模板手动编辑 → 同步变量标签高亮
  $('#ord_name')?.addEventListener('input', () => { UI.renderNameChips(); Templates.refreshPreviews(); });
  $('#li_name')?.addEventListener('input', () => { UI.renderLiNameChips(); Templates.refreshPreviews(); });

  // 右侧表单任意改动 → 写回当前选中的类型
  ['ord_kpiType', 'ord_kpiValue', 'ord_kpiNoTarget', 'ord_optimizationPriority', 'ord_budgetAllocation'].forEach((id) => {
    $('#' + id)?.addEventListener('change', () => { UI.commitComboForm(); Templates.refreshPreviews(); });
  });
  $('#ord_kpiValue')?.addEventListener('input', () => UI.commitComboForm());
  $$('#ord_mediaTypes input').forEach((c) => {
    c.addEventListener('change', () => { UI.commitComboForm(); Templates.refreshPreviews(); });
  });

  // 投放（预算和投放）- 添加投放 / 添加广告活动行 / 公共字段写回
  $('#btnAddFlight').addEventListener('click', () => UI.addFlight());
  $('#btnAddFlightRow')?.addEventListener('click', () => UI.addFlightRow());
  ['ord_budgetCapType', 'ord_budgetCapAmount', 'ord_agencyFeeType', 'ord_agencyFeeValue'].forEach((id) => {
    $('#' + id)?.addEventListener('input', () => UI.commitFlightForm());
    $('#' + id)?.addEventListener('change', () => UI.commitFlightForm());
  });
  $$('input[name="ord_unusedBudget"]').forEach((r) => r.addEventListener('change', () => { UI.commitFlightForm(); Templates.refreshPreviews(); }));
  $('#ord_budgetCapEnabled').addEventListener('change', (e) => {
    $('#ord_budgetCapFields').style.display = e.target.checked ? '' : 'none';
    UI.commitFlightForm();
    Templates.refreshPreviews();
  });
  $('#ord_agencyFeeEnabled').addEventListener('change', (e) => {
    $('#ord_agencyFeeFields').style.display = e.target.checked ? '' : 'none';
    UI.commitFlightForm();
    Templates.refreshPreviews();
  });

  // 频率 / 频次组 勾选 → 展开对应配置
  $('#ord_freqCapEnabled').addEventListener('change', (e) => {
    $('#ord_freqCapFields').style.display = e.target.checked ? '' : 'none';
    Templates.refreshPreviews();
  });
  $('#ord_freqGroupEnabled').addEventListener('change', (e) => {
    $('#ord_freqGroupFields').style.display = e.target.checked ? '' : 'none';
    Templates.refreshPreviews();
  });

  // 频次上限 - 添加行
  $('#btnAddFreqCap').addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'freq-row';
    row.innerHTML = `
      <input type="number" data-freq-impressions value="3" min="1" placeholder="次数" style="width:60px" />
      次，每
      <input type="number" data-freq-timevalue value="1" min="1" style="width:50px" />
      <select data-freq-timeunit style="width:80px"><option value="DAY">天</option><option value="HOUR">小时</option><option value="MINUTE">分钟</option></select>
      每
      <select data-freq-scope style="width:80px"><option value="USER">用户</option><option value="HOUSEHOLD">家庭</option></select>
      <button type="button" class="freq-del" title="删除">×</button>
    `;
    $('#freqCapRows').appendChild(row);
    row.querySelector('.freq-del').addEventListener('click', () => { row.remove(); Templates.refreshPreviews(); });
    row.querySelectorAll('input, select').forEach((el) => el.addEventListener('input', () => Templates.refreshPreviews()));
    Templates.refreshPreviews();
  });
  // 初始化首行删除按钮
  $$('.freq-del').forEach((btn) => btn.addEventListener('click', (e) => {
    e.target.closest('.freq-row').remove();
    Templates.refreshPreviews();
  }));
  // 初始化首行输入框变化
  $$('#freqCapRows input, #freqCapRows select').forEach((el) =>
    el.addEventListener('input', () => Templates.refreshPreviews()));

  // ===== LineItem 频次上限（多条）=====
  $('#li_delivery_freqCap')?.addEventListener('change', (e) => {
    $('#li_delivery_freqCapFields').style.display = e.target.checked ? '' : 'none';
    Templates.refreshPreviews();
  });
  $('#btnAddLiFreqCap')?.addEventListener('click', () => {
    const row = document.createElement('div');
    row.className = 'freq-row';
    row.innerHTML = `
      <input type="number" data-freq-impressions value="3" min="1" placeholder="次数" style="width:60px" />
      次，每
      <input type="number" data-freq-timevalue value="1" min="1" style="width:50px" />
      <select data-freq-timeunit style="width:80px"><option value="DAY">天</option><option value="HOUR">小时</option><option value="MINUTE">分钟</option></select>
      每
      <select data-freq-scope style="width:80px"><option value="USER">用户</option><option value="HOUSEHOLD">家庭</option></select>
      <button type="button" class="freq-del" title="删除">×</button>
    `;
    $('#li_freqCapRows').appendChild(row);
    row.querySelector('.freq-del').addEventListener('click', () => { row.remove(); Templates.refreshPreviews(); });
    row.querySelectorAll('input, select').forEach((el) => el.addEventListener('input', () => Templates.refreshPreviews()));
    Templates.refreshPreviews();
  });
  // 初始化 LineItem 首行删除/输入
  $$('#li_freqCapRows .freq-del').forEach((btn) => btn.addEventListener('click', (e) => {
    e.target.closest('.freq-row').remove();
    Templates.refreshPreviews();
  }));
  $$('#li_freqCapRows input, #li_freqCapRows select').forEach((el) =>
    el.addEventListener('input', () => Templates.refreshPreviews()));

  // ===== LineItem 联动 =====
  // 媒体类型 切换 → 显示对应分支 + 写回当前媒体类型
  $('#li_mediaType').addEventListener('change', () => {
    UI.refreshMediaBranch();
    UI.commitMediaForm();
    Templates.refreshPreviews();
  });

  // 添加媒体类型
  $('#btnAddMedia')?.addEventListener('click', () => UI.addMedia());

  // 产品和服务：添加组 + 类别搜索
  $('#btnAddProduct')?.addEventListener('click', () => UI.addProduct());
  $('#li_productSearch')?.addEventListener('input', (e) => UI.renderProductCategories(e.target.value));

  // 库存：添加组 + 库存类型切换 + 三块搜索
  $('#btnAddInventory')?.addEventListener('click', () => UI.addInventory());
  $$('input[name="li_inv_type"]').forEach((r) => r.addEventListener('change', (e) => {
    const inv = UI.curInventory();
    if (inv) inv.type = e.target.value;
    $('#li_inv_manualWrap').style.display = e.target.value === 'MANUAL_PUBLISHERS' ? '' : 'none';
    UI.afterInvChange();
  }));
  $('#li_inv_pubSearch')?.addEventListener('input', (e) => UI.renderInvPublishers(e.target.value));
  $('#li_inv_dealSearch')?.addEventListener('input', (e) => UI.renderInvDeals(e.target.value));
  $('#li_inv_groupSearch')?.addEventListener('input', (e) => UI.renderInvGroups(e.target.value));
  // 交易 / 库存组 折叠展开
  $$('[data-inv-toggle]').forEach((head) => {
    head.addEventListener('click', () => {
      const which = head.dataset.invToggle;
      const wrap = $(which === 'deals' ? '#li_inv_dealsWrap' : '#li_inv_groupsWrap');
      const open = wrap.style.display !== 'none';
      wrap.style.display = open ? 'none' : '';
      head.classList.toggle('open', !open);
      head.querySelector('.cat-caret').textContent = open ? '›' : '⌄';
    });
  });

  // 定向策略「添加投放目标」下拉
  $('#btnAddTargeting')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = $('#targetingAddMenu');
    if (!menu) return;
    if (menu.hidden) UI.renderTargetingMenu();
    menu.hidden = !menu.hidden;
  });
  document.addEventListener('click', (e) => {
    const menu = $('#targetingAddMenu');
    if (!menu || menu.hidden) return;
    if (!menu.contains(e.target) && e.target.id !== 'btnAddTargeting') menu.hidden = true;
  });

  // 流媒体方案 / DOOH 位置 改动 → 写回
  ['li_media_streamingPlan', 'li_media_doohLocation'].forEach((id) => {
    $('#' + id)?.addEventListener('change', () => { UI.commitMediaForm(); Templates.refreshPreviews(); });
  });

  // 设备 / 移动环境：至少保留一个选中（取消最后一个时阻止）
  function guardAtLeastOne(containerSel) {
    const boxes = $$(`${containerSel} input[type="checkbox"]`);
    boxes.forEach((cb) => {
      cb.addEventListener('change', () => {
        const checked = boxes.filter((b) => b.checked);
        if (checked.length === 0) { cb.checked = true; return; }
        UI.commitMediaForm();
        Templates.refreshPreviews();
      });
    });
  }
  guardAtLeastOne('#li_media_devices');
  guardAtLeastOne('#li_media_mobileEnv');

  // 最高 CPM 模式 → 手动金额显隐
  $('#li_bidding_maxCpmMode').addEventListener('change', (e) => {
    $('#li_bidding_maxCpmWrap').style.display = e.target.value === 'MANUAL' ? '' : 'none';
    Templates.refreshPreviews();
  });

  // ===== Creative 联动 =====
  // 大类 → 子类型候选 & clickThrough 候选（与对照表 §5.3/§5.4 一致）
  const CR_SUBTYPES = {
    DISPLAY: [['STANDARD_DISPLAY', '标准展示'], ['THIRD_PARTY_DISPLAY', '第三方投放标签']],
    VIDEO: [['STANDARD_VIDEO', '标准视频'], ['THIRD_PARTY_VIDEO', '第三方 VAST/VPAID']],
    AUDIO: [['STANDARD_AUDIO', '标准音频'], ['INTERACTIVE_AUDIO', '互动式音频'], ['PODCAST', '播客']],
    COMPONENT_BASED: [['COMPONENT_BASED', '基于组件（单一类型）']],
  };
  const CR_CLICKTYPES = {
    STANDARD_DISPLAY: [['BRAND_STORE', '品牌旗舰店'], ['OTHER_WEBSITE', '其他网站']],
    THIRD_PARTY_DISPLAY: [['AMAZON', '指向亚马逊'], ['OTHER_WEBSITE', '其他网站']],
    STANDARD_VIDEO: [['AMAZON_PRODUCT', '亚马逊站内商品'], ['BRAND_STORE', '品牌旗舰店'], ['OTHER_WEBSITE', '其他网站']],
    THIRD_PARTY_VIDEO: [['AMAZON', '指向亚马逊'], ['OTHER_WEBSITE', '其他网站']],
    STANDARD_AUDIO: [['AMAZON_PRODUCT', '亚马逊站内商品'], ['OTHER_WEBSITE', '其他网站']],
    INTERACTIVE_AUDIO: [['CTA', '由 CTA 替代（无独立着陆页）']],
    PODCAST: [['AMAZON_PRODUCT', '亚马逊站内商品'], ['OTHER_WEBSITE', '其他网站']],
    COMPONENT_BASED: [['AMAZON_PRODUCT', '亚马逊商品'], ['OTHER_WEBSITE', '其他网站'], ['BRAND_STORE', '品牌旗舰店']],
  };

  function fillSelect(sel, pairs) {
    sel.innerHTML = pairs.map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
  }

  // 着陆页类型 → 显示对应输入
  function refreshClickBranch() {
    const ct = $('#cr_clickType').value;
    $$('.click-branch').forEach((el) => (el.style.display = 'none'));
    if (ct === 'AMAZON_PRODUCT') $('#cr_click_AMAZON_PRODUCT').style.display = '';
    else if (ct === 'BRAND_STORE') {
      $('#cr_click_BRAND_STORE').style.display = '';
      $('#cr_click_BRAND_STORE_page').style.display = '';
    } else if (ct === 'OTHER_WEBSITE') $('#cr_click_OTHER_WEBSITE').style.display = '';
  }

  // 子类型 → 大类内部细分显隐（标准/第三方、互动式音频、组件分支等）
  function refreshSubtypeBranch() {
    const subtype = $('#cr_subtype').value;
    const isStdDisplay = subtype === 'STANDARD_DISPLAY';
    const is3pDisplay = subtype === 'THIRD_PARTY_DISPLAY';
    const isStdVideo = subtype === 'STANDARD_VIDEO';
    const is3pVideo = subtype === 'THIRD_PARTY_VIDEO';
    const isInteractive = subtype === 'INTERACTIVE_AUDIO';
    $$('.cr-std-display').forEach((el) => (el.style.display = isStdDisplay ? '' : 'none'));
    $$('.cr-3p-display').forEach((el) => (el.style.display = is3pDisplay ? '' : 'none'));
    $$('.cr-std-video').forEach((el) => (el.style.display = isStdVideo ? '' : 'none'));
    $$('.cr-3p-video').forEach((el) => (el.style.display = is3pVideo ? '' : 'none'));
    $$('.cr-interactive-audio').forEach((el) => (el.style.display = isInteractive ? '' : 'none'));
    // 站点（仅第三方展示/视频）
    $('#cr_siteWrap').style.display = (is3pDisplay || is3pVideo) ? '' : 'none';
  }

  // COMPONENT_BASED：着陆页类型决定素材区字段显隐
  function refreshComponentBranch() {
    if ($('#cr_type').value !== 'COMPONENT_BASED') return;
    const ct = $('#cr_clickType').value;
    const showBrand = ct === 'OTHER_WEBSITE' || ct === 'BRAND_STORE';
    $$('.cr-cb-brand').forEach((el) => (el.style.display = showBrand ? '' : 'none'));
    $$('.cr-cb-body').forEach((el) => (el.style.display = showBrand ? '' : 'none'));
    $$('.cr-cb-cta').forEach((el) => (el.style.display = showBrand ? '' : 'none'));
  }

  // 第三方点击量 URL（仅展示/视频显示）
  function refresh3pClick() {
    const t = $('#cr_type').value;
    $('#cr_3pClickWrap').style.display = (t === 'DISPLAY' || t === 'VIDEO') ? '' : 'none';
  }

  // 大类切换 → 重填子类型 → 重填 clickType → 各分支显隐
  $('#cr_type').addEventListener('change', () => {
    const t = $('#cr_type').value;
    fillSelect($('#cr_subtype'), CR_SUBTYPES[t]);
    $('#cr_subtype').dispatchEvent(new Event('change'));
    // 创意大类分支区显隐
    $$('.creative-branch').forEach((el) => (el.style.display = 'none'));
    const branch = $(`#cr_branch_${t}`);
    if (branch) branch.style.display = '';
    refresh3pClick();
  });

  // 子类型切换 → 重填 clickType 候选 → 分支显隐
  $('#cr_subtype').addEventListener('change', () => {
    const subtype = $('#cr_subtype').value;
    fillSelect($('#cr_clickType'), CR_CLICKTYPES[subtype] || [['OTHER_WEBSITE', '其他网站']]);
    refreshSubtypeBranch();
    $('#cr_clickType').dispatchEvent(new Event('change'));
  });

  // 着陆页类型切换 → 输入显隐 + 组件素材区显隐
  $('#cr_clickType').addEventListener('change', () => {
    refreshClickBranch();
    refreshComponentBranch();
    Templates.refreshPreviews();
  });

  // 组件广告位模式（仅影响 payload，不改显隐，刷新预览即可）
  $('#cr_cb_placementMode').addEventListener('change', () => Templates.refreshPreviews());
  $('#cr_aud_ctaType').addEventListener('change', () => Templates.refreshPreviews());

  // 初始化 Creative 级联
  $('#cr_type').dispatchEvent(new Event('change'));

  // 模板字段变化时更新预览
  ['ord_name','ord_poNumber','ord_advertiserDomain','ord_notes',
   'ord_budgetCapEnabled','ord_budgetCapType','ord_budgetCapAmount','ord_agencyFeeEnabled','ord_agencyFeeType','ord_agencyFeeValue',
   'ord_kpiType','ord_kpiValue','ord_kpiNoTarget','ord_optimizationPriority','ord_budgetAllocation',
   'ord_includeLinearTV','ord_frequencyGroupId',
   'li_name','li_externalId','li_notes','li_mediaType','li_media_streamingPlan','li_media_doohLocation',
   'li_delivery_start','li_delivery_end','li_delivery_budgetAlloc',
   'li_delivery_pacing','li_delivery_spendLimit','li_delivery_spendMin','li_delivery_freqCap',
   'li_bidding_baseBid','li_bidding_maxCpmMode','li_bidding_maxCpmValue',
   'cr_name','cr_language','cr_externalId','cr_site','cr_type','cr_subtype','cr_clickType',
   'cr_click_asin','cr_click_storeId','cr_click_pageId','cr_click_url',
   'cr_disp_adExperience','cr_disp_3pSize','cr_disp_tagSource',
   'cr_vid_vastVerifyUrl','cr_vid_vastTagUrl',
   'cr_aud_title','cr_aud_brandName','cr_aud_ctaType',
   'cr_cb_brandName','cr_cb_headlines','cr_cb_bodyText','cr_cb_cta','cr_cb_placementMode','cr_cb_aiPersons',
   'cr_3pImpressionUrls','cr_3pClickUrls','cr_otherHtml'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => Templates.refreshPreviews());
  });
  $$('#ord_mediaTypes input, #ord_unusedBudget input, #li_media_devices input, #li_media_mobileEnv input, #cr_disp_sizes input, #cr_vid_adExperience input, #cr_vid_categories input').forEach((el) =>
    el.addEventListener('change', () => Templates.refreshPreviews()));
}

function bindTable() {
  // 为三个变体表各绑定工具按钮（按 data-layer 区分）
  $$('[data-vt-add]').forEach((btn) => {
    btn.addEventListener('click', () => UI.addVariantRow(btn.dataset.vtAdd, 1));
  });
  $$('[data-vt-addn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const layer = btn.dataset.vtAddn;
      const input = document.querySelector(`[data-vt-count="${layer}"]`);
      const n = parseInt(input?.value, 10) || 0;
      if (n < 1) { alert('请输入要新增的行数'); return; }
      if (n > 500) { alert('单次最多新增 500 行'); return; }
      UI.addVariantRow(layer, n);
    });
  });
  $$('[data-vt-demo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const layer = btn.dataset.vtDemo;
      const def = VARIANT_DEFS[layer];
      State[def.stateKey] = JSON.parse(JSON.stringify(def.demo()));
      UI.renderVariantTable(layer);
      log('info', `${def.name} 已加载 ${State[def.stateKey].length} 行示例`);
    });
  });
  $$('[data-vt-clear]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const layer = btn.dataset.vtClear;
      const def = VARIANT_DEFS[layer];
      if (!State[def.stateKey].length) return;
      if (!confirm(`确定清空 ${def.name} 全部 ${State[def.stateKey].length} 行？`)) return;
      State[def.stateKey] = [];
      UI.renderVariantTable(layer);
    });
  });

  // 一键加载全部示例
  $('#btnLoadAllDemo')?.addEventListener('click', () => {
    State.creativeRows = JSON.parse(JSON.stringify(DEMO_CREATIVE_ROWS));
    UI.renderAllTables();
    log('ok', `已加载示例：${State.creativeRows.length} Creative`);
  });
}

/* ===== 7) 提交到主页 list（写入 localStorage 由 home.html 读取）===== */
function submitToHome() {
  const mode = State.entryMode;
  // 重新构造 Order × Flight 列表（与 _buildTasks 同源逻辑）
  const typeList = State.orderCombos.length ? State.orderCombos : [{}];
  const flightList = State.flightCombos.length ? State.flightCombos : [{}];
  const mediaList = State.mediaCombos.length ? State.mediaCombos : [{}];
  const productList = State.productCombos.length ? State.productCombos : [{ categories: [] }];
  const inventoryList = State.inventoryCombos.length ? State.inventoryCombos : [{ type: 'ALL_PUBLISHERS' }];

  const advertiserName = State.selectedAdvertiser?.name || 'BrandX US';
  const currency = State.selectedAdvertiser?.currency || 'USD';
  const now = Date.now();
  const newOrders = [];
  const newLineItems = [];

  // 仅创建订单（orders 入口）：只输出 Order，不输出 LineItem
  // 仅创建订单项（lineitems 入口）：
  //   - 新建订单模式：同时输出 Order + LineItem
  //   - 沿用已有订单：只输出 LineItem，挂到所选已有订单
  const writeOrders = mode !== 'lineitems' || State.orderMode === 'NEW';
  const writeLineItems = mode !== 'orders';

  if (mode === 'lineitems' && State.orderMode === 'EXISTING' && State.selectedExistingOrder) {
    // 已有订单：每个 LineItem 直接挂到该订单
    const eo = State.selectedExistingOrder;
    const orderName = eo.name || eo.orderId;
    const orderCode = eo.orderId;
    const orderId = eo.orderId;
    const MT = { DISPLAY: '展示', STREAMING_TV: '流媒体电视', ONLINE_VIDEO: '在线视频', AUDIO: '音频', DIGITAL_OUT_OF_HOME: '数字户外' };
    let li = 0;
    mediaList.forEach((mv) => {
      productList.forEach((pv) => {
        inventoryList.forEach((iv) => {
          li++;
          const liName = Templates.lineItemName({ mediaType: mv.mediaType }, mv, pv) || `LineItem_${MT[mv.mediaType] || mv.mediaType || 'X'}`;
          newLineItems.push({
            id: `${orderId}_li_${now}_${li}`,
            statusKey: 'LINEITEM_NOT_RUNNING',
            name: liName,
            code: orderCode,
            orderName,
            orderId,
            detail: '显示策略详情',
            mediaType: MT[mv.mediaType] || mv.mediaType,
            productCount: (pv.categories || []).length,
            inventoryType: iv.type === 'ALL_PUBLISHERS' ? '所有出版商' : '手动库存',
            budget: '—',
            objectiveDeletion: '[object Object]',
            totalSpend: '—',
            effective1000: '—',
            forecastSpend: '—',
            budgetLimit: '—',
            impressions: '—',
            points: '—',
            totalCost: '—',
            advertiser: advertiserName,
            currency,
            createdAt: now,
          });
        });
      });
    });
  } else {
    typeList.forEach((tv, ti) => {
      flightList.forEach((fv, fi) => {
        const ov = { ...tv, _flight: fv };
        const orderName = Templates.orderName(ov, fv) || `Order ${ti + 1}-${fi + 1}`;
        const orderId = `ord_${now}_${ti}_${fi}_${Math.random().toString(36).slice(2, 8)}`;
        const orderCode = String(now).slice(-13) + ' ' + String(ti * 10 + fi).padStart(2, '0');
        const budgetSum = (fv.rows || []).reduce((s, r) => s + (Number(r.budget) || 0), 0);

        if (writeOrders) {
          newOrders.push({
            id: orderId,
            statusKey: 'NOT_RUNNING',
            name: orderName,
            code: orderCode,
            detail: '显示策略详情',
            budget: budgetSum > 0 ? `$${budgetSum.toFixed(2)}` : '$0.00',
            budgetType: '营销订单',
            objectiveDeletion: tv.goal ? (ORDER_GOAL_LABELS[tv.goal] || tv.goal) : '—',
            totalSpend: '—',
            halfHourSpend: '—',
            budgetLimit: fv.budgetCapEnabled ? `$${fv.budgetCapAmount || 0}` : '—',
            impressions: '—',
            points: '—',
            effective1000: '—',
            ctr: '—',
            purchaseRate: '—',
            advertiser: advertiserName,
            currency,
            kpiType: tv.kpiType || '',
            createdAt: now,
          });
        }

        if (writeLineItems) {
          const MT = { DISPLAY: '展示', STREAMING_TV: '流媒体电视', ONLINE_VIDEO: '在线视频', AUDIO: '音频', DIGITAL_OUT_OF_HOME: '数字户外' };
          let li = 0;
          mediaList.forEach((mv) => {
            productList.forEach((pv) => {
              inventoryList.forEach((iv) => {
                li++;
                const liId = `${orderId}_li_${li}`;
                const liName = Templates.lineItemName({ mediaType: mv.mediaType }, mv, pv) || `LineItem_${MT[mv.mediaType] || mv.mediaType || 'X'}`;
                newLineItems.push({
                  id: liId,
                  statusKey: 'LINEITEM_NOT_RUNNING',
                  name: liName,
                  code: orderCode,
                  orderName,
                  orderId,
                  detail: '显示策略详情',
                  mediaType: MT[mv.mediaType] || mv.mediaType,
                  productCount: (pv.categories || []).length,
                  inventoryType: iv.type === 'ALL_PUBLISHERS' ? '所有出版商' : '手动库存',
                  budget: budgetSum > 0 ? `$${budgetSum.toFixed(2)}` : '—',
                  objectiveDeletion: tv.goal ? (ORDER_GOAL_LABELS[tv.goal] || tv.goal) : '—',
                  totalSpend: '—',
                  effective1000: '—',
                  forecastSpend: '—',
                  budgetLimit: fv.budgetCapEnabled ? `$${fv.budgetCapAmount || 0}` : '—',
                  impressions: '—',
                  points: '—',
                  totalCost: '—',
                  advertiser: advertiserName,
                  currency,
                  createdAt: now,
                });
              });
            });
          });
        }
      });
    });
  }

  // 合并到已存在的 list
  let existingOrders = [];
  let existingLis = [];
  try { existingOrders = JSON.parse(localStorage.getItem('amzdsp_orders') || '[]'); } catch (e) {}
  try { existingLis = JSON.parse(localStorage.getItem('amzdsp_lineitems') || '[]'); } catch (e) {}
  if (newOrders.length) localStorage.setItem('amzdsp_orders', JSON.stringify([...newOrders, ...existingOrders]));
  if (newLineItems.length) localStorage.setItem('amzdsp_lineitems', JSON.stringify([...newLineItems, ...existingLis]));

  log('ok', `已提交：${newOrders.length} 个 Order，${newLineItems.length} 个 LineItem`);
  alert(`提交成功：${newOrders.length ? `创建 ${newOrders.length} 个 Order；` : ''}${newLineItems.length ? `创建 ${newLineItems.length} 个 LineItem；` : ''}已回填到主页。`);

  // 跳回主页（按入口 tab）
  const targetTab = mode === 'lineitems' ? 'lineitems' : 'orders';
  window.location.href = `home.html#${targetTab}`;
}

function bindEngine() {
  $('#btnRun')?.addEventListener('click', () => {
    if (!State.selectedAdvertiser) { alert('请先在第 1 步选择广告主'); UI.goStep(1); return; }
    if (!State.mediaCombos.length) { alert('请先在第 3 步添加媒体类型'); UI.goStep(3); return; }
    Engine.run(false);
  });
  $('#btnPause')?.addEventListener('click', () => Engine.pause());
  $('#btnResume')?.addEventListener('click', () => Engine.resume());
  $('#btnClear')?.addEventListener('click', () => {
    State.tasks = [];
    State.stats = { total: 0, ok: 0, fail: 0, run: 0, calls: 0, retry: 0 };
    UI.resetTaskList();
    UI.refreshStats();
  });
  // 提交按钮（步骤5）
  $('#btnSubmit')?.addEventListener('click', () => {
    if (!State.selectedAdvertiser) { alert('请先在第 1 步选择广告主'); UI.goStep(1); return; }
    if (State.entryMode !== 'orders') {
      // 创建订单项需要校验媒体类型
      if (!State.mediaCombos.length) { alert('请先添加媒体类型'); UI.goStep(3); return; }
    }
    submitToHome();
  });
  // 执行参数变化 → 同步右侧 sidebar
  ['cfg_concurrency', 'cfg_qps'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => UI.updateSidebar());
  });
}

function boot() {
  State.entryMode = getEntryMode();
  bindStepNav();
  bindAdvertiser();
  bindTemplates();
  bindTable();
  bindEngine();
  UI.renderNameChips();
  UI.renderLiNameChips();
  Templates.refreshPreviews();
  UI.updateSidebar();
  applyFlowMode();
  // 返回按钮：所有 .back-btn 都返回 home
  $$('.back-btn, #btnBackHome').forEach((btn) => {
    btn.addEventListener('click', () => {
      window.location.href = 'home.html';
    });
  });
  // 入口模式提示
  if (State.entryMode === 'orders') log('info', '当前入口：创建订单（仅需广告主 → Order → 组合预览）');
  else if (State.entryMode === 'lineitems') log('info', '当前入口：创建订单项（根据订单模式动态显示步骤）');
  else log('info', 'Demo 已就绪');
}

document.addEventListener('DOMContentLoaded', boot);
