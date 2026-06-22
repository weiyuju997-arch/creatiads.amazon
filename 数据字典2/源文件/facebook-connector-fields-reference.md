# Facebook Connector Fields Reference

Complete reference of all metrics, dimensions, breakdowns, entity fields, and action types available through Dubhe's Facebook connectors. Based on Facebook Marketing API v24.0.

---

## Connector Types

| Connector Type | Description | Level |
|---|---|---|
| `FACEBOOK_INSIGHTS` | Ad Insights reports (custom fields) | account/campaign/adset/ad |
| `FACEBOOK_AD_COUNTRY` | Ad-level insights with country breakdown | ad |
| `FACEBOOK_CAMPAIGNS` | Campaign-level insights | campaign |
| `FACEBOOK_ADSETS` | Ad Set-level insights | adset |
| `FACEBOOK_ADS` | Ad-level insights (no country) | ad |
| `FACEBOOK_ACCOUNT_METADATA` | Ad account entity data | account |
| `FACEBOOK_CAMPAIGN_METADATA` | Campaign entity data | campaign |
| `FACEBOOK_ADSET_METADATA` | Ad Set entity data | adset |
| `FACEBOOK_AD_METADATA` | Ad entity data | ad |
| `FACEBOOK_CREATIVE_METADATA` | Ad Creative entity data | creative |
| `FACEBOOK_BUSINESS_METADATA` | Business entity data | business |

---

## Insights Dimensions (fields parameter)

### Account Dimensions

| Field | Description |
|---|---|
| `account_currency` | Account currency code |
| `account_id` | Ad account ID |
| `account_name` | Ad account name |

### Campaign Dimensions

| Field | Description |
|---|---|
| `campaign_id` | Campaign ID |
| `campaign_name` | Campaign name |
| `buying_type` | Buying type (AUCTION, RESERVED, FIXED_CPM) |
| `objective` | Campaign objective |
| `optimization_goal` | Optimization goal |

### Ad Set Dimensions

| Field | Description |
|---|---|
| `adset_id` | Ad Set ID |
| `adset_name` | Ad Set name |

### Ad Dimensions

| Field | Description |
|---|---|
| `ad_id` | Ad ID |
| `ad_name` | Ad name |

### Time Dimensions

| Field | Description |
|---|---|
| `date_start` | Report period start date (DB column: `date`) |
| `date_stop` | Report period end date |
| `created_time` | Entity creation time |
| `updated_time` | Entity last update time |

---

## Insights Metrics

### Core Delivery Metrics

| Field | Type | Description |
|---|---|---|
| `spend` | DECIMAL | Amount spent (account currency) |
| `impressions` | BIGINT | Times ads were on screen |
| `clicks` | BIGINT | Total clicks (all) |
| `reach` | BIGINT | Unique users who saw ads (estimated) |
| `frequency` | DECIMAL | Avg times each person saw ads (estimated) |
| `cpc` | DECIMAL | Cost per click (all) |
| `cpm` | DECIMAL | Cost per 1,000 impressions |
| `cpp` | DECIMAL | Cost per 1,000 people reached (estimated) |
| `ctr` | DECIMAL | Click-through rate (%) |
| `unique_clicks` | BIGINT | Unique users who clicked (estimated) |
| `unique_ctr` | DECIMAL | Unique click-through rate (estimated) |

### Action & Conversion Metrics

| Field | Type | Description |
|---|---|---|
| `actions` | JSON | Array of conversion actions (see Action Types) |
| `action_values` | JSON | Monetary value of actions |
| `conversions` | JSON | Conversion events array |
| `conversion_values` | JSON | Value of conversion events |

### Cost Per Action Metrics

