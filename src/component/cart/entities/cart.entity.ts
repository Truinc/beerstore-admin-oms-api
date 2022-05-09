export interface Cart {
  id: string;
  customer_id: number;
  channel_id: number;
  email: string;
  currency: Currency;
  tax_included: boolean;
  base_amount: number;
  discount_amount: number;
  cart_amount: number;
  coupons?: null[] | null;
  line_items: LineItems;
  created_time: string;
  updated_time: string;
  locale: string;
  display?: string;
  product_name?: string;
}
export interface Currency {
  code: string;
}
export interface LineItems {
  physical_items?: PhysicalItemsEntity[] | null;
  digital_items?: null[] | null;
  gift_certificates?: null[] | null;
  custom_items?: null[] | null;
}
export interface PhysicalItemsEntity {
  id: string;
  parent_id?: null;
  variant_id: number;
  product_id: number;
  sku: string;
  name: string;
  url: string;
  quantity: number;
  taxable: boolean;
  image_url: string;
  discounts?: null[] | null;
  coupons?: null[] | null;
  discount_amount: number;
  coupon_amount: number;
  list_price: number;
  sale_price: number;
  extended_list_price: number;
  extended_sale_price: number;
  is_require_shipping: boolean;
  is_mutable: boolean;
  options?: OptionsEntity[] | null;
}
export interface OptionsEntity {
  name: string;
  nameId: number;
  value: string;
  valueId: number;
}
