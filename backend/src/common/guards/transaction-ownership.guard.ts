import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { Account } from '../../accounts/entities/account.entity';

@Injectable()
export class TransactionOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const transactionId = parseInt(request.params.id);
    const userId = request.user?.userId;

    if (!transactionId || !userId) {
      throw new ForbiddenException('Acesso negado');
    }

    // Buscar a transação com a conta
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId },
      relations: ['account', 'account.user']
    });

    if (!transaction) {
      throw new NotFoundException('Transação não encontrada');
    }

    // Verificar se a conta da transação pertence ao usuário logado
    if (transaction.account.user.id !== userId) {
      throw new ForbiddenException('Você não tem permissão para modificar esta transação');
    }

    return true;
  }
}