| Field | Description |
|---|---|
| `cost_per_action_type` | Avg cost per action type |
| `cost_per_conversion` | Avg cost per conversion |
| `cost_per_inline_link_click` | Avg cost per inline link click |
| `cost_per_inline_post_engagement` | Avg cost per post engagement |
| `cost_per_outbound_click` | Avg cost per outbound click |
| `cost_per_thruplay` | Avg cost per ThruPlay |
| `cost_per_unique_action_type` | Avg cost per unique action type |
| `cost_per_unique_click` | Avg cost per unique click |
| `cost_per_unique_inline_link_click` | Avg cost per unique inline link click |
| `cost_per_unique_outbound_click` | Avg cost per unique outbound click |
| `cost_per_15_sec_video_view` | Avg cost per 15-second video view |
| `cost_per_2_sec_continuous_video_view` | Avg cost per 2-second continuous video view |
| `cost_per_ad_click` | Avg cost per ad click |
| `cost_per_one_thousand_ad_impression` | Cost per 1,000 ad impressions |
| `cost_per_unique_conversion` | Avg cost per unique conversion |
| `cost_per_dda_countby_convs` | Cost per DDA conversion |

### Click Metrics

| Field | Type | Description |
|---|---|---|
| `inline_link_clicks` | BIGINT | Clicks on links (1-day click window) |
| `inline_link_click_ctr` | DECIMAL | Inline link click-through rate |
| `inline_post_engagement` | BIGINT | Total post engagement actions |
| `outbound_clicks` | JSON | Clicks to off-Facebook destinations |
| `outbound_clicks_ctr` | JSON | Outbound click-through rate |
| `unique_inline_link_clicks` | BIGINT | Unique inline link clicks (estimated) |
| `unique_link_clicks_ctr` | DECIMAL | Unique link click-through rate |
| `unique_outbound_clicks` | JSON | Unique outbound clicks (estimated) |
| `unique_outbound_clicks_ctr` | JSON | Unique outbound click-through rate |

### Video Metrics

| Field | Description |
|---|---|
| `video_play_actions` | Times video started playing |
| `video_avg_time_watched_actions` | Average time video was played |
| `video_p25_watched_actions` | Times video played to 25% |
| `video_p50_watched_actions` | Times video played to 50% |
| `video_p75_watched_actions` | Times video played to 75% |
| `video_p95_watched_actions` | Times video played to 95% |
| `video_p100_watched_actions` | Times video played to 100% |
| `video_30_sec_watched_actions` | Times video played 30+ seconds |
| `video_continuous_2_sec_watched_actions` | Times video played 2+ continuous seconds |
| `video_play_curve_actions` | Video play curve data |
| `video_play_retention_0_to_15s_actions` | Video retention 0-15 seconds |
| `video_play_retention_20_to_60s_actions` | Video retention 20-60 seconds |
| `video_play_retention_graph_actions` | Video retention graph data |
| `video_time_watched_actions` | Total video time watched |
| `video_thruplay_watched_actions` | ThruPlay video views |

### ROAS Metrics

| Field | Description |
|---|---|
| `purchase_roas` | Return on ad spend from purchases |
| `website_purchase_roas` | ROAS from website purchases |
| `mobile_app_purchase_roas` | ROAS from mobile app purchases |

### Canvas/Instant Experience Metrics

| Field | Description |
|---|---|
| `canvas_avg_view_percent` | Average % of Canvas viewed |
| `canvas_avg_view_time` | Average time Canvas was viewed |
| `instant_experience_clicks_to_open` | Clicks to open Instant Experience |
| `instant_experience_clicks_to_start` | Clicks to start Instant Experience |
| `instant_experience_outbound_clicks` | Outbound clicks from Instant Experience |

### Catalog Metrics

| Field | Description |
|---|---|
| `catalog_segment_actions` | Catalog segment actions |
| `catalog_segment_value` | Catalog segment value |
| `catalog_segment_value_mobile_purchase_roas` | Mobile purchase ROAS for catalog segment |
| `catalog_segment_value_omni_purchase_roas` | Omni-channel purchase ROAS for catalog segment |
| `catalog_segment_value_website_purchase_roas` | Website purchase ROAS for catalog segment |

### Engagement Metrics

| Field | Description |
|---|---|
| `full_view_impressions` | Full view impressions |
| `full_view_reach` | Full view reach |
| `social_spend` | Social spend amount |

### Website Metrics

| Field | Description |
|---|---|
| `website_ctr` | Website click-through rate |
| `landing_page_view_per_link_click` | Landing page views per link click |

### Result Metrics

