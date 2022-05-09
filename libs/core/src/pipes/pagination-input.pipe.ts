/* eslint-disable @typescript-eslint/ban-types */
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { PaginationInputDto } from '../swagger/dto/pagination.dto';

@Injectable()
export class PaginationInputPipe implements PipeTransform {
  async transform(value: PaginationInputDto, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const tranformed = {};
    if (object.take) {
      Object.assign(tranformed, { take: parseInt(`${object.take}`) });
    }
    if (object.skip) {
      Object.assign(tranformed, { skip: parseInt(`${object.skip}`) });
    }
    if (object.sort) {
      const column = object.sort.split(',').reduce((previous, current) => {
        const obj = current.split(':').map((v) => v.trim());
        Object.assign(previous, { [obj[0]]: obj[1] });
        return previous;
      }, {});

      Object.assign(tranformed, { sort: column });
    }

    return tranformed;
  }
  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
