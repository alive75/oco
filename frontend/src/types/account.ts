export interface Account {
  id: number;
  name: string;
  type: 'CHECKING' | 'CREDIT_CARD' | 'INVESTMENT';
  balance: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
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