import { ApiProperty } from '@nestjs/swagger'
import type { User } from '../models/user'

export class UserPresenter {
  @ApiProperty({
    description: 'Identificador único do usuário',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id!: string

  @ApiProperty({ description: 'Nome do usuário', example: 'João da Silva' })
  name!: string

  @ApiProperty({ description: 'Email do usuário', example: 'joao@example.com' })
  email!: string

  static toHttp(user: User): UserPresenter {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
    }
  }
}
