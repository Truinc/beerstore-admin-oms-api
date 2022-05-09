import { OmitType } from '@nestjs/swagger';
import { Address } from '../entity/address.entity';

export class CreateAddressDto extends OmitType(Address, ['id'] as const) {}
