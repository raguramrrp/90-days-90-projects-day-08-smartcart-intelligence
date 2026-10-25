export type ProvenanceType = "LIVE" | "CACHED" | "HISTORICAL" | "SAMPLE" | "UNAVAILABLE";

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  preferred_currency: string;
  email_notifications_enabled: boolean;
  in_app_notifications_enabled: boolean;
  created_at: string;
}

export interface Retailer {
  id: number;
  code: string;
  name: string;
  website_url: string;
  logo_url?: string;
  is_active: boolean;
  freshness_ttl_minutes: number;
  notes?: string;
}

export interface PriceObservation {
  id: number;
  product_listing_id: number;
  price: number;
  original_price?: number;
  currency: string;
  in_stock: boolean;
  shipping_cost: number;
  taxes_and_fees: number;
  estimated_total: number;
  provenance: ProvenanceType;
  observed_at: string;
  retrieved_at: string;
}

export interface ProductListing {
  id: number;
  product_id: number;
  retailer_id: number;
  retailer: Retailer;
  external_sku?: string;
  listing_url: string;
  is_verified: boolean;
  latest_price?: PriceObservation;
}

export interface Product {
  id: number;
  title: string;
  brand: string;
  model_number?: string;
  gtin_upc?: string;
  category: string;
  subcategory?: string;
  image_url?: string;
  description?: string;
  tags?: string;
  is_active: boolean;
  created_at: string;
  current_lowest_price?: number;
  all_time_lowest_price?: number;
  original_mrp?: number;
  retailer_count: number;
  in_stock_any: boolean;
  deal_score?: number;
  deal_label?: string;
  provenance?: ProvenanceType;
}

export interface PriceStats {
  current_price: number;
  all_time_low: number;
  all_time_high: number;
  historical_avg: number;
  median_price: number;
  absolute_change_30d: number;
  percent_change_30d: number;
  data_points_count: number;
  currency: string;
}

export interface PriceHistoryPoint {
  date: string;
  observed_at: string;
  price: number;
  retailer: string;
  retailer_code: string;
  provenance: ProvenanceType;
  in_stock: boolean;
}

export interface ForecastPoint {
  day_offset: number;
  target_date: string;
  predicted_price: number;
  lower_bound: number;
  upper_bound: number;
}

export interface PriceHistoryResponse {
  product_id: number;
  product_title: string;
  stats: PriceStats;
  history: PriceHistoryPoint[];
  forecast?: ForecastPoint[];
}

export interface WatchlistItem {
  id: number;
  watchlist_id: number;
  product_id: number;
  product: Product;
  target_price?: number;
  note?: string;
  needed_by?: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  created_at: string;
  current_price?: number;
  price_diff_target?: number;
  target_reached: boolean;
}

export interface WatchlistResponse {
  id: number;
  user_id: number;
  name: string;
  items: WatchlistItem[];
  created_at: string;
}

export interface PriceAlertRule {
  id: number;
  user_id: number;
  product_id: number;
  product_title?: string;
  rule_type: "TARGET_PRICE" | "PERCENT_DROP" | "PRICE_INCREASE" | "BACK_IN_STOCK";
  threshold_value?: number;
  is_active: boolean;
  created_at: string;
  last_triggered_at?: string;
}

export interface NotificationDelivery {
  id: number;
  channel: string;
  delivery_mode: string;
  recipient: string;
  status: string;
  preview_body?: string;
  sent_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  product_id: number;
  product_title?: string;
  product_image?: string;
  rule_id?: number;
  title: string;
  message: string;
  previous_price?: number;
  new_price?: number;
  channel: string;
  status: "UNREAD" | "READ" | "ARCHIVED";
  created_at: string;
  deliveries: NotificationDelivery[];
}

export interface ShoppingListItem {
  id: number;
  shopping_list_id: number;
  product_id?: number;
  product?: Product;
  item_title: string;
  desired_quantity: number;
  estimated_unit_price: number;
  is_purchased: boolean;
  priority: string;
  needed_by?: string;
  created_at: string;
}

export interface ShoppingList {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  color: string;
  items: ShoppingListItem[];
  total_estimated_cost: number;
  completed_items_count: number;
  total_items_count: number;
  created_at: string;
}

export interface Budget {
  id: number;
  user_id: number;
  month_year: string;
  category: string;
  budget_limit: number;
  spent_amount: number;
  planned_amount: number;
  remaining_amount: number;
  utilization_percentage: number;
  is_exceeded: boolean;
  created_at: string;
}

export interface RecurringPurchase {
  id: number;
  user_id: number;
  product_id?: number;
  product?: Product;
  custom_title: string;
  replenishment_interval_days: number;
  last_replenished_at: string;
  next_review_at: string;
  days_until_next_review: number;
  needs_replenishment_soon: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PurchaseRecord {
  id: number;
  user_id: number;
  product_id?: number;
  retailer_id?: number;
  product_title?: string;
  retailer_name?: string;
  purchase_price: number;
  original_baseline_price?: number;
  realized_savings: number;
  purchase_date: string;
  notes?: string;
}

export interface SavingsSummary {
  total_potential_savings: number;
  total_realized_savings: number;
  confirmed_purchases_count: number;
  active_tracked_deals_count: number;
  average_discount_percentage: number;
  currency: string;
}

export interface DealScoreFactor {
  name: string;
  score_impact: number;
  description: string;
}

export interface DealScoreResponse {
  product_id: number;
  product_title: string;
  deal_score: number;
  deal_label: "EXCELLENT_DEAL" | "GOOD_PRICE" | "FAIR" | "OVERPRICED" | "INSUFFICIENT_DATA";
  guidance: "BUY NOW" | "WAIT" | "COMPARE FIRST" | "INSUFFICIENT DATA";
  confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT_DATA";
  explanation: string;
  factors: DealScoreFactor[];
  data_freshness_hours: number;
  provenance: ProvenanceType;
}

export interface ProviderHealth {
  id: number;
  retailer_id: number;
  retailer_code: string;
  retailer_name: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN" | "AUTH_REQUIRED";
  response_time_ms: number;
  message?: string;
  checked_at: string;
  freshness_ttl_minutes: number;
  official_api_status: string;
  credential_requirement: string;
}

export interface RefreshJob {
  id: number;
  job_type: string;
  triggered_by: string;
  status: string;
  items_processed: number;
  items_updated: number;
  error_log?: string;
  started_at: string;
  completed_at?: string;
}

export interface SystemStatus {
  app_version: string;
  database_status: string;
  scheduler_status: string;
  email_delivery_mode: string;
  active_retailers_count: number;
  total_products_count: number;
  total_observations_count: number;
  providers: ProviderHealth[];
  last_refresh_job?: RefreshJob;
}
