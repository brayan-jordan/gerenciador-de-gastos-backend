import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsEnum, IsInt, IsString, Min, MinLength } from 'class-validator'
import type { Recurrence } from '../models/fixed-expense'

export class CreateFixedExpenseContract {
  @ApiProperty({
    description: 'Descrição do gasto fixo',
    example: 'Aluguel',
  })
  @IsString()
  @MinLength(1)
  description!: string

  @ApiProperty({
    description: 'Valor em centavos (inteiro positivo)',
    example: 120000,
  })
  @IsInt()
  @Min(1)
  amountInCents!: number

  @ApiProperty({
    description: 'Recorrência do gasto',
    enum: ['monthly', 'quarterly', 'semiannual', 'annual'],
    example: 'monthly',
  })
  @IsEnum(['monthly', 'quarterly', 'semiannual', 'annual'])
  recurrence!: Recurrence

  @ApiProperty({
    description: 'Data de referência para o cálculo das ocorrências (YYYY-MM-DD)',
    example: '2024-01-01',
  })
  @IsDateString()
  referenceDate!: string
}
