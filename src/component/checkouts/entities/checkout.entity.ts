import { Cart } from '../../cart/entities/cart.entity';

export interface Checkout {
  id: string;
  cart: Cart;
  billing_address: BillingAddress;
  consignments?: null[] | null;
  taxes?: TaxesEntity[] | null;
  coupons?: null[] | null;
  order_id?: null;
  shipping_cost_total_inc_tax: number;
  shipping_cost_total_ex_tax: number;
  handling_cost_total_inc_tax: number;
  handling_cost_total_ex_tax: number;
  tax_total: number;
  subtotal_inc_tax: number;
  subtotal_ex_tax: number;
  grand_total: number;
  created_time: string;
  updated_time: string;
  customer_message: string;
}
export interface Currency {
  code: string;
}
export interface DiscountsEntity {
  id: string;
  discounted_amount: number;
}

export interface BillingAddress {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state_or_province: string;
  state_or_province_code: string;
  country: string;
  country_code: string;
  postal_code: string;
  phone: string;
  custom_fields?: CustomFieldsEntity[] | null;
}
export interface CustomFieldsEntity {
  fieldId: string;
  fieldValue: string;
}
export interface TaxesEntity {
  name: string;
  amount: number;
}
