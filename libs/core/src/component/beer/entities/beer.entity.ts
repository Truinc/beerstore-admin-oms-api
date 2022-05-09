import { ApiProperty } from '@nestjs/swagger';

export class VariantsEntity {
  @ApiProperty({ type: Number })
  id: number;
  @ApiProperty({ type: Number })
  product_id: number;
  @ApiProperty({ type: String })
  sku: string;
  @ApiProperty({ type: Number })
  sku_id: number;
  @ApiProperty({ type: Number })
  price: number;
  @ApiProperty({ type: Number })
  calculated_price: number;
  @ApiProperty({ type: Number })
  sale_price: number;
  @ApiProperty({ type: Number })
  retail_price?: null;
  @ApiProperty({ type: Number })
  map_price?: null;
  @ApiProperty({ type: Number })
  weight?: null;
  @ApiProperty({ type: Number })
  calculated_weight: number;
  @ApiProperty({ type: Number })
  width?: null;
  @ApiProperty({ type: Number })
  height?: null;
  @ApiProperty({ type: Number })
  depth?: null;
  @ApiProperty({ type: Boolean })
  is_free_shipping: boolean;
  @ApiProperty({ type: Number })
  fixed_cost_shipping_price?: null;
  @ApiProperty({ type: Boolean })
  purchasing_disabled: boolean;
  @ApiProperty({ type: String })
  purchasing_disabled_message: string;
  @ApiProperty({ type: String })
  image_url: string;
  @ApiProperty({ type: Number })
  cost_price: number;
  @ApiProperty({ type: String })
  upc: string;
  @ApiProperty({ type: String })
  mpn: string;
  @ApiProperty({ type: String })
  gtin: string;
  @ApiProperty({ type: Number })
  inventory_level: number;
  @ApiProperty({ type: Number })
  inventory_warning_level: number;
  @ApiProperty({ type: String })
  bin_picking_number: string;
  @ApiProperty({ type: Object })
  option_values?: OptionValuesEntity[] | null;
  @ApiProperty({ type: Object })
  variant_info?: IVariantInfo;
  price_info?: CustomFieldsEntity;
  @ApiProperty({ type: Boolean })
  is_packup?: boolean;
  @ApiProperty({ type: Boolean })
  is_sale?: boolean;
}
export class Beer {
  @ApiProperty({ type: Number })
  id: number;
  @ApiProperty({ type: String })
  name: string;
  @ApiProperty({ type: String })
  type: string;
  @ApiProperty({ type: String })
  sku: string;
  @ApiProperty({ type: String })
  description: string;
  @ApiProperty({ type: Number })
  weight: number;
  @ApiProperty({ type: Number })
  width: number;
  @ApiProperty({ type: Number })
  depth: number;
  @ApiProperty({ type: Number })
  height: number;
  @ApiProperty({ type: Number })
  price: number;
  @ApiProperty({ type: Number })
  cost_price: number;
  @ApiProperty({ type: Number })
  retail_price: number;
  @ApiProperty({ type: Number })
  sale_price: number;
  @ApiProperty({ type: Number })
  map_price: number;
  @ApiProperty({ type: Number })
  tax_class_id: number;
  @ApiProperty({ type: String })
  product_tax_code: string;
  @ApiProperty({ type: Number })
  calculated_price: number;
  @ApiProperty({ type: Array })
  categories?: number[] | null;
  @ApiProperty({ type: Number })
  brand_id: number;
  @ApiProperty({ type: Number })
  option_set_id: number;
  @ApiProperty({ type: String })
  option_set_display: string;
  @ApiProperty({ type: Number })
  inventory_level: number;
  @ApiProperty({ type: Number })
  inventory_warning_level: number;
  @ApiProperty({ type: String })
  inventory_tracking: string;
  @ApiProperty({ type: Number })
  reviews_rating_sum: number;
  @ApiProperty({ type: Number })
  reviews_count: number;
  @ApiProperty({ type: Number })
  total_sold: number;
  @ApiProperty({ type: Number })
  fixed_cost_shipping_price: number;
  @ApiProperty({ type: Boolean })
  is_free_shipping: boolean;
  @ApiProperty({ type: Boolean })
  is_visible: boolean;
  @ApiProperty({ type: Boolean })
  is_featured: boolean;
  @ApiProperty({ type: Array })
  related_products?: number[] | null;
  @ApiProperty({ type: String })
  warranty: string;
  @ApiProperty({ type: String })
  bin_picking_number: string;
  @ApiProperty({ type: String })
  layout_file: string;
  @ApiProperty({ type: String })
  upc: string;
  @ApiProperty({ type: String })
  mpn: string;
  @ApiProperty({ type: String })
  gtin: string;
  @ApiProperty({ type: String })
  search_keywords: string;
  @ApiProperty({ type: String })
  availability: string;
  @ApiProperty({ type: String })
  availability_description: string;
  @ApiProperty({ type: String })
  gift_wrapping_options_type: string;
  @ApiProperty({ type: Array })
  gift_wrapping_options_list?: null[] | null;

