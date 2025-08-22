import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('accounts')
@ApiBearerAuth()
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findByUser(@Request() req) {
    return this.accountsService.findByUser(req.user.userId);
  }
}