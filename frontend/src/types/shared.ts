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
  paidByUserId: number;
  individualAmount: number;
  user: {
    name: string;
  };
  category?: {
    name: string;
  };
}