import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { apiReference } from '@scalar/nestjs-api-reference'
import { AppModule } from './app.module'
import { EnvService } from './env/env.service'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const config = new DocumentBuilder()
    .setTitle('Gerenciador de Gastos')
    .setDescription('API para gerenciamento de gastos pessoais')
    .setVersion('1.0')
    .build()

  const document = SwaggerModule.createDocument(app, config)

  app.use(
    '/docs',
    apiReference({
      spec: { content: document },
      theme: 'default',
    }),
  )

  const envService = app.get(EnvService)
  const port = envService.get('PORT')

  await app.listen(port)
}
bootstrap()
