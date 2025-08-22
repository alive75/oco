import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { SharedService } from './shared.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('shared')
@ApiBearerAuth()
@Controller('shared')
export class SharedController {
  constructor(private readonly sharedService: SharedService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getBalance(@Query('month') month?: string) {
    const targetMonth = month ? new Date(month) : new Date();
    return this.sharedService.getMonthlyBalance(targetMonth);
  }
}