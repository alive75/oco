import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  async findAll(): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      relations: ['account', 'category', 'paidBy'],
    });
  }
}