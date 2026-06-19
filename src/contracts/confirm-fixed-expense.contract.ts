import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsOptional, Matches, Min } from 'class-validator'

export class ConfirmFixedExpenseContract {
  @ApiProperty({
    description: 'Mês de confirmação no formato YYYY-MM',
    example: '2024-01',
  })
  @Matches(/^\d{4}-\d{2}$/, { message: 'month deve estar no formato YYYY-MM' })
  month!: string

  @ApiProperty({
    description: 'Valor em centavos (usa o valor base do gasto fixo se omitido)',
    example: 95000,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  amountInCents?: number
}
