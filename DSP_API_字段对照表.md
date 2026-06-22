# Amazon DSP API 字段对照表（预估 vs 官方）

> 用途：拿到官方 OpenAPI 文档后，在「官方实际值」列逐项填写，「差异/备注」列标注不一致点。
>
> 置信度：🟢 高 / 🟡 中 / 🔴 低（重点核实）
>
> 核实状态：⬜ 未核实 / ✅ 已确认一致 / ⚠️ 有差异 / ❌ 预估错误

---

## 0. 核实进度总览

| 模块 | 字段数 | 已核实 | 重点风险项 |
|---|---|---|---|
| 通用规范 | 3 | 0 | base path |
| Advertiser | 1 接口 | 0 | - |
| Order | 35+ | UI层✅(API字段名待定) | goal→KPI联动 / frequencyCaps数组 / products |
| Line Item | 50+ | UI层✅(API字段名待定) | mediaType分支 / inventory三级 / targeting10+维度 / 竞价模型 |
| Creative | 80+ | UI层✅(API字段名待定) | 4大类Tab / 子类型分支 / clickThrough分支 / COMPONENT_BASED 3着陆页分支 |
| Audience | 2 | 0 | category 枚举 |
| 错误/限流 | - | 0 | 限流真实数值 |

> Order 层已据 DSP 后台真实截图（8批）在 UI 层确认全部字段，详见 §3.2–3.6。
> LineItem 层已据 DSP 后台真实截图（6批）在 UI 层确认全部字段，详见 §4.2–4.14。
> Creative 层已据 DSP 后台真实截图（12批）在 UI 层确认全部字段，详见 §5.2–5.10。
> API 侧字段命名仍待 OpenAPI 文档核实。

---

## 1. 通用规范

| 项 | 预估值 | 置信度 | 官方实际值 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|
| US Base URL | `https://advertising-api.amazon.com` | 🟢 | | ⬜ | |
| EU Base URL | `https://advertising-api-eu.amazon.com` | 🟢 | | ⬜ | |
| FE Base URL | `https://advertising-api-fe.amazon.com` | 🟢 | | ⬜ | |
| DSP 根路径 | `/dsp/` | 🟡 | | ⬜ | **高优先级**：是否真为 /dsp/ |
| Token 端点 | `POST https://api.amazon.com/auth/o2/token` | 🟢 | | ⬜ | |
| access_token 有效期 | 3600s | 🟢 | | ⬜ | |
| Header: Authorization | `Bearer {token}` | 🟢 | | ⬜ | |
| Header: ClientId | `Amazon-Advertising-API-ClientId` | 🟢 | | ⬜ | |
| Header: Scope | `Amazon-Advertising-API-Scope` (profileId) | 🟢 | | ⬜ | |
| Content-Type | `application/json` | 🟡 | | ⬜ | DSP 可能用专属 media type 做版本控制 |

---

## 2. Advertiser API

| 项 | 预估值 | 置信度 | 官方实际值 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|
| 列表接口 | `GET /dsp/advertisers` | 🟡 | | ⬜ | |
| resp.advertiserId | string | 🟡 | | ⬜ | |
| resp.currency | string | 🟡 | | ⬜ | |
| resp.country | string | 🟡 | | ⬜ | |
| resp.timezone | string | 🟡 | | ⬜ | |
| 分页字段 | `nextToken` | 🟡 | | ⬜ | 是否 token 分页 |

---

## 3. Order API

### 3.1 接口

| 操作 | 预估路径 | 置信度 | 官方实际值 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|
| 创建 | `POST /dsp/orders` | 🟡 | | ⬜ | |
| 查单个 | `GET /dsp/orders/{orderId}` | 🟡 | | ⬜ | |
| 查列表 | `GET /dsp/orders?advertiserId=` | 🟡 | | ⬜ | |
| 更新 | `PUT/PATCH /dsp/orders/{orderId}` | 🟡 | | ⬜ | PUT 还是 PATCH |
| 归档 | `DELETE` 或 `PUT status` | 🟡 | | ⬜ | |

### 3.2 字段（已按 DSP 后台真实截图修正 — 2026-06）

