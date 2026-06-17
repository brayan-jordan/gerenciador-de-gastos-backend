import { ApiProperty } from '@nestjs/swagger'
import { IsString, MinLength } from 'class-validator'

export class UpdateUserContract {
  @ApiProperty({ description: 'Nome do usuário', example: 'João da Silva' })
  @IsString()
  @MinLength(1)
  name!: string
}
