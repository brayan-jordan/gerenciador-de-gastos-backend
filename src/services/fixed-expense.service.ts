import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, eq } from 'drizzle-orm'
import type { CreateFixedExpenseContract } from '../contracts/create-fixed-expense.contract'
import type { UpdateFixedExpenseContract } from '../contracts/update-fixed-expense.contract'
import { DATABASE, type Database } from '../database/database'
import { type FixedExpense, fixedExpenses } from '../models/fixed-expense'

@Injectable()
export class FixedExpenseService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(userId: string, data: CreateFixedExpenseContract): Promise<FixedExpense> {
    const [fixedExpense] = await this.db
      .insert(fixedExpenses)
      .values({ ...data, userId })
      .returning()

    return fixedExpense
  }

  async findAll(userId: string): Promise<FixedExpense[]> {
    return this.db
      .select()
      .from(fixedExpenses)
      .where(and(eq(fixedExpenses.userId, userId), eq(fixedExpenses.isActive, true)))
  }

  async findOne(userId: string, id: string): Promise<FixedExpense> {
    const [fixedExpense] = await this.db
      .select()
      .from(fixedExpenses)
      .where(
        and(
          eq(fixedExpenses.id, id),
          eq(fixedExpenses.userId, userId),
          eq(fixedExpenses.isActive, true),
        ),
      )

    if (!fixedExpense) {
      throw new NotFoundException(`Gasto fixo ${id} não encontrado`)
    }

    return fixedExpense
  }

  async update(
    userId: string,
    id: string,
    data: UpdateFixedExpenseContract,
  ): Promise<FixedExpense> {
    const [fixedExpense] = await this.db
      .update(fixedExpenses)
      .set({ ...data, updatedAt: new Date() })
      .where(
        and(
          eq(fixedExpenses.id, id),
          eq(fixedExpenses.userId, userId),
          eq(fixedExpenses.isActive, true),
        ),
      )
      .returning()

    if (!fixedExpense) {
      throw new NotFoundException(`Gasto fixo ${id} não encontrado`)
    }

    return fixedExpense
  }

  async remove(userId: string, id: string): Promise<void> {
    const [fixedExpense] = await this.db
      .update(fixedExpenses)
      .set({ isActive: false, updatedAt: new Date() })
      .where(
        and(
          eq(fixedExpenses.id, id),
          eq(fixedExpenses.userId, userId),
          eq(fixedExpenses.isActive, true),
        ),
      )
      .returning()

    if (!fixedExpense) {
      throw new NotFoundException(`Gasto fixo ${id} não encontrado`)
    }
  }
}
