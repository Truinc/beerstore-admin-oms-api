import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
// import { User, UserSchema } from './schema/user.schema';
import { User } from './entity/user.entity';
import { SignInLogs } from './entity/signInLogs.entity';
// import { UserStores } from './entity/userStores.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, SignInLogs])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
