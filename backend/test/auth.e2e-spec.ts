import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Auth & LGPD (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  let tokenCidadao: string;

  it('Deve autenticar o paciente de teste (Login) e retornar JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        identificador: 'joao.silva@email.com',
        senha: 'Senha@123',
      })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('usuario');
    expect(res.body.usuario.perfil).toBe('CIDADAO');
    // CPF mascarado pelo interceptor LGPD
    expect(res.body.usuario.cpf).toMatch(/^\*\*\*.*-\*\*$/);

    tokenCidadao = res.body.token;
  });

  it('Deve acessar o perfil do cidadão autenticado via /api/auth/me', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenCidadao}`)
      .expect(200);

    expect(res.body.email).toBe('joao.silva@email.com');
    expect(res.body.perfil).toBe('CIDADAO');
    expect(res.body.bairro).toBe('Ponta Negra');
    // LGPD: CPF mascarado e senha omitida
    expect(res.body.cpf).toMatch(/^\*\*\*.*-\*\*$/);
    expect(res.body).not.toHaveProperty('senha');
  });

  it('Deve rejeitar cadastro com CPF inválido (HTTP 400)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/cadastro')
      .send({
        nome: 'Maria Invalida',
        cpf: '11111111111', // CPF repetido/inválido
        email: 'maria.invalida@email.com',
        senha: 'Senha@123',
        bairro: 'Tirol',
        aceitouTermosLgpd: true,
      })
      .expect(400);

    expect(res.body.message).toContain('CPF inválido');
  });

  it('Deve rejeitar cadastro sem aceite dos Termos LGPD (HTTP 400)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/cadastro')
      .send({
        nome: 'Carlos Sem Termos',
        cpf: '52998224725', // CPF matematicamente válido
        email: 'carlos.semtermos@email.com',
        senha: 'Senha@123',
        bairro: 'Candelária',
        aceitouTermosLgpd: false,
      })
      .expect(400);
  });
});
