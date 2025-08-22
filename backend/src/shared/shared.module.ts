import { Module } from '@nestjs/common';
import { SharedController } from './shared.controller';
import { SharedService } from './shared.service';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [TransactionsModule],
  controllers: [SharedController],
  providers: [SharedService],
})
export class SharedModule {}