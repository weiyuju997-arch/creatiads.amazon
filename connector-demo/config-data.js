/* =========================================================
 * 配置弹窗数据层（多平台）
 * 字段来源：数据字典2 / 应用层-用户视角 的 4 个 CSV
 *   - 跨平台通用维度 / 跨平台通用指标
 *   - 平台专属维度 / 平台专属指标
 * 按 Facebook / Google / TikTok / Amazon 分别映射。
 * common: true 表示常用字段，默认勾选并显示在精简区。
 * ========================================================= */

/* 平台元信息（标题、图标、API 说明） */
const PLATFORM_META = {
  facebook: { name: 'Facebook Ads', title: '配置广告洞察连接器', api: 'Facebook Marketing API · 广告洞察', short: 'f',  color: '#1877f2', sink: 'conn_fb_ad_insights' },
  google:   { name: 'Google Ads',   title: '配置 Google Ads 连接器', api: 'Google Ads API · 报表',         short: 'G',  color: '#4285F4', sink: 'conn_google_ads_report' },
  tiktok:   { name: 'TikTok Ads',   title: '配置 TikTok Ads 连接器', api: 'TikTok Marketing API · 报表',    short: 'TT', color: '#000000', sink: 'conn_tiktok_ads_report' },
  amazon:   { name: 'Amazon Ads',   title: '配置 Amazon Ads 连接器', api: 'Amazon Advertising API · 报表',  short: 'a',  color: '#FF9900', sink: 'conn_amazon_ads_report' }
};

/* 账户分两层：平台账户（授权登录号）→ 旗下多个广告账户
 * authorizedAt：授权时间，用于默认选中"最近一次授权"的平台账户 */
const PLATFORM_ACCOUNTS = [
  {
    id: 'login_1', login: 'weiyuju997@gmail.com', name: 'Brand Business Center', authorizedAt: '2026-05-20',
    adAccounts: [
      { id: 'act_1729384756', name: 'Brand Main · US',       status: 'active' },
      { id: 'act_8273645102', name: 'Performance · EU',       status: 'active' },
      { id: 'act_5647382910', name: 'App Install · APAC',     status: 'active' },
      { id: 'act_3948572610', name: 'Retargeting · LATAM',    status: 'paused' },
      { id: 'act_1093847562', name: 'Holiday Promo · US',     status: 'active' },
      { id: 'act_2238947163', name: 'Lead Gen · DACH',        status: 'active' },
      { id: 'act_6675839201', name: 'Catalog Sales · SEA',    status: 'active' },
      { id: 'act_7741029384', name: 'Brand Awareness · JP',   status: 'paused' }
    ]
  },
  {
    id: 'login_2', login: 'ads-ops@agency.com', name: 'Agency Managed BC', authorizedAt: '2026-06-01',
    adAccounts: [
      { id: 'act_5512093847', name: 'Client A · Search',  status: 'active' },
      { id: 'act_5512093848', name: 'Client B · Retarget', status: 'active' },
      { id: 'act_5512093849', name: 'Client C · Video',    status: 'active' }
    ]
  }
];

/* 频率选项 */
const FREQ_OPTIONS = [
  { id: 'every_5min',  label: '每 5 分钟',   times: '288次/天', cron: '*/5 * * * *' },
  { id: 'every_15min', label: '每 15 分钟',  times: '96次/天',  cron: '*/15 * * * *' },
  { id: 'hourly',      label: '每小时',      times: '24次/天',  cron: '0 * * * *' },
  { id: 'daily',       label: '每天 00:00:00',    times: '1次/天',   cron: '0 0 * * *' },
  { id: 'weekly',      label: '每周一 00:00:00',  times: '1次/周',   cron: '0 0 * * 1' }
];

/* 自定义落库数据库（在 creatiads → Destinations 中创建的） */
const DESTINATIONS = [
  { id: 'dest_mysql_prod',  name: '我的 MySQL 生产库',  type: 'MySQL' },
  { id: 'dest_pg_analytics',name: 'Analytics PG 库',    type: 'PostgreSQL' },
  { id: 'dest_bq_warehouse',name: 'BigQuery 数仓',       type: 'BigQuery' }
];

/* 字段简写：[id, 显示名, kind, common?] -> {id,name,kind,common} */
function F(id, name, kind, common) { return { id, name, kind, common: !!common }; }