> 来源说明：以下「官方实际值」列来自用户提供的 DSP 创建订单页面真实截图（8 批），UI 层确认；API 字段名仍为推断（标 🟡），需拿到 OpenAPI 后再确认接口侧命名。
> 核实状态：✅=UI已确认 / 🟦=UI确认但API字段名待定 / ⬜未核实

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| advertiserId | string | ✅ | 🟢 | 订单归属广告主 | ✅ | |
| name | string | ✅ | 🟢 | 名称（必填输入框） | ✅ | |
| poNumber | string | ❌ | 🟢 | **PO编号**（采购订单号，可空） | ✅ | 原预估的 externalId 实为此字段 |
| advertiserDomain | string | ❌ | 🟢 | **广告主域名**（合规用，可空） | ✅ | |
| notes | string | ❌ | 🟢 | **备注**（仅工具内可见，不下发投放） | ✅ | |
| amazonPromotion | bool | ❌ | 🟢 | **亚马逊促销**勾选框 | ✅ | 勾选→联动限制订单项类型、隐藏 mediaTypes |
| mediaTypes | enum[] | 条件 | 🟢 | **媒体类型**(多选)：展示/在线视频/流媒体电视/音频 | ✅ | 仅 amazonPromotion=false 时显示 |
| startDateTime | datetime+tz | ✅ | 🟢 | 投放开始（日期+时间+**时区如PDT**） | ✅ | 时区随广告主，非纯UTC |
| endDateTime | datetime+tz | ❌ | 🟢 | 投放结束（可空=长期） | ✅ | |
| budget.amount | number | ✅ | 🟢 | 预算金额 $ | ✅ | |
| budget.currencyCode | string | ✅ | 🟢 | 币种 | ✅ | |
| unusedBudgetAction | enum | ❌ | 🟢 | **未使用预算**单选 | ✅ | 见 3.3 枚举 |
| budgetCap.type | enum | ❌ | 🟢 | **预算上限**：每日/每月 | ✅ | |
| budgetCap.amount | number | ❌ | 🟢 | 上限金额 $ | ✅ | |
| agencyFee.type | enum | ❌ | 🟢 | **代理费**：百分比/固定 | ✅ | 有订单项时锁定不可改 |
| agencyFee.value | number | ❌ | 🟢 | 代理费值 (% 或 $) | ✅ | |
| goal | enum | ✅ | 🟢 | **目标**单选（3选1） | ✅ | 见 3.3，联动 KPI |
| goalKpi.type | enum | 条件 | 🟢 | **KPI**（由 goal 联动出不同候选） | ✅ | 见 3.4 联动表 |
| goalKpi.value | number | ❌ | 🟢 | KPI目标值（单位随KPI联动） | ✅ | 触达无此框 |
| goalKpi.unit | enum | 派生 | 🟢 | 单位：%/$/次数（随KPI联动） | ✅ | 前端派生，未必是独立API字段 |
| goalKpi.noTarget | bool | ❌ | 🟢 | **「请不要设置KPI目标值」**复选框 | ✅ | 多数KPI有此选项 |
| optimization.priority | enum | ❌ | 🟢 | **竞价优先级**：优先用完预算/优先KPI目标值 | ✅ | |
| optimization.budgetAllocation | enum | ❌ | 🟢 | **预算管理**：自动分配/手动管理 | ✅ | |
| frequencyCaps[] | object[] | ❌ | 🟢 | **频次上限**（可加多条） | ✅ | **数组**！见 3.5 |
| frequencyCaps[].maxImpressions | int | - | 🟢 | 展示次数上限 | ✅ | |
| frequencyCaps[].timeValue | int | - | 🟢 | 时间窗口值 | ✅ | |
| frequencyCaps[].timeUnit | enum | - | 🟢 | 天/小时/分钟 | ✅ | 注意：非 WEEK/MONTH |
| frequencyCaps[].scope | enum | - | 🟢 | 用户/家庭 | ✅ | |
| includeLinearTVInFrequency | bool | ❌ | 🟢 | 将传统电视广告展示计入频次 | ✅ | |
| frequencyGroupId | string(ref) | ❌ | 🟢 | **频次组**（引用已有有效组） | ✅ | ⚠️只能引用「有效」的已存在组，需预校验 |
| products[] | object[] | 条件 | 🟢 | 关联ASIN启用商品转化指标 | ✅ | 见 3.6；Performance+ 需≥1个首选ASIN |
| products[].asin | string | - | 🟢 | 商品 ASIN | ✅ | |
| products[].featured | bool/enum | - | 🟢 | 设为精选（如"是的,有变体"） | ✅ | |
| products[].marketplace | string | - | 🟢 | 亚马逊域（站点） | ✅ | |
| autoGenerateResponsiveAd | bool | ❌ | 🟢 | 自动生成自适应广告（默认On） | ✅ | |
| offAmazonConversions[] | object[] | ❌ | 🟢 | 站外转化事件（名称/来源/转化类型） | ✅ | 替代原预估 pixelIds |
| commitments[] | object[] | ❌ | 🟡 | 继承的承诺(只读)+订单承诺 | 🟦 | 高级选项，入口 DSP>广告库存>承诺 |

> ❌ 已废弃的早期错误预估：`productLine`（实际是 `mediaTypes` 多选）、`frequencyCap` 单对象（实际数组）、`conversionTracking.pixelIds`（实际 products + offAmazonConversions）。

### 3.3 基础枚举（已确认）

| 枚举名 | 真实值 | 置信度 | 核实状态 |
|---|---|---|---|
| goal | AWARENESS(认知度) / CONSIDERATION(购买意向) / CONVERSIONS(转化量) | 🟢 | ✅ 实为3选1，原5枚举错误 |
| mediaTypes | DISPLAY(展示) / ONLINE_VIDEO(在线视频) / STREAMING_TV(流媒体电视) / AUDIO(音频) | 🟢 | ✅ 多选 |
| unusedBudgetAction | NO_CHANGE(不更改) / ROLLOVER_PACING(结转提前投放) / ROLLOVER_CUMULATIVE(结转累计) | 🟢 | ✅ |
| budgetCap.type | DAILY(每日) / MONTHLY(每月) | 🟢 | ✅ |
| agencyFee.type | PERCENTAGE(百分比) / FIXED(固定) | 🟢 | ✅ |
| optimization.priority | SPEND_FULL_BUDGET(优先用完预算) / KPI_TARGET(优先KPI目标值) | 🟢 | ✅ |
| optimization.budgetAllocation | AUTO(自动分配) / MANUAL(手动管理) | 🟢 | ✅ |
| frequencyCaps[].timeUnit | DAY(天) / HOUR(小时) / MINUTE(分钟) | 🟢 | ✅ 注意无 WEEK/MONTH |
| frequencyCaps[].scope | USER(用户) / HOUSEHOLD(家庭) | 🟢 | ✅ |
| Order status | DRAFT / ACTIVE / PAUSED / ARCHIVED | 🟡 | ⬜ 状态机仍待API确认 |

### 3.4 goal → KPI 联动表（核心，已确认）

> goal 单选后，KPI 下拉只显示对应组的候选值。这是早期预估错得最多的部分。

| goal | 可选 KPI | KPI目标值单位 |
|---|---|---|
| **AWARENESS(认知度)** | 触达(REACH) | 无目标值输入框 |
| | 频率(FREQUENCY) | 次数下拉(2/3/4/5 times,每周) |
| | 电视增量触达(INCREMENTAL_TV_REACH) | 多出「品牌」下拉(需联系PSC) |
| **CONSIDERATION(购买意向)** | CTR | % |
| | CPC | $ |
| | 视频单次完播成本(CPVC) | $ |
| | VCR(视频完播率) | % |
| | CPDPV(单次详情页浏览成本) | $ |
| | DPVR(详情页浏览率) | % |
| **CONVERSIONS(转化量)** | ROAS | 倍数/比率 |
| | T-ROAS(总ROAS) | 倍数/比率 |
| | CPA | $ |
| | C-ROAS | 倍数/比率 |
| | CPSU(单次订阅成本) | $ |
| | CPFAO(首单成本) | $ |

