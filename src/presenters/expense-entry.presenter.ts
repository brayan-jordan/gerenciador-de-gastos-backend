import { ApiProperty } from '@nestjs/swagger'
import type { ExpenseEntry } from '../models/expense-entry'

export class ExpenseEntryPresenter {
  @ApiProperty({
    description: 'Identificador único do lançamento',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string

  @ApiProperty({
    description: 'Identificador do usuário proprietário',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  userId!: string

  @ApiProperty({
    description: 'ID do gasto fixo de origem (null para lançamentos manuais)',
    example: '550e8400-e29b-41d4-a716-446655440002',
    nullable: true,
  })
  fixedExpenseId!: string | null

  @ApiProperty({ description: 'Descrição do lançamento', example: 'Mercado' })
  description!: string

  @ApiProperty({ description: 'Valor em centavos', example: 15090 })
  amountInCents!: number

  @ApiProperty({ description: 'Data do gasto (YYYY-MM-DD)', example: '2026-06-18' })
  date!: string

  @ApiProperty({ description: 'Data de criação' })
  createdAt!: Date

  @ApiProperty({ description: 'Data de última atualização' })
  updatedAt!: Date

  static toHttp(entry: ExpenseEntry): ExpenseEntryPresenter {
    return {
      id: entry.id,
      userId: entry.userId,
      fixedExpenseId: entry.fixedExpenseId ?? null,
      description: entry.description,
      amountInCents: entry.amountInCents,
      date: entry.date,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }
  }
}
