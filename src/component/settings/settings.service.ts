import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from './entity/settings.entity';
import { CreateSettingDto } from './dto/create-settings.dto';
import { UpdateSettingDto } from './dto/update-settings.dto';
@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
  ) {}

  async create(createSettingDto: CreateSettingDto[]): Promise<any> {
    for (const setting of createSettingDto) {
      const setttingEntry = await this.settingsRepository.findOne({
        settingName: setting.settingName,
      });
      if (setttingEntry) {
        await this.settingsRepository.update(
          {
            settingName: setting.settingName,
          },
          {
            ...setting,
          },
        );
      } else {
        await this.settingsRepository.save(setting);
      }
    }

    return createSettingDto;
  }

  async findAll(take: number, skip: number, sort?: object): Promise<object> {
    const filter = {};
    const where = [];
    Object.assign(filter, { skip, take });
    if (sort) {
      Object.assign(filter, { order: sort });
    }
    if (where.length > 0) {
      Object.assign(filter, { where });
    }
    const [items, total] = await this.settingsRepository.findAndCount({
      ...filter,
    });

    return {
      total,
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

  async patch(userId: number, body: any): Promise<Settings> {
    await this.settingsRepository.update({ id: userId }, { ...body });
    return this.findOne(userId);
  }

  async delete(id: number) {
    const user = await this.findOne(id);
    if (user) {
      return new NotFoundException('setting not found');
    }
    return this.settingsRepository.delete(id);
  }
}
