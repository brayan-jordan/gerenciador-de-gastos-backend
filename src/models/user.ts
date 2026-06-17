import { pgTable, text, uuid } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
