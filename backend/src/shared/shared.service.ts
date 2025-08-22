import { Injectable } from '@nestjs/common';

@Injectable()
export class SharedService {
  async getMonthlyBalance(month: Date) {
    // Placeholder for shared expenses calculation
    return {
      user1Paid: 0,
      user2Paid: 0,
      owedBy: null,
      amount: 0,
    };
  }
}