> 通用：除「触达」外多数 KPI 有「请不要设置KPI目标值」复选框；勾选后 value 置空。

### 3.5 frequencyCaps 数组结构（已确认）

```jsonc
"frequencyCaps": [
  {
    "maxImpressions": 3,      // 展示次数不得超过
    "timeValue": 1,           // 时间窗口值
    "timeUnit": "DAY",        // DAY / HOUR / MINUTE
    "scope": "USER"           // USER(用户) / HOUSEHOLD(家庭)
  }
  // 可「添加其他频率上限」→ 多条
],
"includeLinearTVInFrequency": false,  // 将传统电视广告展示计入频次
"frequencyGroupId": null               // ⚠️ 仅可引用已存在的「有效」频次组
```

### 3.6 转化跟踪结构（已确认，替代旧 conversionTracking 预估）

```jsonc
"products": [                          // 关联ASIN启用商品转化指标(详情页浏览/加心愿单)
  { "asin": "B0...", "featured": true, "marketplace": "ATVPDKIKX0DER" }
  // 录入方式：复制粘贴(≤2000) 或 上传CSV(>2000)
],
"autoGenerateResponsiveAd": true,      // 默认On
"offAmazonConversions": [              // 站外转化事件，跟踪站外绩效
  { "name": "...", "source": "...", "conversionType": "..." }
]
// ⚠️ Performance+ 自动广告活动需至少 1 个首选(featured) ASIN
```

---

## 4. Line Item API（最核心，已按真实截图重构 — 2026-06）

> 来源说明：以下「UI 真实表现」列来自用户提供的 DSP 创建订单项页面真实截图（6 批），UI 层确认；API 字段名仍为推断（标 🟡），需拿到 OpenAPI 后再确认接口侧命名。
> 核实状态：✅=UI已确认 / 🟦=UI确认但API字段名待定 / ⬜未核实

### 4.1 接口

| 操作 | 预估路径 | 置信度 | 官方实际值 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|
| 创建（单条） | `POST /dsp/lineItems` | 🟡 | | ⬜ | |
| **批量创建** | `POST /dsp/lineItems/batch`（存疑） | 🔴 | | ⬜ | **架构关键**：原生 batch 是否存在 |
| 查单个 | `GET /dsp/lineItems/{id}` | 🟡 | | ⬜ | |
| 更新 | `PUT/PATCH /dsp/lineItems/{id}` | 🟡 | | ⬜ | |

### 4.2 基本字段（已确认）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| orderId | string | ✅ | 🟢 | 下拉选择所属订单（可搜索） | ✅ | 批量场景下从上一步 Order 自动带入 |
| name | string | ✅ | 🟢 | 名称（必填输入框） | ✅ | |
| externalId | string | ❌ | 🟢 | **外部 ID 或采购订单**（可选） | ✅ | 与 Order 层 poNumber 呼应 |
| notes | string | ❌ | 🟢 | **备注**（可选多行文本框） | ✅ | |
| status | enum | ✅ | 🟢 | LineItem 状态（创建时默认 PAUSED） | ✅ | |

### 4.3 媒体类型（Media Type）**分支型核心字段**（已确认）

> ⚠️ LineItem 的媒体类型决定整个订单项形态，是**单选卡片**，每种类型联动展开不同的子配置区块。

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| mediaType | enum | ✅ | 🟢 | **媒体类型**单选卡片 | ✅ | 见 4.4 枚举，原预估的 lineItemType 就是此字段 |
| media.devices[] | enum[] | 条件 | 🟢 | 设备：电脑端/移动端（多选） | ✅ | 仅 DISPLAY 类型显示 |
| media.mobileEnvironments[] | enum[] | 条件 | 🟢 | 移动环境：网页/应用程序（多选） | ✅ | 仅 DISPLAY 类型显示 |
| media.streamingTvPlan | enum | 条件 | 🟢 | 方案：所有内容/直播活动优化器 | ✅ | 仅 STREAMING_TV 类型显示 |
| media.doohProductLocation | enum | 条件 | 🟢 | Product location: Sold in-store / Not sold in-store | ✅ | 仅 DIGITAL_OUT_OF_HOME 类型显示 |

### 4.4 媒体类型枚举（已确认，❌原预估完全错误）

| 枚举名 | 真实值 | 置信度 | 核实状态 |
|---|---|---|---|
| mediaType | DISPLAY(展示) / STREAMING_TV(流媒体电视) / ONLINE_VIDEO(在线视频) / AUDIO(音频) / DIGITAL_OUT_OF_HOME(数字户外广告) | 🟢 | ✅ UI 确认5种+「显示更多」可能还有 |
| media.devices | DESKTOP(电脑端) / MOBILE(移动端) | 🟢 | ✅ |
| media.mobileEnvironments | WEB(网页) / APP(应用程序) | 🟢 | ✅ |
| media.streamingTvPlan | ALL_CONTENT(所有内容) / LIVE_EVENTS_OPTIMIZER(直播活动优化器) | 🟢 | ✅ |
| media.doohProductLocation | SOLD_IN_STORE / NOT_SOLD_IN_STORE | 🟢 | ✅ |

> ❌ 废弃的早期错误预估：`lineItemType: STANDARD_DISPLAY/VIDEO/OTT/MOBILE_APP/AAP_DISPLAY/AAP_VIDEO` 全错，真实是 `mediaType` 五大类+分支联动。

### 4.5 产品和服务类别（Products and Services）（已确认）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| productCategories[] | string[] | ❌ | 🟢 | **两级树形多选**（顶级分类×子类） | ✅ | 如 Automotive > Audio Video & Gadgets；Beauty & Fashion > Accessories |

> 枚举量极大（10+ 顶级分类 × 各自数十子类），真实接入需字典接口拉取。Demo 仅放代表值 + 注释说明。

### 4.6 库存（Inventory）区块（已确认，❌原 supplySources 预估结构错误）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| inventory.type | enum | ✅ | 🟢 | **广告库存类型**：所有出版商(自动) / 手动选择出版商 | ✅ | 见 4.7 枚举 |
| inventory.publishers[] | string[] | 条件 | 🟢 | **三大类出版商多选**（手动时必填） | ✅ | 见 4.8 结构 |
| inventory.deals[] | string[] | ❌ | 🟢 | **交易**（引用 PMP/私有交易） | ✅ | 引用型，默认"无" |
| inventory.groupId | string(ref) | ❌ | 🟢 | **库存组**（引用已有库存组） | ✅ | 引用型，默认"无" |

