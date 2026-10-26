import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { AppModule } from '../src/app.module.js';

describe('Agendamentos, Vagas & Concorrência (e2e)', () => {
  let app: INestApplication<App>;
  let tokenPaciente: string;
  let tokenAtendente: string;
  let vagaDisponivelId: string;
  let outraVagaMesmoTurnoId: string;
  let agendamentoCriadoId: string;
  let protocoloCriado: string;
  let qrCodeTokenCriado: string;

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

    // 1. Obter Token do Paciente de teste (João da Silva)
    const loginPaciente = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        identificador: 'joao.silva@email.com',
        senha: 'Senha@123',
      });
    tokenPaciente = loginPaciente.body.token;

    // 2. Obter Token da Atendente de teste (Ana Paula)
    const loginAtendente = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        identificador: 'atendente.pontanegra@susnatal.rn.gov.br',
        senha: 'Senha@123',
      });
    tokenAtendente = loginAtendente.body.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Deve listar o catálogo de UBSs de Natal com suas especialidades (RF02)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/ubs')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(8);
    const pontaNegra = res.body.find((u: any) => u.nome === 'UBS Ponta Negra');
    expect(pontaNegra).toBeDefined();
    expect(pontaNegra.distritoSanitario).toBe('SUL');
    expect(pontaNegra.especialidades.length).toBeGreaterThan(0);
  });

  it('Deve buscar vagas disponíveis com tempo de resposta < 500 ms (RF03 / RNF04)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/vagas/disponiveis')
      .expect(200);

    expect(res.body).toHaveProperty('vagas');
    expect(res.body).toHaveProperty('tempoRespostaMs');
    // RNF04: Tempo inferior a 500ms
    expect(res.body.tempoRespostaMs).toBeLessThan(500);
    expect(res.body.vagas.length).toBeGreaterThan(1);

    vagaDisponivelId = res.body.vagas[0].id;
    // Guardar outra vaga do mesmo turno para testar conflito
    const mesmoTurno = res.body.vagas.find(
      (v: any) =>
        v.id !== vagaDisponivelId &&
        v.turno === res.body.vagas[0].turno &&
        v.data === res.body.vagas[0].data,
    );
    if (mesmoTurno) {
      outraVagaMesmoTurnoId = mesmoTurno.id;
    }
  });

  it('Deve reservar consulta com protocolo amigável e QR Code (RF04 / RF06)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/agendamentos')
      .set('Authorization', `Bearer ${tokenPaciente}`)
      .send({
        vagaId: vagaDisponivelId,
      })
      .expect(201);

    expect(res.body).toHaveProperty('agendamento');
    const ag = res.body.agendamento;
    expect(ag.status).toBe('AGENDADO');
    expect(ag.codigoProtocolo).toMatch(/^NAT-\d{4}-[A-Z0-9]+$/);
    expect(ag.qrCodeToken).toBeDefined();

    agendamentoCriadoId = ag.id;
    protocoloCriado = ag.codigoProtocolo;
    qrCodeTokenCriado = ag.qrCodeToken;
  });

  it('Deve BLOQUEAR nova reserva da mesma vaga por outro paciente (RF05 - Concorrência 409)', async () => {
    // Tentar reservar exatamente a mesma vaga
    const res = await request(app.getHttpServer())
      .post('/api/agendamentos')
      .set('Authorization', `Bearer ${tokenPaciente}`)
      .send({
        vagaId: vagaDisponivelId,
      })
      .expect(409);

    expect(res.body.message).toContain('já foi reservada por outro paciente');
  });

  it('Deve BLOQUEAR dois agendamentos para o mesmo paciente no mesmo turno (RF05 - 400)', async () => {
    if (outraVagaMesmoTurnoId) {
      const res = await request(app.getHttpServer())
        .post('/api/agendamentos')
        .set('Authorization', `Bearer ${tokenPaciente}`)
        .send({
          vagaId: outraVagaMesmoTurnoId,
        })
        .expect(400);

      expect(res.body.message).toContain('mesmo turno');
    }
  });

  it('Deve obter comprovante digital pelo protocolo oficial (RF06 / Tela 7)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/agendamentos/comprovante/${protocoloCriado}`)
      .expect(200);

    expect(res.body.id).toBe(agendamentoCriadoId);
    expect(res.body.codigoProtocolo).toBe(protocoloCriado);
    expect(res.body.vaga.ubs.nome).toBe('UBS Ponta Negra');
  });

  it('Atendente deve realizar Check-in presencial via QR Code na recepção (US05.2)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/agendamentos/check-in')
      .set('Authorization', `Bearer ${tokenAtendente}`)
      .send({
        qrCodeToken: qrCodeTokenCriado,
      })
      .expect(200);

    expect(res.body.mensagem).toContain('Check-in realizado com sucesso');
    expect(res.body.agendamento.status).toBe('CHECK_IN');
  });

  it('Cidadão deve listar suas consultas ativas e histórico (RF08 / Tela 8)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/agendamentos/minhas')
      .set('Authorization', `Bearer ${tokenPaciente}`)
      .expect(200);

    expect(res.body).toHaveProperty('proximas');
    expect(res.body).toHaveProperty('historico');
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });
});
