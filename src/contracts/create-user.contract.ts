import { ApiProperty } from '@nestjs/swagger'

export class CreateUserContract {
  @ApiProperty({ description: 'Nome do usuário', example: 'João da Silva' })
  name: string
}
