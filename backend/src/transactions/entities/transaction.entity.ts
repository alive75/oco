import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { BudgetCategory } from '../../budgets/entities/budget-category.entity';
import { User } from '../../users/entities/user.entity';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  date: Date;

  @Column()
  payee: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: false })
  isShared: boolean;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Account, account => account.transactions)
  account: Account;

  @ManyToOne(() => BudgetCategory, category => category.transactions, { nullable: true })
  category: BudgetCategory;

  @ManyToOne(() => User, user => user.transactions)
  paidBy: User;
}