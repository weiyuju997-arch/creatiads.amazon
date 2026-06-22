# TikTok Connector 支持清单

## 一、Connector 类型（6种）

| Connector | 类型 | 说明 |
|---|---|---|
| TIKTOK_ACCOUNT | Metadata | 广告账户元数据 |
| TIKTOK_CAMPAIGN | Metadata | 广告系列元数据 |
| TIKTOK_ADGROUP | Metadata | 广告组元数据 |
| TIKTOK_AD | Metadata | 广告元数据 |
| TIKTOK_AD_COUNTRY | Report | 广告分国家效果报告 |
| TIKTOK_ACCOUNT_METADATA | Metadata | 账户信息（轻量） |

## 二、调用的 API 端点

Base URL: `https://business-api.tiktok.com/open_api/v1.3`

| API 端点 | 用途 | 对应 Connector |
|---|---|---|
| `/advertiser/info/` | 获取广告主账户信息 | TIKTOK_ACCOUNT, TIKTOK_ACCOUNT_METADATA |
| `/campaign/get/` | 获取广告系列列表 | TIKTOK_CAMPAIGN |
| `/adgroup/get/` | 获取广告组列表 | TIKTOK_ADGROUP |
| `/ad/get/` | 获取广告列表 | TIKTOK_AD |
| `/report/integrated/get/` | 获取效果报告 | TIKTOK_AD_COUNTRY |

## 三、Report 支持的维度（19个）

| 分类 | 维度字段 |
|---|---|
| **entity** | `advertiser_id`, `campaign_id`, `adgroup_id`, `ad_id` |
| **time** | `stat_time_day`, `stat_time_hour` |
| **demographic** | `age`, `gender` |
| **geographic** | `country_code`, `province_id`, `dma_id` |
| **platform** | `platform`, `placement`, `interest_category`, `language` |
| **audience** | `audience_type`, `ac` |
| **creative** | `tiktok_item_id`, `tiktok_account_id`, `tiktok_subplacements` |

## 四、Report 支持的指标（100+个）

### basic
`spend`, `cash_spend`, `voucher_spend`, `impressions`, `reach`, `clicks`, `ctr`, `cpc`, `cpm`, `frequency`, `currency`, `budget`, `bid`

### video
`video_play_actions`, `video_watched_2s`, `video_watched_6s`, `video_views_p25`, `video_views_p50`, `video_views_p75`, `video_views_p100`, `average_video_play`, `engaged_view`

### engagement
`likes`, `follows`, `comments`, `shares`, `clicks_on_music_disc`, `profile_visits`

### conversion
`conversion`, `conversion_rate`, `cost_per_conversion`, `real_time_conversion`, `purchase`, `complete_payment`, `registration`, `cost_per_purchase`, `purchase_roas`, `complete_payment_roas`, `value_per_complete_payment`, `total_purchase_value`, `total_purchase`

### app_install
`app_install`, `download_start`, `add_payment_info`

### app_event
`app_event_add_to_cart`, `shop_total_items_purchased`, `total_purchase_value_day0`, `total_purchase_value_day2`, `total_purchase_value_day6`

### skan
`skan_conversion`, `skan_app_install`, `skan_purchase`

### attribution
`vta_purchase`, `cta_app_install`, `cta_purchase`

### onsite
`onsite_shopping`, `onsite_total_purchase_value`

## 五、Report 配置选项

| 配置项 | 可选值 |
|---|---|
| **Report Type** | `BASIC`, `AUDIENCE`, `PLAYABLE_MATERIAL`, `CATALOG` |
| **Data Level** | `AUCTION_ADVERTISER`, `AUCTION_CAMPAIGN`, `AUCTION_ADGROUP`, `AUCTION_AD` |
| **Service Type** | `AUCTION`, `RESERVATION` |

## 六、Entity Metadata 字段统计

| 实体 | 字段数 | 字段分类 |
|---|---|---|
| Account | 20 | basic, status, financial, contact, business |
| Campaign | 28 | basic, status, budget, optimization, attribution, temporal |
| AdGroup | 76 | basic, status, schedule, budget, targeting, placement, optimization, creative, tracking |
| Ad | 55 | basic, status, creative, tracking, temporal |

## 七、系统默认报告配置

- **默认维度**: `stat_time_day`, `ad_id`, `country_code`
- **默认指标**: `spend`, `impressions`, `clicks`, `ctr`, `cpc`, `cpm`, `conversion`, `cost_per_conversion`, `conversion_rate`

## 八、认证方式

| 认证类型 | 用途 | Token URL |
|---|---|---|
| **Business (Marketing) API** | 广告管理、报告拉取 | `https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/` |
| **Account (Organic) API** | 用户基本信息 | `https://open.tiktokapis.com/v2/oauth/token/` |

## 九、字段映射

系统内部会对 TikTok 字段做标准化映射：

| TikTok 原始字段 | 系统标准字段 |
|---|---|
| `stat_time_day` | `date` |
| `conversion` | `conversions` |
| `country_code` | `country` |
| `spend` | `cost` (归入 cost 标准化组) |
