import { drizzle } from 'drizzle-orm/postgres-js'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '../models/schema'

export const DATABASE = Symbol('DATABASE')

export type Database = PostgresJsDatabase<typeof schema>

export { drizzle, schema }
