/* eslint-disable @typescript-eslint/ban-types */
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { OrdersSearchDto } from '../swagger/dto/ordersSearch.dto';

@Injectable()
export class OrderSearchPipe implements PipeTransform {
  async transform(value: OrdersSearchDto, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const tranformed = {};
    if (object.searchText) {
      Object.assign(tranformed, { searchText: `${object.searchText}` });
    }

    if (object.orderStatus) {
      Object.assign(tranformed, { orderStatus: `${object.orderStatus}` });
    }
    return tranformed;
  }
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
