import {
  Controller, Get, Post, Delete,
  Body, Param, Query, Request, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common'
import { Request as ExpressRequest } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { BudgetsService } from './budgets.service'
import { CreateBudgetDto } from './dto/create-budget.dto'
import { ListBudgetsDto } from './dto/list-budgets.dto'

interface AuthRequest extends ExpressRequest {
  user: { userId: string; email: string }
}

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  findAll(@Request() req: AuthRequest, @Query() query: ListBudgetsDto) {
    return this.budgetsService.findAll(req.user.userId, query)
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  upsert(@Request() req: AuthRequest, @Body() dto: CreateBudgetDto) {
    return this.budgetsService.upsert(req.user.userId, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.budgetsService.remove(req.user.userId, id)
  }
}
