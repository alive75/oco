import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum AccountType {
  CHECKING = 'CHECKING',
  CREDIT_CARD = 'CREDIT_CARD',
  INVESTMENT = 'INVESTMENT',
}

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: AccountType })
  type: AccountType;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, user => user.accounts)
  user: User;

  @OneToMany(() => Transaction, transaction => transaction.account)
  transactions: Transaction[];
}