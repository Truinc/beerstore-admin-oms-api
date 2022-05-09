// fields verification required
export interface Order {
  id: string;
  _authentication: {
    force_password_reset: boolean;
    new_password: string;
  };
  company: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_created: string;
  date_modified: string;
  store_credit: number;
  registration_ip_address: string;
  customer_group_id: number;
  notes: string;
  tax_exempt_category: string;
  accepts_marketing: boolean;
  addresses: {
    url: string;
    resource: string;
  };
  form_fields: [
    {
      name: string;
      value: string;
    },
  ];
  reset_pass_on_login: boolean;
}

export enum SortOptions {
  ORDER_ID = 'id',
  CUSTOMER_ID = 'customer_id',
  DATE_CREATED = 'date_created',
  DATE_MODIFIED = 'date_modified',
  STATUS_ID = 'status_id',
}

export const orderQuery = [
  'sort',
  'status_id',
  'limit',
  'max_date_created',
  'max_date_modified',
  'max_total',
  'min_date_created',
  'min_date_modified',
  'page',
];

export const sortOptions = [
  'id',
  'customer_id',
  'date_created',
  'date_modified',
  'status_id',
];
export interface OrderQuery {
  sort?: SortOptions;
  status_id?: string;
  limit?: number;
  max_date_created?: string;
  max_date_modified?: string;
  max_total?: string;
  min_date_created?: string;
  min_date_modified?: string;
  page?: number;
}
