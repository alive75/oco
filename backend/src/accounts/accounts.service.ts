import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) {}

  async findAll(): Promise<Account[]> {
    return this.accountsRepository.find({
      relations: ['user'],
    });
  }

  async findByUser(userId: number): Promise<Account[]> {
    return this.accountsRepository.find({
      where: { user: { id: userId } },
    });
  }
}