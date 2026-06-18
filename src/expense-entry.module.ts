import { Module } from '@nestjs/common'
import { ExpenseEntryController } from './controllers/expense-entry.controller'
import { ExpenseEntryService } from './services/expense-entry.service'

@Module({
  controllers: [ExpenseEntryController],
  providers: [ExpenseEntryService],
})
export class ExpenseEntryModule {}