| Field | Description |
|---|---|
| `results` | Number of results |
| `result_rate` | Result rate |
| `cost_per_result` | Cost per result |
| `objective_results` | Objective-specific results |
| `objective_result_rate` | Objective result rate |
| `cost_per_objective_result` | Cost per objective result |

### Data-Driven Attribution (DDA) Metrics

| Field | Description |
|---|---|
| `dda_countby_convs` | DDA conversion count |
| `dda_results` | DDA results |

### Ad Click/Impression Metrics

| Field | Description |
|---|---|
| `ad_click_actions` | Ad click actions |
| `ad_impression_actions` | Ad impression actions |

### Interactive Component Metrics

| Field | Description |
|---|---|
| `interactive_component_tap` | Interactive component taps |
| `instagram_upcoming_event_reminders_set` | Instagram event reminders set |

### Marketing Messages Metrics

| Field | Description |
|---|---|
| `marketing_messages_delivered` | Marketing messages delivered |
| `marketing_messages_delivery_rate` | Marketing message delivery rate |
| `marketing_messages_read_rate_benchmark` | Marketing message read rate benchmark |

### Auction Metrics

| Field | Description |
|---|---|
| `auction_bid` | Auction bid amount |
| `auction_competitiveness` | Auction competitiveness score |
| `auction_max_competitor_bid` | Max competitor bid in auction |
| `wish_bid` | Wish bid amount |

### Product Metrics

| Field | Description |
|---|---|
| `converted_product_quantity` | Quantity of products converted |
| `converted_product_value` | Value of products converted |
| `product_views` | Product views |

### Quality Ranking Metrics (String Values)

| Field | Description |
|---|---|
| `quality_ranking` | Ad quality ranking (ABOVE_AVERAGE, AVERAGE, BELOW_AVERAGE) |
| `engagement_rate_ranking` | Engagement rate ranking |
| `conversion_rate_ranking` | Conversion rate ranking |

---

## Breakdowns (breakdowns parameter)

Breakdowns split insights data by specific dimensions. **Important:** Breakdowns are passed in the `breakdowns` parameter, NOT the `fields` parameter.

### Geographic Breakdowns

| Breakdown | Description |
|---|---|
| `country` | Country (ISO 3166-1 alpha-2) |
| `region` | Region/state code |
| `dma` | Designated Market Area |

### Demographic Breakdowns

| Breakdown | Description |
|---|---|
| `age` | Age range (18-24, 25-34, 35-44, 45-54, 55-64, 65+) |
| `gender` | Gender (male, female, unknown) |

### Device & Platform Breakdowns

| Breakdown | Description |
|---|---|
| `device_platform` | Device platform (mobile, desktop, etc.) |
| `impression_device` | Device where impression occurred |
| `publisher_platform` | Publisher platform (facebook, instagram, audience_network, messenger) |
| `platform_position` | Ad placement position |

### Action Breakdowns

| Breakdown | Description |
|---|---|
| `action_type` | Type of action taken |
| `action_device` | Device where action occurred |
| `action_target_id` | Target ID of action |
| `action_destination` | Destination of action |
| `action_reaction` | Reaction type |
| `action_video_sound` | Video sound status |
| `action_video_type` | Video type |

### Creative Asset Breakdowns

| Breakdown | Description |
|---|---|
| `ad_format_asset` | Ad format asset |
| `body_asset` | Body text asset |
| `call_to_action_asset` | Call-to-action asset |
| `description_asset` | Description asset |
| `image_asset` | Image asset |
| `link_url_asset` | Link URL asset |
| `title_asset` | Title asset |
| `video_asset` | Video asset |

### Carousel Breakdowns

| Breakdown | Description |
|---|---|
| `action_carousel_card_id` | Carousel card ID |
| `action_carousel_card_name` | Carousel card name |
| `action_canvas_component_name` | Canvas component name |

### Other Breakdowns

| Breakdown | Description |
|---|---|
| `product_id` | Product ID |
| `frequency_value` | Frequency value |
| `place_page_id` | Place page ID |
| `hourly_stats_aggregated_by_advertiser_time_zone` | Hourly stats (advertiser TZ) |
| `hourly_stats_aggregated_by_audience_time_zone` | Hourly stats (audience TZ) |

