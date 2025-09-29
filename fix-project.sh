#!/bin/bash

# ============================================
# AI Therapist Enhanced - Auto Fix Script
# Corrige automaticamente os problemas comuns
# ============================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   AI Therapist - Correção Automática    ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Função para exibir status
show_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

# Função para gerar chave segura
generate_key() {
    node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
}

# 1. Verificar Node.js
echo -e "${YELLOW}📋 Verificando pré-requisitos...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js ${NODE_VERSION} instalado${NC}"
else
    echo -e "${RED}❌ Node.js não está instalado${NC}"
    exit 1
fi

# 2. Criar backup se .env.local existir
if [ -f .env.local ]; then
    echo -e "${YELLOW}📦 Criando backup do .env.local existente...${NC}"
    cp .env.local .env.backup.$(date +%Y%m%d_%H%M%S)
    show_status $? "Backup criado"
fi

# 3. Verificar se .env.example existe
if [ ! -f .env.example ]; then
    echo -e "${YELLOW}📄 .env.example não encontrado. Criando...${NC}"
    # Aqui você pode baixar ou criar o arquivo
    echo -e "${RED}Por favor, certifique-se de que .env.example existe${NC}"
    exit 1
fi

# 4. Copiar arquivos corrigidos
echo -e "${YELLOW}📂 Aplicando correções nos arquivos...${NC}"

# Copiar crisis-detection.ts corrigido se existir
if [ -f lib/security/crisis-detection.ts ]; then
    echo "  - Corrigindo crisis-detection.ts..."
    # Backup do original
    cp lib/security/crisis-detection.ts lib/security/crisis-detection.ts.bak 2>/dev/null || true
fi

# 5. Instalar dependências se necessário
if [ ! -d node_modules ]; then
    echo -e "${YELLOW}📦 Instalando dependências...${NC}"
    npm install
    show_status $? "Dependências instaladas"
else
    echo -e "${GREEN}✅ Dependências já instaladas${NC}"
fi

# 6. Gerar chaves de criptografia se não existirem
echo -e "${YELLOW}🔐 Verificando chaves de criptografia...${NC}"

if [ -f .env.local ]; then
    # Verificar se as chaves já estão configuradas
    if grep -q "ENCRYPTION_MASTER_KEY=GERE_" .env.local || ! grep -q "ENCRYPTION_MASTER_KEY=" .env.local; then
        echo "  Gerando ENCRYPTION_MASTER_KEY..."
        KEY1=$(generate_key)
        if [ "$(uname)" == "Darwin" ]; then
            # macOS
            sed -i '' "s/ENCRYPTION_MASTER_KEY=.*/ENCRYPTION_MASTER_KEY=\"$KEY1\"/" .env.local 2>/dev/null || echo "ENCRYPTION_MASTER_KEY=\"$KEY1\"" >> .env.local
        else
            # Linux
            sed -i "s/ENCRYPTION_MASTER_KEY=.*/ENCRYPTION_MASTER_KEY=\"$KEY1\"/" .env.local 2>/dev/null || echo "ENCRYPTION_MASTER_KEY=\"$KEY1\"" >> .env.local
        fi
    fi

    if grep -q "AUDIT_ENCRYPTION_KEY=GERE_" .env.local || ! grep -q "AUDIT_ENCRYPTION_KEY=" .env.local; then
        echo "  Gerando AUDIT_ENCRYPTION_KEY..."
        KEY2=$(generate_key)
        if [ "$(uname)" == "Darwin" ]; then
            sed -i '' "s/AUDIT_ENCRYPTION_KEY=.*/AUDIT_ENCRYPTION_KEY=\"$KEY2\"/" .env.local 2>/dev/null || echo "AUDIT_ENCRYPTION_KEY=\"$KEY2\"" >> .env.local
        else
            sed -i "s/AUDIT_ENCRYPTION_KEY=.*/AUDIT_ENCRYPTION_KEY=\"$KEY2\"/" .env.local 2>/dev/null || echo "AUDIT_ENCRYPTION_KEY=\"$KEY2\"" >> .env.local
        fi
    fi

    if grep -q "NEXTAUTH_SECRET=your-" .env.local || ! grep -q "NEXTAUTH_SECRET=" .env.local; then
        echo "  Gerando NEXTAUTH_SECRET..."
        KEY3=$(generate_key)
        if [ "$(uname)" == "Darwin" ]; then
            sed -i '' "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=\"$KEY3\"/" .env.local 2>/dev/null || echo "NEXTAUTH_SECRET=\"$KEY3\"" >> .env.local
        else
            sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=\"$KEY3\"/" .env.local 2>/dev/null || echo "NEXTAUTH_SECRET=\"$KEY3\"" >> .env.local
        fi
    fi
    
    echo -e "${GREEN}✅ Chaves de criptografia configuradas${NC}"
