import { PickType } from '@nestjs/swagger';
import { CreateCurbSideDto } from './create-curb-side.dto';

export class UpdateCurbSideDto extends PickType(CreateCurbSideDto, [
  'storeId',
  'deliveryDate',
  'slotStartTime',
  'slotEndTime',
  'checkoutId',
] as const) {}
