import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'OCO - Orçamento do Casal Organizado API';
  }
}