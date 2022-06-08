export interface Order {
    orderStatus: number;
    orderId: string;
    orderType: string;
    storeId: string;
    fulfillmentDate: string;
    fulfillmentTime: string;
    customerName: string;
    customerEmail: string;
    transactionId: string;
    orderDateTime: string;
    cancellationDate: string;
    cancellationBy: string;
    cancellationReason: string;
    productsData?: (ProductsDataEntity)[] | null;
    orderData: OrderData;
    paymentData: MetaOrPaymentData;
  }
  export interface ProductsDataEntity {
    id: number;
    order_id: number;
    product_id: number;
    variant_id: number;
    order_address_id: number;
    name: string;
    name_customer: string;
    name_merchant: string;
    sku: string;
    upc: string;
    type: string;
    base_price: string;
    price_ex_tax: string;
    price_inc_tax: string;
    price_tax: string;
    base_total: string;
    total_ex_tax: string;
    total_inc_tax: string;
    total_tax: string;
    weight: string;
    width: string;
    height: string;
    depth: string;
    quantity: number;
    base_cost_price: string;
    cost_price_inc_tax: string;
    cost_price_ex_tax: string;
    cost_price_tax: string;
    is_refunded: boolean;
    quantity_refunded: number;
    refund_amount: string;
    return_id: number;
    wrapping_name: string;
    base_wrapping_cost: string;
    wrapping_cost_ex_tax: string;
    wrapping_cost_inc_tax: string;
    wrapping_cost_tax: string;
    wrapping_message: string;
    quantity_shipped: number;
    event_name?: null;
    event_date: string;
    fixed_shipping_cost: string;
    ebay_item_id: string;
    ebay_transaction_id: string;
    option_set_id?: null;
    parent_order_product_id?: null;
    is_bundled_product: boolean;
    bin_picking_number: string;
    external_id?: null;
    fulfillment_source: string;
    applied_discounts?: (null)[] | null;
    product_options?: (ProductOptionsEntity)[] | null;
    configurable_fields?: (null)[] | null;
    product: Product;
  }
  export interface ProductOptionsEntity {
    id: number;
    option_id: number;
    order_product_id: number;
    product_option_id: number;
    display_name: string;
    display_name_customer: string;
    display_name_merchant: string;
    display_value: string;
    display_value_customer: string;
    display_value_merchant: string;
    value: string;
    type: string;
    name: string;
    display_style: string;
  }
  export interface Product {
    data: Data;
    meta: MetaOrPaymentData;
  }
  export interface Data {
    id: number;
    name: string;
    type: string;
    sku: string;
    description: string;
    weight: number;
    width: number;
    depth: number;
    height: number;
    price: number;
    cost_price: number;
    retail_price: number;
    sale_price: number;
    map_price: number;
    tax_class_id: number;
    product_tax_code: string;
    calculated_price: number;
    categories?: (number)[] | null;
    brand_id: number;
    option_set_id: number;
    option_set_display: string;
    inventory_level: number;
    inventory_warning_level: number;
    inventory_tracking: string;
    reviews_rating_sum: number;
    reviews_count: number;
    total_sold: number;
    fixed_cost_shipping_price: number;
    is_free_shipping: boolean;
    is_visible: boolean;
    is_featured: boolean;
    related_products?: (number)[] | null;
    warranty: string;
    bin_picking_number: string;
    layout_file: string;
    upc: string;
    mpn: string;
    gtin: string;
    search_keywords: string;
    availability: string;
    availability_description: string;
    gift_wrapping_options_type: string;
    gift_wrapping_options_list?: (null)[] | null;
    sort_order: number;
    condition: string;
    is_condition_shown: boolean;
    order_quantity_minimum: number;
    order_quantity_maximum: number;
    page_title: string;
    meta_keywords?: (null)[] | null;
    meta_description: string;
    date_created: string;
    date_modified: string;
    view_count: number;
    preorder_release_date?: null;
    preorder_message: string;
    is_preorder_only: boolean;
    is_price_hidden: boolean;
    price_hidden_label: string;
    custom_url: CustomUrl;
    base_variant_id?: null;
    open_graph_type: string;
    open_graph_title: string;
    open_graph_description: string;
    open_graph_use_meta_description: boolean;
    open_graph_use_product_name: boolean;
    open_graph_use_image: boolean;
    variants?: (VariantsEntity)[] | null;
    custom_fields?: (CustomFieldsEntity)[] | null;
    options?: (OptionsEntity)[] | null;
  }
  export interface CustomUrl {
    url: string;
    is_customized: boolean;
  }
  export interface VariantsEntity {
    id: number;
    product_id: number;
    sku: string;
    sku_id: number;
    price: number;
    calculated_price: number;
    sale_price: number;
    retail_price?: null;
    map_price?: null;
    weight?: null;
    calculated_weight: number;
    width?: null;
    height?: null;
    depth?: null;
    is_free_shipping: boolean;
    fixed_cost_shipping_price?: null;
    purchasing_disabled: boolean;
    purchasing_disabled_message: string;
    image_url: string;
    cost_price: number;
    upc: string;
    mpn: string;
    gtin: string;
    inventory_level: number;
    inventory_warning_level: number;
    bin_picking_number: string;
    option_values?: (OptionValuesEntity)[] | null;
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
    value: string;
  }
  export interface OptionsEntity {
    id: number;
    product_id: number;
    name: string;
    display_name: string;
    type: string;
    sort_order: number;
    option_values?: (OptionValuesEntity1)[] | null;
    config?: (null)[] | null;
  }
  export interface OptionValuesEntity1 {
    id: number;
    label: string;
    sort_order: number;
    value_data?: null;
    is_default: boolean;
  }
  export interface MetaOrPaymentData {
      amount: number,
      card: {
          card_type: string;
          last_four: string;
      }
  }
  export interface OrderData {
    id: number;
    customer_id: number;
    date_created: string;
    date_modified: string;
    date_shipped: string;
    status_id: number;
    status: string;
    subtotal_ex_tax: string;
    subtotal_inc_tax: string;
    subtotal_tax: string;
    base_shipping_cost: string;
    shipping_cost_ex_tax: string;
    shipping_cost_inc_tax: string;
    shipping_cost_tax: string;
    shipping_cost_tax_class_id: number;
    base_handling_cost: string;
    handling_cost_ex_tax: string;
    handling_cost_inc_tax: string;
    handling_cost_tax: string;
    handling_cost_tax_class_id: number;
    base_wrapping_cost: string;
    wrapping_cost_ex_tax: string;
    wrapping_cost_inc_tax: string;
    wrapping_cost_tax: string;
    wrapping_cost_tax_class_id: number;
    total_ex_tax: string;
    total_inc_tax: string;
    total_tax: string;
    items_total: number;
    items_shipped: number;
    payment_method: string;
    payment_provider_id: string;
    payment_status: string;
    refunded_amount: string;
    order_is_digital: boolean;
    store_credit_amount: string;
    gift_certificate_amount: string;
    ip_address: string;
    ip_address_v6: string;
    geoip_country: string;
    geoip_country_iso2: string;
    currency_id: number;
    currency_code: string;
    currency_exchange_rate: string;
    default_currency_id: number;
    default_currency_code: string;
    staff_notes: string;
    customer_message: string;
    discount_amount: string;
    coupon_discount: string;
    shipping_address_count: number;
    is_deleted: boolean;
    ebay_order_id: string;
    cart_id: string;
    billing_address: BillingAddress;
    is_email_opt_in: boolean;
    credit_card_type?: null;
    order_source: string;
    channel_id: number;
    external_source?: null;
    products: ProductsOrShippingAddressesOrCoupons;
    shipping_addresses: ProductsOrShippingAddressesOrCoupons;
    coupons: ProductsOrShippingAddressesOrCoupons;
    external_id?: null;
    external_merchant_id?: null;
    tax_provider_id: string;
    customer_locale: string;
    store_default_currency_code: string;
    store_default_to_transactional_exchange_rate: string;
    custom_status: string;
  }
  export interface BillingAddress {
    first_name: string;
    last_name: string;
    company: string;
    street_1: string;
    street_2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    country_iso2: string;
    phone: string;
    email: string;
    form_fields?: (FormFieldsEntity)[] | null;
  }
  export interface FormFieldsEntity {
    name: string;
    value: string;
  }
  export interface ProductsOrShippingAddressesOrCoupons {
    url: string;
    resource: string;
  }
  