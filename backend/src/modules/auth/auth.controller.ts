import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { CadastroCidadaoDto } from './dto/cadastro-cidadao.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser, type UsuarioAutenticado } from '../../common/decorators/current-user.decorator.js';
import { LgpdSanitizerInterceptor } from '../../common/interceptors/lgpd-sanitizer.interceptor.js';

@ApiTags('Autenticação & Acesso')
@UseInterceptors(LgpdSanitizerInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('cadastro')
  @ApiOperation({
    summary: 'Auto-cadastro do cidadão (RF01 / Épico 01)',
    description: 'Cadastra um novo cidadão na rede de saúde de Natal-RN com validação de CPF e consentimento LGPD.',
  })
  @ApiResponse({ status: 201, description: 'Cidadão cadastrado com sucesso e JWT emitido.' })
  @ApiResponse({ status: 400, description: 'CPF, e-mail ou Cartão SUS já cadastrado, ou dados inválidos.' })
  async cadastrar(@Body() dto: CadastroCidadaoDto, @Ip() ip: string) {
    return this.authService.cadastrarCidadao(dto, ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticação de usuários (Cidadão, Atendente, Médico, Gestor)',
    description: 'Realiza o login com e-mail/CPF e senha, retornando o token JWT e dados do perfil.',
  })
  @ApiResponse({ status: 200, description: 'Login autenticado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas ou usuário inativo.' })
  async login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.authService.login(dto, ip);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter dados do perfil autenticado',
    description: 'Retorna as informações do usuário atual identificado pelo token JWT.',
  })
  @ApiResponse({ status: 200, description: 'Dados do perfil retornado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente ou expirado.' })
  async me(@CurrentUser() user: UsuarioAutenticado) {
    return this.authService.obterPerfil(user.id);
  }
}