### SKAdNetwork Breakdowns (iOS)

| Breakdown | Description |
|---|---|
| `app_id` | App ID |
| `skan_campaign_id` | SKAdNetwork campaign ID |
| `skan_conversion_id` | SKAdNetwork conversion ID |
| `skan_version` | SKAdNetwork version |
| `coarse_conversion_value` | Coarse conversion value |
| `fidelity_type` | Fidelity type |
| `hsid` | Hierarchical source identifier |
| `postback_sequence_index` | Postback sequence index |
| `redownload` | Redownload indicator |

### Valid Breakdown Combinations

Facebook restricts which breakdowns can be combined. Valid combinations include:

- Single: `action_type`, `action_target_id`, `action_device`, `age`, `gender`, `country`, `region`, `publisher_platform`, `product_id`
- Demographics: `age,gender`
- Device + Platform: `action_device,impression_device`, `action_device,publisher_platform`, `publisher_platform,impression_device`, `publisher_platform,platform_position`
- Complex: `action_device,publisher_platform,platform_position,impression_device`
- Carousel: `action_carousel_card_id,impression_device`, `action_carousel_card_id,country`, `action_carousel_card_id,age,gender`
- SKAdNetwork: `app_id,skan_conversion_id`

---

## Action Types

Action types appear in the `actions` and `action_values` JSON arrays. Extract specific action types from these arrays in your pipeline.

### Engagement Actions

| Action Type | Description |
|---|---|
| `link_click` | Link clicks |
| `landing_page_view` | Landing page views |
| `page_engagement` | Page engagements |
| `post_engagement` | Post engagements |
| `post_reaction` | Post reactions (like, love, etc.) |
| `comment` | Comments |
| `post` | Posts/shares |
| `photo_view` | Photo views |
| `video_view` | Video views (3+ seconds) |

### Conversion Actions

| Action Type | Description |
|---|---|
| `purchase` | Purchases (e-commerce) |
| `add_to_cart` | Add to cart events |
| `initiate_checkout` | Checkout initiations |
| `add_payment_info` | Payment info additions |
| `add_to_wishlist` | Add to wishlist |
| `view_content` | Content views |
| `search` | Searches |

### Lead Generation Actions

| Action Type | Description |
|---|---|
| `lead` | Lead submissions |
| `complete_registration` | Registrations |
| `submit_application` | Application submissions |
| `schedule` | Appointment scheduling |
| `contact` | Contact form submissions |

### Mobile App Actions

| Action Type | Description |
|---|---|
| `app_install` | App installs |
| `app_custom_event` | Custom app events |
| `mobile_app_install` | Mobile app installs |
| `app_engagement` | App engagements |

### Messaging Actions

| Action Type | Description |
|---|---|
| `onsite_conversion.messaging_conversation_started_7d` | Messaging conversations started (7-day) |
| `onsite_conversion.messaging_first_reply` | First message replies |

---

## Campaign Entity Fields

Fields available when fetching campaign metadata (not insights).

### Identity Fields

| Field | Description |
|---|---|
| `id` | Campaign ID |
| `account_id` | Ad account ID |
| `name` | Campaign name |

### Status Fields

| Field | Description |
|---|---|
| `status` | Campaign status |
| `configured_status` | Configured status |
| `effective_status` | Effective status |

### Budget Fields

| Field | Description |
|---|---|
| `daily_budget` | Daily budget (cents) |
| `lifetime_budget` | Lifetime budget (cents) |
| `budget_remaining` | Budget remaining (cents) |
| `spend_cap` | Spend cap (cents) |
| `can_use_spend_cap` | Whether spend cap can be used |

### Bidding Fields

| Field | Description |
|---|---|
| `bid_strategy` | Bid strategy |
| `buying_type` | Buying type (AUCTION, RESERVED) |

### Timing Fields

| Field | Description |
|---|---|
| `start_time` | Campaign start time |
| `stop_time` | Campaign stop time |
| `created_time` | Creation time |
| `updated_time` | Last update time |
| `last_budget_toggling_time` | Last budget toggle time |

