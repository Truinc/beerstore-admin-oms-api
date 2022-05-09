import { SetMetadata } from '@nestjs/common';
import { RolesEnum } from '../component/user/entity/user.entity';

export const Roles = (...roles: RolesEnum[]) => SetMetadata('roles', roles);
