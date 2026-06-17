import { config } from 'dotenv'

// Carrega o ambiente isolado de teste antes de qualquer módulo do Nest
// inicializar. `override: true` garante que as variáveis de teste
// substituam quaisquer valores herdados do shell/.env.
config({ path: '.env.test', override: true })