### 4.7 库存类型枚举（已确认）

| 枚举名 | 真实值 | 置信度 | 核实状态 |
|---|---|---|---|
| inventory.type | ALL_PUBLISHERS(所有出版商-自动) / MANUAL_PUBLISHERS(手动选择出版商) | 🟢 | ✅ |

### 4.8 库存出版商三级结构（已确认，手动选择时）

```jsonc
"inventory": {
  "type": "MANUAL_PUBLISHERS",
  "publishers": [
    // ===== 亚马逊自有自营网络 (Amazon O&O) =====
    "ALEXA", "AMAZON", "AMAZON_DIGITAL_SIGNAGE", "FIRE_TV", "FIRE_TABLET",
    "GOODREADS", "IMDB", "PRIME_VIDEO", "TWITCH",
    
    // ===== Amazon Publisher Direct =====
    "AMAZON_PUBLISHER_DIRECT",
    
    // ===== 第三方广告交易平台 (Third-party Exchanges) =====
    // 「显示全部」（枚举量大，需字典接口）
  ],
  "deals": [],         // 交易/PMP，引用型
  "groupId": null      // 库存组，引用型
}
```

> ⚠️ 出版商粒度极细（具体到 Alexa/Goodreads/Prime Video 单个产品），真实接入需字典接口拉取全量枚举。

### 4.9 定向策略（Targeting）**10+ 独立维度**（已确认，❌原预估结构过于简化）

> ⚠️ 原预估将定向打平为单层 targeting 对象是错误的。真实结构是：**10+ 个独立定向维度**，每个都是可选 add/更改 型子模块。

| 定向维度 | 字段名推断 | 类型 | 置信度 | UI 真实表现 | 核实状态 |
|---|---|---|---|---|---|
| **商品** | targeting.products[] | string[] | 🟢 | 商品定向（ASIN/品类） | ✅ |
| **场内客群类别** | targeting.inMarketSegments[] | string[] | 🟢 | 场内客群细分 | ✅ |
| **关键词** | targeting.keywords[] | object[] | 🟢 | 关键词定向（含匹配类型） | ✅ |
| **受众** | targeting.audiences.include[] / exclude[] | string[] | 🟢 | 受众 ID（include/exclude） | ✅ |
| **位置** | targeting.geo.include[] / exclude[] | object[] | 🟢 | 地理定向（定向/排除，支持多位置信号） | ✅ |
| **域名** | targeting.domains.include[] / exclude[] | string[] | 🟢 | 域名白/黑名单（默认"所有域名"） | ✅ |
| **内容相关投放** | (已迁移) | - | - | ⚠️ 已迁移到"商品、品类和关键词" | ✅ |
| **设备** | targeting.devices[] | enum[] | 🟢 | 设备定向（默认"所有设备"） | ✅ |
| **移动应用** | targeting.mobileApps.include[] / exclude[] | string[] | 🟢 | 移动应用白/黑名单（默认"所有移动应用"） | ✅ |
| **品牌适用性** `测试` | targeting.brandSuitability | enum | 🟢 | 标准 - 库存层级（第三方广告库存来源） | 🟦 |

> 注：位置（geo）确认支持"使用多个位置信号"、定向/排除、含粒度标注（Country / State / DMA / City / Postal Code）。

### 4.10 投放（Delivery）区块（已确认）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| delivery.startDateTime | datetime+tz | ✅ | 🟢 | 开始（日期+时间，**时区 PDT**） | ✅ | 与 Order 一致，时区随广告主 |
| delivery.endDateTime | datetime+tz | ✅ | 🟢 | 结束（日期+时间，时区 PDT） | ✅ | |
| delivery.budgetAllocation | enum | ✅ | 🟢 | **订单项预算**：自动预算分配/手动管理预算 | ✅ | 与 Order 层 budgetAllocation 同构 |
| delivery.spendLimits.dailyOrMonthly | number | ❌ | 🟢 | 设置每日或每月支出限额（复选框+金额） | ✅ | |
| delivery.spendLimits.dailyMinimum | number | ❌ | 🟢 | 设定每日最低支出（复选框+金额） | ✅ | |
| delivery.pacing.type | enum | ✅ | 🟢 | **投放进度**：均匀/提前/尽快 | ✅ | 见 4.11 枚举 |
| delivery.frequencyCap | object | ❌ | 🟢 | **频率**：复选框"限制顾客可以看到此广告的次数" | ✅ | 与 Order 层 frequencyCaps 结构完全一致 |

### 4.11 投放相关枚举（已确认）

| 枚举名 | 真实值 | 置信度 | 核实状态 |
|---|---|---|---|
| delivery.budgetAllocation | AUTO(自动预算分配) / MANUAL(手动管理预算) | 🟢 | ✅ 与 Order 同构 |
| delivery.pacing.type | EVEN(均匀) / FRONT_LOADED(提前) / ASAP(尽快) | 🟢 | ✅ 原预估枚举基本对 |

### 4.12 竞价（Bidding）区块（已确认，❌原 bidStrategy 预估完全错误）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| bidding.priority | (继承) | - | 🟢 | **竞价优先级**：只读继承自 Order | ✅ | 从 Order.optimization.priority 继承，LineItem 不重设 |
| bidding.baseBidCpm | number | ✅ | 🟢 | **基础竞价** US$ | ✅ | |
| bidding.maxCpmMode | enum | ✅ | 🟢 | **最高每千次展示成本(CPM)平均值**：自动优化/手动设置 | ✅ | 见 4.13 枚举 |
| bidding.maxCpmValue | number | 条件 | 🟢 | 手动设置时的 US$ 金额 | ✅ | 有校验提示（如"设为 US$13.55 或更高"） |
| bidding.adjustments | object | ❌ | 🟢 | **竞价调整** `New` Optional（默认"无"） | 🟦 | 可选高级功能 |

