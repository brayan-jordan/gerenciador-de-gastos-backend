import { Module } from '@nestjs/common'
import { AppController } from './controllers/app.controller'
import { EnvModule } from './env/env.module'
import { AppService } from './services/app.service'

@Module({
  imports: [EnvModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
