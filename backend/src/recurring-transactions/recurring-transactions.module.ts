import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { RecurringTransactionsService } from './recurring-transactions.service'
import { RecurringTransactionsController } from './recurring-transactions.controller'

@Module({
  imports: [AuthModule],
  providers: [RecurringTransactionsService],
  controllers: [RecurringTransactionsController],
})
export class RecurringTransactionsModule {}
