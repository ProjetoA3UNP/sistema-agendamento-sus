import { Module } from '@nestjs/common';
import { VagasController } from './vagas.controller.js';
import { VagasService } from './vagas.service.js';
import { AuditoriaModule } from '../auditoria/auditoria.module.js';

@Module({
  imports: [AuditoriaModule],
  controllers: [VagasController],
  providers: [VagasService],
  exports: [VagasService],
})
export class VagasModule {}
