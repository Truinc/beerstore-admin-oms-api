import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BamboraService } from './bambora.service';
import { BamboraController } from './bambora.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [BamboraController],
  providers: [BamboraService],
  exports: [BamboraService],
})
export class BamboraModule {}
