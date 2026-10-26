import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AgendamentosService } from './agendamentos.service.js';
import { AgendarConsultaDto } from './dto/agendar-consulta.dto.js';
import { CancelarConsultaDto } from './dto/cancelar-consulta.dto.js';
import { CheckInDto } from './dto/checkin.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser, type UsuarioAutenticado } from '../../common/decorators/current-user.decorator.js';
import { LgpdSanitizerInterceptor } from '../../common/interceptors/lgpd-sanitizer.interceptor.js';

@ApiTags('Agendamentos, Triagem & Comprovantes')
@UseInterceptors(LgpdSanitizerInterceptor)
@Controller('agendamentos')
export class AgendamentosController {
  constructor(private readonly agendamentosService: AgendamentosService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CIDADAO, Role.ATENDENTE, Role.GESTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reservar consulta com Lock Pessimista (RF04 / RF05)',
    description: 'Bloqueia a vaga no MySQL e agenda para o cidadão sem risco de colisão simultânea ou duplicidade de turno.',
  })
  @ApiResponse({ status: 201, description: 'Consulta reservada com sucesso e comprovante gerado.' })
  @ApiResponse({ status: 409, description: 'Conflito: Vaga já reservada por outro paciente no mesmo instante.' })
  @ApiResponse({ status: 400, description: 'Paciente já possui outra consulta marcada no mesmo turno.' })
  async agendar(
    @Body() dto: AgendarConsultaDto,
    @CurrentUser() user: UsuarioAutenticado,
    @Ip() ip: string,
  ) {
    return this.agendamentosService.agendar(
      dto,
      user.id,
      user.perfil as Role,
      ip,
    );
  }

  @Get('minhas')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Minhas consultas (RF08 / Tela 8)',
    description: 'Retorna a lista de consultas ativas e histórico do cidadão autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos do paciente.' })
  async minhasConsultas(@CurrentUser() user: UsuarioAutenticado) {
    return this.agendamentosService.minhasConsultas(user.id);
  }

  @Get('comprovante/:identificador')
  @ApiOperation({
    summary: 'Obter dados do Comprovante Digital (RF06 / Tela 7)',
    description: 'Localiza o agendamento por protocolo (NAT-2026-XXXX), token do QR Code ou ID.',
  })
  @ApiResponse({ status: 200, description: 'Dados completos do comprovante para exibição/impressão.' })
  @ApiResponse({ status: 404, description: 'Comprovante não encontrado.' })
  async obterComprovante(@Param('identificador') identificador: string) {
    return this.agendamentosService.obterComprovante(identificador);
  }

  @Patch(':id/cancelar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cancelar consulta com regra de 24h (RF07 / Modal Tela 8)',
    description: 'Cancela a reserva e libera a vaga imediatamente na agenda pública para a população.',
  })
  @ApiResponse({ status: 200, description: 'Consulta cancelada com sucesso.' })
  @ApiResponse({ status: 400, description: 'Prazo inferior a 24 horas para cancelamento pelo cidadão.' })
  async cancelar(
    @Param('id') id: string,
    @Body() dto: CancelarConsultaDto,
    @CurrentUser() user: UsuarioAutenticado,
    @Ip() ip: string,
  ) {
    return this.agendamentosService.cancelar(
      id,
      dto,
      user.id,
      user.perfil as Role,
      ip,
    );
  }

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ATENDENTE, Role.GESTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check-in de chegada na UBS via QR Code / CPF (US05.2 / Painel Recepção)',
    description: 'Atendente registra a presença presencial do paciente escaneando o QR Code ou digitando o CPF.',
  })
  @ApiResponse({ status: 200, description: 'Presença confirmada e paciente encaminhado à espera.' })
  @ApiResponse({ status: 404, description: 'Agendamento não localizado.' })
  async realizarCheckIn(
    @Body() dto: CheckInDto,
    @CurrentUser() user: UsuarioAutenticado,
    @Ip() ip: string,
  ) {
    return this.agendamentosService.realizarCheckIn(dto, user.id, ip);
  }

  @Patch(':id/falta')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ATENDENTE, Role.GESTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marcar falta / não comparecimento (US05.3)',
    description: 'Registra a ausência do paciente no horário agendado.',
  })
  @ApiResponse({ status: 200, description: 'Falta registrada com sucesso.' })
  async registrarFalta(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Ip() ip: string,
  ) {
    return this.agendamentosService.registrarFalta(id, user.id, ip);
  }
}
