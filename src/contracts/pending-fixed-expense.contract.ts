import { ApiProperty } from '@nestjs/swagger'
import { Matches } from 'class-validator'

export class PendingFixedExpenseQuery {
  @ApiProperty({
    description: 'Mês de referência no formato YYYY-MM',
    example: '2024-01',
  })
  @Matches(/^\d{4}-\d{2}$/, { message: 'month deve estar no formato YYYY-MM' })
  month!: string
}
