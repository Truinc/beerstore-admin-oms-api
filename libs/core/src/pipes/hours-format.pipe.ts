/* eslint-disable @typescript-eslint/ban-types */
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import * as moment from 'moment';

@Injectable()
export class HoursFormatPipe implements PipeTransform {
  async transform(object: string) {
    const range = object.trim().split('M ');
    if (range.length < 2) {
      throw new BadRequestException('invalid slot format');
    }
    const start = parseInt(moment(range[0], 'hh:mm A').format('Hmm'), 10);
    const end = parseInt(moment(range[1], 'hh:mm A').format('Hmm'), 10);

    return { start, end, value: object.trim() };
  }
}
