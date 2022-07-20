export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  env: process.env.ENVIRONMENT || 'development',
  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: process.env.JWT_FORGET_EXPIRATION_MINUTES,
  },
  database: {
    uri: process.env.MONGODB_URL,
    server: process.env.DB_SERVER,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
  },
  roles: {
    admin: 'ADMIN',
    user: 'USER',
  },
  CustomerAttribute: {
    dob_id: Number(process.env.CUSTOMER_DOB_ATTRID) || 3,
    salutation_id: Number(process.env.CUSTOMER_SALUTATION_ATTRID) || 2,
    address_id: Number(process.env.ADDRESS_ATTRID) || 26,
  },
  bigcom: {
    url: process.env.BIGCOM_API_URL,
    store: process.env.STORE_HASH,
    access_token: process.env.AUTH_TOKEN,
  },
  httpService: {
    storeURL: process.env.STORE_URL,
    storeAuthToken: process.env.STORE_AUTH_TOKEN,
    username: process.env.STORE_AUTH_USERNAME,
    password: process.env.STORE_AUTH_PASSWORD,
  },
  cacheManager: {
    ttl: process.env.CACHE_TTL || 10,
    max: process.env.CACHE_MAX || 100,
  },
  CartProductinfo: {
    default_base_delivery_fee: Number(process.env.DEFAULT_DELIVERY_FEE) || 13,
    Extra_delivery_fee: Number(process.env.EXTRA_DELIVERY_FEE) || 5,
    first_slot: Number(process.env.EXTRA_DELIVERY_FEE_CART_SIZE) || 74,
    next_slot: Number(process.env.EXTRA_DELIVERY_FEE_CART_SIZE2) || 72,
  },

  bigComIds: {
    WHAT_NEW_TYPE: process.env.WHAT_NEW_TYPE || 438,
    ON_SALE_TYPE: process.env.ON_SALE_TYPE || 346,
    BOTTLES: process.env.BOTTLES || 342,
    BOTTLES_SINGLE: process.env.BOTTLES_SINGLE || 354,
    BOTTLES_4_PACK: process.env.BOTTLES_4_PACK || 317,
    BOTTLES_6_PACK: process.env.BOTTLES_6_PACK || 369,
    BOTTLES_12_PACK: process.env.BOTTLES_12_PACK || 343,
    BOTTLES_24_PACK: process.env.BOTTLES_24_PACK || 344,
    CANS: process.env.CANS || 332,
    CANS_SINGLE: process.env.CANS_SINGLE || 337,
    CANS_4_PACK: process.env.CANS_4_PACK || 339,
    CANS_6_PACK: process.env.CANS_6_PACK || 338,
    CANS_12_PACK: process.env.CANS_12_PACK || 333,
    CANS_24_PACK: process.env.CANS_24_PACK || 334,
    KEGS: process.env.KEGS || 347,
  },
  thebeerguy: {
    url: process.env.THE_BEER_GUY_URL,
    key: process.env.THE_BEER_GUY_KEY,
  },
  bambora: {
    enabled3dsecure: process.env.ENABLED3DSECURE == 'true',
    version3dsecure: process.env.VERSION3DSECURE || 2,
    language: process.env.LANGUAGE || 'en-US',
    color_depth: process.env.COLOR_DEPTH || '24',
    screen_width: Number(process.env.SCREEN_WIDTH) || 1920,
    screen_height: Number(process.env.SCREEN_HEIGHT) || 1080,
    time_zone: Number(process.env.TIME_ZONE) || -120,
    url: process.env.BAMBORA_URL,
    authtoken: process.env.AUTHTOKEN,
    termUrl: process.env.TERMURL,
  },
  canadapost: {
    url: process.env.CANADAPOST_API_URL,
    version: process.env.CANADAPOST_V,
    api_key: process.env.CANADAPOST_API_KEY,
  },
  beerstoreApp: {
    url: process.env.BEERSTORE_APP_URL,
    token: process.env.BEERSTORE_APP_TOKEN,
    title: process.env.BEERSTORE_APP_PUSH_Title,
  },
  mail: {
    from_email_id: process.env.MAIL_FROM_EMAIL_ID,
    from_name: process.env.MAIL_FROM_NAME,
    host: process.env.MAIL_HOST,
    encryption: process.env.MAIL_ENCRYPTION,
    port: process.env.MAIL_PORT,
    username: process.env.MAIL_USERNAME,
    password: process.env.MAIL_PASSWORD,
    site_base_url: process.env.SITE_BASE_URL
  },
  timezone: {
    zone: process.env.TIME_ZONE
  }
});
