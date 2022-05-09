export interface Cart {
  id: string;
}

// response rx from BC when create cart api is hit

// {
//   "data": {
//       "id": "1d480b3f-2680-4666-8b0e-6ee89ddea1dc",
//       "customer_id": 0,
//       "channel_id": 1,
//       "email": "",
//       "currency": {
//           "code": "CAD"
//       },
//       "tax_included": false,
//       "base_amount": 74.75,
//       "discount_amount": 0,
//       "cart_amount": 74.75,
//       "coupons": [],
//       "line_items": {
//           "physical_items": [
//               {
//                   "id": "e2953254-24aa-483a-b257-a04b08ca2459",
//                   "parent_id": null,
//                   "variant_id": 11416396,
//                   "product_id": 2320352,
//                   "sku": "1026001_2059",
//                   "name": "alexander-keiths-ipa~2059",
//                   "url": "https://beerstore-staging.mybigcommerce.com/alexander-keiths-ipa-2059/",
//                   "quantity": 5,
//                   "taxable": true,
//                   "image_url": "https://cdn11.bigcommerce.com/r-bed89d011afe375794394d8fa270f6ec8a1ed650/themes/ClassicNext/images/ProductDefault.gif",
//                   "discounts": [],
//                   "coupons": [],
//                   "discount_amount": 0,
//                   "coupon_amount": 0,
//                   "list_price": 14.95,
//                   "sale_price": 14.95,
//                   "extended_list_price": 74.75,
//                   "extended_sale_price": 74.75,
//                   "is_require_shipping": true,
//                   "is_mutable": true
//               }
//           ],
//           "digital_items": [],
//           "gift_certificates": [],
//           "custom_items": []
//       },
//       "created_time": "2022-02-18T07:11:26+00:00",
//       "updated_time": "2022-02-18T07:11:26+00:00",
//       "locale": "en"
//   },
//   "meta": {}
// }
