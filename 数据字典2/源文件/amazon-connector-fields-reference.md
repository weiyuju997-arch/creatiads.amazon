# Amazon Connector Fields Reference

Complete reference of all report categories, metrics, dimensions, and fields available through Dubhe's Amazon Advertising connectors. Covers Amazon DSP, Sponsored Ads (SP/SB/SD), Amazon Marketing Cloud (AMC), and Account Metadata.

> **Note:** Unlike Facebook (single Ads Insights schema), Amazon spans several distinct APIs. Each report category has its own field set, request shape, and field-naming convention. Field names below are the **raw Amazon API field** → **Dubhe DB column** (after `AmazonRemapper` normalization).

---

## Report Categories

| Category | `mediaApiType` | API Used | Account ID Type |
|---|---|---|---|
| `DSP` | `AMAZON_DSP_REPORT` | Amazon DSP Reporting | DSP advertiser IDs |
| `SPONSORED_ADS` | `AMAZON_SP_REPORT` / `AMAZON_SB_REPORT` / `AMAZON_SD_REPORT` | Sponsored Ads v3 Reporting | profileId + entityId |
| `AMC` | `AMAZON_AMC_REPORT` | Amazon Marketing Cloud | AMC instanceId |
| `ACCOUNT_METADATA` | `AMAZON_ACCOUNT_METADATA` | Profiles / Manager Account | profileId |

The `mediaApiType` for `SPONSORED_ADS` resolves by `adProduct`:
- `SPONSORED_PRODUCTS` → `AMAZON_SP_REPORT`
- `SPONSORED_BRANDS` → `AMAZON_SB_REPORT`
- `SPONSORED_DISPLAY` → `AMAZON_SD_REPORT`

---

## Regions

Amazon Ads uses three geographic regions, each with distinct API base URLs and OAuth endpoints.

| Region | Markets | API Base URL |
|---|---|---|
| `NA` | US, CA, MX, BR | `https://advertising-api.amazon.com` |
| `EU` | UK, DE, FR, IT, ES, NL, SE, PL, etc. | `https://advertising-api-eu.amazon.com` |
| `FE` | JP, AU, SG, IN | `https://advertising-api-fe.amazon.com` |

---

## Amazon DSP Report

Programmatic display/video advertising reporting.

### Report Types (`type`)

| Report Type | Description |
|---|---|
| `CAMPAIGN` | Order and line item performance |
| `GEOGRAPHY` | Performance by geographic location |
| `AUDIENCE` | Performance by audience segment |
| `INVENTORY` | Performance by inventory source |
| `PRODUCT` | Performance by promoted product |
| `TECHNOLOGY` | Performance by device/technology |

### DSP Dimension Fields

| Amazon API Field | Dubhe Column | Description |
|---|---|---|
| `date` | `date` | Report date |
| `advertiserId` | `advertiser_id` | DSP advertiser ID |
| `orderId` | `order_id` | Order ID |
| `orderName` | `order_name` | Order name |
| `lineItemId` | `line_item_id` | Line item ID |
| `lineItemName` | `line_item_name` | Line item name |
| `creativeId` | `creative_id` | Creative ID |
| `campaignId` | `campaign_id` | Campaign ID |

### DSP Metrics

#### Cost & Delivery

| Amazon API Field | Dubhe Column | Type | Description |
|---|---|---|---|
| `totalCost` | `spend` | Double | Total cost / spend |
| `impressions` | `impressions` | Long | Impressions |
| `clickThroughs` | `clicks` | Long | Click-throughs |
| `totalFee` | `total_fee` | Double | Total fee |
| `agencyFee` | `agency_fee` | Double | Agency fee |

#### Rates

| Amazon API Field | Dubhe Column | Type | Description |
|---|---|---|---|
| `eCPM` | `ecpm` | Double | Effective cost per 1,000 impressions |
| `eCPC` | `ecpc` | Double | Effective cost per click |
| `CTR` | `ctr` | Double | Click-through rate |

#### Detail Page Views (14-day)

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `dpvViews14d` | `dpv_views_14d` | Long |
| `dpvClicks14d` | `dpv_clicks_14d` | Long |
| `totalDetailPageViews14d` | `total_detail_page_views_14d` | Long |