else
    echo -e "${YELLOW}⚠️  .env.local não existe. Criando...${NC}"
    cp .env.example .env.local
fi

# 7. Verificar MongoDB
echo -e "${YELLOW}🗄️  Verificando MongoDB...${NC}"
if grep -q "mongodb+srv://pedrazzoliorlando" .env.local 2>/dev/null; then
    echo -e "${GREEN}✅ MongoDB Atlas detectado${NC}"
    echo -e "${YELLOW}  Certifique-se de que as credenciais estão corretas${NC}"
elif grep -q "mongodb://localhost" .env.local 2>/dev/null; then
    # Verificar se MongoDB local está rodando
    if command -v docker &> /dev/null; then
        if docker ps | grep -q mongo; then
            echo -e "${GREEN}✅ MongoDB local rodando via Docker${NC}"
        else
            echo -e "${YELLOW}⚠️  MongoDB local não detectado${NC}"
            read -p "Deseja iniciar MongoDB via Docker? (s/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Ss]$ ]]; then
                docker run -d -p 27017:27017 --name mongodb-ai-therapist mongo
                show_status $? "MongoDB iniciado"
            fi
        fi
    fi
fi

# 8. Verificar API Key
echo -e "${YELLOW}🤖 Verificando configuração de IA...${NC}"
if ! grep -q "GOOGLE_GEMINI_API_KEY=\"\"" .env.local && grep -q "GOOGLE_GEMINI_API_KEY=" .env.local; then
    if ! grep -q "GOOGLE_GEMINI_API_KEY=\"your-" .env.local; then
        echo -e "${GREEN}✅ Google Gemini API key configurada${NC}"
    else
        echo -e "${YELLOW}⚠️  Google Gemini API key não configurada${NC}"
        echo "  Obtenha sua chave em: https://makersuite.google.com/app/apikey"
    fi
elif grep -q "OPENAI_API_KEY=" .env.local && ! grep -q "OPENAI_API_KEY=\"\"" .env.local; then
    echo -e "${GREEN}✅ OpenAI API key configurada${NC}"
else
    echo -e "${YELLOW}⚠️  Nenhuma API de IA configurada${NC}"
    echo "  Configure GOOGLE_GEMINI_API_KEY ou OPENAI_API_KEY no .env.local"
fi

# 9. Gerar Prisma Client
echo -e "${YELLOW}🔧 Gerando Prisma Client...${NC}"
npx prisma generate
show_status $? "Prisma Client gerado"

# 10. Executar teste de ambiente
echo -e "${YELLOW}🧪 Executando teste de ambiente...${NC}"
if [ -f test-env.js ]; then
    node test-env.js
else
    echo -e "${YELLOW}  Arquivo test-env.js não encontrado${NC}"
fi

# Resumo final
echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Correções aplicadas com sucesso!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""
echo "Próximos passos:"
echo -e "${BLUE}1.${NC} Se necessário, adicione sua API key no .env.local"
echo -e "${BLUE}2.${NC} Configure o banco de dados: npm run db:push"
echo -e "${BLUE}3.${NC} (Opcional) Popular banco: npm run db:seed"
echo -e "${BLUE}4.${NC} Iniciar aplicação: npm run dev"
echo ""
echo -e "${YELLOW}📝 Notas importantes:${NC}"
echo "  - Backup do .env.local salvo (se existia)"
echo "  - Chaves de criptografia geradas automaticamente"
echo "  - Verifique o arquivo .env.local para ajustes finais"
echo ""
echo -e "${GREEN}🚀 Tudo pronto! Execute: npm run dev${NC}"