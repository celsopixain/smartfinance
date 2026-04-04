import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { Request as ExpressRequest } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { TransactionsService } from './transactions.service'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { ListTransactionsDto } from './dto/list-transactions.dto'

interface AuthRequest extends ExpressRequest {
  user: { userId: string; email: string }
}

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req: AuthRequest, @Body() dto: CreateTransactionDto) {
    // user_id vem exclusivamente do JWT — nunca do body
    return this.transactionsService.create(req.user.userId, dto)
  }

  @Get()
  findAll(@Request() req: AuthRequest, @Query() query: ListTransactionsDto) {
    return this.transactionsService.findAll(req.user.userId, query)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Request() req: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactionsService.remove(req.user.userId, id)
  }
}
