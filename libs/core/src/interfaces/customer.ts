export interface Customer {
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

export interface Address {
  address1: string;
  address2: string;
  address_type: string;
  city: string;
  company: string;
  country: string;
  country_code: string;
  customer_id: number;
  first_name: string;
  id: number;
  last_name: string;
  phone: number;
  postal_code: string;
  state_or_province: string;
}
