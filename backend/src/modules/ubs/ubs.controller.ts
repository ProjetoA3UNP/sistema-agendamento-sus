import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DistritoSanitario } from '@prisma/client';
import { UbsService } from './ubs.service.js';

@ApiTags('Unidades de Saúde (UBS) & Especialidades')
@Controller('ubs')
export class UbsController {
  constructor(private readonly ubsService: UbsService) {}

  @Get('especialidades')
  @ApiOperation({
    summary: 'Listar especialidades médicas ativas',
    description: 'Retorna a lista de especialidades ofertadas na rede municipal (ex: Clínico Geral, Odontologia, Pré-natal).',
  })
  @ApiResponse({ status: 200, description: 'Lista de especialidades retornada com sucesso.' })
  async listarEspecialidades() {
    return this.ubsService.listarEspecialidades();
  }

  @Get()
  @ApiOperation({
    summary: 'Catálogo de UBSs de Natal-RN (RF02 / Épico 02)',
    description: 'Retorna as UBSs ativas com filtros opcionais por distrito sanitário (Norte, Sul, Leste, Oeste), bairro ou especialidade.',
  })
  @ApiQuery({ name: 'distrito', enum: DistritoSanitario, required: false })
  @ApiQuery({ name: 'bairro', type: String, required: false })
  @ApiQuery({ name: 'especialidadeId', type: String, required: false })
  @ApiResponse({ status: 200, description: 'Catálogo de UBSs retornado com sucesso.' })
  async listar(
    @Query('distrito') distrito?: DistritoSanitario,
    @Query('bairro') bairro?: string,
    @Query('especialidadeId') especialidadeId?: string,
  ) {
    return this.ubsService.listar(distrito, bairro, especialidadeId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Detalhes de uma UBS por ID',
    description: 'Retorna informações de endereço, contatos e especialidades de uma unidade específica.',
  })
  @ApiResponse({ status: 200, description: 'Detalhes da UBS encontrados.' })
  @ApiResponse({ status: 404, description: 'UBS não encontrada.' })
  async obterPorId(@Param('id') id: string) {
    return this.ubsService.obterPorId(id);
  }
}