### 4.13 竞价相关枚举（已确认，❌原 bidStrategy 废弃）

| 枚举名 | 真实值 | 置信度 | 核实状态 |
|---|---|---|---|
| bidding.maxCpmMode | AUTO(自动优化) / MANUAL(手动设置) | 🟢 | ✅ |

> ❌ 废弃的早期错误预估：`bidStrategy: FIXED/DYNAMIC/OPTIMIZE_FOR_CLICKS/OPTIMIZE_FOR_CONVERSIONS/OPTIMIZE_FOR_REACH` 完全错误。真实竞价模型是：baseBidCpm + maxCpmMode(AUTO/MANUAL) + maxCpmValue + 竞价优先级从 Order 继承。

### 4.14 LineItem 状态枚举（部分确认）

| 枚举名 | 真实值 | 置信度 | 核实状态 |
|---|---|---|---|
| lineItem status | ACTIVE / PAUSED / ARCHIVED | 🟡 | 🟦 UI 层创建时默认 PAUSED，状态机待 API 确认 |

---

## 4.15 关键修正总结（早期预估 vs 真实）

| 维度 | 早期预估 | 真实截图 | 影响 |
|---|---|---|---|
| 媒体类型 | lineItemType 平铺枚举 | **mediaType 分支型**，每种类型展开不同子配置 | 🔴 架构级修正 |
| 库存 | supplySources 平铺数组 | **inventory 三级结构**：type(自动/手动) + publishers[O&O/APD/3P] + deals + groupId | 🔴 结构级修正 |
| 定向 | targeting 单层对象 | **10+ 独立维度**，每个都是 add/更改 型子模块 | 🔴 架构级修正 |
| 竞价 | bidStrategy 枚举 | baseBidCpm + maxCpmMode(AUTO/MANUAL) + **竞价优先级从 Order 继承** | 🔴 模型级修正 |
| 产品类别 | 无 | **productCategories 两级树形多选** | 🟡 新增字段 |
| 投放预算 | budget.budgetType | **delivery.budgetAllocation（与 Order 同构）** + spendLimits | 🟡 结构调整 |

---

## 5. Creative API（已按 DSP 后台真实截图修正 — 2026-06）

> 来源说明：以下「UI 真实表现」列来自用户提供的 DSP 创建创意页面真实截图（12 批），UI 层确认；API 字段名仍为推断（标 🟡），需拿到 OpenAPI 后再确认接口侧命名。
> 核实状态：✅=UI已确认 / 🟦=UI确认但API字段名待定 / ⬜未核实

### 5.1 接口

| 操作 | 预估路径 | 置信度 | 官方实际值 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|
| 上传素材 | `POST /dsp/assets/upload` (multipart) | 🟡 | | ⬜ | **核实流程**：一步还是两步 |
| 创建创意 | `POST /dsp/creatives` | 🟡 | | ⬜ | |
| 关联到 lineItem | `POST /dsp/lineItems/{id}/creatives` | 🟡 | | ⬜ | 或在 lineItem 里传 creativeIds |

### 5.2 通用字段（4大类都有）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| advertiserId | string | ✅ | 🟢 | 创意归属广告主 | ✅ | |
| name | string | ✅ | 🟢 | 名称（必填输入框） | ✅ | |
| site | string | 条件 | 🟢 | 站点下拉（US/BR/CA/MX...） | ✅ | 仅第三方展示/第三方视频有 |
| language | string | ✅ | 🟢 | 语言下拉（英语...） | ✅ | |
| externalId | string | ❌ | 🟢 | 外部编号（可选） | ✅ | |
| clickThrough | object | ✅ | 🟢 | **点击跳转**（分支型） | ✅ | 见 5.3 分支表 |
| thirdPartyTracking.impressionUrls[] | string[] | ❌ | 🟢 | 第三方展示量 URL（数组） | ✅ | 所有类型通用 |
| thirdPartyTracking.clickUrls[] | string[] | ❌ | 🟢 | 第三方点击量 URL（数组） | ✅ | 展示/视频有，音频/组件无 |
| otherHtml | string | ❌ | 🟢 | 其他 HTML（可选） | ✅ | 高级选项 |
| status | enum | ✅ | 🟢 | 创意状态（创建后初始 PENDING_REVIEW） | ✅ | |

### 5.3 clickThrough 分支枚举（不同类型支持不同子集）

| 类型 | 支持的 clickThrough 选项 | 置信度 | 核实状态 |
|---|---|---|---|
| **DISPLAY 标准展示** | BRAND_STORE(品牌旗舰店) / OTHER_WEBSITE(其他网站) | 🟢 | ✅ |
| **DISPLAY 第三方展示** | 下拉（指向亚马逊/其他网站） | 🟢 | ✅ |
| **VIDEO 标准视频** | AMAZON_PRODUCT(亚马逊站内商品,含ASIN) / BRAND_STORE / OTHER_WEBSITE | 🟢 | ✅ |
| **VIDEO 第三方视频** | 下拉（指向亚马逊/其他网站） | 🟢 | ✅ |
| **AUDIO 标准/播客** | AMAZON_PRODUCT / OTHER_WEBSITE | 🟢 | ✅ |
| **AUDIO 互动式** | 由 ctaType 替代（加入购物车/提醒我/发送更多信息） | 🟢 | ✅ |
| **COMPONENT_BASED** | AMAZON_PRODUCT(商品列表) / OTHER_WEBSITE / BRAND_STORE（**决定整个素材区结构**） | 🟢 | ✅ |

### 5.4 creativeType 枚举（已确认，❌原预估完全错误）

| 枚举名 | 真实值 | 置信度 | 核实状态 |
|---|---|---|---|
| creativeType | DISPLAY / VIDEO / AUDIO / COMPONENT_BASED | 🟢 | ✅ UI 确认4大类 Tab |
| DISPLAY 子类型 | STANDARD_DISPLAY(标准) / THIRD_PARTY_DISPLAY(第三方投放标签) | 🟢 | ✅ |
| VIDEO 子类型 | STANDARD_VIDEO(标准) / THIRD_PARTY_VIDEO(第三方VAST/VPAID) | 🟢 | ✅ |
| AUDIO 子类型 | STANDARD_AUDIO(标准音频) / INTERACTIVE_AUDIO(互动式音频) / PODCAST(播客) | 🟢 | ✅ |
| COMPONENT_BASED 子类型 | 无（单一类型，由 clickThrough 着陆页类型决定素材区结构） | 🟢 | ✅ |

