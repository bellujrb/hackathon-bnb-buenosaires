import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.setGlobalPrefix('api');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('LangGraph API')
    .setDescription('API do módulo LangGraph simplificado')
    .setVersion('1.0')
    .addTag('langgraph')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  await app.listen(port);
  console.log(`🚀 Backend rodando na porta ${port}`);
  console.log(`📚 Swagger disponível em http://localhost:${port}/api/docs`);
}

bootstrap();

