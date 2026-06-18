import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { AuthModule } from './auth.module'
import { AppController } from './controllers/app.controller'
import { DatabaseModule } from './database/database.module'
import { EnvModule } from './env/env.module'
import { FixedExpenseModule } from './fixed-expense.module'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { AppService } from './services/app.service'
import { UserModule } from './user.module'

@Module({
  imports: [EnvModule, DatabaseModule, UserModule, AuthModule, FixedExpenseModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
