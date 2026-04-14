import {
  Controller, Get, Post, Delete, Patch,
  Body, Param, Query, Request, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common'
import { Request as ExpressRequest } from 'express'
import { IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RecurringTransactionsService } from './recurring-transactions.service'
import { CreateRecurringTransactionDto } from './dto/create-recurring-transaction.dto'

class GenerateQueryDto {
  @IsInt() @Min(1) @Max(12) @Type(() => Number) month: number
  @IsInt() @Min(2020)       @Type(() => Number) year: number
}

interface AuthRequest extends ExpressRequest {
  user: { userId: string; email: string }
}

@Controller('recurring-transactions')
@UseGuards(JwtAuthGuard)
export class RecurringTransactionsController {
  constructor(private readonly service: RecurringTransactionsService) {}

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.service.findAll(req.user.userId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req: AuthRequest, @Body() dto: CreateRecurringTransactionDto) {
    return this.service.create(req.user.userId, dto)
  }

  @Patch(':id/toggle')
  @HttpCode(HttpStatus.OK)
  toggle(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.service.toggleActive(req.user.userId, id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.service.remove(req.user.userId, id)
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  generate(@Request() req: AuthRequest, @Query() query: GenerateQueryDto) {
    return this.service.generateForMonth(req.user.userId, query.month, query.year)
  }
}
