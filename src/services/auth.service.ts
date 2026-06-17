import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare } from 'bcryptjs'
import type { AuthenticateContract } from '../contracts/authenticate.contract'
import { UserService } from './user.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(credentials: AuthenticateContract): Promise<string> {
    const user = await this.userService.findByEmail(credentials.email)

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const passwordMatches = await compare(credentials.password, user.password)

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    return this.jwtService.signAsync({ sub: user.id })
  }
}