> ❌ 废弃的早期错误预估：`DISPLAY_BANNER/DISPLAY_HTML5/VIDEO_VAST/VIDEO_VPAID/OTT_VIDEO/AUDIO/DYNAMIC_ECOMMERCE` 全错。真实是 4 大类 + 各自子类型。

### 5.5 DISPLAY 展示创意字段

#### 5.5.1 标准展示（STANDARD_DISPLAY）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| clickThrough.type | enum | ✅ | 🟢 | BRAND_STORE / OTHER_WEBSITE | ✅ | |
| clickThrough.storeId | string | 条件 | 🟢 | 品牌旗舰店 ID | ✅ | type=BRAND_STORE 时 |
| clickThrough.pageId | string | ❌ | 🟢 | 页面 ID | ✅ | type=BRAND_STORE 时可选 |
| clickThrough.url | string | 条件 | 🟢 | 目标 URL | ✅ | type=OTHER_WEBSITE 时 |
| adExperience | enum | ✅ | 🟢 | SINGLE_IMAGE(单图) / HTML5(动态) | 🟢 | ✅ |
| assets.images[] | object[] | 条件 | 🟢 | 图片数组（SINGLE_IMAGE 时） | ✅ | |
| assets.html5ZipAssetId | string | 条件 | 🟢 | HTML5 ZIP 文件 ID | ✅ | HTML5 时 |
| assets.backupImageAssetId | string | 条件 | 🟢 | 备用图片 ID | ✅ | HTML5 时必填 |
| settings.adChoicesPosition | enum | ❌ | 🟢 | 广告选择标识位置（左上/右上...） | ✅ | |
| settings.border | bool | ❌ | 🟢 | 边框 | ✅ | |
| supplyOpportunities.sizes[] | string[] | ✅ | 🟢 | 广告位尺寸多选（10+种） | ✅ | 见 5.5.3 枚举 |

#### 5.5.2 第三方展示（THIRD_PARTY_DISPLAY）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| tagSource | string | ✅ | 🟢 | 标签来源（HTML 标签粘贴） | ✅ | 核心素材 |
| size | string | ✅ | 🟢 | 尺寸下拉单选（10+种） | ✅ | 与标准展示枚举一致但为单选 |
| clickThrough.type | enum | ✅ | 🟢 | 下拉：指向亚马逊/其他网站 | ✅ | |

#### 5.5.3 展示广告位尺寸枚举（已确认）

| 枚举名 | 真实值 | 置信度 | 核实状态 |
|---|---|---|---|
| supplyOpportunities.sizes | 320x50 / 300x250 / 414x125 / 728x90 / 160x600 / 970x250 / 300x600 / 300x50 / 320x100 / 980x55 | 🟢 | ✅ UI 确认10种 |

### 5.6 VIDEO 视频创意字段

#### 5.6.1 标准视频（STANDARD_VIDEO）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| clickThrough.type | enum | ✅ | 🟢 | AMAZON_PRODUCT / BRAND_STORE / OTHER_WEBSITE | ✅ | 比展示多商品 ASIN |
| clickThrough.asin | string | 条件 | 🟢 | 商品 ASIN | ✅ | type=AMAZON_PRODUCT 时 |
| clickThrough.storeId | string | 条件 | 🟢 | 品牌旗舰店 ID | ✅ | type=BRAND_STORE 时 |
| clickThrough.url | string | 条件 | 🟢 | 目标 URL | ✅ | type=OTHER_WEBSITE 时 |
| videoAsset.assetId | string | ✅ | 🟢 | MP4 视频文件 ID | ✅ | 1920x1080 / 1080x1920 |
| adExperience[] | enum[] | ✅ | 🟢 | 在线视频/流媒体电视（多选） | ✅ | |
| vastThirdPartyVerificationUrl | string | ❌ | 🟢 | VAST 第三方验证 URL | ✅ | |
| creativeCategories[] | string[] | ❌ | 🟢 | 创意素材类别（40+复选框） | ✅ | 见 5.6.3 枚举 |

#### 5.6.2 第三方视频（THIRD_PARTY_VIDEO）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| vastTagUrl | string | ✅ | 🟢 | VAST/VPAID 标签 URL | ✅ | 核心素材 |
| clickThrough.type | enum | ✅ | 🟢 | 下拉：指向亚马逊/其他网站 | ✅ | |

#### 5.6.3 创意素材类别枚举（已确认，仅标准视频）

| 枚举名 | 真实值（代表性） | 置信度 | 核实状态 |
|---|---|---|---|
| creativeCategories | 酒类 / 交友 / 药品 / 博彩 / 政治 / 性保健 / 烟草 / 电子游戏 / 成人内容 / 误导性声明 ... （40+项） | 🟢 | ✅ UI 确认复选框，完整枚举需字典接口 |

### 5.7 AUDIO 音频创意字段

#### 5.7.1 标准音频（STANDARD_AUDIO）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| clickThrough.type | enum | ✅ | 🟢 | AMAZON_PRODUCT / OTHER_WEBSITE | ✅ | |
| clickThrough.asin | string | 条件 | 🟢 | 商品 ASIN（「添加商品」） | ✅ | type=AMAZON_PRODUCT 时 |
| clickThrough.url | string | 条件 | 🟢 | 目标 URL | ✅ | type=OTHER_WEBSITE 时 |
| audioAsset.assetId | string | ✅ | 🟢 | 音频文件 ID（MP3/WAV/OGG） | ✅ | ≤500MB, 10-30秒 |
| coverImage.assetId | string | ❌ | 🟢 | 配图 ID | ✅ | 1024x1024, ≤750KB |
| title | string | ❌ | 🟢 | 标题（≤50字符） | ✅ | |

