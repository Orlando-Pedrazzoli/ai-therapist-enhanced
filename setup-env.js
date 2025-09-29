#!/usr/bin/env node

/**
 * Script de configuração automática do ambiente
 * Gera chaves seguras e configura o .env.local
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Gerar chave segura
function generateSecureKey(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64');
}

// Template do .env.local com valores seguros
function generateEnvContent(config) {
  return `# ========================================
# AI Therapist Enhanced - Environment Configuration
# Generated on: ${new Date().toISOString()}
# ========================================

# Database
DATABASE_URL="${config.databaseUrl || 'mongodb://localhost:27017/ai-therapist'}"

# NextAuth Configuration
NEXTAUTH_URL="${config.nextAuthUrl || 'http://localhost:3000'}"
NEXTAUTH_SECRET="${generateSecureKey(32)}"

# AI Provider (Choose one)
${
  config.aiProvider === 'gemini'
    ? `GOOGLE_GEMINI_API_KEY="${config.geminiKey || ''}"
GOOGLE_GEMINI_MODEL="gemini-pro"`
    : '# GOOGLE_GEMINI_API_KEY=""'
}
${
  config.aiProvider === 'openai'
    ? `OPENAI_API_KEY="${config.openaiKey || ''}"
OPENAI_MODEL="gpt-4"`
    : '# OPENAI_API_KEY=""'
}

# Security Keys (Auto-generated secure keys)
ENCRYPTION_MASTER_KEY="${generateSecureKey(32)}"
AUDIT_ENCRYPTION_KEY="${generateSecureKey(32)}"

# Crisis Detection & Safety
ENABLE_CRISIS_DETECTION="true"
CRISIS_WEBHOOK_URL="${config.crisisWebhook || ''}"
CRISIS_ALERT_EMAIL="${config.crisisEmail || ''}"

# Email Service (Optional)
SMTP_HOST="${config.smtpHost || 'smtp.gmail.com'}"
SMTP_PORT="${config.smtpPort || '587'}"
SMTP_USER="${config.smtpUser || ''}"
SMTP_PASS="${config.smtpPass || ''}"
SMTP_FROM="${config.smtpFrom || 'AI Wellness <noreply@localhost>'}"

# Feature Flags
ENABLE_ANONYMOUS_SESSIONS="true"
ENABLE_DATA_ENCRYPTION="true"
ENABLE_AUDIT_LOGGING="true"
MAX_FREE_SESSIONS_PER_DAY="10"
SESSION_TIMEOUT_MINUTES="30"
DATA_RETENTION_DAYS="30"

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE="20"
RATE_LIMIT_SESSIONS_PER_DAY="10"

# Compliance
COMPLIANCE_MODE="${config.complianceMode || 'LGPD'}"
REQUIRE_CONSENT="true"
MINIMUM_AGE="18"

# Environment
NODE_ENV="${config.nodeEnv || 'development'}"
DEBUG_MODE="${config.debugMode || 'false'}"
LOG_LEVEL="info"

# Emergency Contacts (Region Specific)
BRAZIL_CRISIS_HOTLINE="188"
US_CRISIS_HOTLINE="988"
DEFAULT_CRISIS_HOTLINE="${config.defaultHotline || '188'}"

# AI Safety Settings
AI_TEMPERATURE="0.7"
AI_MAX_TOKENS="1000"
AI_TOP_P="0.95"
AI_SAFETY_FILTER="strict"

# Session Defaults
DEFAULT_LANGUAGE="${config.defaultLanguage || 'pt-BR'}"
DEFAULT_TIMEZONE="${config.defaultTimezone || 'America/Sao_Paulo'}"
DEFAULT_THEME="light"

# Analytics (Optional)
${
  config.googleAnalytics
    ? `GOOGLE_ANALYTICS_ID="${config.googleAnalytics}"`
    : '# GOOGLE_ANALYTICS_ID=""'
}
${config.sentryDsn ? `SENTRY_DSN="${config.sentryDsn}"` : '# SENTRY_DSN=""'}
`;
}

async function main() {
  console.log(`${colors.cyan}
╔════════════════════════════════════════╗
║  AI Therapist Enhanced - Setup Wizard  ║
╚════════════════════════════════════════╝
${colors.reset}`);

  console.log(
    `${colors.yellow}Este script irá configurar seu ambiente de desenvolvimento.${colors.reset}\n`
  );

  const config = {};

  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question(
      `${colors.yellow}⚠️  .env.local já existe. Deseja sobrescrever? (s/n): ${colors.reset}`
    );
    if (overwrite.toLowerCase() !== 's') {
      console.log(`${colors.cyan}Configuração cancelada.${colors.reset}`);
      process.exit(0);
    }
  }

  // Configuração básica
  console.log(`\n${colors.cyan}1. Configuração Básica${colors.reset}`);
  console.log('─'.repeat(40));

  // MongoDB
  const useDefaultDb = await question('Usar MongoDB local padrão? (s/n): ');
  if (useDefaultDb.toLowerCase() !== 's') {
    config.databaseUrl = await question(
      'Digite sua string de conexão MongoDB: '
    );
  }

  // NextAuth URL
  const useDefaultUrl = await question('Usar http://localhost:3000? (s/n): ');
  if (useDefaultUrl.toLowerCase() !== 's') {
    config.nextAuthUrl = await question('Digite a URL da aplicação: ');
  }

  // AI Provider
  console.log(`\n${colors.cyan}2. Provedor de IA${colors.reset}`);
  console.log('─'.repeat(40));
  const aiChoice = await question(
    'Qual provedor de IA? (1) Google Gemini (2) OpenAI: '
  );

  if (aiChoice === '1') {
    config.aiProvider = 'gemini';
    config.geminiKey = await question(
      'Digite sua API Key do Gemini (Enter para adicionar depois): '
    );
  } else {
    config.aiProvider = 'openai';
    config.openaiKey = await question(
      'Digite sua API Key do OpenAI (Enter para adicionar depois): '
    );
  }

  // Região
  console.log(`\n${colors.cyan}3. Configuração Regional${colors.reset}`);
  console.log('─'.repeat(40));
  const region = await question(
    'Região principal? (1) Brasil (2) EUA (3) Outro: '
  );

  if (region === '1') {
    config.defaultLanguage = 'pt-BR';
    config.defaultTimezone = 'America/Sao_Paulo';
    config.defaultHotline = '188';
    config.complianceMode = 'LGPD';
  } else if (region === '2') {
    config.defaultLanguage = 'en-US';
    config.defaultTimezone = 'America/New_York';
    config.defaultHotline = '988';
    config.complianceMode = 'HIPAA';
  } else {
    config.defaultLanguage = await question('Idioma padrão (pt-BR/en-US): ');
    config.defaultTimezone = await question('Timezone padrão: ');
    config.defaultHotline = await question('Telefone de crise padrão: ');
    config.complianceMode = await question(
      'Modo de compliance (LGPD/GDPR/HIPAA/NONE): '
    );
  }

  // Configurações opcionais
  console.log(`\n${colors.cyan}4. Configurações Opcionais${colors.reset}`);
  console.log('─'.repeat(40));

  const configureEmail = await question(
    'Configurar email para notificações? (s/n): '
  );
  if (configureEmail.toLowerCase() === 's') {
    config.smtpHost =
      (await question('SMTP Host (Enter para Gmail): ')) || 'smtp.gmail.com';
    config.smtpPort = (await question('SMTP Port (Enter para 587): ')) || '587';
    config.smtpUser = await question('Email de envio: ');
    config.smtpPass = await question('Senha do app (não a senha normal): ');
    config.smtpFrom = (await question('Nome do remetente: ')) || 'AI Wellness';
    config.crisisEmail = config.smtpUser;
  }

  const configureCrisis = await question(
    'Configurar webhook de crise? (s/n): '
  );
  if (configureCrisis.toLowerCase() === 's') {
    config.crisisWebhook = await question('URL do webhook: ');
  }

  const configureAnalytics = await question('Configurar analytics? (s/n): ');
  if (configureAnalytics.toLowerCase() === 's') {
    config.googleAnalytics = await question(
      'Google Analytics ID (Enter para pular): '
    );
    config.sentryDsn = await question('Sentry DSN (Enter para pular): ');
  }

  // Ambiente
  const isProd = await question('É ambiente de produção? (s/n): ');
  config.nodeEnv = isProd.toLowerCase() === 's' ? 'production' : 'development';
  config.debugMode = isProd.toLowerCase() === 's' ? 'false' : 'true';

  // Gerar arquivo .env.local
  console.log(`\n${colors.cyan}Gerando configuração...${colors.reset}`);
  const envContent = generateEnvContent(config);

  fs.writeFileSync(envPath, envContent);
  console.log(
    `${colors.green}✅ .env.local criado com sucesso!${colors.reset}`
  );

  // Gerar backup
  const backupPath = path.join(process.cwd(), `.env.backup.${Date.now()}`);
  fs.writeFileSync(backupPath, envContent);
  console.log(
    `${colors.green}✅ Backup salvo em: ${backupPath}${colors.reset}`
  );

  // Instruções finais
  console.log(
    `\n${colors.cyan}════════════════════════════════════════${colors.reset}`
  );
  console.log(
    `${colors.green}Configuração concluída com sucesso!${colors.reset}\n`
  );
  console.log('Próximos passos:');
  console.log('1. Revise o arquivo .env.local gerado');
  console.log('2. Adicione as API keys se ainda não adicionou');
  console.log('3. Execute: npm install');
  console.log('4. Execute: npm run db:push');
  console.log('5. Execute: npm run dev');
  console.log(`\n${colors.yellow}⚠️  Lembre-se:${colors.reset}`);
  console.log('- Nunca commite o .env.local no git');
  console.log('- Mantenha suas chaves seguras');
  console.log('- Use senhas fortes para produção');
  console.log(
    `\n${colors.cyan}════════════════════════════════════════${colors.reset}`
  );

  rl.close();
}

// Executar
main().catch(error => {
  console.error(`${colors.red}Erro: ${error.message}${colors.reset}`);
  process.exit(1);
});
