import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/models/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // biome-ignore lint/style/noNonNullAssertion: validado em runtime pelo env schema
    url: process.env.DATABASE_URL!,
  },
})