/* =========================================================
 * 各平台字段（按分类）
 * ========================================================= */
const FIELDS_BY_PLATFORM = {
  /* ---------------- Facebook ---------------- */
  facebook: [
    { id: 'identifiers', name: 'IDENTIFIERS 标识与层级', fields: [
      F('account_id',   '账户ID Account ID',     'dim'),
      F('account_name', '账户名称 Account Name', 'dim', true),
      F('campaign_id',  '广告系列ID Campaign ID', 'dim'),
      F('campaign_name','广告系列 Campaign',      'dim', true),
      F('adset_id',     '广告组ID Adset ID',     'dim'),
      F('adset_name',   '广告组 Adset',          'dim'),
      F('ad_id',        '广告ID Ad ID',          'dim'),
      F('ad_name',      '广告 Ad',               'dim')
    ]},
    { id: 'time', name: 'TIME 时间', fields: [
      F('date_start', '日期 Date', 'dim', true)
    ]},
    { id: 'status', name: 'STATUS & CONFIG 状态与配置', fields: [
      F('status',                '广告系列状态 Campaign Status',  'dim'),
      F('effective_status',      '广告系列主要状态 Primary Status','dim'),
      F('adset_status',          '广告组状态 Adset Status',       'dim'),
      F('ad_status',             '广告状态 Ad Status',            'dim'),
      F('bid_strategy',          '出价策略 Bid Strategy',         'dim'),
      F('daily_budget',          '预算金额 Budget',               'dim'),
      F('optimization_goal',     '优化目标 Optimization Goal',    'dim'),
      F('billing_event',         '计费事件 Billing Event',        'dim'),
      F('account_currency',      '货币代码 Currency',             'dim')
    ]},
    { id: 'demographic', name: 'DEMOGRAPHIC 受众', fields: [
      F('age',    '年龄 Age',    'dim'),
      F('gender', '性别 Gender', 'dim')
    ]},
    { id: 'geographic', name: 'GEOGRAPHIC 地区', fields: [
      F('country', '国家 Country', 'dim'),
      F('region',  '地区 Region',  'dim'),
      F('dma',     '都市圈 DMA',   'dim')
    ]},
    { id: 'platform_device', name: 'PLATFORM & DEVICE 版位与设备', fields: [
      F('publisher_platform', '投放平台 Platform',         'dim'),
      F('platform_position',  '广告版位 Placement',        'dim'),
      F('device_platform',    '设备类型 Device',           'dim'),
      F('impression_device',  '展示设备 Impression Device','dim')
    ]},
    { id: 'creative', name: 'CREATIVE 创意', fields: [
      F('image_asset',         '图片素材 Image',          'dim'),
      F('video_asset',         '视频素材 Video',          'dim'),
      F('title_asset',         '标题素材 Title',          'dim'),
      F('body_asset',          '正文素材 Body',           'dim'),
      F('call_to_action_asset','行动号召素材 CTA',         'dim'),
      F('ad_format_asset',     '广告格式素材 Ad Format',   'dim')
    ]},
    { id: 'basic_metrics', name: 'BASIC METRICS 基础指标', fields: [
      F('spend',       '花费 Spend',        'metric', true),
      F('impressions', '展示量 Impressions','metric', true),
      F('clicks',      '点击量 Clicks',      'metric', true),
      F('ctr',         '点击率 CTR',         'metric', true),
      F('cpc',         '点击成本 CPC',       'metric', true),
      F('cpm',         '千次展示成本 CPM',   'metric', true),
      F('reach',       '覆盖人数 Reach',     'metric'),
      F('frequency',   '频次 Frequency',     'metric')
    ]},
    { id: 'conversions', name: 'CONVERSIONS 转化', fields: [
      F('conversions',         '转化量 Conversions',        'metric'),
      F('conversions_value',   '转化价值 Conv. Value',      'metric'),
      F('cost_per_conversion', '每次转化费用 Cost/Conv.',    'metric'),
      F('purchase',            '购买量 Purchase',           'metric'),
      F('total_purchase_value','总购买价值 Purchase Value',  'metric'),
      F('purchase_roas',       '购买ROAS Purchase ROAS',    'metric'),
      F('add_to_cart',         '加入购物车 Add to Cart',     'metric'),
      F('initiate_checkout',   '发起结账 Initiate Checkout', 'metric'),
      F('view_content',        '内容浏览 View Content',      'metric'),
      F('registration',        '注册量 Registration',       'metric'),
      F('app_install',         '应用安装 App Install',       'metric'),
      F('add_payment_info',    '添加支付信息 Add Payment',   'metric')
    ]},
    { id: 'video', name: 'VIDEO 视频', fields: [
      F('video_p25_watched_actions',  '视频25%播放 Video P25', 'metric'),
      F('video_p50_watched_actions',  '视频50%播放 Video P50', 'metric'),
      F('video_p75_watched_actions',  '视频75%播放 Video P75', 'metric'),
      F('video_p100_watched_actions', '视频完播 Video P100',   'metric'),
      F('video_avg_time_watched_actions', '平均观看时长 Avg Watch Time', 'metric')
    ]}
  ],

  /* ---------------- Google ---------------- */
  google: [
    { id: 'identifiers', name: 'IDENTIFIERS 标识与层级', fields: [
      F('customer_id',          '账户ID Customer ID',    'dim'),
      F('customer_name',        '账户名称 Customer Name','dim', true),
      F('campaign_id',          '广告系列ID Campaign ID', 'dim'),
      F('campaign_name',        '广告系列 Campaign',      'dim', true),
      F('ad_group_id',          '广告组ID Ad Group ID',  'dim'),
      F('ad_group_name',        '广告组 Ad Group',       'dim'),
      F('ad_id',                '广告ID Ad ID',          'dim'),
      F('ad_name',              '广告 Ad',               'dim')
    ]},
    { id: 'time', name: 'TIME 时间', fields: [
      F('date',        '日期 Date',     'dim', true),
      F('hour',        '小时 Hour',     'dim'),
      F('day_of_week', '星期几 Day',    'dim'),
      F('week',        '周 Week',       'dim'),
      F('month',       '月 Month',      'dim'),
      F('quarter',     '季度 Quarter',  'dim'),
      F('year',        '年 Year',       'dim')
    ]},
    { id: 'device_network', name: 'DEVICE & NETWORK 设备与网络', fields: [
      F('device',          '设备类型 Device',         'dim'),
      F('ad_network_type', '广告网络类型 Network',     'dim'),
      F('click_type',      '点击类型 Click Type',     'dim'),
      F('slot',            '广告位置 Slot',           'dim')
    ]},
    { id: 'keyword_search', name: 'KEYWORD & SEARCH 关键词与搜索', fields: [
      F('keyword_text',       '关键词文本 Keyword',     'dim'),
      F('keyword_match_type', '关键词匹配类型 Match Type','dim'),
      F('search_term',        '搜索词 Search Term',     'dim')
    ]},
    { id: 'geographic', name: 'GEOGRAPHIC 地区', fields: [
      F('geo_target_country','地理定向国家 Country', 'dim'),
      F('geo_target_city',   '地理定向城市 City',     'dim'),
      F('geo_target_region', '地理定向地区 Region',   'dim'),
      F('geo_target_state',  '地理定向州/省 State',   'dim'),
      F('geo_target_metro',  '地理定向都市圈 Metro',  'dim')
    ]},
    { id: 'conversion_seg', name: 'CONVERSION 转化拆分', fields: [
      F('conversion_action_name',     '转化行为名称 Conv. Action', 'dim'),
      F('conversion_action_category', '转化行为类别 Conv. Category','dim')
    ]},
    { id: 'status', name: 'STATUS & CONFIG 状态与配置', fields: [
      F('campaign_status',                  '广告系列状态 Campaign Status', 'dim'),
      F('campaign_advertising_channel_type','广告渠道类型 Channel Type',     'dim'),
      F('bidding_strategy_type',            '出价策略 Bid Strategy',         'dim'),
      F('ad_group_status',                  '广告组状态 Ad Group Status',    'dim'),
      F('currency_code',                    '货币代码 Currency',             'dim')
    ]},
    { id: 'basic_metrics', name: 'BASIC METRICS 基础指标', fields: [
      F('cost_micros',  '花费 Cost',           'metric', true),
      F('impressions',  '展示量 Impressions',  'metric', true),
      F('clicks',       '点击量 Clicks',        'metric', true),
      F('ctr',          '点击率 CTR',           'metric', true),
      F('average_cpc',  '平均点击成本 Avg.CPC', 'metric', true),
      F('average_cpm',  '平均千次展示成本 Avg.CPM','metric', true),
      F('average_cost', '平均费用 Avg.Cost',    'metric')
    ]},
    { id: 'conversions', name: 'CONVERSIONS 转化', fields: [
      F('conversions',              '转化量 Conversions',       'metric'),
      F('conversions_value',        '转化价值 Conv. Value',     'metric'),
      F('cost_per_conversion',      '每次转化费用 Cost/Conv.',   'metric'),
      F('conversions_value_per_cost','转化价值/花费 ROAS',       'metric'),
      F('all_conversions',          '总转化量 All Conv.',       'metric'),
      F('all_conversions_value',    '总转化价值 All Conv. Value','metric'),
      F('view_through_conversions', '浏览转化量 View-through',   'metric'),
      F('conversion_rate',          '转化率 Conv. Rate',        'metric')
    ]},
    { id: 'engagement', name: 'ENGAGEMENT 互动', fields: [
      F('engagements',     '互动量 Engagements',      'metric'),
      F('engagement_rate', '互动率 Engagement Rate',  'metric'),
      F('interactions',    '互动数 Interactions',     'metric'),
      F('interaction_rate','互动率 Interaction Rate', 'metric')
    ]},
    { id: 'impr_share', name: 'IMPRESSION SHARE 展示份额', fields: [
      F('search_impression_share',        '搜索展示份额 Search IS',     'metric'),
      F('search_top_impression_share',    '搜索顶部展示份额 Top IS',     'metric'),
      F('absolute_top_impression_percentage','绝对顶部展示率 Abs Top %', 'metric'),
      F('search_click_share',             '搜索点击份额 Click Share',    'metric')
    ]},
    { id: 'video', name: 'VIDEO 视频', fields: [
      F('video_trueview_views',     'TrueView观看量 TrueView Views', 'metric'),
      F('video_trueview_view_rate', 'TrueView观看率 View Rate',      'metric'),
      F('video_quartile_p100_rate', '视频完播率 Video P100',         'metric'),
      F('video_watch_time_duration_millis', '视频总观看时长 Watch Time', 'metric')
    ]},
    { id: 'active_view', name: 'ACTIVE VIEW 可见曝光', fields: [
      F('active_view_impressions', '可见展示量 AV Impr.',  'metric'),
      F('active_view_ctr',         '可见点击率 AV CTR',    'metric'),
      F('active_view_viewability', '可见性 Viewability',   'metric')
    ]},
    { id: 'shopping', name: 'SHOPPING & REVENUE 购物与营收', fields: [
      F('orders',                    '订单量 Orders',        'metric'),
      F('revenue_micros',            '营收 Revenue',         'metric'),
      F('units_sold',                '销售件数 Units Sold',  'metric'),
      F('average_order_value_micros','平均订单价值 AOV',     'metric')
    ]}
  ],

  /* ---------------- TikTok ---------------- */
  tiktok: [
    { id: 'identifiers', name: 'IDENTIFIERS 标识与层级', fields: [
      F('advertiser_id', '广告主ID Advertiser ID', 'dim', true),
      F('campaign_id',   '广告系列ID Campaign ID',  'dim', true),
      F('adgroup_id',    '广告组ID Ad Group ID',    'dim'),
      F('ad_id',         '广告ID Ad ID',            'dim')
    ]},
    { id: 'time', name: 'TIME 时间', fields: [
      F('stat_time_day',  '日期 Date',  'dim', true),
      F('stat_time_hour', '小时 Hour',  'dim')
    ]},
    { id: 'demographic', name: 'DEMOGRAPHIC 受众', fields: [
      F('age',               '年龄 Age',           'dim'),
      F('gender',            '性别 Gender',         'dim'),
      F('interest_category', '兴趣分类 Interest',   'dim'),
      F('language',          '语言 Language',       'dim'),
      F('audience_type',     '受众类型 Audience',   'dim'),
      F('ac',                '受众分类 AC',         'dim')
    ]},
    { id: 'platform_device', name: 'PLATFORM & DEVICE 版位与设备', fields: [
      F('country_code', '国家 Country',     'dim'),
      F('platform',     '投放平台 Platform','dim'),
      F('placement',    '广告版位 Placement','dim')
    ]},
    { id: 'creative', name: 'CREATIVE 创意', fields: [
      F('tiktok_item_id',       'TikTok内容ID Item ID',     'dim'),
      F('tiktok_account_id',    'TikTok账号ID Account ID',  'dim'),
      F('tiktok_subplacements', 'TikTok子版位 Subplacement','dim')
    ]},
    { id: 'basic_metrics', name: 'BASIC METRICS 基础指标', fields: [
      F('spend',       '花费 Spend',        'metric', true),
      F('impressions', '展示量 Impressions','metric', true),
      F('clicks',      '点击量 Clicks',      'metric', true),
      F('ctr',         '点击率 CTR',         'metric', true),
      F('cpc',         '点击成本 CPC',       'metric', true),
      F('cpm',         '千次展示成本 CPM',   'metric', true),
      F('reach',       '覆盖人数 Reach',     'metric'),
      F('frequency',   '频次 Frequency',     'metric'),
      F('budget',      '预算 Budget',        'metric')
    ]},
    { id: 'conversions', name: 'CONVERSIONS 转化', fields: [
      F('conversion',          '转化量 Conversion',        'metric'),
      F('conversion_rate',     '转化率 Conv. Rate',        'metric'),
      F('cost_per_conversion', '每次转化费用 Cost/Conv.',   'metric'),
      F('purchase',            '购买量 Purchase',          'metric'),
      F('total_purchase_value','总购买价值 Purchase Value', 'metric'),
      F('purchase_roas',       '购买ROAS Purchase ROAS',   'metric'),
      F('complete_payment',    '完成支付 Complete Payment', 'metric'),
      F('registration',        '注册量 Registration',      'metric'),
      F('app_install',         '应用安装 App Install',      'metric'),
      F('add_payment_info',    '添加支付信息 Add Payment',  'metric')
    ]},
    { id: 'engagement', name: 'ENGAGEMENT 互动', fields: [
      F('likes',          '点赞量 Likes',         'metric'),
      F('follows',        '关注量 Follows',       'metric'),
      F('comments',       '评论量 Comments',      'metric'),
      F('shares',         '分享量 Shares',        'metric'),
      F('profile_visits', '主页访问 Profile Visits','metric')
    ]},
    { id: 'video', name: 'VIDEO 视频', fields: [
      F('video_play_actions','视频播放量 Video Plays', 'metric'),
      F('video_watched_2s',  '视频2秒观看 2s Views',   'metric'),
      F('video_watched_6s',  '视频6秒观看 6s Views',   'metric'),
      F('video_views_p25',   '视频25%播放 Video P25',  'metric'),
      F('video_views_p50',   '视频50%播放 Video P50',  'metric'),
      F('video_views_p75',   '视频75%播放 Video P75',  'metric'),
      F('video_views_p100',  '视频完播 Video P100',    'metric'),
      F('engaged_view',      '有效观看 Engaged View',  'metric')
    ]}
  ],

  /* ---------------- Amazon ---------------- */
  amazon: [
    { id: 'identifiers', name: 'IDENTIFIERS 标识与层级', fields: [
      F('advertiserId', '广告主ID Advertiser ID', 'dim', true),
      F('campaignId',   '广告系列ID Campaign ID',  'dim', true),
      F('campaignName', '广告系列 Campaign',       'dim'),
      F('adGroupId',    '广告组ID Ad Group ID',    'dim'),
      F('adId',         '广告ID Ad ID',            'dim')
    ]},
    { id: 'time', name: 'TIME 时间', fields: [
      F('date', '日期 Date', 'dim', true)
    ]},
    { id: 'product', name: 'PRODUCT 商品', fields: [
      F('advertisedAsin', '推广ASIN Advertised ASIN', 'dim'),
      F('advertisedSku',  '推广SKU Advertised SKU',   'dim'),
      F('adProduct',      '广告产品类型 Ad Product',   'dim')
    ]},
    { id: 'status', name: 'STATUS & CONFIG 状态与配置', fields: [
      F('campaignStatus',     '广告系列状态 Campaign Status', 'dim'),
      F('campaignBudgetType', '预算类型 Budget Type',         'dim'),
      F('type',               '报告类型 Report Type',         'dim')
    ]},
    { id: 'basic_metrics', name: 'BASIC METRICS 基础指标', fields: [
      F('cost',        '花费 Cost',         'metric', true),
      F('impressions', '展示量 Impressions','metric', true),
      F('clicks',      '点击量 Clicks',      'metric', true),
      F('CTR',         '点击率 CTR',         'metric', true),
      F('eCPC',        '点击成本 eCPC',      'metric', true),
      F('eCPM',        '千次展示成本 eCPM',  'metric', true)
    ]},
    { id: 'detail_page', name: 'DETAIL PAGE 详情页', fields: [
      F('dpvViews14d',             '详情页浏览(14天) DPV 14d',     'metric'),
      F('totalDetailPageViews14d', '总详情页浏览(14天) Total DPV', 'metric'),
      F('totalAddToCart14d',       '加入购物车(14天) ATC 14d',     'metric'),
      F('totalAddToList14d',       '加入列表(14天) ATL 14d',       'metric')
    ]},
    { id: 'purchase', name: 'PURCHASE & SALES 购买与销售', fields: [
      F('totalPurchases14d',  '总购买(14天) Purchases 14d', 'metric'),
      F('totalPurchaseRate14d','总购买率(14天) Purchase Rate','metric'),
      F('totalSales14d',      '总销售额(14天) Sales 14d',   'metric'),
      F('totalUnitsSold14d',  '总销售件数(14天) Units 14d', 'metric'),
      F('newToBrandPurchases14d','品牌新客购买(14天) NTB',   'metric')
    ]},
    { id: 'attribution', name: 'ATTRIBUTION 归因窗口', fields: [
      F('purchases1d',  '购买量(1天) Purchases 1d',   'metric'),
      F('purchases7d',  '购买量(7天) Purchases 7d',   'metric'),
      F('purchases14d', '购买量(14天) Purchases 14d', 'metric'),
      F('purchases30d', '购买量(30天) Purchases 30d', 'metric'),
      F('sales7d',      '销售额(7天) Sales 7d',       'metric'),
      F('sales14d',     '销售额(14天) Sales 14d',     'metric'),
      F('sales30d',     '销售额(30天) Sales 30d',     'metric')
    ]},
    { id: 'viewability', name: 'VIEWABILITY 可见性', fields: [
      F('measurableImpressions', '可衡量展示 Measurable Impr.', 'metric'),
      F('viewableImpressions',   '可见展示 Viewable Impr.',     'metric'),
      F('viewabilityRate',       '可见率 Viewability Rate',     'metric'),
      F('videoCompleted',        '视频完播 Video Completed',    'metric'),
      F('videoStarted',          '视频开始播放 Video Started',  'metric')
    ]},
    { id: 'fee', name: 'FEE 费用', fields: [
      F('totalFee',  '总费用 Total Fee',  'metric'),
      F('agencyFee', '代理费 Agency Fee', 'metric')
    ]}
  ]
};