#### Add to Cart (14-day)

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `totalAddToCart14d` | `total_add_to_cart_14d` | Long |
| `totalAddToCartClicks14d` | `total_add_to_cart_clicks_14d` | Long |
| `totalAddToCartViews14d` | `total_add_to_cart_views_14d` | Long |

#### Add to List (14-day)

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `totalAddToList14d` | `total_add_to_list_14d` | Long |

#### Purchases (14-day)

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `totalPurchases14d` | `total_purchases_14d` | Long |
| `totalPurchasesClicks14d` | `total_purchases_clicks_14d` | Long |
| `totalPurchasesViews14d` | `total_purchases_views_14d` | Long |
| `purchasesClicks14d` | `purchases_clicks_14d` | Long |
| `purchasesViews14d` | `purchases_views_14d` | Long |
| `totalPurchaseRate14d` | `total_purchase_rate_14d` | Double |

#### Sales & Units (14-day)

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `totalSales14d` | `total_sales_14d` | Double |
| `totalUnitsSold14d` | `total_units_sold_14d` | Long |
| `unitsSold14d` | `units_sold_14d` | Long |

#### New-to-Brand (14-day)

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `newToBrandPurchases14d` | `ntb_purchases_14d` | Long |
| `newToBrandPurchasesClicks14d` | `ntb_purchases_clicks_14d` | Long |
| `newToBrandPurchasesViews14d` | `ntb_purchases_views_14d` | Long |
| `newToBrandPurchaseRate14d` | `ntb_purchase_rate_14d` | Double |
| `newToBrandEcpp14d` | `ntb_ecpp_14d` | Double |
| `totalNewToBrandPurchases14d` | `total_ntb_purchases_14d` | Long |

#### Subscribe & Save (14-day)

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `newSubscribeAndSave14d` | `new_subscribe_and_save_14d` | Long |
| `totalSubscribeAndSave14d` | `total_subscribe_and_save_14d` | Long |

#### Video

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `videoStarted` | `video_started` | Long |
| `videoCompleted` | `video_completed` | Long |

#### Viewability

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `measurableImpressions` | `measurable_impressions` | Long |
| `viewableImpressions` | `viewable_impressions` | Long |
| `viewabilityRate` | `viewability_rate` | Double |

#### Brand Search (14-day)

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `brandSearch14d` | `brand_search_14d` | Long |
| `brandSearchClicks14d` | `brand_search_clicks_14d` | Long |
| `brandSearchViews14d` | `brand_search_views_14d` | Long |

> Any DSP field not in the explicit map above is auto-converted from camelCase to snake_case and passed through.

---

## Sponsored Ads Report (SP / SB / SD)

Sponsored Products, Sponsored Brands, and Sponsored Display reporting via the Amazon Ads v3 Reporting API. Selected via `adProduct` + `reportTypeId`.

### Ad Products (`adProduct`)

| Value | mediaApiType | Description |
|---|---|---|
| `SPONSORED_PRODUCTS` | `AMAZON_SP_REPORT` | Keyword/product-targeted ads |
| `SPONSORED_BRANDS` | `AMAZON_SB_REPORT` | Brand/headline ads |
| `SPONSORED_DISPLAY` | `AMAZON_SD_REPORT` | Display retargeting ads |

### Report Types (`reportTypeId`)

| Report Type | Ad Product | Description |
|---|---|---|
| `spCampaigns` | SP | Campaign-level performance |
| `spTargeting` | SP | Targeting (keyword/product) performance |
| `spSearchTerm` | SP | Search term performance |
| `spAdvertisedProduct` | SP | Advertised product (ASIN/SKU) performance |
| `spPurchasedProduct` | SP | Purchased product performance |
| `sbCampaigns` | SB | Campaign-level performance |
| `sbSearchTerm` | SB | Search term performance |
| `sdCampaigns` | SD | Campaign-level performance |
| `sdTargeting` | SD | Targeting performance |

### Sponsored Ads Field Naming

Sponsored Ads fields are normalized from camelCase to snake_case (e.g. `campaignName` → `campaign_name`). You choose the exact columns per report type via the `columns` request field; the lists below are the common/typical columns per report type.

### Dimension Columns (by report type)