  @ApiProperty({ type: Number })
  sort_order: number;
  @ApiProperty({ type: String })
  condition: string;
  @ApiProperty({ type: Boolean })
  is_condition_shown: boolean;
  @ApiProperty({ type: Number })
  order_quantity_minimum: number;
  @ApiProperty({ type: Number })
  order_quantity_maximum: number;
  @ApiProperty({ type: String })
  page_title: string;
  @ApiProperty({ type: Array })
  meta_keywords?: null[] | null;
  @ApiProperty({ type: String })
  meta_description: string;
  @ApiProperty({ type: String })
  date_created: string;
  @ApiProperty({ type: String })
  date_modified: string;
  @ApiProperty({ type: Number })
  view_count: number;
  @ApiProperty({ type: String })
  preorder_release_date?: null;
  @ApiProperty({ type: String })
  preorder_message: string;
  @ApiProperty({ type: Boolean })
  is_preorder_only: boolean;
  @ApiProperty({ type: Boolean })
  is_price_hidden: boolean;
  @ApiProperty({ type: String })
  price_hidden_label: string;
  @ApiProperty({ type: Object })
  custom_url: CustomUrl;
  @ApiProperty({ type: Number })
  base_variant_id?: null;
  @ApiProperty({ type: String })
  open_graph_type: string;
  @ApiProperty({ type: String })
  open_graph_title: string;
  @ApiProperty({ type: String })
  open_graph_description: string;
  @ApiProperty({ type: Boolean })
  open_graph_use_meta_description: boolean;
  @ApiProperty({ type: Boolean })
  open_graph_use_product_name: boolean;
  @ApiProperty({ type: Boolean })
  open_graph_use_image: boolean;
  @ApiProperty({ type: VariantsEntity })
  variants?: VariantsEntity[] | null;
  @ApiProperty({ type: String })
  images?: string[] | null;
  @ApiProperty({ type: String })
  primary_image?: string;
  @ApiProperty({ type: Object })
  custom_fields?: CustomFieldsEntity[] | null;
  @ApiProperty({ type: Boolean })
  is_sale?: boolean;
  @ApiProperty({ type: String })
  display?: string;
  @ApiProperty({ type: String })
  producer?: string;
}
export interface CustomUrl {
  url: string;
  is_customized: boolean;
}

export interface OptionValuesEntity {
  id: number;
  label: string;
  option_id: number;
  option_display_name: string;
}
export interface CustomFieldsEntity {
  id: number;
  name: string;
  value: string | PriceMetaData;
}

export interface IVariantInfo {
  type?: string;
  size?: number;
  pack_size?: number;
  label: string;
}

export interface PriceMetaData {
  current_price: CurrentPriceOrPreviousPrice;
  previous_price: CurrentPriceOrPreviousPrice;
  on_sale: string;
}
export interface CurrentPriceOrPreviousPrice {
  deposit: number;
  tax?: TaxEntity[] | null;
  total_price: number;
}
export interface TaxEntity {
  tax_type: string;
  tax_amount: number;
}
