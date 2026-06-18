import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator'
import type { Recurrence } from '../models/fixed-expense'

export class UpdateFixedExpenseContract {
  @ApiProperty({
    description: 'Descrição do gasto fixo',
    example: 'Aluguel',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string

  @ApiProperty({
    description: 'Valor em centavos (inteiro positivo)',
    example: 120000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  amountInCents?: number

  @ApiProperty({
    description: 'Recorrência do gasto',
    enum: ['monthly', 'quarterly', 'semiannual', 'annual'],
    example: 'monthly',
    required: false,
  })
  @IsOptional()
  @IsEnum(['monthly', 'quarterly', 'semiannual', 'annual'])
  recurrence?: Recurrence
}
