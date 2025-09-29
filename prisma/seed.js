// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Limpar dados existentes
  console.log('🧹 Limpando dados existentes...');
  await prisma.message.deleteMany();
  await prisma.therapySession.deleteMany();
  await prisma.moodEntry.deleteMany();
  await prisma.crisisEvent.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.appConfig.deleteMany();

  // Criar configurações da aplicação
  console.log('⚙️  Criando configurações da aplicação...');
  const configs = [
    {
      key: 'maintenance_mode',
      value: { enabled: false, message: 'Sistema em manutenção' },
      description: 'Ativa/desativa modo de manutenção',
    },
    {
      key: 'crisis_keywords',
      value: {
        critical: ['suicídio', 'me matar', 'acabar com tudo'],
        high: ['sem esperança', 'não vale a pena'],
        medium: ['deprimido', 'ansioso', 'triste'],
      },
      description: 'Palavras-chave para detecção de crise',
    },
    {
      key: 'session_limits',
      value: {
        anonymous: { daily: 3, duration: 30 },
        registered: { daily: 10, duration: 60 },
      },
      description: 'Limites de sessão por tipo de usuário',
    },
    {
      key: 'emergency_contacts',
      value: {
        brazil: [
          { name: 'CVV', phone: '188', available: '24h' },
          { name: 'SAMU', phone: '192', available: '24h' },
        ],
        us: [
          { name: '988 Lifeline', phone: '988', available: '24/7' },
          { name: '911', phone: '911', available: '24/7' },
        ],
      },
      description: 'Contatos de emergência por região',
    },
  ];

  for (const config of configs) {
    await prisma.appConfig.create({
      data: config,
    });
  }

  // Criar usuário de teste
  console.log('👤 Criando usuário de teste...');
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      hashedEmail: crypto
        .createHash('sha256')
        .update('test@example.com')
        .digest('hex'),
      passwordHash:
        '$2a$10$K8.5QbKxhVYPNabO.QmEeOTYvlJ.dN9iXxUJwKqV0Y0GKwG5IbDJa', // password: test123
      name: 'Usuário Teste',
      isAnonymous: false,
      consentGiven: new Date(),
      consentVersion: '1.0.0',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      age: 25,
      location: 'Brasil',
    },
  });

  // Criar sessão de terapia de exemplo
  console.log('💬 Criando sessão de terapia de exemplo...');
  const therapySession = await prisma.therapySession.create({
    data: {
      sessionId: crypto.randomUUID(),
      userId: testUser.id,
      encryptedData: Buffer.from('encrypted_session_data').toString('base64'),
      encryptionIv: crypto.randomBytes(16).toString('base64'),
      encryptionSalt: crypto.randomBytes(16).toString('base64'),
      moodStart: 5,
      moodEnd: 7,
      techniques: ['CBT', 'Mindfulness'],
      topics: [crypto.createHash('sha256').update('ansiedade').digest('hex')],
      isActive: true,
    },
  });

  // Criar algumas mensagens de exemplo
  console.log('📝 Criando mensagens de exemplo...');
  const messages = [
    {
      sessionId: therapySession.id,
      role: 'user',
      encryptedContent: Buffer.from('Olá, estou me sentindo ansioso').toString(
        'base64'
      ),
      encryptionIv: crypto.randomBytes(16).toString('base64'),
    },
    {
      sessionId: therapySession.id,
      role: 'assistant',
      encryptedContent: Buffer.from(
        'Olá! Obrigado por compartilhar como você está se sentindo. A ansiedade pode ser desafiadora. Vamos explorar isso juntos.'
      ).toString('base64'),
      encryptionIv: crypto.randomBytes(16).toString('base64'),
    },
  ];

  for (const message of messages) {
    await prisma.message.create({ data: message });
  }

  // Criar entradas de humor
  console.log('😊 Criando entradas de humor...');
  const moodEntries = [
    {
      userId: testUser.id,
      mood: 7,
      energy: 6,
      anxiety: 4,
      activities: ['trabalho', 'exercício'],
      triggers: ['reunião importante'],
    },
    {
      userId: testUser.id,
      mood: 5,
      energy: 5,
      anxiety: 6,
      activities: ['casa'],
      triggers: ['notícias'],
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // Ontem
    },
  ];

  for (const entry of moodEntries) {
    await prisma.moodEntry.create({ data: entry });
  }

  // Criar conquistas
  console.log('🏆 Criando conquistas...');
  const achievements = [
    {
      userId: testUser.id,
      type: 'session_streak',
      name: 'Primeira Sessão',
      description: 'Completou sua primeira sessão de bem-estar',
      progress: 100,
      completed: true,
      completedAt: new Date(),
    },
    {
      userId: testUser.id,
      type: 'mood_improvement',
      name: 'Progresso Positivo',
      description: 'Melhorou seu humor em 3 sessões consecutivas',
      progress: 66,
      completed: false,
    },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.create({ data: achievement });
  }

  // Criar evento de crise de exemplo (resolvido)
  console.log('🚨 Criando evento de crise de exemplo (resolvido)...');
  await prisma.crisisEvent.create({
    data: {
      userId: testUser.id,
      level: 'MEDIUM',
      triggers: ['ansiedade', 'stress'],
      resourcesShown: true,
      contactsProvided: ['CVV', 'CAPS'],
      userAcknowledged: true,
      resolved: true,
      resolvedAt: new Date(),
      followUpNeeded: false,
    },
  });

  // Criar logs de auditoria
  console.log('📋 Criando logs de auditoria...');
  const auditLogs = [
    {
      action: 'login',
      resourceType: 'user',
      resourceId: testUser.id,
      userHash: crypto.createHash('sha256').update(testUser.id).digest('hex'),
      ipHash: crypto.createHash('sha256').update('127.0.0.1').digest('hex'),
      userAgent: 'Mozilla/5.0',
      success: true,
    },
    {
      action: 'create_session',
      resourceType: 'therapy_session',
      resourceId: therapySession.id,
      userHash: crypto.createHash('sha256').update(testUser.id).digest('hex'),
      ipHash: crypto.createHash('sha256').update('127.0.0.1').digest('hex'),
      userAgent: 'Mozilla/5.0',
      success: true,
    },
  ];

  for (const log of auditLogs) {
    await prisma.auditLog.create({ data: log });
  }

  console.log('✅ Seed concluído com sucesso!');
  console.log('');
  console.log('📊 Resumo dos dados criados:');
  console.log(
    '   - 1 usuário de teste (email: test@example.com, senha: test123)'
  );
  console.log('   - 1 sessão de terapia com 2 mensagens');
  console.log('   - 2 entradas de humor');
  console.log('   - 2 conquistas (1 completa, 1 em progresso)');
  console.log('   - 1 evento de crise (resolvido)');
  console.log('   - 4 configurações da aplicação');
  console.log('   - 2 logs de auditoria');
  console.log('');
  console.log('🚀 Pronto para testar! Execute: npm run dev');
}

main()
  .catch(e => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
