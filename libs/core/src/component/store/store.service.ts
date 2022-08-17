import { XMLParser } from 'fast-xml-parser';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  // BadGatewayException,
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
// import { Cron } from '@nestjs/schedule';
import * as moment from 'moment';
import { InjectRepository } from '@nestjs/typeorm';
import {
  getConnection,
  Repository,
  getRepository,
  // TableForeignKey,
  Between,
} from 'typeorm';

import { UpdateStoreMetaDto } from './dto/update-store-meta.dto';
// import { CreateDelveryChargesDto } from './dto/create-store-deliveryCharges.dto';
// import { CreateExtraFeaturesDto } from './dto/create-store-extraFeatures.dto';
import { Store } from './entities/store.entity';
import { StoreFeatures } from './entities/storeFeatures.entity';
import { StoreHours } from './entities/storeHours.entity';
import { StoreExtraFeatures } from './entities/storeExtraFeatures.entity';
import { StoreDeliveryCharges } from './entities/storeDeliveryFee.entity';
import { catchError, lastValueFrom, map } from 'rxjs';
import IStores from './interfaces/store.interface';
import { CreateDeliveryDto } from './dto/create-delivery-fee.dto';
import { ImportExtraFeatureDto } from './dto/import-extra-feature.dto';
import { ImportDeliveryFeeDto } from './dto/import-delivery-fee.dto';
import { CreateStoreExtraFeaturesDto } from './dto/create-store-extra-feature.dto';
import { groupBy, pick } from 'lodash';
import { StoreFavorite } from './entities/storeFavorite.entity';
import { HolidayHours } from './entities/holidayHrs.entity';
import { HolidayInfo } from './entities/holidayInfo.entity';
import { CreateHolidayHoursDto } from './dto/create-holiday-hours.dto';
import { CreateHolidayInfoDto } from './dto/create-holiday-info.dto';
import { RolesEnum, User } from 'src/component/user/entity/user.entity';
import { StoreStatus } from './entities/storeStatus.entity';
// import {
//   RolesEnum,
//   User,
// } from 'apps/oms/src/component/user/entity/user.entity';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(StoreHours)
    private storeHoursRepository: Repository<StoreHours>,
    @InjectRepository(StoreExtraFeatures)
    private storeExtraFeaturesRepository: Repository<StoreExtraFeatures>,
    @InjectRepository(StoreDeliveryCharges)
    private storeDeliveryRepository: Repository<StoreDeliveryCharges>,
    @InjectRepository(StoreFeatures)
    private storeFeaturesRepository: Repository<StoreFeatures>,
    @InjectRepository(StoreFavorite)
    private storeFavoriteRepository: Repository<StoreFavorite>,
    @InjectRepository(HolidayHours)
    private storeHolidayHrsRepository: Repository<HolidayHours>,
    @InjectRepository(HolidayInfo)
    private storeHolidayInfoRepository: Repository<HolidayInfo>,
    @InjectRepository(StoreStatus)
    private storeStatusRepository: Repository<StoreStatus>,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  // cron executes everyday at 11:30 AM
  // @Cron('0 30 11 * * 1-7')
  // handleCron() {
  //   console.log('Called when the current second is 10');
  //   // this.bulkInsertStores();
  // }

  // async addStore(
  // createStoreDto: CreateStoreMetaDto,
  // storeHoursDto: CreateStoreHoursDto[],
  // storeFeaturesDto: CreateStoreFeaturesDto[],
  // ) {
  // try {
  // const { storeId } = createStoreDto;
  /* const storeHoursList = storeHoursDto.map((storeHour) => {
        return {
          ...storeHour,
          storeId: +storeId,
        };
      });
      const storeFeaturesList = storeFeaturesDto.map((feature) => {
        return {
          ...feature,
          storeId: +storeId,
        };
      }); */
  // const createStore = await this.storeRepository.create(createStoreDto);
  // const savedStore = await this.storeRepository.save(createStore);
  //   const storeHours = await this.storeHoursRepository.create(storeHoursDto);

  /* const storeAttributes = await Promise.all([
        getConnection()
          .createQueryBuilder()
          .insert()
          .into(StoreHours)
          .values(storeHoursList)
          .execute(),
        getConnection()
          .createQueryBuilder()
          .insert()
          .into(StoreFeatures)
          .values(storeFeaturesList)
          .execute(),
      ]); */
  //   const saveStoreHours = await this.storeHoursRepository.save(storeHours);

  // console.log('saveStoreHours', storeAttributes);
  // return this.findOne(savedStore.id);
  //   } catch (err) {
  //     throw new BadRequestException(err.message);
  //   }
  // }

  /**
   *  find store by storeId
   * @param storeId
   * @returns
   */
  async findByStoreId(storeId: number): Promise<Store> {
    return this.findById(storeId);
  }

  async findById(id: number): Promise<Store> {
    const store = await this.storeRepository.findOne(id);
    return store;
  }

  /**
   *  find store features by storeId
   * @param storeId
   * @returns
   */
  async findStoreFeaturesById(storeId: number): Promise<StoreFeatures[]> {
    const store = await this.findByStoreId(storeId);
    if (!store) {
      throw new NotFoundException('store not found');
    }
    const storeFeatures = await this.storeFeaturesRepository.find({
      where: { store },
    });
    return storeFeatures;
  }

  async findStoreHoursById(storeId: number): Promise<StoreHours[]> {
    const store = await this.findByStoreId(storeId);
    if (!store) {
      throw new NotFoundException('store not found');
    }
    const storeHour = await this.storeHoursRepository.find({
      where: { store },
    });
    return storeHour;
  }

  /**
   * parse file and get stores data
   */
  parseStoresMeta = (storeData: string): IStores['store'] => {
    const options = {
      ignoreAttributes: true,
      ignoreDeclaration: true,
      trimValues: true,
    };
    const xmlParser = new XMLParser(options);
    const parser = xmlParser.parse(storeData);
    if (
      parser['soapenv:Envelope'] &&
      parser['soapenv:Envelope']['soapenv:Body'] &&
      parser['soapenv:Envelope']['soapenv:Body']['stores'] &&
      parser['soapenv:Envelope']['soapenv:Body']['stores']['store']
    ) {
      return parser['soapenv:Envelope']['soapenv:Body']['stores']['store'];
    }
    return [];
  };

  getStoresData = async () => {
    const url = `${this.configService.get('httpService').storeURL}`;
    const response = await lastValueFrom(
      this.httpService
        .get(url, {
          headers: {
            Authorization: `Basic ${
              this.configService.get('httpService').storeAuthToken
            }`,
          },
          auth: {
            username: `${this.configService.get('httpService').username}`,
            password: `${this.configService.get('httpService').password}`,
          },
        })
        .pipe(
          catchError((e) => {
            // console.log('e', e);
            throw new HttpException(e.response.data, e.response.status);
          }),
          map((response) => {
            // console.log('response', response);
            return response.data;
          }),
        ),
    );

    const storesData = await this.parseStoresMeta(response);
    return storesData;
    // const storeTablesData = this.formattData(storesData);
    // return storeTablesData;
  };

  async startTransction() {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    const stores = await this.getStoresData();
    try {
      const storeAction = [];
      await queryRunner.startTransaction();
      // const storeFeatureTable = await queryRunner.getTable('store_features');
      // const storeHourTable = await queryRunner.getTable('store_hours');

      // console.log(storeFeatureTable.foreignKeys);
      // console.log(storeHourTable.foreignKeys);

      // let hourForeignKey = null;
      // if (storeHourTable.foreignKeys.length > 0) {
      //   hourForeignKey = storeHourTable.foreignKeys[0];
      //   await queryRunner.dropForeignKey(
      //     storeHourTable,
      //     storeHourTable.foreignKeys[0]?.name,
      //   );
      // }
      // let featureForeignKey = null;

      // if (storeFeatureTable.foreignKeys.length > 0) {
      //   featureForeignKey = storeFeatureTable.foreignKeys[0];
      //   await queryRunner.dropForeignKey(
      //     storeFeatureTable,
      //     storeFeatureTable.foreignKeys[0].name,
      //   );
      // }

      // console.log(storeFeatureTable.foreignKeys);
      // console.log(storeHourTable.foreignKeys);

      // await queryRunner.manager.clear(StoreHours);
      // await queryRunner.manager.clear(StoreFeatures);
      // await queryRunner.manager.clear(Store);
      await queryRunner.manager
        .getRepository(Store)
        .createQueryBuilder()
        .delete()
        .execute();

      // if (featureForeignKey) {
      //   await queryRunner.createForeignKey(
      //     storeFeatureTable,
      //     new TableForeignKey(featureForeignKey),
      //   );
      // }

      // if (hourForeignKey) {
      //   await queryRunner.createForeignKey(
      //     storeHourTable,
      //     new TableForeignKey(hourForeignKey),
      //   );
      /**
         * {
            columnNames: [ 'storeId' ],
            referencedColumnNames: [ 'id' ],
            name: 'FK_d3af1b4f4ca17cee171d4c07c48',
            referencedDatabase: 'beerstore_store',
            referencedSchema: 'dbo',
            referencedTableName: 'store',
            onDelete: 'CASCADE',
            onUpdate: 'NO ACTION',
            deferrable: undefined
          }
         */
      // }

      stores.map((data) => {
        const featureAction = [];
        const avaiablityAction = [];
        // execute some operations on this transaction:
        const store = {
          id: data.store_id,
          locationName: data.location_name || '',
          streetNo: `${data.street_no}` || '',
          street: data.street || '',
          city: data.city || '',
          province: data.province || '',
          postalCode: data.postal_code || '',
          country: data.country || '',
          latitude: data.geocode.latitude || -1,
          longitude: data.geocode.longitude || -1,
          phone: `${data.phone_no}`,
        };

        if (data.features && data.features.characteristic) {
          if (Array.isArray(data.features.characteristic)) {
            data.features.characteristic.map((feature) => {
              const storefeat = {};
              Object.assign(storefeat, { feature });
              featureAction.push(storefeat);
            });
          } else {
            const storefeat = {};
            Object.assign(storefeat, { feature: data.features.characteristic });
            featureAction.push(storefeat);
          }
        }

        if (data.hours && data.hours.hour && data.hours.hour.day) {
          data.hours.hour.day.map((obj) => {
            const storeH = {};
            Object.assign(storeH, {
              toHour: obj.to_hour,
              fromHour: obj.from_hour,
              weekDay: obj.week_day,
            });

            avaiablityAction.push(storeH);
            return;
          });
        }
        Object.assign(store, {
          storeFeatures: [...featureAction],
          storeHours: [...avaiablityAction],
        });

        storeAction.push(queryRunner.manager.save(Store, store));
        return;
      });

      await Promise.all(storeAction);
      await queryRunner.commitTransaction();
    } catch (err) {
      console.log(err);
      // since we have errors let's rollback changes we made
      await queryRunner.rollbackTransaction();
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }
  }

  async filterStores(
    lat: number,
    lang: number,
    location: string,
    street: string,
    postal_code: string,
    city: string,
    take: number,
    skip: number,
    sort: object,
    customerId = 0,
    dateForHoliday = new Date(),
    id: number,
  ) {
    const formattedSlotDate = moment(dateForHoliday).format('YYYY-MM-DD');
    const table = getRepository(Store)
      .createQueryBuilder('Store')
      .select([
        'Store.id AS id',
        'Store.locationName AS locationName',
        'Store.streetNo AS streetNo',
        'Store.street AS street',
        'Store.city AS city',
        'Store.province AS province',
        'Store.postalCode AS postalCode',
        'Store.country AS country',
        'Store.latitude AS latitude',
        'Store.longitude AS longitude',
        'Store.phone AS phone',
        'Store.createdDate AS createdDate',
        'Store.updatedDate AS updatedDate',
      ])
      .addSelect([
        `(6371 * acos(cos(RADIANS(${lat})) * cos(RADIANS(Store.latitude)) * cos(RADIANS(Store.longitude) - RADIANS(${lang})) + sin(RADIANS(${lat})) * sin(RADIANS(Store.latitude)))) as distance`,
        `(CASE WHEN (SELECT COUNT(*) FROM store_favorite where storeId=store.id and customerId=${customerId}) > 0 then 1 else 0 end ) as favorite`,
      ]);

    const where = [];
    const value = {};
    if (location) {
      where.push('locationName like :location');
      Object.assign(value, { location: `%${location}%` });
    }

    if (street) {
      where.push('street like :street');
      Object.assign(value, { street: `%${street}%` });
    }

    if (postal_code) {
      where.push('postalCode like :postal_code');
      Object.assign(value, { postal_code: `%${postal_code}%` });
    }

    if (city) {
      where.push('city like :city');
      Object.assign(value, { city: `%${city}%` });
    }

    if (id) {
      where.push('id like :id');
      Object.assign(value, { id: `%${id}%` });
    }

    if (where.length > 0) {
      table.where(where.join(' OR '), value);
    }

    if (!sort) {
      sort = { distance: 'ASC' };
    }

    table.orderBy(sort as { [key: string]: 'ASC' | 'DESC' });
    const total = await table.getCount();
    if (skip) {
      table.skip(skip);
    }
    if (take) {
      table.take(take);
    }
    let items: Store[] = await table.getRawMany();

    const stores = items.map((item) => item.id);
    let extraFeature = [];
    if (stores.length > 0) {
      extraFeature = await this.storeExtraFeaturesRepository
        .createQueryBuilder('feature')
        .where('feature.storeId IN (:...stores)', {
          stores: [...stores],
          status: 1,
        })
        .getRawMany();
    }

    // AND feature.isActive = :status
    const storeExtraFeatures = groupBy(extraFeature, 'feature_storeId');
    items = items.map((o) => {
      if (storeExtraFeatures[o.id]) {
        Object.assign(o, { extraFeature: storeExtraFeatures[o.id] });
      } else {
        Object.assign(o, { extraFeature: [] });
      }
      return o;
    });

    // const total = await this.storeRepository.count();

    const responseToSend = {
      lat,
      lang,
      total,
      take,
      skip,
      items,
    };
    const range = await this.getUpcommingHoliday(formattedSlotDate);
    if (range) {
      Object.assign(responseToSend, { holiday: range });
    }
    return responseToSend;
  }

  async storesList(
    location: string,
    street: string,
    postal_code: string,
    city: string,
    take: number,
    skip: number,
    sort: object,
    id: number,
    user: User,
  ) {
    const storeIds = [];
    if (user && user.role === RolesEnum.storemanager && user?.usersStores) {
      user?.usersStores.forEach((userStore) => {
        storeIds.push(userStore.storeId);
      });
    }
    let queryString = '';
    const table = getRepository(Store)
      .createQueryBuilder('Store')
      .select([
        'Store.id AS id',
        'Store.locationName AS locationName',
        'Store.streetNo AS streetNo',
        'Store.street AS street',
        'Store.city AS city',
        'Store.province AS province',
        'Store.postalCode AS postalCode',
        'Store.country AS country',
        'Store.latitude AS latitude',
        'Store.longitude AS longitude',
        'Store.phone AS phone',
        'Store.createdDate AS createdDate',
        'Store.updatedDate AS updatedDate',
      ])
      .addSelect([
        `(select isActive from store_status where storeId = Store.id) as isActive`,
      ]);

    const where = [];
    const value = {};
    if (location) {
      where.push('locationName like :location');
      Object.assign(value, { location: `%${location}%` });
    }

    if (street) {
      where.push('street like :street');
      Object.assign(value, { street: `%${street}%` });
    }

    if (postal_code) {
      where.push('postalCode like :postal_code');
      Object.assign(value, { postal_code: `%${postal_code}%` });
    }

    if (city) {
      where.push('city like :city');
      Object.assign(value, { city: `%${city}%` });
    }

    if (id) {
      where.push('id like :id');
      Object.assign(value, { id: `%${id}%` });
    }

    if (where.length > 0) {
      queryString = where.join(' OR ');
      // table.where(where.join(' OR '), value);
    }

    if (storeIds.length) {
      queryString = queryString
        ? `( ${queryString} ) AND id IN (:...ids)`
        : `id IN (:...ids)`;
      Object.assign(value, { ids: storeIds });
    }

    table.where(queryString, value);

    if (!sort) {
      sort = { distance: 'ASC' };
    }

    table.orderBy(sort as { [key: string]: 'ASC' | 'DESC' });
    const total = await table.getCount();
    if (skip) {
      table.skip(skip);
    }
    if (take) {
      table.take(take);
    }
    let items: Store[] = await table.getRawMany();

    const stores = items.map((item) => item.id);
    let extraFeature = [];
    if (stores.length > 0) {
      extraFeature = await this.storeExtraFeaturesRepository
        .createQueryBuilder('feature')
        .where('feature.storeId IN (:...stores)', {
          stores: [...stores],
          status: 1,
        })
        .getRawMany();
    }

    // AND feature.isActive = :status
    const storeExtraFeatures = groupBy(extraFeature, 'feature_storeId');
    items = items.map((o) => {
      if (storeExtraFeatures[o.id]) {
        Object.assign(o, { extraFeature: storeExtraFeatures[o.id] });
      } else {
        Object.assign(o, { extraFeature: [] });
      }
      return o;
    });

    // const total = await this.storeRepository.count();

    const responseToSend = {
      total,
      take,
      skip,
      items,
    };

    return responseToSend;
  }

  async addStore(
    updateStoreDto: UpdateStoreMetaDto,
    storeDeliveryData: CreateDeliveryDto,
    storeExtraFeaturesData: CreateStoreExtraFeaturesDto[],
  ): Promise<any> {
    const prevStore = await this.findByStoreId(+updateStoreDto.id);
    if (prevStore) {
      throw new BadRequestException('Store number already exists.');
    }
    const strFeatures = updateStoreDto.storeFeatures.map((item) => {
      const { feature } = item;
      return { feature };
    });
    const payload = {
      ...updateStoreDto,
      storeFeatures: strFeatures,
    };
    const storeToSave = await this.storeRepository.create(payload);
    const store = await this.storeRepository.save(storeToSave);

    if (updateStoreDto.isActive) {
      const storeStatus = await this.storeStatusRepository.create({
        isActive: updateStoreDto.isActive,
        store,
      });
      await this.storeStatusRepository.save(storeStatus);
    }
    if (storeDeliveryData) {
      const delivery = await this.storeDeliveryRepository.create(
        storeDeliveryData,
      );
      delivery.store = store;
      await this.storeDeliveryRepository.save(delivery);
    }

    if (storeExtraFeaturesData) {
      const action = storeExtraFeaturesData.map(async (o) => {
        const obj = await this.storeExtraFeaturesRepository.create(o);
        obj.store = store;
        await this.storeExtraFeaturesRepository.save(obj);
      });
      await Promise.all(action);
    }
    const createStore = await this.getStore(store.id, false, null);
    return createStore;
  }

  setStatus = async (storeId: number, isActive: number) => {
    const store = await this.findById(storeId);
    if (!store) {
      throw new BadRequestException('Store not found.');
    }

    const storeStatusDetails = await this.storeStatusRepository.findOne({
      where: { store },
    });
    if (storeStatusDetails) {
      await this.storeStatusRepository.update(
        { id: storeStatusDetails.id },
        { isActive },
      );
    } else {
      const statusDetailCreate = this.storeStatusRepository.create({
        isActive,
        store,
      });
      await this.storeStatusRepository.save(statusDetailCreate);
    }
    return this.storeStatusRepository.findOne({
      where: { store },
    });
  };

  async getStoreStatus(storeId: number): Promise<any> {
    const store = await this.findById(storeId);
    console.log('store', store);
    if (store) {
      const storeStatusDetails = await this.storeStatusRepository.findOne({
        where: { store },
      });
      console.log('storeStatusDetails', storeStatusDetails);
      return storeStatusDetails;
    } else {
      return null;
    }
  }

  async updateStore(
    id: number,
    updateStoreDto: UpdateStoreMetaDto,
    storeDeliveryData: CreateDeliveryDto,
    storeExtraFeaturesData: CreateStoreExtraFeaturesDto[],
  ): Promise<any> {
    const store = await this.findByStoreId(id);
    if (!store) {
      throw new NotFoundException('store not found');
    }

    if (updateStoreDto.featuresIds.length) {
      await this.deleteStoreFeatures(updateStoreDto.featuresIds);
    }

    delete updateStoreDto['featuresIds'];

    const strFeatures = updateStoreDto.storeFeatures.map((item) => {
      const { feature } = item;
      return { feature };
    });

    const payload = {
      ...updateStoreDto,
      storeFeatures: strFeatures,
      id: store.id,
    };
    const storeToSave = await this.storeRepository.preload(payload);
    await this.storeRepository.save(storeToSave);

    if (storeDeliveryData) {
      if (storeDeliveryData.id) {
        const delivery = await this.storeDeliveryRepository.preload(
          storeDeliveryData,
        );
        delivery.store = store;
        await this.storeDeliveryRepository.save(delivery);
      } else {
        const delivery = await this.storeDeliveryRepository.create(
          storeDeliveryData,
        );
        delivery.store = store;
        await this.storeDeliveryRepository.save(delivery);
      }
    }

    if (storeExtraFeaturesData) {
      // await this.storeExtraFeaturesRepository.delete({ store: store });
      const action = storeExtraFeaturesData.map(async (o) => {
        if (o.id) {
          const obj = await this.storeExtraFeaturesRepository.preload(o);
          obj.store = store;
          await this.storeExtraFeaturesRepository.save(obj);
        } else {
          const obj = await this.storeExtraFeaturesRepository.create(o);
          obj.store = store;
          await this.storeExtraFeaturesRepository.save(obj);
        }
      });
      await Promise.all(action);
    }

    const updatedStore = await this.getStore(store.id, false, null);
    return updatedStore;
  }

  async deleteStore(storeId: number) {
    try {
      const store = await this.storeRepository.findOne(storeId);
      const extraFeatures = await this.storeExtraFeaturesRepository.find({
        where: { store },
      });
      const deliveryCharges =  await this.storeDeliveryRepository.findOne({
        where: { store },
      });
      const storeStatus =  await this.storeStatusRepository.findOne({
        where: { store },
      });
      if (!store) {
        return new NotFoundException('store not found');
      }
      if(extraFeatures && extraFeatures.length > 0){
        const extraFeaturesIds = [];
        extraFeatures.forEach(extraFeatures => {
          extraFeaturesIds.push(extraFeatures.id);
        })
        await this.storeExtraFeaturesRepository.delete(extraFeaturesIds);
      }
      if(store?.storeFeatures && store?.storeFeatures.length > 0){
        const featureIds = [];
        store.storeFeatures.forEach(feature => {
          featureIds.push(feature.id);
        })
        await this.deleteStoreFeatures(featureIds);
      }
      if(deliveryCharges){
        await this.storeDeliveryRepository.delete(deliveryCharges.id);
      }
      if(storeStatus){
        await this.storeStatusRepository.delete(storeStatus.id);
      }
      if(store?.storeFeatures && store?.storeFeatures.length > 0){
        const featureIds = [];
        store.storeFeatures.forEach(feature => {
          featureIds.push(feature.id);
        })
        await this.deleteStoreFeatures(featureIds);
      }
      
      await this.storeRepository.delete(store.id);
      return 'store deleted';
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }

  async deleteStoreFeatures(idArr: number[]) {
    await this.storeFeaturesRepository.delete(idArr);
    return;
  }

  formatStoreHours(store: Store): Store {
    const { storeHours } = store;
    const formatedHours = storeHours.map((o) => {
      if (o.fromHour && o.toHour) {
        const fromHour = moment(o.fromHour, 'Hmm').format('hh:mm A');
        const toHour = moment(o.toHour, 'Hmm').format('hh:mm A');
        const weekDay = moment(o.weekDay, 'dd').format('dddd');
        return { ...o, fromHour, toHour, weekDay };
      }
      const weekDay = moment(o.weekDay, 'dd').format('dddd');
      return { ...o, weekDay };
    });
    return { ...store, storeHours: formatedHours };
  }

  async getStoreDeliveryFee(storeId: number): Promise<any> {
    const store = await this.findByStoreId(storeId);
    if (!store) {
      throw new NotFoundException('store not found');
    }
    return this.storeDeliveryRepository.findOne({
      where: { store },
    });
  }

  async getStore(
    storeId: number,
    format = true,
    customerId: number,
    dateForHoliday = new Date(),
  ) {
    const formattedSlotDate = moment(dateForHoliday).format('YYYY-MM-DD');
    const store = await this.findByStoreId(storeId);

    if (!store) {
      throw new NotFoundException('store not found');
    }
    let isFavorite = false;
    const delivery = await this.storeDeliveryRepository.findOne({
      where: { store },
    });

    const extraFeature = await this.storeExtraFeaturesRepository.find({
      where: { store },
    });

    let storeResponse: Store | any = { ...store };
    if (format) {
      storeResponse = this.formatStoreHours(storeResponse);
    }
    if (customerId) {
      const favoriteItem = await this.storeFavoriteRepository.findOne({
        store: store,
        customerId: customerId,
      });
      if (favoriteItem) {
        isFavorite = true;
      }
    }

    const holidayData = await this.getUpcommingHolidayWorkingHours(
      formattedSlotDate,
      storeId,
    );
    if (holidayData.holiday && holidayData.items.length > 0) {
      const holidayList = holidayData.items.map((holidayInfo) => {
        let fromHour = '0';
        let toHour = '0';
        if (holidayInfo.closeHours != 0 && holidayInfo.openHours != 0) {
          fromHour = moment(holidayInfo.openHours, 'Hmm').format('hh:mm A');
          toHour = moment(holidayInfo.closeHours, 'Hmm').format('hh:mm A');
        }
        const formatedDate = `${moment(
          holidayInfo.startDate,
          'YYYY-MM-DD',
        ).format('MMM D')}th`;

        return {
          fromHour,
          toHour,
          date: formatedDate,
          holidayName: holidayInfo.holidayName,
          holidayMessage: holidayInfo.message,
        };
      });
      Object.assign(storeResponse, {
        holiday: {
          title: holidayData.parent.title,
          message: holidayData.parent.messages,
          color: holidayData.parent.color,
          items: holidayList,
        },
      });
    }

    const storeStatus = await this.getStoreStatus(storeId);

    Object.assign(storeResponse, {
      deliveryFee: delivery,
      extraFeature: extraFeature,
      favorite: isFavorite,
      ...(storeStatus && { storeStatus: storeStatus.isActive }),
    });

    return storeResponse;
  }

  /*  Import Store Feature */
  async importextraFeaturedata(Importdata: ImportExtraFeatureDto[]) {
    await this.storeExtraFeaturesRepository
      .createQueryBuilder()
      .delete()
      .execute();
    const action = Importdata.map(async (feature) => {
      const storeList = await this.storeRepository
        .createQueryBuilder('store')
        .where('store.id IN (:...stores)', {
          stores: feature.store,
        })
        .getMany();

      const featureToSave = storeList.map((store) => {
        const v = pick(feature, ['code', 'feature', 'isActive']);
        Object.assign(v, { store });
        return v;
      });

      const createData = await this.storeExtraFeaturesRepository.create(
        featureToSave,
      );
      await this.storeExtraFeaturesRepository.save(createData);
    });
    await Promise.all(action);
  }

  async importDeliveryFee(Importdata: ImportDeliveryFeeDto[]) {
    await this.storeDeliveryRepository.createQueryBuilder().delete().execute();
    const action = Importdata.map(async (info) => {
      const storeList = await this.storeRepository
        .createQueryBuilder('store')
        .where('store.id IN (:...stores)', {
          stores: info.store,
        })
        .getMany();

      const infoToSave = storeList.map((store) => {
        const v = pick(info, ['fee']);
        Object.assign(v, { store });
        return v;
      });

      const createData = await this.storeDeliveryRepository.create(infoToSave);
      await this.storeDeliveryRepository.save(createData);
    });
    await Promise.all(action);
  }

  async addfavoriteStore(storeId: number, customerId: number) {
    const store = await this.findByStoreId(storeId);
    if (store) {
      const favoriteItem = await this.storeFavoriteRepository.findOne({
        store: store,
        customerId: customerId,
      });
      if (!favoriteItem) {
        const favorite = this.storeFavoriteRepository.create({ customerId });
        favorite.store = store;
        const response = await this.storeFavoriteRepository.save(favorite);
        return response;
      }
      throw new BadRequestException('store is already in the favorite list');
    }
    throw new NotFoundException('store not found');
  }

  async deleteFavoriteStore(storeId: number, customerId: number) {
    const store = await this.findByStoreId(storeId);
    if (store) {
      const favoriteItem = await this.storeFavoriteRepository.findOne({
        store: store,
        customerId: customerId,
      });
      if (favoriteItem) {
        const response = await this.storeFavoriteRepository.delete(
          favoriteItem.id,
        );
        return response;
      }
      throw new NotFoundException('Favorite store entity not found');
    }
    throw new NotFoundException('store not found');
  }

  async getFavoriteStore(
    customerId: number,
    take: number,
    skip: number,
    lat: number,
    lang: number,
  ) {
    const table = await this.storeFavoriteRepository
      .createQueryBuilder('storeFavorite')
      .leftJoinAndSelect('storeFavorite.store', 'store')
      .select([
        'storeFavorite.customerId as customerId',
        'store.id as id',
        'store.locationName as locationName',
        'store.streetNo as streetNo',
        'store.street as street',
        'store.city as city',
        'store.province as province',
        'store.postalCode as postalCode',
        'store.country as country',
        'store.latitude as latitude',
        'store.longitude as longitude',
      ])
      .addSelect([
        `(6371 * acos(cos(RADIANS(${lat}))* cos(RADIANS(store.latitude)) * cos(RADIANS(store.longitude) - RADIANS(${lang})) + sin(RADIANS(${lat})) * sin(RADIANS(store.latitude)))) as distance`,
      ]);
    table.where(`customerId = ${customerId}`);
    if (skip) {
      table.offset(skip);
    }
    if (take) {
      table.limit(take);
    }
    const allItems = await table.getRawMany();
    const items = [];
    allItems.forEach((element) => {
      const itemObject = {
        customerId: element.customerId,
        store: {
          ...element,
          distance: Math.round((element.distance + Number.EPSILON) * 100) / 100,
        },
      };
      items.push(itemObject);
    });
    const total = await this.storeFavoriteRepository.count({
      where: { customerId },
    });
    // const filter = { skip };
    // if (take) {
    //   Object.assign(filter, { take });
    // }
    // const [items, total] = await this.storeFavoriteRepository.findAndCount({
    //   ...filter,
    //   where: {
    //     customerId,
    //   },
    //   relations: ['store'],
    // });
    const getData = items;

    const stores = getData.map((o) => o.store.id);
    if (stores.length > 0) {
      const extraFeature = await this.storeExtraFeaturesRepository
        .createQueryBuilder('feature')
        .where('feature.storeId IN (:...stores)', {
          stores: [...stores],
          status: 1,
        })
        .getRawMany();
      const storeExtraFeatures = groupBy(extraFeature, 'feature_storeId');
      const finalresponse = getData.map((o) => {
        if (storeExtraFeatures[`${o.store.id}`]) {
          Object.assign(o.store, {
            extraFeature: storeExtraFeatures[`${o.store.id}`],
          });
        } else {
          Object.assign(o.store, { extraFeature: [] });
        }
        const response = pick(o.store, [
          'id',
          'locationName',
          'streetNo',
          'street',
          'city',
          'province',
          'postalCode',
          'country',
          'latitude',
          'longitude',
          'phone',
          'distance',
          'extraFeature',
        ]);
        return {
          ...pick(o, ['customerId', 'createdDate', 'updatedDate']),
          store: response,
        };
      });
      return {
        total,
        take,
        skip,
        items: finalresponse,
      };
    }
    return { total, take, skip, items: getData };
  }

  async getUpcommingHoliday(formattedSlotDate: string) {
    const upcommingHoliday = await this.storeHolidayHrsRepository
      .createQueryBuilder('holiday')
      .where(`endDate >= :data AND startDate <= :data`, {
        data: formattedSlotDate,
      })
      .getOne();
    return upcommingHoliday;
  }

  async getUpcommingHolidayWorkingHours(slotDate: string, storeId: number) {
    const range = await this.getUpcommingHoliday(slotDate);
    if (range) {
      const upcommingHoliday = await this.storeHolidayInfoRepository.find({
        where: {
          startDate: Between(range.startDate, range.endDate),
          storeId: storeId,
        },
      });
      if (upcommingHoliday) {
        return { holiday: true, items: upcommingHoliday, parent: range };
      }
    }
    return { holiday: false, items: [], parent: range };
  }

  async saveHoliday(
    holidayHour: CreateHolidayHoursDto,
    holidayInfo: CreateHolidayInfoDto[],
  ) {
    try {
      const holidayInfoList = [];
      const prevholiday = await this.storeHolidayHrsRepository.findOne({
        where: {
          startDate: holidayHour.startDate,
        },
      });
      if (prevholiday?.id && prevholiday.id !== holidayHour.id) {
        throw new BadRequestException('Holiday already exists.');
      }
      if (holidayHour.id) {
        await this.deleteHoliday(holidayHour.id);
        delete holidayHour.id;
      }
      for (const info of holidayInfo) {
        if (Array.isArray(info.storeIdList) && info.storeIdList.length > 0) {
          for (const storeId of info.storeIdList) {
            const obj = new HolidayInfo(
              storeId,
              info.group,
              info.startDate,
              info.holidayName,
              info.openHours,
              info.closeHours,
              info.message,
            );
            holidayInfoList.push(obj);
          }
        }
      }
      const holiday = await this.storeHolidayHrsRepository.save({
        ...holidayHour,
        holidayInfo: holidayInfoList,
      });
      return holiday;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteHoliday(id: number) {
    try {
      const holiday = await this.storeHolidayHrsRepository.findOne(id);
      if (!holiday) {
        return new NotFoundException('Holiday not found!');
      }
      await this.storeHolidayHrsRepository.delete(id);
      return;
    } catch (error) {
      return error;
    }
  }

  async findAllHolidays(take: number, skip: number, sort: object) {
    const [result, total] = await this.storeHolidayHrsRepository.findAndCount({
      take,
      skip,
      ...(sort && {order: sort }),
    });

    return {
      items: result,
      count: total,
      take,
      skip,
    };
  }

  async getHoliday(id: number): Promise<any> {
    return this.storeHolidayHrsRepository.findOne(id);
  }
}

/**
 *  search for stores nearby WIP
 * @param take
 * @param skip
 * @param latitude
 * @param logitude
 * @param radius
 * @returns
 */
// findStoreNearBy = async (
//   storeId: number,
//   // take?: number,
//   // skip?: number,
//   radius?: number,
// ): Promise<object> => {
//   const STORETABLENAME = 'store';
//   const store = await this.findByStoreId(storeId);

//   if (store) {
//     const { latitude, longitude } = store;
//     const searchDistance = +radius || 2;

//     const lat = +latitude;
//     const lng = +longitude;

//     // https://ourcodeworld.com/articles/read/1019/how-to-find-nearest-locations-from-a-collection-of-coordinates-latitude-and-longitude-with-php-mysql
//     //   $nearest_stores = $wpdb->get_results("SELECT p.*, pm1.meta_value as lat,
//     //   pm2.meta_value as lng,
//     //   ACOS(SIN(RADIANS($current_lat))*SIN(RADIANS(pm1.meta_value))+COS(RADIANS($current_lat))*COS(RADIANS(pm1.meta_value))*COS(RADIANS(pm2.meta_value)-RADIANS($current_long))) * 6371 AS distance
//     //  FROM $wpdb->posts p
//     //  INNER JOIN $wpdb->postmeta pm1 ON p.id = pm1.post_id AND pm1.meta_key = 'geocode_lat'
//     //  INNER JOIN $wpdb->postmeta pm2 ON p.id = pm2.post_id AND pm2.meta_key = 'geocode_lon'
//     //  ".$query_search_inner_part."
//     //  WHERE post_type = 'stores' AND post_status = 'publish' ".$query."
//     //  ORDER BY distance ASC LIMIT " .$start_from.",".$limit.";") ;

//     // SELECT * FROM (SELECT s.latitude, s.longitude, s.store_number, s.name, s.address, s.fs_tel,
//     //   (6371 *
//     //   acos(cos(degree2radian(".$vars['location']['lat'].")) *
//     //   cos(degree2radian(s.latitude)) *
//     //   cos(degree2radian(s.longitude) -
//     //   degree2radian(".$vars['location']['lng'].")) +
//     //   sin(degree2radian(".$vars['location']['lat'].")) *
//     //   sin(degree2radian(s.latitude)))) distance
//     // FROM common.stores s
//     const query = `SELECT * FROM (
//       SELECT *,
//           (
//               (
//                   (
//                       acos(
//                           sin(( ${lat} * pi() / 180))
//                           *
//                           sin(( latitude * pi() / 180)) + cos(( ${lat} * pi() /180 ))
//                           *
//                           cos(( latitude * pi() / 180)) * cos((( ${lng} - longitude ) * pi()/180 )))
//                   ) * 180/pi()
//               )  * 60  * 1.1515 * 1.609344
//           )
//       as distance FROM ${STORETABLENAME}
//   ) ${STORETABLENAME}
//     ORDER BY distance ASC`;
//     // WHERE distance <= ${searchDistance}
//     // this.storeRepository.query();
//     const entityManager = getManager();
//     const response = await entityManager.query(query);
//     return response;
//   }
//   return new NotFoundException('store not found');
// };