/* =========================================================
 * 平台上下文：通过 URL 参数 ?platform=facebook|google|tiktok|amazon
 * 决定当前配置哪个平台。默认 facebook。
 * ========================================================= */
function getPlatformKey() {
  try {
    const p = new URLSearchParams(window.location.search).get('platform');
    if (p && FIELDS_BY_PLATFORM[p]) return p;
  } catch (e) {}
  return 'facebook';
}

const ACTIVE_PLATFORM = getPlatformKey();
const ACTIVE_META = PLATFORM_META[ACTIVE_PLATFORM];
const FIELD_CATEGORIES = FIELDS_BY_PLATFORM[ACTIVE_PLATFORM];

/* 扁平索引 */
const FIELD_INDEX = {};
FIELD_CATEGORIES.forEach(cat => cat.fields.forEach(f => { FIELD_INDEX[f.id] = { ...f, catId: cat.id, catName: cat.name }; }));

/* 常用字段 id（默认勾选） */
const COMMON_FIELDS = FIELD_CATEGORIES.flatMap(c => c.fields.filter(f => f.common).map(f => f.id));

/* 广告账户扁平索引 */
const AD_ACCOUNT_INDEX = {};
PLATFORM_ACCOUNTS.forEach(p => p.adAccounts.forEach(a => { AD_ACCOUNT_INDEX[a.id] = { ...a, platformId: p.id }; }));
function getPlatformAccount(id) { return PLATFORM_ACCOUNTS.find(p => p.id === id); }
/* 最近一次授权的平台账户（按 authorizedAt 倒序） */
function getLatestAuthorizedAccount() {
  return [...PLATFORM_ACCOUNTS].sort((a, b) => (b.authorizedAt || '').localeCompare(a.authorizedAt || ''))[0];
}
