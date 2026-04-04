import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Request, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common'
import { Request as ExpressRequest } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AccountsService } from './accounts.service'
import { CreateAccountDto } from './dto/create-account.dto'
import { UpdateAccountDto } from './dto/update-account.dto'

interface AuthRequest extends ExpressRequest {
  user: { userId: string; email: string }
}

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.accountsService.findAll(req.user.userId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req: AuthRequest, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(req.user.userId, dto)
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.update(req.user.userId, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.accountsService.remove(req.user.userId, id)
  }
}