### Other Campaign Fields

| Field | Description |
|---|---|
| `objective` | Campaign objective |
| `smart_promotion_type` | Smart promotion type |
| `primary_attribution` | Primary attribution setting |
| `is_skadnetwork_attribution` | SKAdNetwork attribution enabled |
| `has_secondary_skadnetwork_reporting` | Secondary SKAdNetwork reporting |
| `adlabels` | Ad labels |
| `promoted_object` | Promoted object |
| `special_ad_categories` | Special ad categories |
| `special_ad_category` | Special ad category |
| `special_ad_category_country` | Special ad category country |
| `budget_rebalance_flag` | Budget rebalance flag |
| `is_budget_schedule_enabled` | Budget schedule enabled |
| `is_adset_budget_sharing_enabled` | Ad set budget sharing enabled |
| `source_campaign` | Source campaign |
| `source_campaign_id` | Source campaign ID |
| `topline_id` | Topline ID |
| `issues_info` | Issues information |
| `pacing_type` | Pacing type |

---

## Ad Set Entity Fields

Fields available when fetching ad set metadata.

### Core Fields

| Field | Description |
|---|---|
| `id` | Ad Set ID |
| `account_id` | Ad account ID |
| `name` | Ad Set name |
| `campaign_id` | Campaign ID |
| `status` | Ad Set status |
| `configured_status` | Configured status |
| `effective_status` | Effective status |

### Budget Fields

| Field | Description |
|---|---|
| `daily_budget` | Daily budget (cents) |
| `lifetime_budget` | Lifetime budget (cents) |
| `budget_remaining` | Budget remaining (cents) |
| `daily_min_spend_target` | Daily minimum spend target |
| `daily_spend_cap` | Daily spend cap |
| `lifetime_min_spend_target` | Lifetime minimum spend target |
| `lifetime_spend_cap` | Lifetime spend cap |

### Bidding Fields

| Field | Description |
|---|---|
| `bid_amount` | Bid amount (cents) |
| `bid_strategy` | Bid strategy |
| `bid_adjustments` | Bid adjustments |
| `bid_constraints` | Bid constraints |
| `bid_info` | Bid information |
| `billing_event` | Billing event |

### Timing Fields

| Field | Description |
|---|---|
| `start_time` | Ad Set start time |
| `end_time` | Ad Set end time |
| `created_time` | Creation time |
| `updated_time` | Last update time |

### Optimization Fields

| Field | Description |
|---|---|
| `optimization_goal` | Optimization goal |
| `optimization_sub_event` | Optimization sub-event |
| `multi_optimization_goal_weight` | Multi-optimization goal weight |

### Targeting Fields

| Field | Description |
|---|---|
| `targeting` | Targeting spec |
| `targeting_optimization_types` | Targeting optimization types |
| `destination_type` | Destination type |

### Attribution Fields

| Field | Description |
|---|---|
| `attribution_spec` | Attribution specification |
| `campaign_attribution` | Campaign attribution |

### Scheduling Fields

| Field | Description |
|---|---|
| `adset_schedule` | Ad Set schedule |
| `frequency_control_specs` | Frequency control specs |
| `pacing_type` | Pacing type |

### Creative Fields

| Field | Description |
|---|---|
| `creative_sequence` | Creative sequence |
| `is_dynamic_creative` | Dynamic creative enabled |

### Other Ad Set Fields

| Field | Description |
|---|---|
| `adlabels` | Ad labels |
| `promoted_object` | Promoted object |
| `asset_feed_id` | Asset feed ID |
| `learning_stage_info` | Learning stage information |
| `issues_info` | Issues information |
| `recommendations` | Recommendations |
| `dsa_beneficiary` | DSA beneficiary |
| `dsa_payor` | DSA payor |
| `source_adset` | Source ad set |
| `source_adset_id` | Source ad set ID |
| `rf_prediction_id` | Reach & frequency prediction ID |

---

## Ad Entity Fields

Fields available when fetching ad metadata.

### Core Fields

