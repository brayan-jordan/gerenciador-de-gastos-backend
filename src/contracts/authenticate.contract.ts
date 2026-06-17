import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsString, MinLength } from 'class-validator'

export class AuthenticateContract {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@example.com',
  })
  @IsEmail()
  email!: string

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'senha-secreta',
  })
  @IsString()
  @MinLength(1)
  password!: string
}
