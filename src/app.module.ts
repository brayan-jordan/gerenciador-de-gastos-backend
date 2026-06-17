import { Module } from '@nestjs/common'
import { AppController } from './controllers/app.controller'
import { DatabaseModule } from './database/database.module'
import { EnvModule } from './env/env.module'
import { AppService } from './services/app.service'
import { UserModule } from './user.module'

@Module({
  imports: [EnvModule, DatabaseModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
