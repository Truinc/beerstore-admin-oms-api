import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
// import { User, UserSchema } from './schema/user.schema';
import { User } from './entity/user.entity';
import { SignInLogs } from './entity/signInLogs.entity';
import { UserStores } from './entity/userStores.entity';
import { OrdersModule } from '../orders/orders.module';
// import { StoreService } from '../store/store.service';
import { StoreModule } from '@beerstore/core/component/store/store.module';
// import { SpecialCategories } from '@beerstore/core/component/beer-category/entities/special-categories.entity';
import { Store } from '@beerstore/core/component/store/entities/store.entity';

@Module({
  imports: [
    StoreModule,
    TypeOrmModule.forFeature([
      User,
      UserStores,
      SignInLogs,
      // SpecialCategories,
      Store,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
