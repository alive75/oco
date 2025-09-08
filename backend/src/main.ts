import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  
  // Enhanced global validation pipe with better error handling
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true, // Strip properties that don't have decorators
    forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  // CORS configuration with environment variables
  const frontendUrl = configService.get('FRONTEND_URL') || 'http://localhost:5173';
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('OCO API')
    .setDescription(`
      **Orçamento do Casal Organizado** - API para gerenciamento financeiro pessoal com Zero-Based Budgeting
      
      ## Funcionalidades
      - 🔐 Autenticação JWT
      - 💰 Gerenciamento de contas (corrente, cartão, investimento)
      - 📊 Orçamento por categorias e grupos
      - 💸 Controle de transações
      - 🤝 Despesas compartilhadas do casal
      
      ## Usuários de Teste
      - **usuario1@oco.app** / senha: 123456
      - **usuario2@oco.app** / senha: 123456
    `)
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Digite o JWT token obtido no login'
    })
    .addTag('auth', 'Autenticação e autorização')
    .addTag('accounts', 'Gerenciamento de contas')
    .addTag('budgets', 'Orçamento e categorias')
    .addTag('transactions', 'Transações financeiras')
    .addTag('shared', 'Despesas compartilhadas')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    }
  });
  
  const port = configService.get('PORT') || 3000;
  await app.listen(port);
  
  logger.log(`🚀 OCO Backend running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();