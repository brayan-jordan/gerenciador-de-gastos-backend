import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsInt, IsString, Min, MinLength } from 'class-validator'

export class CreateExpenseEntryContract {
  @ApiProperty({ description: 'Descrição do lançamento', example: 'Mercado' })
  @IsString()
  @MinLength(1)
  description!: string

  @ApiProperty({ description: 'Valor em centavos (inteiro positivo)', example: 15090 })
  @IsInt()
  @Min(1)
  amountInCents!: number

  @ApiProperty({ description: 'Data do gasto (YYYY-MM-DD)', example: '2026-06-18' })
  @IsDateString()
  date!: string
}
