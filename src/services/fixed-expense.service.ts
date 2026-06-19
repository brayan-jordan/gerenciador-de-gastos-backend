import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { and, eq, isNotNull, sql } from 'drizzle-orm'
import type { ConfirmFixedExpenseContract } from '../contracts/confirm-fixed-expense.contract'
import type { CreateFixedExpenseContract } from '../contracts/create-fixed-expense.contract'
import type { UpdateFixedExpenseContract } from '../contracts/update-fixed-expense.contract'
import { DATABASE, type Database } from '../database/database'
import { type ExpenseEntry, expenseEntries } from '../models/expense-entry'
import { type FixedExpense, type Recurrence, fixedExpenses } from '../models/fixed-expense'

function isRecurrenceInMonth(referenceDate: string, recurrence: Recurrence, targetMonth: string): boolean {
  const [refYear, refMonth] = referenceDate.split('-').map(Number)
  const [tgtYear, tgtMonth] = targetMonth.split('-').map(Number)
  const diffMonths = (tgtYear - refYear) * 12 + (tgtMonth - refMonth)
  if (diffMonths < 0) return false
  switch (recurrence) {
    case 'monthly': return true
    case 'quarterly': return diffMonths % 3 === 0
    case 'semiannual': return diffMonths % 6 === 0
    case 'annual': return tgtMonth === refMonth
  }
}

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

  async findPending(userId: string, month: string): Promise<FixedExpense[]> {
    const active = await this.db
      .select()
      .from(fixedExpenses)
      .where(and(eq(fixedExpenses.userId, userId), eq(fixedExpenses.isActive, true)))

    const confirmed = await this.db
      .select({ fixedExpenseId: expenseEntries.fixedExpenseId })
      .from(expenseEntries)
      .where(
        and(
          eq(expenseEntries.userId, userId),
          isNotNull(expenseEntries.fixedExpenseId),
          sql`cast(${expenseEntries.date} as text) like ${month + '%'}`,
        ),
      )

    const confirmedIds = new Set(
      confirmed.map((e) => e.fixedExpenseId).filter((id): id is string => id !== null),
    )

    return active.filter(
      (fe) => isRecurrenceInMonth(fe.referenceDate, fe.recurrence, month) && !confirmedIds.has(fe.id),
    )
  }

  async confirm(userId: string, id: string, data: ConfirmFixedExpenseContract): Promise<ExpenseEntry> {
    const fixedExpense = await this.findOne(userId, id)

    if (!isRecurrenceInMonth(fixedExpense.referenceDate, fixedExpense.recurrence, data.month)) {
      throw new BadRequestException(
        `Gasto fixo ${id} não incide no mês ${data.month} de acordo com sua recorrência`,
      )
    }

    const existing = await this.db
      .select()
      .from(expenseEntries)
      .where(
        and(
          eq(expenseEntries.fixedExpenseId, id),
          sql`cast(${expenseEntries.date} as text) like ${data.month + '%'}`,
        ),
      )

    if (existing.length > 0) {
      throw new ConflictException(`Gasto fixo ${id} já foi confirmado em ${data.month}`)
    }

    const [entry] = await this.db
      .insert(expenseEntries)
      .values({
        userId,
        fixedExpenseId: id,
        description: fixedExpense.description,
        amountInCents: data.amountInCents ?? fixedExpense.amountInCents,
        date: `${data.month}-01`,
      })
      .returning()

    return entry
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
