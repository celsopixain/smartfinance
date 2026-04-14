import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { BudgetsService } from './budgets.service'
import { BudgetsController } from './budgets.controller'

@Module({
  imports: [AuthModule],
  providers: [BudgetsService],
  controllers: [BudgetsController],
})
export class BudgetsModule {}
