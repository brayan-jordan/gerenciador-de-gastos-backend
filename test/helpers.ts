import { ValidationPipe } from '@nestjs/common'
import type { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import cookieParser from 'cookie-parser'
import request from 'supertest'
import type { App } from 'supertest/types'
import { AppModule } from '../src/app.module'
import { DATABASE, type Database } from '../src/database/database'
import { users } from '../src/models/user'

/**
 * Cria a aplicação Nest para testes e2e aplicando os mesmos middlewares
 * globais do `main.ts` (ValidationPipe + cookieParser), para que o
 * comportamento HTTP seja idêntico ao de produção.
 */
export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleRef.createNestApplication<INestApplication<App>>()
  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  await app.init()
  return app
}

/** Limpa a tabela de usuários do banco de teste. */
export async function cleanDatabase(app: INestApplication): Promise<void> {
  const db = app.get<Database>(DATABASE)
  await db.delete(users)
}

let emailCounter = 0

/** Gera um email único e estável por chamada dentro da execução. */
export function uniqueEmail(prefix = 'user'): string {
  emailCounter += 1
  return `${prefix}-${emailCounter}@example.com`
}

export interface AuthenticatedUser {
  id: string
  email: string
  password: string
  cookie: string
}

/**
 * Cadastra um usuário e faz sign-in, retornando os dados e o cookie de
 * sessão (`access_token`) para uso em requisições autenticadas.
 */
export async function registerAndLogin(
  app: INestApplication<App>,
  overrides: Partial<{ name: string; email: string; password: string }> = {},
): Promise<AuthenticatedUser> {
  const name = overrides.name ?? 'Usuário Teste'
  const email = overrides.email ?? uniqueEmail()
  const password = overrides.password ?? 'senha-secreta'

  const created = await request(app.getHttpServer())
    .post('/users')
    .send({ name, email, password })
    .expect(201)

  const signIn = await request(app.getHttpServer())
    .post('/sessions')
    .send({ email, password })
    .expect(200)

  const setCookie = signIn.headers['set-cookie']
  const cookie = Array.isArray(setCookie) ? setCookie[0] : (setCookie ?? '')

  return { id: created.body.id, email, password, cookie }
}
