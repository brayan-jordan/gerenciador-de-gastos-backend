import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './user'

export const recurrenceEnum = pgEnum('recurrence', [
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
])

export const fixedExpenses = pgTable('fixed_expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  description: text('description').notNull(),
  amountInCents: integer('amount_in_cents').notNull(),
  recurrence: recurrenceEnum('recurrence').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type FixedExpense = typeof fixedExpenses.$inferSelect
export type NewFixedExpense = typeof fixedExpenses.$inferInsert
export type Recurrence = (typeof recurrenceEnum.enumValues)[number]
