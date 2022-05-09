export interface FavoriteBeer {
  id: number;
  customer_id: number;
  name: string;
  is_public: boolean;
  token: string;
  items?: ItemsEntity[] | null;
}
export interface ItemsEntity {
  id: number;
  product_id: number;
  variant_id: number;
}

export interface Pagination {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
}
