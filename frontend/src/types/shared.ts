export interface SharedBalance {
  user1Paid: number;
  user2Paid: number;
  owedBy?: number;
  amount: number;
  isBalanced: boolean;
}

export interface SharedTransaction {
  id: number;
  amount: number;
  date: Date;
  payee: string;
  notes?: string;
  paid_by_user_id: number;
  individual_amount: number;
  user: {
    name: string;
  };
  category?: {
    name: string;
  };
}