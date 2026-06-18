import { Module } from '@nestjs/common'
import { FixedExpenseController } from './controllers/fixed-expense.controller'
import { FixedExpenseService } from './services/fixed-expense.service'

@Module({
  controllers: [FixedExpenseController],
  providers: [FixedExpenseService],
})
export class FixedExpenseModule {}
