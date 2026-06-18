import { ApiProperty } from '@nestjs/swagger'
import { IsDateString, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator'

export class UpdateExpenseEntryContract {
  @ApiProperty({ description: 'Descrição do lançamento', example: 'Mercado', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string

  @ApiProperty({ description: 'Valor em centavos (inteiro positivo)', example: 15090, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  amountInCents?: number

  @ApiProperty({ description: 'Data do gasto (YYYY-MM-DD)', example: '2026-06-18', required: false })
  @IsOptional()
  @IsDateString()
  date?: string
}
