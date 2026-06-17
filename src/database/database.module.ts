import { Global, Module } from '@nestjs/common'
import postgres from 'postgres'
import { EnvModule } from '../env/env.module'
import { EnvService } from '../env/env.service'
import { DATABASE, drizzle, schema } from './database'

@Global()
@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: DATABASE,
      inject: [EnvService],
      useFactory: (envService: EnvService) => {
        const client = postgres(envService.get('DATABASE_URL'))
        return drizzle(client, { schema })
      },
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule {}
