import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { SessionsController } from './controllers/sessions.controller'
import { EnvModule } from './env/env.module'
import { EnvService } from './env/env.service'
import { AuthService } from './services/auth.service'
import { UserModule } from './user.module'

@Module({
  imports: [
    UserModule,
    EnvModule,
    JwtModule.registerAsync({
      global: true,
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (envService: EnvService) => ({
        secret: envService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [SessionsController],
  providers: [AuthService],
})
export class AuthModule {}
