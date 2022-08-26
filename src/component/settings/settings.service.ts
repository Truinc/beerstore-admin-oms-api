import { initializeApp } from "@firebase/app";
import { getDatabase, ref, onValue, update } from '@firebase/database';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './entity/settings.entity';
import { CreateSettingDto } from './dto/create-settings.dto';
import { UpdateSettingDto } from './dto/update-settings.dto';
import { ConfigService } from '@nestjs/config';

const settingsKeys = [
  'disable_store',
  'maintenance_message',
  // 'message',
  'show_popup',
  'unique_key',
  'warning_message',
];
@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
    private readonly config: ConfigService,
  ) {}

  async create(createSettingDto: CreateSettingDto[]): Promise<any> {
    console.log('createSettingsDto', createSettingDto);
    // for (const setting of createSettingDto) {
    //   const setttingEntry = await this.settingsRepository.findOne({
    //     settingName: setting.settingName,
    //   });
    //   if (setttingEntry) {
    //     await this.settingsRepository.update(
    //       {
    //         settingName: setting.settingName,
    //       },
    //       {
    //         ...setting,
    //       },
    //     );
    //   } else {
    //     await this.settingsRepository.save(setting);
    //   }
    // }

    // return createSettingDto;
    try {
      let firebaseObj = {};
      if (createSettingDto && createSettingDto.length) {
        let keyObj;
        settingsKeys.forEach((keyName) => {
          keyObj = createSettingDto.find((key) => key.settingName === keyName);
          if (keyObj) {
            firebaseObj[keyObj.settingName] = keyObj.settingValue;
          }
        });
      }
      const response = await this.updateFirebaseDB(firebaseObj);
      return response;
    } catch (err) {
      console.log(err.message);
      throw new BadRequestException(err.message);
    }
  }

  async findAll(take: number, skip: number, sort?: object): Promise<object> {
    // const filter = {};
    // const where = [];
    // Object.assign(filter, { skip, take });
    // if (sort) {
    //   Object.assign(filter, { order: sort });
    // }
    // if (where.length > 0) {
    //   Object.assign(filter, { where });
    // }
    // const [items, total] = await this.settingsRepository.findAndCount({
    //   ...filter,
    // });

    const settingsObj = await this.getFirebaseDB();
    let settingsCount = 0;
    let items = [];
    const settingsKeys = Object?.keys(settingsObj) || [];
    if (settingsKeys.length > 0) {
      settingsKeys.forEach((settingKey, _idx) => {
        items.push({
          settingName: settingKey,
          settingValue: settingsObj[settingKey],
          id: _idx + 1,
        });
      });
    }
    return {
      total: settingsCount,
      take,
      skip,
      items,
    };
  }

  async findOne(id: number): Promise<any> {
    const user = await this.settingsRepository.findOne({
      id,
    });
    return user;
  }

  async update(id: number, body: UpdateSettingDto) {
    try {
      const setting = await this.findOne(id);
      if (!setting) {
        return new NotFoundException('setting not found');
      }
      await this.settingsRepository.update({ id }, { ...body });
      return this.findOne(id);
    } catch (err) {
      throw err;
    }
  }

  async patch(id: number, body: any): Promise<Settings> {
    await this.settingsRepository.update({ id }, { ...body });
    return this.findOne(id);
  }

  async delete(id: number) {
    const user = await this.findOne(id);
    if (user) {
      return new NotFoundException('setting not found');
    }
    return this.settingsRepository.delete(id);
  }

  getFirebaseDB(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        const app = initializeApp(this.config.get('firebase'));
        const database = getDatabase(app);
        const dbRef = ref(database, 'maintenance_schedule');
        onValue(dbRef, (snapshot) => {
          resolve(snapshot.val());
        });
      } catch (err) {
        reject(err.message);
      }
    });
  }

  updateFirebaseDB(updatedSettings: any) {
    return new Promise(async (resolve, reject) => {
      try {
        const app = initializeApp(this.config.get('firebase'));
        const database = getDatabase(app);
        const prevSettings = await this.getFirebaseDB();
        const postData = {
          ...prevSettings,
          ...updatedSettings,
          unique_key: new Date().getTime(),
        };
        const updates = {};
        updates['maintenance_schedule'] = postData;
        update(ref(database), updates);
        resolve(updatedSettings);
      } catch (err) {
        reject(err.message);
      }
    });
  }
}
