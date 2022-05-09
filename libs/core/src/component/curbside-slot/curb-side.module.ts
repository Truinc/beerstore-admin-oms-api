import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurbSide } from './entities/curb-side.entity';
import { CurbSideService } from './curb-side.service';
import { CurbSideController } from './curb-side.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CurbSide])],
  providers: [CurbSideService],
  controllers: [CurbSideController],
  exports: [CurbSideService],
})
export class CurbSideModule {}
