export interface Product {
  availability: string;
  availability_description: string;
  base_variant_id: string;
  bin_picking_number: number;
  brand_id: number;
  calculated_price: number;
  categories: number[];
  condition: string;
  cost_price: number;
  custom_url: {
    is_customized: boolean;
    url: string;
  };
  date_created: string;
  date_modified: string;
  depth: number;
  description: string;
  fixed_cost_shipping_price: number;
  gift_wrapping_options_list: string[];
  gift_wrapping_options_type: string;
  gtin: string;
  height: number;
  id: number;
  inventory_level: number;
  inventory_tracking: string;
  inventory_warning_level: number;
  is_condition_shown: boolean;
  is_featured: boolean;
  is_free_shipping: boolean;
  is_preorder_only: boolean;
  is_price_hidden: boolean;
  is_visible: boolean;
  layout_file: string;
  map_price: number;
  meta_description: string;
  meta_keywords: string[];
  mpn: string;
  name: string;
  open_graph_description: string;
  open_graph_title: string;
  open_graph_type: string;
  open_graph_use_image: boolean;
  open_graph_use_meta_description: boolean;
  open_graph_use_product_name: boolean;
  option_set_display: string;
  option_set_id: number;
  order_quantity_maximum: number;
  order_quantity_minimum: number;
  page_title: string;
  preorder_message: string;
  preorder_release_date: string;
  price: number;
  price_hidden_label: string;
  product_tax_code: string;
  related_products: number[];
  retail_price: number;
  reviews_count: number;
  reviews_rating_sum: number;
  sale_price: number;
  search_keywords: string;
  sku: number;
  sort_order: number;
  tax_class_id: number;
  total_sold: number;
  type: string;
  upc: string;
  view_count: number;
  warranty: string;
  weight: number;
  width: number;
}

// {
// "availability": "available",
// "availability_description": "",
// "base_variant_id": null,
// "bin_picking_number": "",
// "brand_id": 514,
// "calculated_price": 17.25,
// "categories": [
//   329,
//   335,
//   336,
//   332,
//   337,
//   338,
//   334,
//   333,
//   339,
//   340
// ],
// "condition": "New",
// "cost_price": 0,
// "custom_url": {
//   "is_customized": false,
//   "url": "/keystone-ice-2002/"
// },
// "date_created": "2021-02-06T21:11:04+00:00",
// "date_modified": "2021-12-20T15:39:25+00:00",
// "depth": 0,
// "description": "Keystone Ice is a medium-bodied, crisp beer that is lightly hopped with a slightly sweet flavor and medium-to-dry finish with a light gold colour.",
// "fixed_cost_shipping_price": 0,
// "gift_wrapping_options_list": [],
// "gift_wrapping_options_type": "any",
// "gtin": "",
// "height": 0,
// "id": 2299606,
// "inventory_level": 0,
// "inventory_tracking": "variant",
// "inventory_warning_level": 0,
// "is_condition_shown": false,
// "is_featured": false,
// "is_free_shipping": false,
// "is_preorder_only": false,
// "is_price_hidden": false,
// "is_visible": false,
// "layout_file": "",
// "map_price": 0,
// "meta_description": "",
// "meta_keywords": [],
// "mpn": "",
// "name": "keystone-ice~2002~InActive_131_2002",
// "open_graph_description": "",
// "open_graph_title": "",
// "open_graph_type": "product",
// "open_graph_use_image": true,
// "open_graph_use_meta_description": true,
// "open_graph_use_product_name": true,
// "option_set_display": "right",
// "option_set_id": 2281711,
// "order_quantity_maximum": 0,
// "order_quantity_minimum": 0,
// "page_title": "KEYSTONE ICE~2002",
// "preorder_message": "",
// "preorder_release_date": null,
// "price": 17.25,
// "price_hidden_label": "",
// "product_tax_code": "",
// "related_products": [
//   -1
// ],
// "retail_price": 0,
// "reviews_count": 0,
// "reviews_rating_sum": 0,
// "sale_price": 0,
// "search_keywords": "",
// "sku": "131_2002",
// "sort_order": 0,
// "tax_class_id": 0,
// "total_sold": 0,
// "type": "physical",
// "upc": "",
// "view_count": 0,
// "warranty": "",
// "weight": 1,
// "width": 0
// },