#### 5.7.2 互动式音频（INTERACTIVE_AUDIO）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| audioAsset.assetId | string | ✅ | 🟢 | 音频文件 ID | ✅ | 同标准音频 |
| coverImage.assetId | string | ❌ | 🟢 | 配图 ID | ✅ | |
| title | string | ❌ | 🟢 | 标题（≤50字符） | ✅ | |
| brandName | string | ✅ | 🟢 | 品牌名称（Alexa 语音互动用） | ✅ | |
| ctaType | enum | ✅ | 🟢 | CTA 类型（3选1） | ✅ | 见 5.7.4 枚举 |
| products[] | object[] | 条件 | 🟢 | 关联商品（仅"加入购物车"CTA） | ✅ | 商品需有"加入购物车"行动号召 |
| containsAiGeneratedPersons | bool | ❌ | 🟢 | 声明含 AI 生成拟真人物 | ✅ | |

#### 5.7.3 播客（PODCAST）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| clickThrough.type | enum | ✅ | 🟢 | AMAZON_PRODUCT / OTHER_WEBSITE | ✅ | |
| audioAsset.assetId | string | ✅ | 🟢 | 音频文件 ID | ✅ | 同标准音频 |

#### 5.7.4 互动式音频 CTA 枚举（已确认）

| 枚举名 | 真实值 | 置信度 | 核实状态 |
|---|---|---|---|
| ctaType | ADD_TO_CART(加入购物车) / REMIND_ME(提醒我) / SEND_MORE_INFO(发送更多信息) | 🟢 | ✅ |

### 5.8 COMPONENT_BASED 基于组件创意字段

> ⚠️ 关键架构特征：clickThrough 的着陆页类型决定整个素材区结构，分 3 种分支。

#### 5.8.1 通用字段

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| clickThrough.type | enum | ✅ | 🟢 | AMAZON_PRODUCT / OTHER_WEBSITE / BRAND_STORE（**决定素材区结构**） | ✅ | 见 5.8.2–5.8.4 分支 |
| containsAiGeneratedPersons | bool | ❌ | 🟢 | 声明含 AI 生成拟真人物 | ✅ | 3 分支通用 |
| disclaimer | string | ❌ | 🟢 | 免责声明（≤60字符） | ✅ | 3 分支通用 |
| adPlacement.mode | enum | ✅ | 🟢 | 展示广告尺寸：响应式调整/特定尺寸 | ✅ | 见 5.8.5 枚举 |
| adPlacement.sizes[] | string[] | 条件 | 🟢 | 特定尺寸多选（10+种） | ✅ | mode=特定尺寸时 |

#### 5.8.2 分支 A：着陆页 = 亚马逊商品（clickThrough.type=AMAZON_PRODUCT）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| products[] | object[] | ✅ | 🟢 | 商品列表（搜索/输入列表/上传） | ✅ | 「创意素材竞争力」环 |
| videoAssets[] | object[] | ❌ | 🟢 | 视频（最多2项） | ✅ | 1920x1080+, MP4, ≤500MB |
| imageAssets[] | object[] | ❌ | 🟢 | 图片（建议15张） | ✅ | 600x600+, JPG/PNG, ≤5MB, 无文字叠加 |
| headlines[] | string[] | ❌ | 🟢 | 标题（≤50字符，多条） | ✅ | |
| logoAsset.assetId | string | ❌ | 🟢 | 徽标 | ✅ | 600x100+, ≤1MB |
| multiLanguageSupport | bool | ❌ | 🟢 | 多语言支持（生成多语言变体） | ✅ | |
| optimization | bool | ❌ | 🟢 | 优化（开发中的效果优化方案） | ✅ | |

#### 5.8.3 分支 B：着陆页 = 其他网站（clickThrough.type=OTHER_WEBSITE）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| clickThrough.url | string | ✅ | 🟢 | 目标 URL | ✅ | |
| brandName | string | ✅ | 🟢 | 品牌名称（≤25字符） | ✅ | |
| nativeVideo | bool | ❌ | 🟢 | 原生视频开关 | ✅ | 提示：不符合标准展示库存条件 |
| imageAssets[] | object[] | ❌ | 🟢 | 图片（15张） | ✅ | 600x600+, JPG/PNG, ≤5MB |
| imageContainsProduct | bool | ❌ | 🟢 | 图片需包含商品 | ✅ | |
| headlines[] | string[] | ❌ | 🟢 | 标题（≤50字符，多条） | ✅ | |
| logoAsset.assetId | string | ❌ | 🟢 | 徽标 | ✅ | 400x400+, ≤1MB |
| bodyTexts[] | string[] | ❌ | 🟢 | 正文文本（≤100字符，最多5项） | ✅ | |
| ctas[] | string[] | ❌ | 🟢 | 行动号召（下拉，最多5项） | ✅ | |

#### 5.8.4 分支 C：着陆页 = 品牌旗舰店（clickThrough.type=BRAND_STORE）

| 字段 | 类型 | 必填 | 置信度 | UI 真实表现 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|---|
| clickThrough.url | string | ✅ | 🟢 | 品牌旗舰店 URL | ✅ | |
| brandName | string | ✅ | 🟢 | 品牌名称（≤25字符） | ✅ | |
| headline | string | ❌ | 🟢 | 标题（≤50字符） | ✅ | |
| allowBrandPromotion | bool | ❌ | 🟢 | 允许添加品牌促销信息 | ✅ | |
| customImage.assetId | string | ❌ | 🟢 | 自定义图片（单张） | ✅ | 600x600+, ≤5MB |
| imageContainsProduct | bool | ❌ | 🟢 | 图片需包含商品 | ✅ | |
| logoAsset.assetId | string | ❌ | 🟢 | 徽标 | ✅ | 400x400+, 1:1 宽高比, ≤1MB |
| bodyText | string | ❌ | 🟢 | 正文文本（≤200字符） | ✅ | 注意：200字符，与B分支100不同 |
| cta | string | ❌ | 🟢 | 行动号召（下拉单选，默认"无"） | ✅ | |

#### 5.8.5 广告位枚举（已确认）

