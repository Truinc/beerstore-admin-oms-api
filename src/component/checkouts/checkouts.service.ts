import { BeerService } from '@beerstore/core/component/beer/beer.service';
import { Beer } from '@beerstore/core/component/beer/entities/beer.entity';
import { StoreService } from '@beerstore/core/component/store/store.service';
import { ApiType, ApiVersion } from '@beerstore/core/interfaces/urls';
import { handleError } from '@beerstore/core/utils';
import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  NotAcceptableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { groupBy, pick } from 'lodash';
import { catchError, lastValueFrom, map, Observable } from 'rxjs';
import { CartService } from '../cart/cart.service';
import { CreateCheckoutDto } from './dto';
import {
  AddBillingAddressDto,
  CrubsideAddBillingAddressDto,
  DeliveryAddBillingAddressDto,
  PickupAddBillingAddressDto,
} from './dto/addBillingAddress.dto';
import { Checkout } from './entities/checkout.entity';

@Injectable()
export class CheckoutsService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private cartService: CartService,
    private beerService: BeerService,
    private storeService: StoreService,
  ) {}

  /**
   * User blacklist check
   * @param ip
   * @param email
   * @param phone
   */
  async checkBlacklist(ip: string, email: string, phone: string) {
    // https://bx-api.tweak.thebeerguy.ca/shopping_cart/check_blacklist/

    const params = new URLSearchParams({
      api_key: this.configService.get('thebeerguy').key,
      phone,
      ip,
      email,
    });
    const blacklistedUser = await lastValueFrom(
      this.httpService
        .get<{ result: string; output: string }>(
          `${
            this.configService.get('thebeerguy').url
          }/shopping_cart/check_blacklist/?${params.toString()}`,
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            const message = err.message;
            throw new UnprocessableEntityException(message);
          }),
        ),
    );
    if (blacklistedUser.result !== 'success') {
      throw new NotAcceptableException('user is blacklisted');
    }
    return blacklistedUser;
  }

  async getCheckout(checkoutId) {
    const checkout = await lastValueFrom(
      this.httpService
        .get<{ data: Checkout }>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/checkouts/${checkoutId}?include=consignments.available_shipping_options`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            let message = err.message;
            if (err.response && err.response.data && err.response.data.title) {
              message = err.response.data.title;
            }
            throw new UnprocessableEntityException(message);
          }),
        ),
    );
    return checkout;
  }

  async getCheckoutWithId(checkoutId: string, storeId: number, type: string) {
    const checkout = await this.getCheckout(checkoutId);
    const { cart, billing_address, consignments } = checkout.data;

    const productNameMap = {};
    const allProductInCart = await this.getAllProductInCart(
      cart.line_items.physical_items.map((c) => c.product_id).join(','),
    );
    const action = cart.line_items.physical_items.map(async (obj) => {
      const { variants, custom_fields, page_title } =
        allProductInCart[`${obj.product_id}`];
      const detailedInfo = this.cartService.groupSaleSubsitution(
        obj,
        variants,
        custom_fields,
      );

      const images = this.beerService.getImageFromCustomField(custom_fields);

      const mapVariant = pick(detailedInfo, [
        'id',
        'variant_id',
        'product_id',
        'sku',
        'name',
        'quantity',
        'sequence',
        'cart_info',
      ]);

      Object.assign(mapVariant, { images });

      Object.assign(productNameMap, {
        [mapVariant.product_id]: page_title.split('~')[0],
      });

      return mapVariant;
    });
    const res = await Promise.all(action);

    const totalCartItems = res.reduce((total, o) => {
      total += o.quantity;
      return total;
    }, 0);

    const totalPrice = res.reduce((total, o) => {
      total += o.cart_info.total_price;
      return total;
    }, 0);

    const hst = res.reduce((total, o) => {
      total += o.cart_info.total_tax;
      return total;
    }, 0);

    // const devileryFee = this.getExtraDeliveryFee(totalCartItems);
    // const resGroup = groupBy(res, 'product_id');
    const grandTotal = totalPrice + hst;
    const result = res.map((o) => ({
      ...o,
      cart_id: cart.id,
      display: productNameMap[o.product_id],
    }));

    let devileryFee = 0;
    let extraFee = 0;
    try {
      if (type === 'DELIVERY') {
        extraFee = this.cartService.getExtraDeliveryFee(totalCartItems);

        devileryFee =
          this.configService.get('CartProductinfo').default_base_delivery_fee;
        const getstoreDeliveryFee = await this.storeService.getStoreDeliveryFee(
          storeId,
        );
        if (getstoreDeliveryFee) {
          devileryFee = getstoreDeliveryFee.fee;
        }
      }
    } catch (err) {
      console.log('Error on get Delivery address', err.message);
    }

    return {
      hst,
      totalCartItems,
      totalPrice,
      deliveryFee: devileryFee + extraFee,
      grandTotal:
        Math.round(
          (grandTotal + devileryFee + extraFee + Number.EPSILON) * 100,
        ) / 100,
      items: result,
      billing_address,
      consignments,
    };
  }

  async requestBillingAddress(checkoutId: string, body: AddBillingAddressDto) {
    const address = await lastValueFrom(
      this.httpService
        .post(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/checkouts/${checkoutId}/billing-address?include=consignments.available_shipping_options`,
          body,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            let message = err.message;
            if (err.response && err.response.data && err.response.data.title) {
              message = err.response.data.title;
            }
            throw new UnprocessableEntityException(message);
          }),
        ),
    );

    return address;
  }

  /**
   * Add Checkout Billing Address
   * @param checkoutId
   * @param consignments
   * @param available_shipping_options
   * @param body
   */
  async addPickupBillingAddress(
    checkoutId: string,
    storeId: number,
    body: PickupAddBillingAddressDto,
  ) {
    const store = await this.storeService.findByStoreId(storeId);
    const custom_fields = {
      store_id: store.id,
      current_store_name: store.locationName,
      current_store_address: `${store.streetNo} ${store.street}, ${store.postalCode}`,
      current_store_distance: '11382',
      order_type: body.order_type,
      pick_delivery_date: new Date(body.date).getTime(),
      pick_delivery_time: body.time,
      delivery_address: '',
      order_email: body.email,
      order_payment_method: body.payment_method,
      pick_delivery_date_text: body.date, //2022-04-20
      user_promotions: '',
      delivery_first_name: body.first_name,
      delivery_last_name: body.last_name,
      delivery_phone: body.phone,
      salutation: body.salutation,
      contact_first_name: body.first_name,
      contact_last_name: body.last_name,
      contact_phone: body.phone,
      contact_email: body.email,
      dob: body.dob,
    };

    const addressPayload = pick(body, [
      'first_name',
      'last_name',
      'email',
      'company',
      'address1',
      'address2',
      'city',
      'state_or_province',
      'state_or_province_code',
      'country_code',
      'postal_code',
      'phone',
    ]) as AddBillingAddressDto;

    Object.assign(addressPayload, {
      custom_fields: [
        {
          field_id: this.configService.get('CustomerAttribute').address_id,
          field_value: JSON.stringify(custom_fields),
        },
      ],
    });
    const address = this.requestBillingAddress(checkoutId, addressPayload);
    return address;
  }

  async addDeliveryBillingAddress(
    checkoutId: string,
    storeId: number,
    body: DeliveryAddBillingAddressDto,
  ) {
    const store = await this.storeService.findByStoreId(storeId);
    const custom_fields = {
      store_id: store.id,
      current_store_name: store.locationName,
      current_store_address: `${store.streetNo} ${store.street}, ${store.postalCode}`,
      current_store_distance: '11382',
      order_type: body.order_type,
      pick_delivery_date: new Date(body.date).getTime(),
      pick_delivery_time: body.time,
      delivery_address: '',
      order_email: body.email,
      order_payment_method: body.payment_method,
      pick_delivery_date_text: body.date, //2022-04-20
      user_promotions: '',
      delivery_first_name: body.first_name,
      delivery_last_name: body.last_name,
      delivery_phone: body.phone,
      salutation: body.salutation,
      contact_first_name: body.first_name,
      contact_last_name: body.last_name,
      contact_phone: body.phone,
      contact_email: body.email,
      dob: body.dob,
    };

    const addressPayload = pick(body, [
      'first_name',
      'last_name',
      'email',
      'company',
      'address1',
      'address2',
      'city',
      'state_or_province',
      'state_or_province_code',
      'country_code',
      'postal_code',
      'phone',
    ]) as AddBillingAddressDto;

    Object.assign(addressPayload, {
      custom_fields: [
        {
          field_id: this.configService.get('CustomerAttribute').address_id,
          field_value: JSON.stringify(custom_fields),
        },
      ],
    });
    const address = this.requestBillingAddress(checkoutId, addressPayload);
    return address;
  }

  /**
   * Add Checkout Billing Address
   * @param checkoutId
   * @param consignments
   * @param available_shipping_options
   * @param body
   */
  async addCrubsideBillingAddress(
    checkoutId: string,
    storeId: number,
    body: CrubsideAddBillingAddressDto,
  ) {
    const store = await this.storeService.findByStoreId(storeId);
    const custom_fields = {
      store_id: store.id,
      current_store_name: store.locationName,
      current_store_address: `${store.streetNo} ${store.street}, ${store.postalCode}`,
      current_store_distance: '11382',
      order_type: body.order_type,
      pick_delivery_date: new Date(body.date).getTime(),
      pick_delivery_time: body.time,
      delivery_address: '',
      order_email: body.email,
      order_payment_method: body.payment_method,
      pick_delivery_date_text: body.date, //2022-04-20
      user_promotions: '',
      delivery_first_name: body.first_name,
      delivery_last_name: body.last_name,
      delivery_phone: body.phone,
      salutation: body.salutation,
      contact_first_name: body.first_name,
      contact_last_name: body.last_name,
      contact_phone: body.phone,
      contact_email: body.email,
      dob: body.dob,
      car_model: body.car_model,
      car_color: body.car_color,
    };

    const addressPayload = pick(body, [
      'first_name',
      'last_name',
      'email',
      'company',
      'address1',
      'address2',
      'city',
      'state_or_province',
      'state_or_province_code',
      'country_code',
      'postal_code',
      'phone',
    ]) as AddBillingAddressDto;

    Object.assign(addressPayload, {
      custom_fields: [
        {
          field_id: this.configService.get('CustomerAttribute').address_id,
          field_value: JSON.stringify(custom_fields),
        },
      ],
    });
    const address = this.requestBillingAddress(checkoutId, addressPayload);
    return address;
  }

  /**
   * BiggComm name is consignment address
   * @param checkoutId
   * @param createCheckoutDto
   * @returns
   */
  async addShippingAddress(checkoutId: string) {
    const checkout = await this.getCheckout(checkoutId);
    const line_items = checkout.data.cart.line_items.physical_items.map(
      (o) => ({ item_id: o.id, quantity: o.quantity }),
    );
    const shippingAddress = pick(checkout.data.billing_address, [
      'first_name',
      'last_name',
      'email',
      'company',
      'address1',
      'address2',
      'city',
      'state_or_province',
      'state_or_province_code',
      'country_code',
      'postal_code',
      'phone',
    ]);

    const body = { line_items, address: shippingAddress };
    const response = await lastValueFrom(
      this.httpService
        .post(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/checkouts/${checkoutId}/consignments?include=consignments.available_shipping_options`,
          [body],
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError((err) => {
            let message = err.message;
            if (err.response && err.response.data && err.response.data.title) {
              message = err.response.data.title;
            }
            throw new UnprocessableEntityException(message);
          }),
        ),
    );

    return response;
  }

  // need testing and more options can be added
  updateShippingAddress(
    checkoutId: string,
    consignmentId: string,
    createCheckoutDto: CreateCheckoutDto,
  ): Observable<any> {
    const uri = `v3/orders`;
    const queryStr = `/${checkoutId}/consignments/${consignmentId}`;
    return this.httpService
      .put(
        `${this.configService.get('bigcom').url}/stores/${
          this.configService.get('bigcom').store
        }/${uri}${queryStr}`,
        createCheckoutDto,
        {
          headers: {
            'x-auth-token': this.configService.get('bigcom').access_token,
          },
        },
      )
      .pipe(
        map((response) => response.data),
        catchError(handleError<any>(null)),
      );
  }

  async updateBillingAddress(
    checkoutId: string,
    addressId: string,
    createCheckoutDto: CreateCheckoutDto,
  ): Promise<any> {
    const uri = `v2/orders`;
    const queryStr = `/${checkoutId}/billing-address/${addressId}`;
    const response = await lastValueFrom(
      this.httpService
        .put(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/${uri}${queryStr}`,
          createCheckoutDto,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError(handleError<any>(null)),
        ),
    );
    return response;
  }

  async deleteShippingAddress(
    checkoutId: string,
    consignmentId: string,
  ): Promise<any> {
    const uri = `v3/orders`;
    const queryStr = `/${checkoutId}/consignments/${consignmentId}`;
    const response = await lastValueFrom(
      this.httpService
        .delete(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/${uri}${queryStr}`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => response.data),
          catchError(handleError<any>(null)),
        ),
    );
    return response;
  }

  async checkKegInCart(checkoutId: string) {
    const checkout = await this.cartService.findOne(checkoutId);
    if (checkout.items && checkout.items.length > 0) {
      const isKeg = checkout.items.reduce((flag, obj) => {
        if (flag !== true) {
          flag = obj.data.some((o) => {
            if (o.cart_info.type === 'Keg') {
              return true;
            }
          });
        }
        return flag;
      }, false);

      if (isKeg) {
        throw new NotAcceptableException(
          'Unfortunately we do not deliver kegs at this time. Please remove this from your cart or switch to Pickup at store.',
        );
      }
    }
    return true;
  }

  async getAllProductInCart(ids: string) {
    const { data } = await this.beerService.getProducts(
      `id:in=${ids}&limit=250&is_visible=true&include=variants,custom_fields`,
    );
    let actualCartProduct = this.beerService.formatVariants(data);

    actualCartProduct = actualCartProduct.map((o) => {
      o.images = this.beerService.getImageFromCustomField(o.custom_fields);
      return o;
    });
    const response: { [key: string]: Beer } = actualCartProduct.reduce(
      (total, o) => {
        return { ...total, [o.id]: o };
      },
      {},
    );
    return response;
  }

  async checkProductInventory(cardId: string, storeId: number, type: string) {
    const notFoundBeers = [];
    /**
     * Get Cart Items
     */
    const uri = `v3/carts/${cardId}`;
    const { data } = await lastValueFrom(this.cartService.request(uri));

    if (data && data.line_items && data.line_items.physical_items) {
      const { physical_items } = data.line_items;
      const totalItemInCart = physical_items.length;
      const productNameMap = {}; // produceId => name
      physical_items.map((o) => {
        Object.assign(productNameMap, {
          [o.product_id]: o.name,
        });
      });

      const { id } = await this.beerService.getBrandFromStoreName(storeId); //storeId to brandId
      const productGroup = groupBy(physical_items, 'product_id');

      /**
       * cartInfo [{name, product_id, variants: all the variant of that product}]
       */
      const cartInfo = Object.keys(productGroup).map((key) => {
        return {
          name: productNameMap[key],
          product_id: key,
          variants: productGroup[key],
        };
      });

      const allProductInCart = await this.getAllProductInCart(
        cartInfo.map((c) => c.product_id).join(','),
      );
      const action = cartInfo.map(async (o) => {
        const storeIdFromProductName = o.name.split('~')[1];
        const productNameToSearch = o.name.replace(
          storeIdFromProductName,
          storeId,
        );
        const filter = `brand_id=${id}&name=${productNameToSearch}&limit=1&is_visible=true&include=variants,custom_fields`;
        const { data, meta } = await this.beerService.getProducts(filter);

        const actualCartProduct = allProductInCart[`${o.product_id}`];

        if (meta.pagination.count === 0) {
          return {
            cart_product_id: o.product_id,
            name: o.name,
            cart_product: actualCartProduct,
          };
        }

        const beer = this.beerService.formatVariants(data);
        beer[0].images = this.beerService.getImageFromCustomField(
          beer[0].custom_fields,
        );
        return {
          cart_product_id: o.product_id,
          name: o.name,
          product: beer[0],
          cart_product: actualCartProduct,
        };
      });

      const productFromTheStore = await Promise.all(action);

      const groupProduct: {
        [key: string]: {
          cart_product_id: string;
          name: string;
          product?: Beer;
          cart_product: Beer;
        };
      } = productFromTheStore.reduce((total, info) => {
        Object.assign(total, { [info.cart_product_id]: info });
        return total;
      }, {});

      cartInfo.map((o) => {
        if (
          groupProduct[`${o.product_id}`] &&
          groupProduct[`${o.product_id}`].product
        ) {
          o.variants.map((cart_variant) => {
            const beer = groupProduct[`${o.product_id}`];

            const cartVariantLabel = beer.cart_product.variants.find(
              (v) => `${v.id}` === `${cart_variant.variant_id}`,
            ).variant_info.label;

            const variant = beer.product.variants.find(
              (v) => `${v.variant_info.label}` === `${cartVariantLabel}`,
            );

            if (!variant) {
              notFoundBeers.push({
                removed: cart_variant.quantity,
                remaining: 0,
                label: cartVariantLabel,
                images: beer.cart_product.images,
                display: beer.cart_product.page_title.split('~')[0],
                product_id: cart_variant.product_id,
                variant_id: cart_variant.variant_id,
              });
            } else if (variant.purchasing_disabled) {
              notFoundBeers.push({
                removed: cart_variant.quantity,
                remaining: 0,
                label: variant.variant_info.label,
                images: beer.cart_product.images,
                display: beer.cart_product.page_title.split('~')[0],
                product_id: cart_variant.product_id,
                variant_id: cart_variant.variant_id,
              });
            } else if (cart_variant.quantity > variant.inventory_level) {
              const removed = cart_variant.quantity - variant.inventory_level;
              notFoundBeers.push({
                removed,
                remaining: variant.inventory_level,
                label: variant.variant_info.label,
                images: beer.product.images,
                display: beer.product.page_title.split('~')[0],
                product_id: cart_variant.product_id,
                variant_id: cart_variant.variant_id,
              });
            }
          });
        } else {
          o.variants.map((obj) => {
            const beer = groupProduct[`${o.product_id}`].cart_product;
            const variant = beer.variants.find(
              (v) => v.product_id === obj.product_id && v.id === obj.variant_id,
            );
            notFoundBeers.push({
              removed: obj.quantity,
              remaining: 0,
              label: variant.variant_info.label,
              images: beer.images,
              display: beer.page_title.split('~')[0],
              product_id: obj.product_id,
              variant_id: obj.variant_id,
            });
          });
        }
        return;
      });

      let message = '';
      if (totalItemInCart === notFoundBeers.length) {
        if (type === 'DELIVERY') {
          message =
            'Unfortunately none of the beers in your cart are available at the delivery store closest to you';
        } else {
          message =
            'Unfortunately none of the beers in your cart are available at the new location';
        }
        throw new NotAcceptableException({ message, partial: false });
      } else if (notFoundBeers.length > 0) {
        if (type === 'DELIVERY') {
          message =
            'The product listed below are not available at the delivery store closest to you and will be removed from your cart, should you wish to proceed';
        } else {
          message =
            'The product listed below are not available from the selected store and will be removed from your cart, should you wish to proceed.';
        }
        throw new NotAcceptableException({
          message,
          products: notFoundBeers,
          partial: true,
        });
      }
    }

    return;
  }
}
