import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common'
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import type { Response } from 'express'
import { AuthenticateContract } from '../contracts/authenticate.contract'
import { Public } from '../decorators/public.decorator'
import { EnvService } from '../env/env.service'
import { AuthService } from '../services/auth.service'

const ACCESS_TOKEN_COOKIE = 'access_token'
const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly authService: AuthService,
    private readonly envService: EnvService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign-in',
    description: 'Autentica o usuário e grava o JWT em um cookie httpOnly',
  })
  @ApiOkResponse({ description: 'Autenticado com sucesso' })
  @ApiUnauthorizedResponse({ description: 'Credenciais inválidas' })
  async signIn(
    @Body() credentials: AuthenticateContract,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const token = await this.authService.signIn(credentials)

    response.cookie(ACCESS_TOKEN_COOKIE, token, {
      httpOnly: true,
      sameSite: 'none',
      secure: this.envService.get('NODE_ENV') === 'production',
      maxAge: ONE_DAY_IN_MS,
    })
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Logout',
    description: 'Encerra a sessão limpando o cookie de autenticação',
  })
  @ApiNoContentResponse({ description: 'Sessão encerrada' })
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE)
  }
}
