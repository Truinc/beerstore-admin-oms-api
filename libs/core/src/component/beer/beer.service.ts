import {
  BadGatewayException,
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, map } from 'rxjs';
import {
  Beer,
  CustomFieldsEntity,
  PriceMetaData,
  VariantsEntity,
} from './entities/beer.entity';
import {
  flatMap,
  groupBy,
  mapValues,
  orderBy,
  map as lodashMap,
  pick,
  partialRight,
  merge,
  filter,
} from 'lodash';
import { parse } from 'querystring';
import { BeerCategoryService } from '../beer-category/beer-category.service';
import { FavoriteBeer, Pagination } from './entities/favorite-beer.entity';

@Injectable()
export class BeerService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private beerCategoryService: BeerCategoryService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}
  // create(createBeerDto: CreateBeerDto) {
  //   return 'This action adds a new beer';
  // }

  async getBrandFromStoreName(
    store_name,
  ): Promise<{ name: string; id: number }> {
    const uri = `v3/catalog/brands?name=${store_name}&limit=1`;
    const store = await lastValueFrom(
      this.httpService
        .get<{ data: { name: string; id: number }[] }>(
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
          map((response) => {
            if (response.data && response.data.data && response.data.data[0]) {
              return response.data.data[0];
            }
            throw new NotFoundException('store not found');
          }),
          catchError((err) => {
            throw new BadGatewayException(err.message);
          }),
        ),
    );
    return store;
  }

  async findAll(
    brand: string,
    category: string,
    id: string,
    name: string,
    sku: string,
    include: string,
    sort: string,
    page: number,
    limit: number,
    images?: boolean,
    categoryName?: string,
  ) {
    let filter = `is_visible=true`;
    const categoryIds = [];

    if (categoryName) {
      const beerCategory = await lastValueFrom(
        await this.beerCategoryService.findAll(categoryName, '', false),
      );
      if (beerCategory && Array.isArray(beerCategory) && beerCategory.length) {
        beerCategory.forEach((category) => {
          categoryIds.push(category.id);
        });
      }
    }

    if (brand) {
      const store = await this.getBrandFromStoreName(brand);
      filter = `${filter}&brand_id=${store.id}`;
    }

    const categoryStr = categoryIds.toString();
    if (category) {
      const categoryList = categoryStr
        ? `${category}, ${categoryStr}`
        : `${category}`;
      filter = `${filter}&categories:in=${categoryList}`;
    } else if (categoryStr) {
      filter = `${filter}&categories:in=${categoryStr}`;
    }

    if (id) {
      filter = `${filter}&id:in=${id}`;
    }

    if (name) {
      filter = `${filter}&name=${name}`;
    }

    if (sku) {
      filter = `${filter}&sku:in=${sku}`;
    }

    if (include) {
      filter = `${filter}&include=${include}`;
    }

    if (images && (!include || !include.includes('custom_fields'))) {
      filter = `${filter}&include=custom_fields`;
    }

    if (sort) {
      filter = `${filter}&sort=${sort}`;
    }
    if (page) {
      filter = `${filter}&page=${page}`;
    }
    if (limit) {
      filter = `${filter}&limit=${limit}`;
    }

    // console.log('testing', filter);
    const categories = await lastValueFrom(
      this.httpService
        .get<{ data: Array<Beer>; meta: { pagination: { total: number } } }>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/catalog/products?${filter}`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response) => {
            if (response?.data) {
              let { data } = response?.data;
              if (
                include &&
                include.includes('variants') &&
                include.includes('custom_fields')
              ) {
                data = data.map((beer) => {
                  beer.variants = this.isPackup(
                    beer.variants,
                    beer.custom_fields,
                  );
                  return beer;
                });
                Object.assign(response?.data, { data });
              }

              if (
                false &&
                ((include && include.includes('custom_fields')) || images)
              ) {
                data = data.map((beer) => {
                  if (
                    beer?.custom_fields &&
                    Array.isArray(beer.custom_fields)
                  ) {
                    beer.images = [];
                    beer.custom_fields.forEach((field) => {
                      if (field.name.includes('product_image_')) {
                        beer.images.push(field.value as string);
                      }
                    });
                  }
                  return beer;
                });
                Object.assign(response?.data, { data });
              }
              return response.data;
            }
            throw new NotFoundException('product not found');
          }),
          catchError((err) => {
            throw new BadGatewayException(err.message);
          }),
        ),
    );
    return categories;
  }

  async getProducts(filter) {
    const uri = encodeURI(
      `stores/${
        this.configService.get('bigcom').store
      }/v3/catalog/products?${filter}`,
    );
    const beers = await lastValueFrom(
      this.httpService
        .get<{
          data: Array<Beer>;
          meta: {
            pagination: {
              total: number;
              current_page: number;
              total_pages: number;
              count: number;
            };
          };
        }>(`${this.configService.get('bigcom').url}/${uri}`, {
          headers: {
            'x-auth-token': this.configService.get('bigcom').access_token,
          },
        })
        .pipe(
          map((response) => {
            if (response?.data) {
              return response.data;
            }
            throw new NotFoundException('product not found');
          }),
          catchError((err) => {
            throw new BadGatewayException(err.message);
          }),
        ),
    );
    return beers;
  }

  async getAllProductsFromStore(storeId: string, category: string) {
    const cacheKey = `store_${storeId}_with_category_${category}`;
    const cached = await this.cacheManager.get<{
      data: Array<Beer>;
      meta: {
        pagination: {
          total: number;
          current_page: number;
          total_pages: number;
        };
      };
    }>(`${cacheKey}`);
    if (cached) {
      return cached;
    }

    const { id } = await this.getBrandFromStoreName(storeId);
    let filter = `brand_id=${id}&limit=250&is_visible=true&include=variants,custom_fields`;
    if (category) {
      filter = `categories:in=${category}&${filter}`;
    }
    const { data, meta } = await this.getProducts(filter);
    const { current_page, total_pages } = meta.pagination;
    let page = current_page + 1;
    const action = [];
    while (page <= total_pages) {
      const link = `page=${page}&${filter}`;
      action.push(this.getProducts(link));
      page += 1;
    }
    const beersList = await Promise.all<{
      data: Array<Beer>;
      meta: {
        pagination: {
          total: number;
          current_page: number;
          total_pages: number;
        };
      };
    }>(action);
    const beers = beersList.reduce((total, current) => {
      const list = current.data;
      return total.concat(list);
    }, data);

    /**
     * Adding into Cache
     */
    await this.cacheManager.set(`${cacheKey}`, {
      data: beers,
      meta,
    });

    return { data: beers, meta };
  }

  ORLogic(ids: number[], beers: Beer[]) {
    const beerList = beers.filter((o) => {
      const { categories } = o;
      if (categories && categories.length > 0) {
        const flag = ids.some((v) => categories.includes(v));
        if (flag) {
          return o;
        }
      }
    });
    return beerList;
  }

  ANDLogic(ids: number[], beers: Beer[]) {
    const beerList = beers.filter((o) => {
      const { categories } = o;
      if (categories && categories.length > 0) {
        const flag = ids.every((v) => categories.includes(v));
        if (flag) {
          return o;
        }
      }
    });
    return beerList;
  }

  getPriceFromCustomField(
    sku: string,
    custom_fields: CustomFieldsEntity[],
  ): CustomFieldsEntity | null {
    if (sku) {
      const id = sku.split('_')[0];
      const obj = custom_fields.find((o) => {
        const { name } = o;
        if (`Price_Metadata_${id}` === name) {
          return o;
        }
      });

      if (obj) {
        const val = obj.value as string;
        const jsonValue = JSON.parse(val);
        return { ...obj, value: jsonValue };
      }
    }
    return null;
  }

  formatVariants(beers: Beer[]): Beer[] {
    return beers.map((o) => {
      const { variants, custom_fields } = o;
      o.variants = variants.map((v) => {
        const obj = { ...v };
        const { sku } = v;
        const field = this.getPriceFromCustomField(sku, custom_fields);
        if (field) {
          Object.assign(obj, { price_info: field });
        }

        if (v.option_values.length > 0) {
          const { label } = v.option_values[0];
          const info = label.split(' ');
          const variant_info = {};
          Object.assign(variant_info, { label });
          if (info[0]) {
            Object.assign(variant_info, { pack_size: parseInt(info[0], 10) });
          }
          if (info[2]) {
            Object.assign(variant_info, { type: info[2] });
          }
          if (info[3]) {
            Object.assign(variant_info, { size: parseInt(info[3], 10) });
          }

          Object.assign(obj, { variant_info });
        }

        return obj;
      });
      return o;
    });
  }

  saleFilter(beers: Beer[]): Beer[] {
    return beers.filter((o) => {
      const { variants } = o;
      if (variants) {
        const flag = variants.some((v) => {
          const field = v.price_info;

          const value = field.value as PriceMetaData;
          if (
            value.on_sale &&
            value.on_sale !== 'N' &&
            value.current_price &&
            value.previous_price
          ) {
            const current = parseInt(`${value.current_price.total_price}`, 10);
            const previous = parseInt(
              `${value.previous_price.total_price}`,
              10,
            );
            if (current < previous) {
              return true;
            }
          }
        });
        if (flag) {
          return { ...o, is_sale: true };
        }
      }
    });
  }

  async filterBeer(
    brand: string,
    category: string,
    attribute: string,
    type: string,
    country: string,
    style: string,
    format: string,
    container: string,
    stock: string,
    sale: string,
    take: string,
    skip: string,
    customer: string,
  ) {
    const ids = [];
    const filterApplied = {};
    if (category) {
      ids.push(category);
    }
    if (attribute) {
      ids.push(attribute);
    }
    if (type) {
      ids.push(type);
    }
    if (country) {
      ids.push(country);
    }
    if (style) {
      ids.push(style);
    }
    if (format) {
      ids.push(format);
    }
    if (container) {
      ids.push(container);
    }

    const { data } = await this.getAllProductsFromStore(brand, ids.join(','));

    let beers = data;

    if (category) {
      const idList = category.split(',').map((o) => parseInt(o, 10));
      beers = this.ORLogic(idList, beers);
      Object.assign(filterApplied, { category });
    }
    if (type) {
      const idList = type.split(',').map((o) => parseInt(o, 10));
      beers = this.ORLogic(idList, beers);
      Object.assign(filterApplied, { type });
    }
    if (style) {
      const idList = style.split(',').map((o) => parseInt(o, 10));
      beers = this.ORLogic(idList, beers);
      Object.assign(filterApplied, { style });
    }
    if (attribute) {
      const idList = attribute.split(',').map((o) => parseInt(o, 10));
      beers = this.ORLogic(idList, beers);
      Object.assign(filterApplied, { attribute });
    }
    if (country) {
      const idList = country.split(',').map((o) => parseInt(o, 10));
      beers = this.ORLogic(idList, beers);
      Object.assign(filterApplied, { country });
    }

    if (container) {
      const idList = container.split(',').map((o) => parseInt(o, 10));
      beers = this.ORLogic(idList, beers);
      Object.assign(filterApplied, { container });
    }

    if (format) {
      const idList = format.split(',').map((o) => parseInt(o, 10));
      beers = this.ORLogic(idList, beers);
      Object.assign(filterApplied, { format });
    }

    if (stock && stock == 'true') {
      Object.assign(filterApplied, { stock });

      beers = beers.filter((o) => {
        const { inventory_level } = o;
        if (inventory_level && inventory_level > 0) {
          return o;
        }
      });

      beers = beers.filter((o) => {
        const { variants } = o;
        if (variants) {
          const flag = variants.some((v) => {
            const { purchasing_disabled, inventory_level } = v;
            if (purchasing_disabled === false && inventory_level > 0) {
              return true;
            }
          });
          if (flag) {
            return o;
          }
        }
      });
    }

    beers = this.formatVariants(beers);

    if (sale && sale == 'true') {
      Object.assign(filterApplied, { sale });

      beers = this.saleFilter(beers);
    }

    let productItemGroup: { [key: string]: number } = {};
    if (customer) {
      const wishlist = await this.getWishlist(
        parseInt(`${customer}`, 10),
        1,
        1,
      );
      if (wishlist.data.length > 0) {
        productItemGroup = wishlist.data[0].items.reduce((total, o) => {
          total[o.product_id] = o.id;
          return total;
        }, {});
      }
    }
    const response = beers.map((o) => {
      const { page_title } = o;
      const display = page_title.split('~')[0];
      o.images = this.getImageFromCustomField(o.custom_fields);

      const producerValue = o.custom_fields.find((field) => {
        if (field.name === 'Producer') {
          return field;
        }
      });

      let producer = '----';
      if (producerValue) {
        producer = producerValue.value as string;
      }

      const obj = pick(o, [
        'id',
        'name',
        'sku',
        'page_title',
        'categories',
        'inventory_level',
        'is_sale',
        'images',
      ]);

      const res = {
        ...obj,
        display,
        producer,
        favorite: productItemGroup[obj.id] ? true : false,
      };

      if (productItemGroup[obj.id] && res.favorite) {
        Object.assign(res, { favoriteId: productItemGroup[obj.id] });
      }

      return res;
    });

    const start = parseInt(skip, 10);
    const end = parseInt(take, 10);
    const items = start + end;

    return {
      data: response.slice(start, items),
      pagination: { total: beers.length, skip: start, take: end },
      filter: filterApplied,
    };
  }

  formatResponse(data: Beer[]) {
    data = data.map((beer) => {
      const variants = this.isPackup(beer.variants, beer.custom_fields);
      const mapVariant = lodashMap(
        variants,
        partialRight(pick, [
          'id',
          'product_id',
          'price',
          'calculated_price',
          'sale_price',
          'is_free_shipping',
          'inventory_level',
          'variant_info',
          'is_packup',
        ]),
      );
      const groupVariant = groupBy(mapVariant, 'variant_info.type');
      const variantList: any = Object.keys(groupVariant).map((key) => ({
        type: key,
        data: groupVariant[key],
      }));
      beer.variants = variantList as VariantsEntity[];
      let images = [];
      if (beer?.custom_fields && Array.isArray(beer.custom_fields)) {
        images = this.getImageFromCustomField(beer.custom_fields);
      }
      beer.images = images;
      return beer;
    });

    const mapped = lodashMap(
      data,
      partialRight(pick, [
        'id',
        'name',
        'description',
        'price',
        'categories',
        'brand_id',
        'inventory_level',
        'is_visible',
        'is_featured',
        'page_title',
        'variants',
      ]),
    );

    return mapped;
  }

  groupVariants = (
    variants: Beer['variants'],
    custom_fields: CustomFieldsEntity[],
  ): { [key: string]: VariantsEntity[] } => {
    const collection: VariantsEntity[] = variants.map((obj) => {
      const variant_info = {};
      if (obj.option_values.length > 0) {
        const { label } = obj.option_values[0];
        const info = label.split(' ');
        Object.assign(variant_info, { label });
        if (info[0]) {
          Object.assign(variant_info, { pack_size: parseInt(info[0], 10) });
        }
        if (info[2]) {
          Object.assign(variant_info, { type: info[2] });
        }
        if (info[3]) {
          Object.assign(variant_info, { size: parseInt(info[3], 10) });
        }
        Object.assign(obj, { variant_info });
      }

      const { sku } = obj;
      const price_info = this.getPriceFromCustomField(sku, custom_fields);
      if (price_info) {
        Object.assign(obj, { price_info });
      }
      return obj;
    });
    return groupBy(collection, 'variant_info.type');
  };

  checkPackup = (
    variant: VariantsEntity,
    variantList: VariantsEntity[],
  ): boolean => {
    return variantList.reduce((flag, obj) => {
      if (
        !flag &&
        obj.variant_info.label != variant.variant_info.label &&
        obj.variant_info.size === variant.variant_info.size &&
        obj.variant_info.pack_size < variant.variant_info.pack_size
      ) {
        const { inventory_level, variant_info } = obj;

        const fmod = variant.variant_info.pack_size % variant_info.pack_size;
        if (fmod === 0) {
          const flag =
            variant_info.pack_size * inventory_level >=
            variant.variant_info.pack_size;
          return flag;
        }
      }
      return flag;
    }, false);
  };

  isPackup = (
    variants: Beer['variants'],
    custom_fields: CustomFieldsEntity[],
  ): Array<VariantsEntity> => {
    let group = this.groupVariants(variants, custom_fields);
    group = mapValues(group, (obj) => {
      return orderBy(
        obj,
        ['variant_info.pack_size', 'variant_info.size'],
        ['desc', 'desc'],
      );
    });

    group = mapValues(group, (obj) => {
      const withPackupFlag = obj.map((variant) => {
        let is_packup = false;
        if (
          variant.purchasing_disabled == false &&
          variant.inventory_level == 0
        ) {
          is_packup = this.checkPackup(variant, obj);
        }
        Object.assign(variant, { is_packup });
        return variant;
      });
      return withPackupFlag;
    });

    return flatMap(group);
  };

  async findOne(id: string, customer: number) {
    // const { id } = await this.getBrandFromStoreName(storeId);
    // const filter = `brand_id=${id}&id=${productId}&limit=1&is_visible=true&include=variants,custom_fields`;
    const filter = `sku=${id}&limit=1&is_visible=true&include=variants,custom_fields`;
    const { data } = await this.getProducts(filter);
    if (data.length > 0) {
      const { custom_fields } = data[0];
      const images = this.getImageFromCustomField(custom_fields);
      const producerValue = custom_fields.find((field) => {
        if (field.name === 'Producer') {
          return field;
        }
      });
      let producer = '----';
      if (producerValue) {
        producer = producerValue.value as string;
      }
      const fileds = custom_fields.filter((field) => {
        const category = ['ABV', 'Country', 'Category', 'Type'];
        const flag = category.some((v) => v.includes(field.name));
        if (flag) {
          return field;
        }
      });
      const { page_title } = data[0];
      const display = page_title.split('~')[0];

      let variants = this.isPackup(data[0].variants, data[0].custom_fields);

      variants = variants.map((obj) => {
        const field = obj.price_info;
        const value = field.value as PriceMetaData;
        if (
          value.on_sale &&
          value.on_sale !== 'N' &&
          value.current_price &&
          value.previous_price
        ) {
          const current = parseInt(`${value.current_price.total_price}`, 10);
          const previous = parseInt(`${value.previous_price.total_price}`, 10);
          if (current < previous) {
            return { ...obj, is_sale: true };
          }
        }
        return { ...obj, is_sale: false };
      });

      const mapVariant = lodashMap(
        variants,
        partialRight(pick, [
          'id',
          'product_id',
          'price',
          'sale_price',
          'inventory_level',
          'variant_info',
          'price_info',
          'is_packup',
          'is_sale',
        ]),
      );
      const groupVariant = groupBy(mapVariant, 'variant_info.type');
      const variantList: any = Object.keys(groupVariant).map((key) => ({
        type: key,
        display: key.charAt(0).toUpperCase() + key.slice(1),
        data: groupVariant[key],
      }));
      data[0].variants = variantList as VariantsEntity[];

      const obj = pick(data[0], [
        'id',
        'name',
        'page_title',
        'description',
        'sku',
        'variants',
      ]);

      let productItemGroup: { [key: string]: number } = {};
      if (customer) {
        const wishlist = await this.getWishlist(
          parseInt(`${customer}`, 10),
          1,
          1,
        );
        if (wishlist.data.length > 0) {
          productItemGroup = wishlist.data[0].items.reduce((total, o) => {
            total[o.product_id] = o.id;
            return total;
          }, {});
        }
      }

      const res = {
        ...obj,
        display,
        producer,
        images,
        custom_fields: fileds,
        favorite: productItemGroup[obj.id] ? true : false,
      };
      if (productItemGroup[obj.id] && res.favorite) {
        Object.assign(res, { favoriteId: productItemGroup[obj.id] });
      }
      return res;
    }
    throw new NotFoundException('product not found');
  }

  async getWishlist(customerId: number, limit = 250, page = 1) {
    const queryStr = `?customer_id=${customerId}&limit=${limit}&page=${page}`;
    const data = await lastValueFrom(
      this.httpService
        .get<{ data: FavoriteBeer[]; meta: { pagination: Pagination } }>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/wishlists${queryStr}`,
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
            throw new BadRequestException(message);
          }),
        ),
    );
    return data;
  }

  async CreateWislist(productId: number, customerId: number) {
    const payload = {
      name: 'Favourite Beers',
      customer_id: customerId,
      items: [
        {
          product_id: productId,
        },
      ],
      is_public: true,
    };
    const response = await lastValueFrom(
      this.httpService
        .post<{ data: FavoriteBeer; meta: { pagination: Pagination } }>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/wishlists`,
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
            throw new BadRequestException(message);
          }),
        ),
    );
    return response;
  }

  async addItemToWishlist(productId: number, wishlistId: number) {
    const queryStr = `/${wishlistId}/items`;
    const payload = {
      items: [
        {
          product_id: productId,
        },
      ],
    };
    const response = await lastValueFrom(
      this.httpService
        .post<{ data: FavoriteBeer; meta: { pagination: Pagination } }>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/wishlists${queryStr}`,
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
            throw new BadRequestException(message);
          }),
        ),
    );
    return response;
  }

  async deleteWishlistItem(itemId: number, wishlistId: number) {
    const queryStr = `/${wishlistId}/items/${itemId}`;
    const response = await lastValueFrom(
      this.httpService
        .delete<{ data: FavoriteBeer[]; meta: { pagination: Pagination } }>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/wishlists${queryStr}`,
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
            throw new BadRequestException(message);
          }),
        ),
    );
    return response;
  }

  async addfavoriteBeer(productId: number, customerId: number) {
    const wishlist = await this.getWishlist(customerId, 1);
    if (wishlist.meta.pagination.count === 0) {
      const { data } = await this.CreateWislist(productId, customerId);
      const item = data.items.find((o) => o.product_id == productId);
      if (item) {
        return { favoriteId: item.id };
      }
    } else {
      const wishlistId = wishlist.data[0].id;
      const { data } = await this.addItemToWishlist(productId, wishlistId);
      const item = data.items.find((o) => o.product_id == productId);
      if (item) {
        return { favoriteId: item.id };
      }
    }
    return { favoriteId: null };
  }

  async deleteFavoriteBeer(itemId: number, customerId: number) {
    const wishlist = await this.getWishlist(customerId, 1);
    if (wishlist.meta.pagination.count > 0) {
      await this.deleteWishlistItem(itemId, wishlist.data[0].id);
      return;
    }
    throw new NotFoundException('Favourite Beer not found');
  }

  async getFavoriteBeers(customerId: number) {
    const wishlist = await this.getWishlist(customerId, 1, 1);
    if (wishlist.meta.pagination.count > 0) {
      const { items } = wishlist.data[0];
      if (items.length > 0) {
        const productItemGroup: { [key: string]: number } = items.reduce(
          (total, o) => {
            total[o.product_id] = o.id;
            return total;
          },
          {},
        );
        const productIds = items
          .map((o) => o.product_id)
          .slice(0, 250)
          .join(',');
        const beers = await this.findAll(
          undefined,
          undefined,
          productIds,
          undefined,
          undefined,
          'variants,custom_fields,images,primary_image',
          undefined,
          1,
          250,
          false,
          undefined,
        );

        beers.data = this.formatVariants(beers.data);
        beers.data = beers.data.map((o) => {
          const { variants } = o;
          if (variants) {
            const flag = variants.some((v) => {
              const field = v.price_info;

              const value = field.value as PriceMetaData;
              if (
                value.on_sale &&
                value.on_sale !== 'N' &&
                value.current_price &&
                value.previous_price
              ) {
                const current = parseInt(
                  `${value.current_price.total_price}`,
                  10,
                );
                const previous = parseInt(
                  `${value.previous_price.total_price}`,
                  10,
                );
                if (current < previous) {
                  return true;
                }
              }
            });

            const inventoryFlag = variants.some((v) => {
              if (v.inventory_level > 0) {
                return true;
              }
            });
            const res = { ...o };

            if (flag) {
              Object.assign(res, { is_sale: true });
            } else {
              Object.assign(res, { is_sale: false });
            }

            if (inventoryFlag) {
              Object.assign(res, { inventory: true });
            } else {
              Object.assign(res, { inventory: false });
            }
            return res;
          }
        });
        const response = beers.data.map((o) => {
          const { page_title } = o;
          const display = page_title.split('~')[0];
          o.images = this.getImageFromCustomField(o.custom_fields);

          const producerValue = o.custom_fields.find((field) => {
            if (field.name === 'Producer') {
              return field;
            }
          });
          let producer = '----';
          if (producerValue) {
            producer = producerValue.value as string;
          }

          const obj = pick(o, ['id', 'is_sale', 'inventory', 'images', 'sku']);
          return { ...obj, display, producer };
        });
        return response.map((o) => ({
          ...o,
          itemId: productItemGroup[`${o.id}`],
          customerId: customerId,
        }));
      }
    }
    return [];
  }

  async deleteWishlist(wishlist_id: number) {
    const response = await lastValueFrom(
      this.httpService
        .delete(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/wishlists/${wishlist_id}`,
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
            throw new BadRequestException(message);
          }),
        ),
    );
    return response;
  }

  getImageFromCustomField(custom_fields: CustomFieldsEntity[]) {
    const images = custom_fields
      .filter((field) => {
        if (field.name.includes('product_image_')) {
          return field;
        }
      })
      .map((field) => field.value as string);
    return images;
  }
}
