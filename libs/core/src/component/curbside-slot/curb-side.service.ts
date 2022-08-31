import { Injectable, NotAcceptableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Not, Repository } from 'typeorm';
import { CreateCurbSideDto } from './dto/create-curb-side.dto';
import { UpdateCurbSideDto } from './dto/update-curb-side.dto';
import { CurbSide } from './entities/curb-side.entity';
import { VerifyCurbSideDto } from './dto/verify-crub-side.dto';
import * as moment from 'moment';

@Injectable()
export class CurbSideService {
  constructor(
    @InjectRepository(CurbSide)
    private curbSideRepository: Repository<CurbSide>,
  ) {}

  public async create(curbSide: CreateCurbSideDto): Promise<CurbSide> {
    const slot = await this.curbSideRepository.create(curbSide);
    await this.curbSideRepository.save(slot);
    const curbSideResponse = await this.curbSideRepository.findOne({
      storeId: curbSide.storeId,
      deliveryDate: curbSide.deliveryDate,
      slotStartTime: curbSide.slotStartTime,
      slotEndTime: curbSide.slotEndTime,
      checkoutId: curbSide.checkoutId,
    });
    return curbSideResponse;
  }

  async release(curbSide: UpdateCurbSideDto): Promise<CurbSide> {
    const curbSideEntry = await this.curbSideRepository.findOne({
      storeId: curbSide.storeId,
      deliveryDate: curbSide.deliveryDate,
      slotStartTime: curbSide.slotStartTime,
      checkoutId: curbSide.checkoutId,
    });
    if (curbSideEntry) {
      await this.curbSideRepository.delete(curbSideEntry.id);
    }
    return;
  }

  async releaseSlotOnCancel(checkoutId: string): Promise<CurbSide> {
    const curbSideEntry = await this.curbSideRepository.findOne({
      checkoutId: checkoutId,
    });
    if (curbSideEntry) {
      await this.curbSideRepository.delete(curbSideEntry.id);
    }
    return;
  }

  async delete(id: number) {
    const crubside = await this.curbSideRepository.findOne(id);
    if (crubside) {
      await this.curbSideRepository.delete(crubside.id);
    }
    return;
  }

  public async findAll(date: Date, storeId: number): Promise<CurbSide[]> {
    const where = {};
    if (date) {
      const formattedSlotDate = moment(date).format('YYYY-MM-DD');
      Object.assign(where, { deliveryDate: formattedSlotDate });
    }
    if (storeId) {
      Object.assign(where, { storeId });
    }
    return this.curbSideRepository.find({ where });
  }

  public async findById(id: number): Promise<UpdateCurbSideDto> {
    return this.curbSideRepository.findOne(id);
  }

  public async checkSlot(curbSide: VerifyCurbSideDto) {
    const slot = await this.curbSideRepository.findOne({
      storeId: curbSide.storeId,
      deliveryDate: curbSide.deliveryDate,
      slotStartTime: curbSide.slotStartTime,
    });
    if (slot) {
      throw new NotAcceptableException('slot not available');
    }
  }

  public async verifySlot(
    date: Date,
    slot: { start: number; end: number; value: string },
    storeId: number,
    checkoutId?: string,
  ) {
    const formattedSlotDate = moment(date).format('YYYY-MM-DD');
    const whereStart = {
      slotStartTime: Between(slot.start, slot.end - 1),
      deliveryDate: formattedSlotDate,
      storeId,
    };
    const whereEnd = {
      slotEndTime: Between(slot.start + 1, slot.end), // to avoid inclusive nature of between
      deliveryDate: formattedSlotDate,
      storeId,
    };
    if (checkoutId) {
      Object.assign(whereStart, { checkoutId: Not(checkoutId) });
      Object.assign(whereEnd, { checkoutId: Not(checkoutId) });
    }

    const where = [whereStart, whereEnd];
    const rows = await this.curbSideRepository.find({
      where,
    });

    if (rows && rows.length > 0) {
      throw new NotAcceptableException('slot already booked');
    }
    return;
  }
}
