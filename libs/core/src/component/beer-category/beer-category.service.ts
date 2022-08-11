import { BadGatewayException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, lastValueFrom, map, Observable } from 'rxjs';
import {
  BeerCategory,
  LightBeerCategory,
} from './entities/beer-category.entity';
import { omit, pick } from 'lodash';

type BeerResponseType =
  | BeerCategory[]
  | { category: string; data: BeerCategory[] }[];
@Injectable()
export class BeerCategoryService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  formatName(data: BeerCategory): BeerCategory {
    let { name } = data;
    if (name) {
      name = name.split('~')[0].trim();
    }
    return { ...data, display: name };
  }

  transform(list: BeerCategory[], group = false): BeerResponseType {
    let res = [];
    const obj = {};
    if (list) {
      if (group) {
        list.map((data) => {
          if (!obj[data.meta_description]) {
            obj[data.meta_description] = [this.formatName(data)];
          } else {
            obj[data.meta_description].push(this.formatName(data));
          }
        });
        res = Object.keys(obj).map((key) => {
          return { category: key, data: obj[key] };
        });
      } else {
        res = list.map((data) => this.formatName(data));
      }
    }
    return res;
  }

  formatForMobile(data: BeerCategory): LightBeerCategory {
    let { name } = data;
    if (name) {
      name = name.split('~')[0].trim();
    }
    return pick({ ...data, display: this.capitalizeFirstLetter(name) }, [
      'id',
      'display',
      'name',
      'meta_description',
    ]);
  }

  capitalizeFirstLetter(name: string) {
    if (name === 'beer_cats') {
      return 'Beer Category';
    }
    if (name && name.length > 1) {
      return name
        .split('_')
        .map((i) => i.charAt(0).toUpperCase() + i.slice(1))
        .join(' ');
    }
    return name;
  }

  containerType(custom: LightBeerCategory[]) {
    const packs = [
      this.configService.get('bigComIds').BOTTLES,
      this.configService.get('bigComIds').CANS,
      this.configService.get('bigComIds').KEGS,
    ];

    // console.log(packs);

    const packSizes = custom.filter((o) => {
      // console.log(o.id);
      if (packs.includes(`${o.id}`)) {
        return o;
      }
    });
    return packSizes;
  }

  packSize(custom: LightBeerCategory[]) {
    const packs = [
      this.configService.get('bigComIds').BOTTLES_SINGLE,
      this.configService.get('bigComIds').BOTTLES_4_PACK,
      this.configService.get('bigComIds').BOTTLES_6_PACK,
      this.configService.get('bigComIds').BOTTLES_12_PACK,
      this.configService.get('bigComIds').BOTTLES_24_PACK,
      this.configService.get('bigComIds').CANS_SINGLE,
      this.configService.get('bigComIds').CANS_4_PACK,
      this.configService.get('bigComIds').CANS_6_PACK,
      this.configService.get('bigComIds').CANS_12_PACK,
      this.configService.get('bigComIds').CANS_24_PACK,
    ];

    const packSizes = custom.filter((o) => {
      if (packs.includes(`${o.id}`)) {
        return o;
      }
    });
    return packSizes;
  }

  transformForMobile(list: BeerCategory[], group = false): BeerResponseType {
    let res = [];
    let obj = {};
    if (list) {
      if (group) {
        list.map((data) => {
          if (!obj[data.meta_description]) {
            obj[data.meta_description] = [this.formatForMobile(data)];
          } else {
            obj[data.meta_description].push(this.formatForMobile(data));
          }
        });

        /**
         * Special check for custom category
         *
         */
        const toggleCategories = [];
        if (obj['Custom']) {
          // const custom = filterCustomField(obj['Custom']);
          const special = obj['Custom'];

          // const kegs = special.find((o) => {
          //   const kegId = this.configService.get('bigComIds').KEGS;
          //   if (o.id == kegId) {
          //     return { ...o, toggle: true };
          //   }
          // });

          // if (kegs) {
          //   toggleCategories.push({
          //     ...kegs,
          //     toggle: true,
          //     display: 'Kegs',
          //     category: kegs.name,
          //   });
          // }

          const whatsNew = special.find((o) => {
            const newId = this.configService.get('bigComIds').WHAT_NEW_TYPE;
            if (o.id == newId) {
              return { ...o, toggle: true };
            }
          });

          if (whatsNew) {
            toggleCategories.push({
              ...whatsNew,
              toggle: true,
              display: 'New Arrivals',
              category: whatsNew.name,
              popular: true,
            });
          }

          const onsale = special.find((o) => {
            const saleId = this.configService.get('bigComIds').ON_SALE_TYPE;
            if (o.id == saleId) {
              return { ...o };
            }
          });
          if (onsale) {
            toggleCategories.push({
              ...onsale,
              toggle: true,
              display: 'On Sale',
              category: onsale.name,
              popular: true,
            });
          }

          const pack_size = this.packSize(special);
          const container_type = this.containerType(special);

          obj = omit(obj, ['Custom']);
          Object.assign(obj, { pack_size, container_type });
        }
        /**
         * Special Check End here
         *
         */
        res = Object.keys(obj).map((key) => {
          return {
            category: key,
            display: this.capitalizeFirstLetter(key),
            data: obj[key],
            popular:
              key === 'pack_size' || key == 'container_type' ? true : false,
          };
        });
        toggleCategories.map((o) => {
          res.push(o);
        });
      } else {
        res = list.map((data) => this.formatForMobile(data));
      }
    }
    return res;
  }

  async findAllBrewers(): Promise<BeerResponseType> {
    let categories = [];
    let filter = '';
      filter = `${filter}&name:like=producer`;
    let loopstatus = true;
    let page = 1;
    while (loopstatus) {
      const data = await lastValueFrom(
        this.httpService
          .get<{ data: BeerCategory[] }>(
            `${this.configService.get('bigcom').url}/stores/${
              this.configService.get('bigcom').store
            }/v3/catalog/categories?limit=250&page=${page}&is_visible=true${filter}`,
            {
              headers: {
                'x-auth-token': this.configService.get('bigcom').access_token,
              },
            },
          )
          .pipe(
            map((response): BeerResponseType => {
              if (response.data && response.data.data) {
                return response.data.data;
              }
              return [];
            }),
            catchError((err) => {
              throw new BadGatewayException(err.message);
            }),
          ),
      );
      page++;
      if (data.length <= 0) {
        loopstatus = false;
      }
      categories = categories.concat(data);
    }
    return categories;
  }

  async findAll(
    search: string,
    category: string,
    group: boolean,
  ): Promise<Observable<BeerResponseType>> {
    /**
     * harcoding limit = 1000, to categories to avoid pagination request
     */
    let filter = 'limit=1000&is_visible=true';
    if (search) {
      filter = `${filter}&name:like=${search}`;
    }
    if (category) {
      filter = `${filter}&id:in=${category}`;
    }

    const categories = await this.httpService
      .get<{ data: BeerCategory[] }>(
        `${this.configService.get('bigcom').url}/stores/${
          this.configService.get('bigcom').store
        }/v3/catalog/categories?${filter}`,
        {
          headers: {
            'x-auth-token': this.configService.get('bigcom').access_token,
          },
        },
      )
      .pipe(
        map((response): BeerResponseType => {
          if (response.data && response.data.data) {
            return this.transform(response.data.data, group);
          }
          return [];
        }),
        catchError((err) => {
          throw new BadGatewayException(err.message);
        }),
      );

    return categories;
  }

  async getAllCategory(
    search: string,
    category: string,
    group: boolean,
  ): Promise<BeerResponseType> {
    /**
     * harcoding limit = 1000, to categories to avoid pagination request
     */
    let filter = 'limit=1000&is_visible=true';
    if (search) {
      filter = `${filter}&name:like=${search}`;
    }
    if (category) {
      filter = `${filter}&id:in=${category}`;
    }

    const categories = await lastValueFrom(
      this.httpService
        .get<{ data: BeerCategory[] }>(
          `${this.configService.get('bigcom').url}/stores/${
            this.configService.get('bigcom').store
          }/v3/catalog/categories?${filter}`,
          {
            headers: {
              'x-auth-token': this.configService.get('bigcom').access_token,
            },
          },
        )
        .pipe(
          map((response): BeerResponseType => {
            if (response.data && response.data.data) {
              return this.transformForMobile(response.data.data, group);
            }
            return [];
          }),
          catchError((err) => {
            throw new BadGatewayException(err.message);
          }),
        ),
    );

    return categories;
  }

  // async findOne(id: number) {
  // const categories = await this.httpService
  //   .get(
  //     `${this.configService.get('bigcom').url}/stores/${
  //       this.configService.get('bigcom').store
  //     }/v3/catalog/categories?id=${id}`,
  //     {
  //       headers: {
  //         'x-auth-token': this.configService.get('bigcom').access_token,
  //       },
  //     },
  //   )
  //   .pipe(
  //     map((response) => {
  //       if (response.data && response.data.data) {
  //         return this.transform(response.data.data, false);
  //       }
  //       return {};
  //     }),
  //     catchError((err) => {
  //       throw new BadGatewayException(err.message);
  //     }),
  //   );

  // return categories;
  // }

  // update(id: number, updateBeerCategoryDto: UpdateBeerCategoryDto) {
  //   return `This action updates a #${id} beerCategory`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} beerCategory`;
  // }
}
