import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  app.enableCors({
    origin: 'http://localhost:5173',
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
  
  await app.listen(3000);
  console.log('OCO Backend running on http://localhost:3000');
  console.log('Swagger docs available at http://localhost:3000/api/docs');
}
bootstrap();