import { Module } from '@nestjs/common';
import { UbsController } from './ubs.controller.js';
import { UbsService } from './ubs.service.js';

@Module({
  controllers: [UbsController],
  providers: [UbsService],
  exports: [UbsService],
})
export class UbsModule {}
