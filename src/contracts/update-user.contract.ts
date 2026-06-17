import { ApiProperty } from '@nestjs/swagger'

export class UpdateUserContract {
  @ApiProperty({ description: 'Nome do usuário', example: 'João da Silva' })
  name: string
}
