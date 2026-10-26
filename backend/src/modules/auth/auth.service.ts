import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { CadastroCidadaoDto } from './dto/cadastro-cidadao.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { limparDocumento, validarCpf } from '../../common/utils/cpf.validator.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async cadastrarCidadao(dto: CadastroCidadaoDto, ip?: string) {
    const cpfLimpo = limparDocumento(dto.cpf);

    // Validação de dígito verificador do CPF
    if (!validarCpf(cpfLimpo)) {
      throw new BadRequestException('CPF inválido. Verifique os dígitos digitados.');
    }

    // Verificar unicidade de CPF
    const cpfExistente = await this.prisma.usuario.findUnique({
      where: { cpf: cpfLimpo },
    });
    if (cpfExistente) {
      throw new BadRequestException('Já existe um cadastro com este CPF no sistema de saúde.');
    }

    // Verificar unicidade de E-mail
    const emailExistente = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (emailExistente) {
      throw new BadRequestException('Já existe um cadastro com este e-mail.');
    }

    // Verificar unicidade de Cartão SUS (se informado)
    let cartaoSusLimpo: string | undefined = undefined;
    if (dto.cartaoSus) {
      cartaoSusLimpo = limparDocumento(dto.cartaoSus);
      const cartaoExistente = await this.prisma.usuario.findUnique({
        where: { cartaoSus: cartaoSusLimpo },
      });
      if (cartaoExistente) {
        throw new BadRequestException('Já existe um paciente cadastrado com este número de Cartão SUS.');
      }
    }

    // Hash seguro da senha
    const senhaHash = await bcrypt.hash(dto.senha, 10);

    // Data de nascimento
    let dataNascimentoDate: Date | null = null;
    if (dto.dataNascimento) {
      dataNascimentoDate = new Date(dto.dataNascimento);
    }

    const usuario = await this.prisma.usuario.create({
      data: {
        nome: dto.nome.trim(),
        cpf: cpfLimpo,
        cartaoSus: cartaoSusLimpo ?? null,
        email: dto.email.toLowerCase().trim(),
        senha: senhaHash,
        perfil: Role.CIDADAO,
        telefone: dto.telefone ?? null,
        bairro: dto.bairro.trim(),
        dataNascimento: dataNascimentoDate,
        aceitouTermosLgpd: dto.aceitouTermosLgpd,
        termosLgpdEm: new Date(),
      },
      select: {
        id: true,
        nome: true,
        cpf: true,
        cartaoSus: true,
        email: true,
        perfil: true,
        bairro: true,
        telefone: true,
        criadoEm: true,
      },
    });

    // Registrar na trilha de auditoria LGPD
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      acao: 'CADASTRO_CIDADAO',
      entidade: 'Usuario',
      entidadeId: usuario.id,
      detalhesJson: {
        bairro: usuario.bairro,
        aceitouTermosLgpd: true,
      },
      ip,
    });

    const token = this.gerarJwt(usuario);

    return {
      mensagem: 'Cadastro realizado com sucesso!',
      token,
      usuario,
    };
  }

  async login(dto: LoginDto, ip?: string) {
    const identificador = dto.identificador.trim();
    const identificadorLimpo = limparDocumento(identificador);

    // Buscar por e-mail ou CPF
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { email: identificador.toLowerCase() },
          { cpf: identificadorLimpo.length === 11 ? identificadorLimpo : undefined },
        ],
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas. Verifique seu usuário e senha.');
    }

    if (!usuario.ativo) {
      throw new UnauthorizedException('Esta conta está inativa. Procure o atendimento da Secretaria de Saúde.');
    }

    const senhaCorreta = await bcrypt.compare(dto.senha, usuario.senha);
    if (!senhaCorreta) {
      throw new UnauthorizedException('Credenciais inválidas. Verifique seu usuário e senha.');
    }

    // Registrar auditoria de login
    await this.auditoria.registrar({
      usuarioId: usuario.id,
      acao: 'LOGIN',
      entidade: 'Usuario',
      entidadeId: usuario.id,
      detalhesJson: { perfil: usuario.perfil },
      ip,
    });

    const token = this.gerarJwt(usuario);

    return {
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        cpf: usuario.cpf,
        cartaoSus: usuario.cartaoSus,
        email: usuario.email,
        perfil: usuario.perfil,
        bairro: usuario.bairro,
      },
    };
  }

  async obterPerfil(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        cpf: true,
        cartaoSus: true,
        email: true,
        perfil: true,
        telefone: true,
        bairro: true,
        dataNascimento: true,
        aceitouTermosLgpd: true,
        criadoEm: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuário não encontrado.');
    }

    return usuario;
  }

  private gerarJwt(usuario: { id: string; email: string; perfil: string; nome: string; cpf: string }) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      nome: usuario.nome,
      cpf: usuario.cpf,
    };

    return this.jwtService.sign(payload);
  }
}
