import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role, Turno } from '@prisma/client';
import { VagasService } from './vagas.service.js';
import { AberturaBlocoVagasDto } from './dto/abertura-bloco-vagas.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser, type UsuarioAutenticado } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Vagas & Disponibilidade')
@Controller('vagas')
export class VagasController {
  constructor(private readonly vagasService: VagasService) {}

  @Get('disponiveis')
  @ApiOperation({
    summary: 'Buscar vagas de consultas disponíveis (RF03 / RF04 / RNF04)',
    description: 'Pesquisa horários vagos filtrando por UBS, especialidade, data e turno com resposta rápida (< 500 ms).',
  })
  @ApiQuery({ name: 'ubsId', type: String, required: false })
  @ApiQuery({ name: 'especialidadeId', type: String, required: false })
  @ApiQuery({ name: 'data', type: String, required: false, description: 'AAAA-MM-DD' })
  @ApiQuery({ name: 'turno', enum: Turno, required: false })
  @ApiResponse({ status: 200, description: 'Lista de vagas disponíveis e tempo de resposta aferido.' })
  async buscarDisponiveis(
    @Query('ubsId') ubsId?: string,
    @Query('especialidadeId') especialidadeId?: string,
    @Query('data') data?: string,
    @Query('turno') turno?: Turno,
  ) {
    return this.vagasService.buscarDisponiveis(ubsId, especialidadeId, data, turno);
  }

  @Post('popular-demonstracao')
  @ApiOperation({
    summary: 'Popular todas as UBSs com vagas de demonstração (Todas as 8 UBSs e 5 Especialidades)',
    description: 'Recria as especialidades (incluindo Exames Básicos & Coleta) e gera centenas de vagas disponíveis para os próximos 10 dias úteis em todas as UBSs de Natal.',
  })
  @ApiResponse({ status: 200, description: 'Banco de dados populado com sucesso.' })
  async popularDemonstracao() {
    return this.vagasService.popularVagasDemonstracao();
  }

  @Post('abertura-bloco')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Abertura de bloco de vagas na agenda (Exclusivo Gestor SMS/UBS)',
    description: 'Permite ao gestor criar blocos de horários para uma especialidade e UBS em determinada data.',
  })
  @ApiResponse({ status: 201, description: 'Bloco de vagas criado com sucesso.' })
  @ApiResponse({ status: 403, description: 'Acesso negado (apenas perfil GESTOR).' })
  async abrirBloco(
    @Body() dto: AberturaBlocoVagasDto,
    @CurrentUser() user: UsuarioAutenticado,
    @Ip() ip: string,
  ) {
    return this.vagasService.abrirBlocoVagas(dto, user.id, ip);
  }
}
