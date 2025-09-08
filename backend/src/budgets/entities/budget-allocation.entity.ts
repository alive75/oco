import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { BudgetCategory } from './budget-category.entity';

@Entity('budget_allocations')
export class BudgetAllocation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'categoryId' })
  categoryId: number;

  @Column({ type: 'date', name: 'monthYear' })
  monthYear: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'allocatedAmount' })
  allocatedAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'carryOverAmount' })
  carryOverAmount: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @ManyToOne(() => BudgetCategory, category => category.allocations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: BudgetCategory;
}