| 枚举名 | 真实值 | 置信度 | 核实状态 |
|---|---|---|---|
| adPlacement.mode | RESPONSIVE(使用响应式尺寸调整) / SPECIFIC(选择特定尺寸) | 🟢 | ✅ |
| adPlacement.sizes | 970x250 / 980x55 / 728x90 / 650x130 / 300x50 / 414x125 / 320x50 / 245x250 / 336x280 / 300x600 / 160x600 / 300x250 | 🟢 | ✅ UI 确认12种（IAB标准+仅限亚马逊） |

### 5.9 Creative 状态枚举（部分确认）

| 枚举名 | 真实值 | 置信度 | 核实状态 |
|---|---|---|---|
| creative status | PENDING_REVIEW(等待中) / ACTIVE / PAUSED / REJECTED / ARCHIVED | 🟡 | 🟦 UI 层确认创建后初始 PENDING_REVIEW，状态机待 API 确认 |

---

## 5.10 关键修正总结（早期预估 vs 真实）

| 维度 | 早期预估 | 真实截图 | 影响 |
|---|---|---|---|
| creativeType | DISPLAY_BANNER/DISPLAY_HTML5/VIDEO_VAST/... 平铺枚举 | **4大类Tab（DISPLAY/VIDEO/AUDIO/COMPONENT_BASED）+ 各自子类型** | 🔴 架构级修正 |
| clickThrough | 单一 clickThroughUrl 字段 | **分支型对象**，不同类型支持不同枚举，COMPONENT_BASED 的 clickThrough 决定整个素材区结构 | 🔴 架构级修正 |
| COMPONENT_BASED | 早期预估为 DYNAMIC_ECOMMERCE，结构未知 | **3种着陆页分支**（亚马逊商品/其他网站/品牌旗舰店），每种展开完全不同的素材区 | 🔴 架构级修正 |
| 第三方创意 | 未区分 | **标准/第三方是独立子类型**，字段差异大（第三方用标签粘贴/URL替代上传） | 🔴 结构级修正 |
| 音频 CTA | 未预估 | **互动式音频有 brandName + ctaType（3选1）+ 商品关联** | 🟡 新增字段 |
| 创意素材类别 | 未预估 | **仅标准视频有**，40+复选框（酒类/交友/药品/博彩...），内容分类用 | 🟡 新增字段 |
| 广告位配置 | format.width/height | **supplyOpportunities.sizes[] 多选**（展示）/ **adPlacement.mode + sizes[]**（组件） | 🟡 结构调整 |

> ⚠️ Creative 是 4 个模块中结构最复杂的：4 大类 × 子类型 × clickThrough 分支 × 素材区联动，真实接入需按类型分模块实现。

---

## 6. Audience API

| 项 | 预估值 | 置信度 | 官方实际值 | 核实状态 | 差异/备注 |
|---|---|---|---|---|---|
| 查询接口 | `GET /dsp/audiences?advertiserId=&category=` | 🟡 | | ⬜ | |
| resp.audienceId | string | 🟡 | | ⬜ | |
| resp.category | enum | 🟡 | | ⬜ | |
| resp.estimatedReach | number | 🟡 | | ⬜ | |

### 枚举核实

| 枚举名 | 预估值 | 置信度 | 官方实际值 | 核实状态 |
|---|---|---|---|---|
| audience category | IN_MARKET / LIFESTYLE / DEMOGRAPHIC / RETARGETING / LOOKALIKE / PIXEL_BASED / CRM_HASH / ADVERTISER_AUDIENCE | 🟡 | | ⬜ |

---

## 7. 错误码与限流

### 7.1 错误码（🟢 通用规范，基本可信）

| HTTP | 含义 | 处理 | 官方确认 | 核实状态 |
|---|---|---|---|---|
| 400 | 参数错误 | 检查 payload | | ⬜ |
| 401 | Token 失效 | 刷新 token | | ⬜ |
| 403 | 权限不足 | 检查 profile/scope | | ⬜ |
| 404 | 资源不存在 | 检查 ID | | ⬜ |
| 409 | 冲突 | 业务处理 | | ⬜ |
| 422 | 业务校验失败 | 看 details | | ⬜ |
| 429 | 限流 | 指数退避 | | ⬜ |
| 5xx | Amazon 侧 | 重试 | | ⬜ |

### 7.2 错误响应结构

| 字段 | 预估 | 置信度 | 官方实际值 | 核实状态 |
|---|---|---|---|---|
| code | string | 🟡 | | ⬜ |
| message | string | 🟡 | | ⬜ |
| details[].field/value/reason | object | 🟡 | | ⬜ |
| requestId | string | 🟡 | | ⬜ |

### 7.3 限流（🟡 全部需核实真实数值）

| 维度 | 预估 | 置信度 | 官方实际值 | 核实状态 |
|---|---|---|---|---|
| 全局 QPS | 10-20 RPS/profile | 🟡 | | ⬜ |
| 创建类 | 5 RPS | 🟡 | | ⬜ |
| 查询类 | 20 RPS | 🟡 | | ⬜ |
| 单批量实体上限 | 100-500 | 🟡 | | ⬜ |
| 限流响应头 | `x-amzn-RateLimit-Limit` | 🟡 | | ⬜ |

---

## 8. 架构关键决策点（必须先确认）

| 决策点 | 影响 | 当前判断 | 官方确认 | 状态 |
|---|---|---|---|---|
| 是否有原生批量端点 | 决定是否需要自建编排引擎 | 大概率无，按单条+编排设计 | | ⬜ |
| dayparting 时区 | 投放时段是否偏移 | 需核实 UTC/广告主时区 | | ⬜ |
| geo.type 各市场支持粒度 | 批量校验规则 | DMA 仅美国等 | | ⬜ |
| 创意上传是否两步 | 任务编排步骤数 | 推断两步（先 asset 后 creative） | | ⬜ |
| 是否有 sandbox 环境 | 测试方案 | 待确认 | | ⬜ |

---

## 9. 维护说明

1. 拿到官方 OpenAPI 后，逐行填「官方实际值」「核实状态」
2. 凡是 ❌/⚠️ 的，在「差异/备注」写清楚正确值
3. 核实完成后更新「0. 核实进度总览」的计数
4. DSP API 持续演进，建议每季度回看一次本表
