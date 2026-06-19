import { date, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { fixedExpenses } from './fixed-expense'
import { users } from './user'

export const expenseEntries = pgTable('expense_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  fixedExpenseId: uuid('fixed_expense_id').references(() => fixedExpenses.id),
  description: text('description').notNull(),
  amountInCents: integer('amount_in_cents').notNull(),
  date: date('date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type ExpenseEntry = typeof expenseEntries.$inferSelect
export type NewExpenseEntry = typeof expenseEntries.$inferInsert
