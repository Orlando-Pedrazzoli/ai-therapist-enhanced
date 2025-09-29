#!/usr/bin/env node

/**
 * Script de teste de ambiente
 * Verifica se todas as configurações necessárias estão presentes
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
};

// Status icons
const icons = {
  success: '✅',
  warning: '⚠️ ',
  error: '❌',
  info: 'ℹ️ ',
};

// Variáveis obrigatórias
const REQUIRED_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'ENCRYPTION_MASTER_KEY',
  'AUDIT_ENCRYPTION_KEY',
];

// Variáveis de IA (pelo menos uma deve estar presente)
const AI_VARS = ['GOOGLE_GEMINI_API_KEY', 'OPENAI_API_KEY'];

// Variáveis opcionais mas recomendadas
const RECOMMENDED_VARS = [
  'ENABLE_CRISIS_DETECTION',
  'COMPLIANCE_MODE',
  'AI_TEMPERATURE',
  'AI_SAFETY_FILTER',
];

function checkEnvFile() {
  console.log(
    `\n${colors.cyan}🔍 Verificando arquivo de ambiente...${colors.reset}`
  );

  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (!fs.existsSync(envPath)) {
    console.log(
      `${colors.red}${icons.error} Arquivo .env.local não encontrado!${colors.reset}`
    );
    console.log(
      `${colors.yellow}   Execute: cp .env.example .env.local${colors.reset}`
    );
    console.log(`${colors.yellow}   Depois: node setup-env.js${colors.reset}`);
    return false;
  }

  console.log(
    `${colors.green}${icons.success} .env.local encontrado${colors.reset}`
  );

  // Load environment variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      envVars[key.trim()] = valueParts.join('=').trim().replace(/["']/g, '');
    }
  });

  return envVars;
}

function validateRequiredVars(envVars) {
  console.log(
    `\n${colors.cyan}📋 Verificando variáveis obrigatórias...${colors.reset}`
  );

  let hasErrors = false;

  REQUIRED_VARS.forEach(varName => {
    if (
      !envVars[varName] ||
      envVars[varName] === '' ||
      envVars[varName].includes('your-') ||
      envVars[varName].includes('GERE_')
    ) {
      console.log(
        `${colors.red}${icons.error} ${varName} não configurado corretamente${colors.reset}`
      );
      hasErrors = true;
    } else {
      console.log(
        `${colors.green}${icons.success} ${varName} ✓${colors.reset}`
      );
    }
  });

  return !hasErrors;
}

function validateAIProvider(envVars) {
  console.log(
    `\n${colors.cyan}🤖 Verificando provedor de IA...${colors.reset}`
  );

  const hasGemini =
    envVars['GOOGLE_GEMINI_API_KEY'] &&
    !envVars['GOOGLE_GEMINI_API_KEY'].includes('your-') &&
    envVars['GOOGLE_GEMINI_API_KEY'] !== '';

  const hasOpenAI =
    envVars['OPENAI_API_KEY'] &&
    !envVars['OPENAI_API_KEY'].includes('your-') &&
    envVars['OPENAI_API_KEY'] !== '';

  if (!hasGemini && !hasOpenAI) {
    console.log(
      `${colors.red}${icons.error} Nenhum provedor de IA configurado!${colors.reset}`
    );
    console.log(
      `${colors.yellow}   Configure GOOGLE_GEMINI_API_KEY ou OPENAI_API_KEY${colors.reset}`
    );
    return false;
  }

  if (hasGemini) {
    console.log(
      `${colors.green}${icons.success} Google Gemini configurado${colors.reset}`
    );
  }

  if (hasOpenAI) {
    console.log(
      `${colors.green}${icons.success} OpenAI configurado${colors.reset}`
    );
  }

  return true;
}

function validateEncryptionKeys(envVars) {
  console.log(
    `\n${colors.cyan}🔐 Verificando chaves de criptografia...${colors.reset}`
  );

  const keys = ['ENCRYPTION_MASTER_KEY', 'AUDIT_ENCRYPTION_KEY'];
  let hasErrors = false;

  keys.forEach(key => {
    const value = envVars[key];

    if (!value || value.includes('GERE_')) {
      console.log(
        `${colors.red}${icons.error} ${key} não foi gerada${colors.reset}`
      );
      hasErrors = true;
    } else {
      try {
        // Verifica se é uma chave base64 válida
        const decoded = Buffer.from(value, 'base64');
        if (decoded.length < 32) {
          console.log(
            `${colors.yellow}${icons.warning} ${key} parece muito curta (< 32 bytes)${colors.reset}`
          );
        } else {
          console.log(
            `${colors.green}${icons.success} ${key} válida (${decoded.length} bytes)${colors.reset}`
          );
        }
      } catch (e) {
        console.log(
          `${colors.red}${icons.error} ${key} não é base64 válido${colors.reset}`
        );
        hasErrors = true;
      }
    }
  });

  if (hasErrors) {
    console.log(
      `\n${colors.yellow}${icons.info} Para gerar chaves seguras, execute:${colors.reset}`
    );
    console.log(`   ${colors.dim}npm run setup:keys${colors.reset}`);
  }

  return !hasErrors;
}

function validateDatabase(envVars) {
  console.log(
    `\n${colors.cyan}🗄️  Verificando configuração do banco de dados...${colors.reset}`
  );

  const dbUrl = envVars['DATABASE_URL'];

  if (!dbUrl || dbUrl.includes('username:password')) {
    console.log(
      `${colors.red}${icons.error} DATABASE_URL não configurado corretamente${colors.reset}`
    );
    return false;
  }

  if (dbUrl.startsWith('mongodb://') || dbUrl.startsWith('mongodb+srv://')) {
    console.log(
      `${colors.green}${icons.success} MongoDB URL válida${colors.reset}`
    );

    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      console.log(
        `${colors.yellow}${icons.warning} Usando MongoDB local${colors.reset}`
      );
    } else if (dbUrl.includes('mongodb.net')) {
      console.log(
        `${colors.green}${icons.success} Usando MongoDB Atlas${colors.reset}`
      );
    }

    return true;
  }

  console.log(
    `${colors.red}${icons.error} DATABASE_URL não parece ser uma URL MongoDB válida${colors.reset}`
  );
  return false;
}

function checkRecommendedSettings(envVars) {
  console.log(
    `\n${colors.cyan}📝 Verificando configurações recomendadas...${colors.reset}`
  );

  RECOMMENDED_VARS.forEach(varName => {
    if (envVars[varName]) {
      console.log(
        `${colors.green}${icons.success} ${varName}: ${envVars[varName]}${colors.reset}`
      );
    } else {
      console.log(
        `${colors.yellow}${icons.warning} ${varName} não configurado (opcional)${colors.reset}`
      );
    }
  });

  // Verificações específicas
  if (envVars['ENABLE_CRISIS_DETECTION'] !== 'true') {
    console.log(
      `${colors.yellow}${icons.warning} Detecção de crise desativada - recomendado manter ativa${colors.reset}`
    );
  }

  if (envVars['AI_SAFETY_FILTER'] !== 'strict') {
    console.log(
      `${colors.yellow}${icons.warning} Filtro de segurança não está em modo strict${colors.reset}`
    );
  }

  const temp = parseFloat(envVars['AI_TEMPERATURE'] || '0.7');
  if (temp > 0.8) {
    console.log(
      `${colors.yellow}${icons.warning} AI_TEMPERATURE alta (${temp}) - pode gerar respostas menos consistentes${colors.reset}`
    );
  }
}

function checkDependencies() {
  console.log(`\n${colors.cyan}📦 Verificando dependências...${colors.reset}`);

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');

  if (!fs.existsSync(packageJsonPath)) {
    console.log(
      `${colors.red}${icons.error} package.json não encontrado${colors.reset}`
    );
    return false;
  }

  if (!fs.existsSync(nodeModulesPath)) {
    console.log(
      `${colors.red}${icons.error} node_modules não encontrado${colors.reset}`
    );
    console.log(`${colors.yellow}   Execute: npm install${colors.reset}`);
    return false;
  }

  // Verifica Node version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].replace('v', ''));

  if (majorVersion < 20) {
    console.log(
      `${colors.red}${icons.error} Node.js ${nodeVersion} - requer v20.0.0 ou superior${colors.reset}`
    );
    return false;
  }

  console.log(
    `${colors.green}${icons.success} Node.js ${nodeVersion}${colors.reset}`
  );
  console.log(
    `${colors.green}${icons.success} Dependências instaladas${colors.reset}`
  );

  return true;
}

function generateReport(results) {
  console.log(`\n${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.cyan}📊 RELATÓRIO DE VERIFICAÇÃO${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);

  const total = Object.keys(results).length;
  const passed = Object.values(results).filter(r => r).length;
  const percentage = Math.round((passed / total) * 100);

  Object.entries(results).forEach(([test, passed]) => {
    const icon = passed ? icons.success : icons.error;
    const color = passed ? colors.green : colors.red;
    console.log(`${color}${icon} ${test}${colors.reset}`);
  });

  console.log(`\n${colors.cyan}${'='.repeat(50)}${colors.reset}`);

  if (percentage === 100) {
    console.log(
      `${colors.green}🎉 Ambiente configurado corretamente! (${percentage}%)${colors.reset}`
    );
    console.log(`\n${colors.cyan}Próximos passos:${colors.reset}`);
    console.log('1. npm run db:push     - Configurar banco de dados');
    console.log('2. npm run dev         - Iniciar servidor de desenvolvimento');
  } else if (percentage >= 70) {
    console.log(
      `${colors.yellow}⚠️  Ambiente parcialmente configurado (${percentage}%)${colors.reset}`
    );
    console.log(
      `${colors.yellow}   Revise as configurações faltantes acima${colors.reset}`
    );
  } else {
    console.log(
      `${colors.red}❌ Ambiente não está configurado corretamente (${percentage}%)${colors.reset}`
    );
    console.log(
      `${colors.red}   Execute: node setup-env.js para configuração assistida${colors.reset}`
    );
  }

  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}\n`);
}

// Main execution
async function main() {
  console.log(`${colors.cyan}
╔════════════════════════════════════════╗
║  AI Therapist - Verificação de Ambiente ║
╚════════════════════════════════════════╝
${colors.reset}`);

  const envVars = checkEnvFile();

  if (!envVars) {
    process.exit(1);
  }

  const results = {
    'Arquivo de ambiente': true,
    'Variáveis obrigatórias': validateRequiredVars(envVars),
    'Provedor de IA': validateAIProvider(envVars),
    'Chaves de criptografia': validateEncryptionKeys(envVars),
    'Banco de dados': validateDatabase(envVars),
    Dependências: checkDependencies(),
  };

  checkRecommendedSettings(envVars);
  generateReport(results);

  // Exit code baseado no sucesso
  const allPassed = Object.values(results).every(r => r);
  process.exit(allPassed ? 0 : 1);
}

// Execute
main().catch(error => {
  console.error(`${colors.red}Erro: ${error.message}${colors.reset}`);
  process.exit(1);
});
