import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { clerkMiddleware } from '@clerk/express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(clerkMiddleware());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const config = new DocumentBuilder()
    .setTitle('NeuralFlow AI API')
    .setDescription(
      'Enterprise orchestration platform for autonomous agent execution.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.enableCors();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
