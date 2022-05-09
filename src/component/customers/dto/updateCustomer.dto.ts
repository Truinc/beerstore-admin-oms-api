import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './createCustomer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