| Report Type | Dimension Columns |
|---|---|
| `spCampaigns` | `date`, `campaignId`, `campaignName`, `campaignStatus`, `campaignBudgetAmount`, `campaignBudgetType`, `campaignBiddingStrategy` |
| `spTargeting` | `date`, `campaignId`, `adGroupId`, `targetId`, `targetingExpression`, `keywordId`, `keyword`, `matchType` |
| `spSearchTerm` | `date`, `campaignId`, `adGroupId`, `searchTerm`, `keywordId`, `keyword`, `matchType` |
| `spAdvertisedProduct` | `date`, `campaignId`, `adGroupId`, `advertisedAsin`, `advertisedSku` |
| `spPurchasedProduct` | `date`, `campaignId`, `adGroupId`, `purchasedAsin` |
| `sbCampaigns` | `date`, `campaignId`, `campaignName`, `campaignStatus`, `campaignBudgetAmount`, `campaignBudgetType`, `campaignBiddingStrategy` |
| `sbSearchTerm` | `date`, `campaignId`, `adGroupId`, `searchTerm`, `keywordId`, `keyword`, `matchType` |
| `sdCampaigns` | `date`, `campaignId`, `campaignName`, `campaignStatus`, `campaignBudgetAmount`, `campaignBudgetType` |
| `sdTargeting` | `date`, `campaignId`, `adGroupId`, `targetId`, `targetingExpression` |

### Metric Columns

#### Core Metrics

| Amazon API Field | Dubhe Column | Type | Description |
|---|---|---|---|
| `impressions` | `impressions` | Long | Impressions |
| `clicks` | `clicks` | Long | Clicks |
| `cost` | `cost` | Double | Cost / spend |

#### Purchases (attribution windows)

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `purchases1d` | `purchases_1d` | Long |
| `purchases7d` | `purchases_7d` | Long |
| `purchases14d` | `purchases_14d` | Long |
| `purchases30d` | `purchases_30d` | Long |

#### Sales (attribution windows)

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `sales1d` | `sales_1d` | Double |
| `sales7d` | `sales_7d` | Double |
| `sales14d` | `sales_14d` | Double |
| `sales30d` | `sales_30d` | Double |

#### Units Sold (attribution windows)

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `unitsSold1d` | `units_sold_1d` | Long |
| `unitsSold7d` | `units_sold_7d` | Long |
| `unitsSold14d` | `units_sold_14d` | Long |
| `unitsSold30d` | `units_sold_30d` | Long |

#### Kindle (KENP)

| Amazon API Field | Dubhe Column | Type |
|---|---|---|
| `kindleEditionNormalizedPagesRead14d` | `kindle_edition_normalized_pages_read_14d` | Long |
| `kindleEditionNormalizedPagesRoyalties14d` | `kindle_edition_normalized_pages_royalties_14d` | Double |

> Sponsored Ads supports many more columns than listed here. The full set depends on `reportTypeId`; refer to Amazon's [Ads API v3 report column docs](https://advertising.amazon.com/API/docs/en-us/guides/reporting/v3/columns). Dubhe passes through any column you request, applying snake_case normalization. The typed conversions above apply to the listed fields; all others pass through as-is.

### Request Shape (`AmazonSpReportRequest`)

| Field | Description |
|---|---|
| `name` | Report name |
| `startDate` | Start date (YYYY-MM-DD) |
| `endDate` | End date (YYYY-MM-DD) |
| `configuration.adProduct` | `SPONSORED_PRODUCTS` / `SPONSORED_BRANDS` / `SPONSORED_DISPLAY` |
| `configuration.groupBy` | List of grouping dimensions |
| `configuration.columns` | List of columns (metrics + dimensions) |
| `configuration.reportTypeId` | Report type ID |
| `configuration.timeUnit` | `DAILY` (default) |
| `configuration.format` | `GZIP_JSON` |

---

## Amazon Marketing Cloud (AMC) Report

Custom SQL analytics over clean-room data. Columns are **user-defined** by your SQL query — there is no fixed metric/dimension list.

### Characteristics

- **Report type:** `SQL_QUERY` (custom SQL)
- **Columns:** Defined entirely by the `SELECT` clause of your query
- **Field handling:** Pass-through (only numeric string → number conversion applied)
- **Output column metadata:** each column carries `name`, `dataType`, `columnType` (`DIMENSION` or `METRIC`)

### Required Fields

| Field | Description |
|---|---|
| `amc_instance_id` | AMC instance ID (required) |
| `sql_query` | The SQL query to execute (required) |

### SQL Date Placeholders

