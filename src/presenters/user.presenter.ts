import { ApiProperty } from '@nestjs/swagger'

export class UserPresenter {
  @ApiProperty({
    description: 'Identificador único do usuário',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string

  @ApiProperty({ description: 'Nome do usuário', example: 'João da Silva' })
  name: string
}
