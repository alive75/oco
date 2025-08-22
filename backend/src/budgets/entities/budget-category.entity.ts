import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { BudgetGroup } from './budget-group.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

@Entity('budget_categories')
export class BudgetCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  allocatedAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => BudgetGroup, group => group.categories, { onDelete: 'CASCADE' })
  group: BudgetGroup;

  @OneToMany(() => Transaction, transaction => transaction.category)
  transactions: Transaction[];
}