| Field | Description |
|---|---|
| `id` | Ad ID |
| `account_id` | Ad account ID |
| `name` | Ad name |
| `adset_id` | Ad Set ID |
| `campaign_id` | Campaign ID |
| `status` | Ad status |
| `configured_status` | Configured status |
| `effective_status` | Effective status |

### Creative Fields

| Field | Description |
|---|---|
| `creative` | Creative object |
| `adcreatives` | Ad creatives array |

### Timing Fields

| Field | Description |
|---|---|
| `created_time` | Creation time |
| `updated_time` | Last update time |
| `ad_active_time` | Ad active time |
| `ad_schedule_start_time` | Schedule start time |
| `ad_schedule_end_time` | Schedule end time |

### Bidding Fields

| Field | Description |
|---|---|
| `bid_amount` | Bid amount (cents) |

### Other Ad Fields

| Field | Description |
|---|---|
| `adlabels` | Ad labels |
| `tracking_specs` | Tracking specifications |
| `conversion_domain` | Conversion domain |
| `ad_review_feedback` | Ad review feedback |
| `issues_info` | Issues information |
| `recommendations` | Recommendations |
| `source_ad` | Source ad |
| `source_ad_id` | Source ad ID |
| `last_updated_by_app_id` | Last updated by app ID |
| `preview_shareable_link` | Preview shareable link |

---

## Ad Creative Entity Fields

Fields available when fetching ad creative metadata.

### Core Fields

| Field | Description |
|---|---|
| `id` | Creative ID |
| `account_id` | Ad account ID |
| `name` | Creative name |

### Content Fields

| Field | Description |
|---|---|
| `body` | Ad body text |
| `title` | Ad title |
| `link_url` | Link URL |
| `image_url` | Image URL |
| `image_hash` | Image hash |
| `video_id` | Video ID |

### Story Fields

| Field | Description |
|---|---|
| `object_story_id` | Object story ID |
| `object_story_spec` | Object story specification |
| `object_type` | Object type |
| `object_id` | Object ID |
| `object_url` | Object URL |

### Instagram Fields

| Field | Description |
|---|---|
| `instagram_permalink_url` | Instagram permalink URL |
| `instagram_user_id` | Instagram user ID |
| `effective_instagram_media_id` | Effective Instagram media ID |
| `effective_instagram_story_id` | Effective Instagram story ID |
| `effective_object_story_id` | Effective object story ID |

### Asset Fields

| Field | Description |
|---|---|
| `asset_feed_spec` | Asset feed specification |
| `thumbnail_id` | Thumbnail ID |
| `thumbnail_url` | Thumbnail URL |
| `image_crops` | Image crops |

### Link Fields

| Field | Description |
|---|---|
| `call_to_action_type` | Call-to-action type |
| `link_destination_display_url` | Link destination display URL |
| `link_og_id` | Link Open Graph ID |
| `url_tags` | URL tags |

### Product Fields

| Field | Description |
|---|---|
| `product_set_id` | Product set ID |
| `template_url` | Template URL |
| `template_url_spec` | Template URL specification |

### Other Creative Fields

| Field | Description |
|---|---|
| `status` | Creative status |
| `categorization_criteria` | Categorization criteria |
| `recommender_settings` | Recommender settings |
| `branded_content` | Branded content |
| `bundle_folder_id` | Bundle folder ID |
| `actor_id` | Actor ID |

---

## Enum Values

### Campaign Objectives

#### Legacy Objectives

- `APP_INSTALLS`
- `BRAND_AWARENESS`
- `CONVERSIONS`
- `EVENT_RESPONSES`
- `LEAD_GENERATION`
- `LINK_CLICKS`
- `LOCAL_AWARENESS`
- `MESSAGES`
- `OFFER_CLAIMS`
- `PAGE_LIKES`
- `POST_ENGAGEMENT`
- `PRODUCT_CATALOG_SALES`
- `REACH`
- `STORE_VISITS`
- `VIDEO_VIEWS`

#### ODAX (Outcome-Driven) Objectives

- `OUTCOME_APP_PROMOTION`
- `OUTCOME_AWARENESS`
- `OUTCOME_ENGAGEMENT`
- `OUTCOME_LEADS`
- `OUTCOME_SALES`
- `OUTCOME_TRAFFIC`

