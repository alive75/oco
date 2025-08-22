import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { BudgetCategory } from './budget-category.entity';

@Entity('budget_groups')
export class BudgetGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'date' })
  monthYear: Date;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => BudgetCategory, category => category.group, { cascade: true })
  categories: BudgetCategory[];
}