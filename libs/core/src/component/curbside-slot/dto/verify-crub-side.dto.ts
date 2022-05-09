import { PickType } from '@nestjs/swagger';
import { CreateCurbSideDto } from './create-curb-side.dto';

export class VerifyCurbSideDto extends PickType(CreateCurbSideDto, [
  'storeId',
  'deliveryDate',
  'slotStartTime',
  'slotEndTime',
] as const) {}