### Bid Strategies

- `LOWEST_COST_WITHOUT_CAP`
- `LOWEST_COST_WITH_BID_CAP`
- `COST_CAP`
- `LOWEST_COST_WITH_MIN_ROAS`

### Optimization Goals

- `NONE`
- `APP_INSTALLS`
- `AD_RECALL_LIFT`
- `ENGAGED_USERS`
- `EVENT_RESPONSES`
- `IMPRESSIONS`
- `LEAD_GENERATION`
- `QUALITY_LEAD`
- `LINK_CLICKS`
- `OFFSITE_CONVERSIONS`
- `PAGE_LIKES`
- `POST_ENGAGEMENT`
- `QUALITY_CALL`
- `REACH`
- `LANDING_PAGE_VIEWS`
- `VISIT_INSTAGRAM_PROFILE`
- `VALUE`
- `THRUPLAY`
- `DERIVED_EVENTS`
- `APP_INSTALLS_AND_OFFSITE_CONVERSIONS`
- `CONVERSATIONS`
- `IN_APP_VALUE`
- `MESSAGING_PURCHASE_CONVERSION`
- `SUBSCRIBERS`
- `REMINDERS_SET`
- `MEANINGFUL_CALL_ATTEMPT`
- `PROFILE_VISIT`
- `PROFILE_AND_PAGE_ENGAGEMENT`

### Billing Events

- `APP_INSTALLS`
- `CLICKS`
- `IMPRESSIONS`
- `LINK_CLICKS`
- `NONE`
- `OFFER_CLAIMS`
- `PAGE_LIKES`
- `POST_ENGAGEMENT`
- `THRUPLAY`
- `PURCHASE`
- `LISTING_INTERACTION`

### Ad Statuses

- `ACTIVE`
- `PAUSED`
- `DELETED`
- `ARCHIVED`
- `PENDING_REVIEW`
- `DISAPPROVED`
- `PREAPPROVED`
- `PENDING_BILLING_INFO`
- `CAMPAIGN_PAUSED`
- `ADSET_PAUSED`
- `IN_PROCESS`
- `WITH_ISSUES`

### Destination Types

- `WEBSITE`
- `APP`
- `MESSENGER`
- `APPLINKS_AUTOMATIC`
- `WHATSAPP`
- `INSTAGRAM_DIRECT`
- `FACEBOOK`
- `SHOP_AUTOMATIC`
- `ON_AD`
- `ON_POST`
- `ON_EVENT`
- `ON_VIDEO`
- `ON_PAGE`
- `INSTAGRAM_PROFILE`
- `FACEBOOK_PAGE`
- `INSTAGRAM_LIVE`
- `FACEBOOK_LIVE`

### Publisher Platforms

- `facebook`
- `instagram`
- `audience_network`
- `messenger`

---

## Field Mappings

### API Field → DB Column

| API Field | DB Column | Notes |
|---|---|---|
| `date_start` | `date` | Use `date` in database |
| `date_stop` | `date_stop` | Keep as-is |

### Common Mistakes

| Wrong | Correct | Notes |
|---|---|---|
| `cost` | `spend` | Facebook uses `spend` |
| `day` | `date` | Use `date` in DB |
| `link_clicks` | `inline_link_clicks` | Use `inline_` prefix |
| `post_engagement` | `inline_post_engagement` | Use `inline_` prefix |
| `unique_link_clicks` | `unique_inline_link_clicks` | Use `inline_` prefix |

---

## Usage Notes

### Attribution Windows

Facebook uses attribution windows to count conversions:
- **1-day click**: Default for inline metrics
- **7-day click, 1-day view**: Common for conversion metrics
- **28-day click, 1-day view**: Extended attribution window

### Estimated Metrics

These metrics are estimated and may not be exact:
- `reach` - Unique users reached
- `frequency` - Average impressions per user
- `unique_clicks` - Unique users who clicked
- `cost_per_unique_click` - Cost per unique click
- All metrics with "unique" in the name

### Data Types