| Placeholder | Replaced With |
|---|---|
| `:timeWindowStart` | `'YYYY-MM-DD'` start of report window |
| `:timeWindowEnd` | `'YYYY-MM-DD'` end of report window |

> For AMC SQL dialect restrictions, supported functions, AMC-specific headers (`AdvertiserId`, `MarketplaceId`), and the two-step workflow (create → execute → poll → download), use the **amc-api** skill.

---

## Account Metadata

Synchronous (non-async) connector that returns advertising profile and managed account information.

### Fields

| Field | Description |
|---|---|
| `profileId` | Advertising profile ID |
| `accountId` | Account ID |
| `name` | Account name |
| `type` | Account type |
| `countryCode` | Country code |
| `dspAdvertiserId` | Numeric DSP advertiser ID (used for DSP API calls) |
| `marketplaceId` | Marketplace ID |
| `managerAccountId` | Manager account ID (if applicable) |
| `platform_user_id` | Platform user ID |

---

## DSP Request Shape (`AmazonDspReportRequest`)

| Field | Description |
|---|---|
| `startDate` | Start date (YYYY-MM-DD) |
| `endDate` | End date (YYYY-MM-DD) |
| `format` | `JSON` |
| `metrics` | List of metric names (see DSP Metrics) |
| `type` | Report type (`CAMPAIGN`, `GEOGRAPHY`, etc.) |
| `dimensions` | List of dimension names |
| `timeUnit` | `DAILY` (default) |
| `advertiserIds` | List of DSP advertiser IDs |

---

## Field Naming Conventions Summary

| Category | Convention | Example |
|---|---|---|
| DSP | Explicit map, then camelCase → snake_case fallback | `totalCost` → `spend`, `dpvViews14d` → `dpv_views_14d` |
| Sponsored Ads | camelCase → snake_case | `campaignName` → `campaign_name`, `unitsSold14d` → `units_sold_14d` |
| AMC | Pass-through (SQL-defined) | `my_custom_metric` → `my_custom_metric` |

### Common Field Mapping Notes

| Note | Detail |
|---|---|
| DSP spend | `totalCost` maps to `spend` (not `cost`) |
| SP spend | `cost` stays `cost` (not `spend`) |
| New-to-brand prefix | DSP `newToBrand*` maps to `ntb_*` |
| Date | Always `date` in DB across all categories |
| Attribution windows | SP uses 1d/7d/14d/30d; DSP standardizes on 14d |

---

## Usage Notes

### Attribution Windows

- **Sponsored Ads:** purchases/sales/units available at 1-day, 7-day, 14-day, and 30-day windows
- **DSP:** standardizes on 14-day attribution for conversion metrics
- Conversions may be attributed retroactively — recent days' data can change

### Data Types

- Numeric values often arrive as strings from the API and are converted to `Long` or `Double`
- Parse failures keep the original string value and log a warning (record is not dropped)
- Missing fields become `null` rather than failing the record

### Execution Model

- **DSP / Sponsored Ads:** asynchronous (request report → poll → download)
- **AMC:** asynchronous workflow (create → execute → poll → download)
- **Account Metadata:** synchronous

### Best Practices

- Request only the columns you need to reduce report size and generation time
- Use `DAILY` time unit for standard time-series reporting
- For DSP, select the `type` that matches your dimension needs (CAMPAIGN for order/line item, GEOGRAPHY for location, etc.)
- For Sponsored Ads, match `reportTypeId` to the granularity you need (campaign vs targeting vs search term)
- For AMC, validate SQL against AMC's dialect restrictions before scheduling

---

## Reference

- **Source files:**
  - `AmazonReportCategory.java` (report categories, report types, validation)
  - `AmazonRemapper.java` (DSP/SP field mappings, type conversions)
  - `AmazonRegion.java` (regional endpoints)
  - `AmazonSpReportRequest.java` / `AmazonDspReportRequest.java` (request shapes)
- **Amazon docs:**
  - [Amazon Ads API Overview](https://advertising.amazon.com/API/docs/en-us/info/api-overview)
  - [Sponsored Ads v3 Reporting Columns](https://advertising.amazon.com/API/docs/en-us/guides/reporting/v3/columns)
  - [Amazon DSP Reporting](https://advertising.amazon.com/API/docs/en-us/dsp-reports)
- **AMC:** use the `amc-api` skill for the full AMC reference
- **Last Updated:** 2026-05-29
