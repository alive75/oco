export interface Account {
  id: number;
  name: string;
  type: 'CHECKING' | 'CREDIT_CARD' | 'INVESTMENT';
  balance: number;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAccountDto {
  name: string;
  type: 'CHECKING' | 'CREDIT_CARD' | 'INVESTMENT';
  balance?: number;
}

export interface UpdateAccountDto {
  name?: string;
  balance?: number;
}