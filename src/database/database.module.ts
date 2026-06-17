import { Global, Inject, Module, type OnModuleDestroy } from '@nestjs/common'
import postgres from 'postgres'
import { EnvModule } from '../env/env.module'
import { EnvService } from '../env/env.service'
import { DATABASE, type Database, drizzle, schema } from './database'

const DATABASE_CLIENT = Symbol('DATABASE_CLIENT')

@Global()
@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: DATABASE_CLIENT,
      inject: [EnvService],
      useFactory: (envService: EnvService) =>
        postgres(envService.get('DATABASE_URL')),
    },
    {
      provide: DATABASE,
      inject: [DATABASE_CLIENT],
      useFactory: (client: postgres.Sql) => drizzle(client, { schema }),
    },
  ],
  exports: [DATABASE],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(DATABASE_CLIENT) private readonly client: postgres.Sql) {}

  async onModuleDestroy(): Promise<void> {
    await this.client.end()
  }
}
