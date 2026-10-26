import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo global para rotas REST
  app.setGlobalPrefix('api');

  // Habilitar CORS para o frontend (Vite)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Validação global com class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Documentação interativa Swagger / OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Gestão SUS - Natal/RN')
    .setDescription('API REST do Sistema de Agendamento e Regulação de Consultas das UBSs de Natal-RN')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend Gestão SUS rodando em: http://localhost:${port}/api`);
  console.log(`📚 Documentação Swagger disponível em: http://localhost:${port}/api/docs`);
}

await bootstrap();
