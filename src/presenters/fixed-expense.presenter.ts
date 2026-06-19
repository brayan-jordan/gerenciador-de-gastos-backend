import { ApiProperty } from '@nestjs/swagger'
import type { FixedExpense, Recurrence } from '../models/fixed-expense'

export class FixedExpensePresenter {
  @ApiProperty({
    description: 'Identificador único do gasto fixo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string

  @ApiProperty({
    description: 'Identificador do usuário proprietário',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  userId!: string

  @ApiProperty({ description: 'Descrição do gasto fixo', example: 'Aluguel' })
  description!: string

  @ApiProperty({ description: 'Valor em centavos', example: 120000 })
  amountInCents!: number

  @ApiProperty({
    description: 'Recorrência do gasto',
    enum: ['monthly', 'quarterly', 'semiannual', 'annual'],
    example: 'monthly',
  })
  recurrence!: Recurrence

  @ApiProperty({
    description: 'Data de referência para o cálculo das ocorrências (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  referenceDate!: string

  @ApiProperty({ description: 'Se o gasto está ativo', example: true })
  isActive!: boolean

  @ApiProperty({ description: 'Data de criação' })
  createdAt!: Date

  @ApiProperty({ description: 'Data de última atualização' })
  updatedAt!: Date

  static toHttp(fixedExpense: FixedExpense): FixedExpensePresenter {
    return {
      id: fixedExpense.id,
      userId: fixedExpense.userId,
      description: fixedExpense.description,
      amountInCents: fixedExpense.amountInCents,
      recurrence: fixedExpense.recurrence,
      referenceDate: fixedExpense.referenceDate,
      isActive: fixedExpense.isActive,
      createdAt: fixedExpense.createdAt,
      updatedAt: fixedExpense.updatedAt,
    }
  }
}
