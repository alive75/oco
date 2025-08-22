import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AccountsModule } from './accounts/accounts.module';
import { BudgetsModule } from './budgets/budgets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USER || 'oco_user',
      password: process.env.DATABASE_PASSWORD || 'oco_password',
      database: process.env.DATABASE_NAME || 'oco_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UsersModule,
    AccountsModule,
    BudgetsModule,
    TransactionsModule,
    SharedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}