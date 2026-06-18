import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import type { CreateExpenseEntryContract } from '../contracts/create-expense-entry.contract'
import type { UpdateExpenseEntryContract } from '../contracts/update-expense-entry.contract'
import { DATABASE, type Database } from '../database/database'
import { type ExpenseEntry, expenseEntries } from '../models/expense-entry'

@Injectable()
export class ExpenseEntryService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(userId: string, data: CreateExpenseEntryContract): Promise<ExpenseEntry> {
    const [entry] = await this.db
      .insert(expenseEntries)
      .values({ ...data, userId })
      .returning()

    return entry
  }

  async findAll(userId: string): Promise<ExpenseEntry[]> {
    return this.db
      .select()
      .from(expenseEntries)
      .where(eq(expenseEntries.userId, userId))
  }

  async findOne(userId: string, id: string): Promise<ExpenseEntry> {
    const [entry] = await this.db
      .select()
      .from(expenseEntries)
      .where(and(eq(expenseEntries.id, id), eq(expenseEntries.userId, userId)))

    if (!entry) {
      throw new NotFoundException(`Lançamento ${id} não encontrado`)
    }

    return entry
  }

  async update(
    userId: string,
    id: string,
    data: UpdateExpenseEntryContract,
  ): Promise<ExpenseEntry> {
    const [entry] = await this.db
      .update(expenseEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(expenseEntries.id, id), eq(expenseEntries.userId, userId)))
      .returning()

    if (!entry) {
      throw new NotFoundException(`Lançamento ${id} não encontrado`)
    }

    return entry
  }

  async remove(userId: string, id: string): Promise<void> {
    const [entry] = await this.db
      .delete(expenseEntries)
      .where(and(eq(expenseEntries.id, id), eq(expenseEntries.userId, userId)))
      .returning()

    if (!entry) {
      throw new NotFoundException(`Lançamento ${id} não encontrado`)
    }
  }
}
