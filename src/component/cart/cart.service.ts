import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, map } from 'rxjs';
import { CreateCartDto, LineItem } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
// import { RepackSingle } from '@beerstore/core/utils/RepackSingle';
import { mapValues, orderBy, pick, groupBy } from 'lodash';

import { BeerService } from '@beerstore/core/component/beer/beer.service';
import {
  Beer,
  CustomFieldsEntity,
  VariantsEntity,
} from '@beerstore/core/component/beer/entities/beer.entity';
import { Cart, PhysicalItemsEntity } from './entities/cart.entity';
import { StoreService } from '@beerstore/core/component/store/store.service';
@Injectable()
export class CartService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private beerService: BeerService,
    private storeService: StoreService,
  ) {}

  request(uri: string) {
    return this.httpService
      .get<{ data: Cart }>(
        `${this.configService.get('bigcom').url}/stores/${
          this.configService.get('bigcom').store
        }/${uri}`,
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
          if (
            err &&
            err.response &&
            err.response.status &&
            err.response.status === 404
          ) {
            throw new NotFoundException('Cart not found');
          }
          throw new UnprocessableEntityException(message);
        }),
      );
  }

  create(createCartDto: {
    line_items: LineItem[];
    customer_id: number;
  }): Promise<{ data: Cart }> {
    // ?include=line_items.physical_items.options,redirect_urls
    return lastValueFrom(
      this.httpService
        .post(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/carts?include=line_items.physical_items.options`,
          createCartDto,
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
  }

  getPackup = (
    variants: VariantsEntity[],
    variant: VariantsEntity,
    line_item: LineItem,
    custom_fields: CustomFieldsEntity[],
  ) => {
    const generated_line_items: LineItem[] = [];
    let group = this.beerService.groupVariants(variants, custom_fields);
    group = mapValues(group, (obj) => {
      return orderBy(
        obj,
        ['variant_info.pack_size', 'variant_info.size'],
        ['desc', 'desc'],
      );
    });
    const filterVariant = group[variant.variant_info.type].filter(
      (obj) =>
        obj.variant_info.label != variant.variant_info.label && // remove the self variant
        obj.variant_info.pack_size < variant.variant_info.pack_size && // variants pack < current variant pack
        obj.variant_info.size === variant.variant_info.size && // belong from similair size
        variant.variant_info.pack_size % obj.variant_info.pack_size === 0 && //multiple of current variant only
        obj.variant_info.pack_size * obj.inventory_level >=
          variant.variant_info.pack_size, // variant have enough quantity
    );
    const totalQuantity = line_item.quantity;
    const filterQuantity = filterVariant.reduce((total, obj) => {
      total += Math.floor(
        (obj.variant_info.pack_size * obj.inventory_level) /
          variant.variant_info.pack_size,
      );
      return total;
    }, 0);

    if (filterQuantity >= totalQuantity) {
      filterVariant.reduce((quantity, obj) => {
        if (quantity > 0) {
          const factor =
            variant.variant_info.pack_size / obj.variant_info.pack_size;
          let quantityContribution = Math.floor(
            (obj.variant_info.pack_size * obj.inventory_level) /
              variant.variant_info.pack_size,
          );
          if (quantityContribution > quantity) {
            quantityContribution = quantity;
          }
          quantity -= quantityContribution;
          generated_line_items.push({
            product_id: line_item.product_id,
            variant_id: obj.id,
            quantity: factor * quantityContribution,
          });
        }
        return quantity;
      }, line_item.quantity);
    }

    return generated_line_items;
  };

  getRepack = (
    variants: VariantsEntity[],
    variant: VariantsEntity,
    line_item: LineItem,
    custom_field: CustomFieldsEntity[],
  ) => {
    const sequence: Array<{
      sale: { variant: VariantsEntity; quantity: number };
      sub?: { variant: VariantsEntity; quantity: number };
    }> = [];
    let group = this.beerService.groupVariants(variants, custom_field);
    group = mapValues(group, (obj) => {
      return orderBy(
        obj,
        ['variant_info.pack_size', 'variant_info.size'],
        ['desc', 'desc'],
      );
    });
    const filterVariant = group[variant.variant_info.type].filter(
      (obj) =>
        obj.variant_info.pack_size > variant.variant_info.pack_size && // get all the bigger packs
        obj.variant_info.size === variant.variant_info.size && // filter on same size
        obj.variant_info.pack_size % variant.variant_info.pack_size === 0, // multiple of current variant
    );
    const totalQuantity = variant.variant_info.pack_size * line_item.quantity;
    const remainingQuantity = filterVariant.reduce((remains, obj) => {
      const contribution = Math.floor(remains / obj.variant_info.pack_size);
      if (contribution > 0) {
        remains = totalQuantity % obj.variant_info.pack_size;
        sequence.push({
          sale: { variant: obj, quantity: contribution },
          sub: {
            variant,
            quantity:
              Math.floor(
                obj.variant_info.pack_size / variant.variant_info.pack_size,
              ) * contribution,
          },
        });
      }
      return remains;
    }, totalQuantity);
    if (remainingQuantity > 0) {
      const contribution = Math.floor(
        remainingQuantity / variant.variant_info.pack_size,
      );
      sequence.push({ sale: { variant, quantity: contribution } });
    }

    return sequence;
  };

  async getProduct(product_id: number) {
    const { data } = await this.beerService.findAll(
      undefined,
      undefined,
      `${product_id}`,
      undefined,
      undefined,
      'variants,custom_fields,images,primary_image',
      undefined,
      undefined,
      1,
    );
    if (data.length > 0) {
      return data[0];
    }
    throw new NotFoundException('product does found');
    // throw exception product not found
  }

  async generateCartItem(
    line_item: LineItem,
    variants: VariantsEntity[],
    custom_fields: CustomFieldsEntity[],
  ) {
    // const { variants, custom_fields } = await this.getProduct(
    //   line_item.product_id,
    // );
    const variant = variants.find((obj) => obj.id === line_item.variant_id);
    if (!variant) {
      // throw exception variant not found
      throw new ConflictException('product does not have sufficient stock');
    }

    if (variant.inventory_level === 0 && !!variant.is_packup) {
      const generated_line_items = this.getPackup(
        variants,
        variant,
        line_item,
        custom_fields,
      );
      if (generated_line_items.length > 0) {
        return { line_items: generated_line_items, variants, custom_fields };
      }
      throw new ConflictException('product does not have sufficient stock');
      // throw insuffecent product in the packup exception
    } else if (variant.inventory_level >= line_item.quantity) {
      return { line_items: [line_item], variants, custom_fields };
    }
    throw new ConflictException('product does not have sufficient stock');
    //  throw error if variant item not sufficient
  }

  getTaxDepositInfo = (
    variant: VariantsEntity,
    custom_fields: CustomFieldsEntity[],
  ) => {
    const custom_field = { deposit: 0, on_sale: 'N', tax: 0 };
    if (custom_fields) {
      const custom_field_res = custom_fields.find((obj1) => {
        const sku = variant.sku.split('_')[0];
        if (`Price_Metadata_${sku}` == obj1.name) {
          return obj1;
        }
      });

      if (custom_field_res && custom_field_res.value) {
        const info: {
          current_price: {
            deposit: number;
            tax: Array<{ tax_type: string; tax_amount: number }>;
          };
          on_sale: string;
        } = JSON.parse(custom_field_res.value as string);

        if (info && info.current_price && info.current_price.deposit) {
          Object.assign(custom_field, { deposit: info.current_price.deposit });
        }

        if (info && info.current_price && info.current_price.tax) {
          const hst = info.current_price.tax.reduce((t, o) => {
            if (o.tax_type == 'HST') {
              t += o.tax_amount;
            }
            return t;
          }, 0);
          Object.assign(custom_field, { tax: hst });
        }

        if (info && info.on_sale) {
          Object.assign(custom_field, { on_sale: info.on_sale });
        }
      }
    }
    return custom_field;
  };

  groupSaleSubsitution = (
    obj: PhysicalItemsEntity,
    variants: VariantsEntity[],
    custom_fields: CustomFieldsEntity[],
  ) => {
    const item = {
      quantity: obj.quantity,
      variant_id: obj.variant_id,
      product_id: obj.product_id,
    };
    const variant = variants.find((obj1) => obj1.id === item.variant_id);
    const sequence = this.getRepack(variants, variant, item, custom_fields);

    let is_sale = false;
    const originalPrice =
      [variant].reduce((total, obj1) => {
        let price = obj1.price;
        if (obj1.sale_price < price) {
          price = obj1.sale_price;
          is_sale = true;
        }
        return (total += price);
      }, 0) * obj.quantity;

    const priceFromRepack = sequence.reduce((total, obj1) => {
      let price = obj1.sale.variant.price;
      if (obj1.sale.variant.sale_price < price) {
        price = obj1.sale.variant.sale_price;
        is_sale = true;
      }
      return (total += price * obj1.sale.quantity);
    }, 0);

    if (originalPrice > priceFromRepack) {
      const packTaxAndDeposit = sequence.reduce(
        (total, obj1) => {
          const field = this.getTaxDepositInfo(
            obj1.sale.variant,
            custom_fields,
          );
          if (field.on_sale != 'N') {
            is_sale = true;
          }

          return {
            tax: total.tax + field.tax * obj1.sale.quantity,
            deposit: total.deposit + field.deposit * obj1.sale.quantity,
          };
        },
        { tax: 0, deposit: 0 },
      );
      return {
        ...obj,
        sequence,
        cart_info: {
          label: variant.variant_info.label,
          type: variant.variant_info.type,
          is_packup: true,
          is_sale,
          total_price: priceFromRepack,
          original_price: originalPrice,
          total_tax: packTaxAndDeposit.tax,
          total_deposit: packTaxAndDeposit.deposit,
        },
      };
    }

    const field = this.getTaxDepositInfo(variant, custom_fields);
    if (field.on_sale != 'N') {
      is_sale = true;
    }
    return {
      ...obj,
      sequence,
      cart_info: {
        label: variant.variant_info.label,
        type: variant.variant_info.type,
        is_packup: false,
        is_sale,
        total_price: originalPrice,
        original_price: originalPrice,
        total_tax: field.tax * obj.quantity,
        total_deposit: field.deposit * obj.quantity,
      },
    };
  };

  async createRepack(createCartDto: CreateCartDto) {
    const { variants, custom_fields } = await this.getProduct(
      createCartDto.product_id,
    );
    const lineItemAction = createCartDto.line_item.map(async (o) => {
      const { line_items } = await this.generateCartItem(
        {
          ...o,
          product_id: createCartDto.product_id,
        },
        variants,
        custom_fields,
      );
      return { line_items };
    });

    const cartItemList = await Promise.all(lineItemAction);

    const line_items: LineItem[] = cartItemList.reduce((obj, o) => {
      const mergeArr = obj.concat(o.line_items);
      return mergeArr;
    }, []);

    const cartInfo = await this.create({
      line_items,
      customer_id: createCartDto.customer_id,
    });

    // cartInfo.data.line_items.physical_items =
    //   cartInfo.data.line_items.physical_items.map((obj) => {
    //     return this.groupSaleSubsitution(obj, variants, custom_fields);
    //   });

    const response = pick(cartInfo.data, ['id', 'customer_id', 'email']);
    // const mapVariant = lodashMap(
    //   cartInfo.data.line_items.physical_items,
    //   partialRight(pick, [
    //     'id',
    //     'variant_id',
    //     'product_id',
    //     'sku',
    //     'name',
    //     'quantity',
    //     'sequence',
    //     'cart_info',
    //   ]),
    // );

    // Object.assign(response, {
    //   display: page_title.split('~')[0],
    //   line_items: { physical_items: mapVariant },
    // });

    return response;
  }

  update = (
    id: string,
    createCartDto: { line_items: LineItem[]; customer_id: number },
  ) => {
    return lastValueFrom(
      this.httpService
        .post(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/carts/${id}/items?include=line_items.physical_items.options`,
          createCartDto,
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
            if (
              err &&
              err.response &&
              err.response.status &&
              err.response.status === 404
            ) {
              throw new NotFoundException('product not found');
            }
            throw new UnprocessableEntityException(message);
          }),
        ),
    );
  };

  async addItemToCart(id: string, createCartDto: CreateCartDto) {
    const { variants, custom_fields } = await this.getProduct(
      createCartDto.product_id,
    );
    // console.log(variants);
    // return variants;
    const lineItemAction = createCartDto.line_item.map(async (o) => {
      const { line_items } = await this.generateCartItem(
        {
          ...o,
          product_id: createCartDto.product_id,
        },
        variants,
        custom_fields,
      );
      return { line_items };
    });

    const cartItemList = await Promise.all(lineItemAction);

    const line_items: LineItem[] = cartItemList.reduce((obj, o) => {
      const mergeArr = obj.concat(o.line_items);
      return mergeArr;
    }, []);

    const cartInfo = await this.update(id, {
      line_items,
      customer_id: createCartDto.customer_id,
    });

    // cartInfo.data.line_items.physical_items =
    //   cartInfo.data.line_items.physical_items.map((obj) => {
    //     return this.groupSaleSubsitution(obj, variants, custom_fields);
    //   });

    const response = pick(cartInfo.data, ['id', 'customer_id', 'email']);
    // const mapVariant = lodashMap(
    //   cartInfo.data.line_items.physical_items,
    //   partialRight(pick, [
    //     'id',
    //     'variant_id',
    //     'product_id',
    //     'sku',
    //     'name',
    //     'quantity',
    //     'sequence',
    //     'cart_info',
    //   ]),
    // );

    // Object.assign(response, {
    //   display: page_title.split('~')[0],
    //   line_items: { physical_items: mapVariant },
    // });

    return response;
  }

  getExtraDeliveryFee(totalQuantity: number) {
    let totalCharges = 0;
    if (totalQuantity >= this.configService.get('CartProductinfo').first_slot) {
      totalCharges +=
        this.configService.get('CartProductinfo').Extra_delivery_fee;
      const quantityForFurtherCharges =
        totalQuantity - this.configService.get('CartProductinfo').first_slot;
      totalCharges +=
        ((quantityForFurtherCharges -
          (quantityForFurtherCharges %
            this.configService.get('CartProductinfo').next_slot)) /
          this.configService.get('CartProductinfo').next_slot) *
        this.configService.get('CartProductinfo').Extra_delivery_fee;
    }
    return totalCharges;
  }

  async getCartWithDeliveryFee(cardId: string, storeId: number, type: string) {
    const cart = await this.findOne(cardId);
    let devileryFee = 0;
    let extraFee = 0;
    try {
      if (type === 'DELIVERY') {
        extraFee = this.getExtraDeliveryFee(cart.totalCartItems);

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
      ...cart,
      deliveryFee: devileryFee + extraFee,
      grandTotal:
        Math.round(
          (cart.grandTotal + devileryFee + extraFee + Number.EPSILON) * 100,
        ) / 100,
    };
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

  async findOne(cardId: string) {
    const uri = `v3/carts/${cardId}`;
    const cartInfo = await lastValueFrom(this.request(uri));

    const productNameMap = {};
    const allProductInCart = await this.getAllProductInCart(
      cartInfo.data.line_items.physical_items
        .map((c) => c.product_id)
        .join(','),
    );
    const action = cartInfo.data.line_items.physical_items.map(async (obj) => {
      // const { variants, custom_fields, page_title } = await this.getProduct(
      //   obj.product_id,
      // );
      const { variants, custom_fields, page_title } =
        allProductInCart[`${obj.product_id}`];
      const detailedInfo = this.groupSaleSubsitution(
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
    const grandTotal = totalPrice + hst;
    const resGroup = groupBy(res, 'product_id');
    const result = Object.keys(resGroup).map((key) => ({
      cart_id: cartInfo.data.id,
      customer_id: cartInfo.data.customer_id,
      product_id: key,
      display: productNameMap[key],
      data: resGroup[key],
    }));
    return {
      hst,
      totalCartItems,
      totalPrice,
      grandTotal,
      items: result,
    };
  }

  remove(id: string) {
    return this.httpService
      .delete(
        `${this.configService.get('bigcom').url}/stores/${
          this.configService.get('bigcom').store
        }/v3/carts/${id}`,
        {
          headers: {
            'x-auth-token': this.configService.get('bigcom').access_token,
          },
        },
      )
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.log(err.response.status);
          let message = err.message;
          if (
            err &&
            err.response &&
            err.response.data &&
            err.response.data.title
          ) {
            message = err.response.data.title;
          }
          if (
            err &&
            err.response &&
            err.response.status &&
            err.response.status === 404
          ) {
            throw new NotFoundException(message);
          }
          throw new UnprocessableEntityException(message);
        }),
      );
  }

  async deleteItemToCart(cartId: string, itemId: string) {
    const response = await lastValueFrom(
      this.httpService
        .delete<Cart>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/carts/${cartId}/items/${itemId}?include=line_items.physical_items.options`,
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
            if (
              err &&
              err.response &&
              err.response.status &&
              err.response.status === 404
            ) {
              throw new NotFoundException(message);
            }
            throw new UnprocessableEntityException(message);
          }),
        ),
    );

    if (response) {
      return this.findOne(cartId);
    }
    return undefined;
  }

  async updateItemToCart(
    cartId: string,
    itemId: string,
    payload: UpdateCartDto,
  ) {
    await lastValueFrom(
      this.httpService
        .put(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/carts/${cartId}/items/${itemId}?include=line_items.physical_items.options`,
          payload,
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
            if (
              err &&
              err.response &&
              err.response.status &&
              err.response.status === 404
            ) {
              throw new NotFoundException(message);
            }
            throw new UnprocessableEntityException(message);
          }),
        ),
    );

    return this.findOne(cartId);
  }
}
