import { IntersectionType } from '@nestjs/swagger';
import { UpdateCustomerProofDto } from './update-customer-proof.dto';
import { UpdateOrderDto } from './update-order.dto';

export class BeerGuyUpdateDto extends IntersectionType(
  UpdateOrderDto,
  UpdateCustomerProofDto,
) {}
