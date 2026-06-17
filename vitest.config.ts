import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      // Apenas código com lógica de negócio testável por unidade.
      include: [
        'src/services/**/*.ts',
        'src/controllers/**/*.ts',
        'src/guards/**/*.ts',
        'src/decorators/**/*.ts',
      ],
      // Sem lógica testável: entrypoint, módulos de DI, env/config,
      // acesso ao banco, schemas e os próprios testes.
      exclude: [
        'src/main.ts',
        '**/*.module.ts',
        'src/env/**',
        'src/database/**',
        'src/models/**',
        'src/**/*.spec.ts',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
})