- **Numeric strings**: `spend`, `impressions`, `clicks` returned as strings, convert to numbers
- **JSON arrays**: `actions`, `conversions`, `cost_per_action_type` require parsing
- **Decimals**: `cpc`, `cpm`, `ctr` are decimal values

### Date Handling

- API returns `date_start` and `date_stop` fields
- For daily reports: `date_start` = `date_stop`
- Store as `date` column in database
- Use `time_increment=1` for daily breakdowns

---

## Connector-Specific Field Sets

### FACEBOOK_INSIGHTS (Account Level)

Default fields: `spend`, `impressions`, `clicks`, `actions`, `account_currency`, `account_id`, `account_name`, `action_values`, `canvas_avg_view_percent`, `conversions`, `conversion_values`, `cost_per_action_type`, `cost_per_inline_link_click`, `cost_per_inline_post_engagement`, `cost_per_outbound_click`, `cost_per_thruplay`, `cost_per_unique_action_type`, `cost_per_unique_click`, `cost_per_unique_inline_link_click`, `cost_per_unique_outbound_click`, `cpc`, `cpm`, `cpp`, `ctr`, `date_start`, `date_stop`, `frequency`, `inline_link_click_ctr`, `inline_link_clicks`, `inline_post_engagement`, `reach`, `social_spend`, `objective`, `optimization_goal`, `outbound_clicks`, `outbound_clicks_ctr`, `place_page_name`, `purchase_roas`, video metrics, `website_ctr`, `website_purchase_roas`

### FACEBOOK_AD_COUNTRY

Default fields: All account-level fields plus `ad_name`, `ad_id`, `adset_id`, `adset_name`, `buying_type`, `campaign_id`, `campaign_name`, `results`, `cost_per_result`, `result_rate`, `unique_clicks`, `unique_ctr`, `unique_outbound_clicks`, `unique_outbound_clicks_ctr`, `unique_inline_link_clicks`, `unique_link_clicks_ctr`

Typical breakdowns: `country`, `age`, `gender`, `device_platform`, `publisher_platform`

### FACEBOOK_CAMPAIGNS

Entity fields: Campaign metadata fields (see Campaign Entity Fields section)

### FACEBOOK_ADSETS

Entity fields: Ad Set metadata fields (see Ad Set Entity Fields section)

### FACEBOOK_ADS

Entity fields: Ad metadata fields (see Ad Entity Fields section)

### FACEBOOK_CREATIVE

Entity fields: Creative metadata fields (see Ad Creative Entity Fields section)

---

## Best Practices

### Field Selection

- **Always include**: `date_start`, `account_id`, level-specific IDs (campaign_id, adset_id, ad_id)
- **Core metrics**: `spend`, `impressions`, `clicks` for basic reporting
- **Engagement**: Add `inline_link_clicks`, `inline_post_engagement` for engagement analysis
- **Conversions**: Include `actions`, `action_values` for conversion tracking
- **Video**: Add video metrics only for video campaigns

### Breakdowns

- **Country**: Use for geographic analysis
- **Age/Gender**: Use for demographic insights (increases data volume significantly)
- **Device/Platform**: Use for placement optimization
- **Limit breakdowns**: Each breakdown multiplies data volume

### Time Increments

- **Daily** (`time_increment=1`): Standard for most reports
- **Weekly** (`time_increment=7`): For trend analysis
- **Monthly** (`time_increment=monthly`): For high-level summaries
- **All days** (`time_increment=all_days`): For total aggregation

### Performance Optimization

- Request only needed fields to reduce API response size
- Use appropriate date ranges (avoid very large ranges)
- Implement pagination for large result sets
- Cache frequently accessed data
- Use async reports for large date ranges

### Data Quality

- Handle null values in actions/conversions arrays
- Convert string numbers to proper numeric types
- Validate date formats before storage
- Check for estimated metrics (may change over time)
- Account for attribution window delays (conversions may be attributed retroactively)

---

## Reference

- **Source**: `FacebookSchemaConstants.java` (Facebook Marketing API v24.0)
- **Documentation**: [Facebook Marketing API Reference](https://developers.facebook.com/docs/marketing-api/reference/ads-insights/)
- **Last Updated**: 2026-05-28
