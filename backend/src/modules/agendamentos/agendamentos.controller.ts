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
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role, StatusAgendamento } from '@prisma/client';
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

  @Get('agenda-dia')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ATENDENTE, Role.GESTOR, Role.MEDICO)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar agenda do dia para a recepção da UBS',
    description: 'Retorna a lista de consultas agendadas filtradas por UBS, data e status.',
  })
  async listarAgendaDia(
    @Query('ubsId') ubsId?: string,
    @Query('data') data?: string,
    @Query('status') status?: StatusAgendamento,
    @Query('busca') busca?: string,
  ) {
    return this.agendamentosService.listarAgendaDia(ubsId, data, status, busca);
  }

  @Get('fila-consultorio')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MEDICO, Role.GESTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fila de pacientes do consultório médico',
    description: 'Retorna a lista de pacientes com check-in, em atendimento ou agendados.',
  })
  async listarFilaConsultorio(
    @CurrentUser() user: UsuarioAutenticado,
    @Query('ubsId') ubsId?: string,
    @Query('data') data?: string,
  ) {
    const medicoId = user.perfil === Role.MEDICO ? user.id : undefined;
    return this.agendamentosService.listarFilaConsultorio(medicoId, ubsId, data);
  }

  @Patch(':id/iniciar-atendimento')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MEDICO, Role.GESTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Iniciar atendimento do paciente no consultório',
    description: 'Atualiza o status para EM_ATENDIMENTO.',
  })
  async iniciarAtendimento(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Ip() ip: string,
  ) {
    return this.agendamentosService.iniciarAtendimento(id, user.id, ip);
  }

  @Patch(':id/finalizar-atendimento')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MEDICO, Role.GESTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Finalizar atendimento médico',
    description: 'Atualiza o status para FINALIZADO com carimbo de data/hora.',
  })
  async finalizarAtendimento(
    @Param('id') id: string,
    @CurrentUser() user: UsuarioAutenticado,
    @Ip() ip: string,
  ) {
    return this.agendamentosService.finalizarAtendimento(id, user.id, ip);
  }

  @Get('metricas-gestao')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Métricas gerais da Secretaria de Saúde (Painel Gestor)',
    description: 'Retorna totais consolidados, absenteísmo, distribuição por UBS e distrito.',
  })
  async obterMetricasGestao() {
    return this.agendamentosService.obterMetricasGestao();
  }

  @Get('auditoria-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.GESTOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Trilha de auditoria LGPD (Painel Gestor)',
    description: 'Retorna os últimos registros de ações sensíveis executadas no sistema.',
  })
  async listarLogsAuditoria(@Query('limite') limite?: string) {
    const lim = limite ? parseInt(limite, 10) : 30;
    return this.agendamentosService.listarLogsAuditoria(lim);
  }
}
