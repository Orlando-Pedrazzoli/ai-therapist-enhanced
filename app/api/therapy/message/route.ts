// app/api/therapy/message/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { prisma } from '@/lib/prisma';
import {
  SessionEncryption,
  DataEncryption,
  getAuditLog,
} from '@/lib/security/encryption';
import { getCrisisDetector } from '@/lib/security/crisis-detection';
import { getPromptSystem } from '@/lib/ai/therapy-prompts';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limiting check
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '20');

  const userLimit = rateLimitMap.get(identifier);

  if (!userLimit || userLimit.resetTime < now) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + 60000 });
    return true;
  }

  if (userLimit.count >= limit) {
    return false;
  }

  userLimit.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, message, context = {} } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(sessionId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    // Get session from database
    const therapySession = await prisma.therapySession.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!therapySession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Check if session is active
    if (!therapySession.isActive) {
      return NextResponse.json(
        { error: 'Session has expired' },
        { status: 403 }
      );
    }

    // Initialize security tools
    const encryption = new DataEncryption(process.env.ENCRYPTION_MASTER_KEY!);
    const sessionEncryption = new SessionEncryption(sessionId);
    const crisisDetector = getCrisisDetector('pt-BR');
    const promptSystem = getPromptSystem('pt-BR');
    const auditLog = getAuditLog();

    // Analyze message for crisis
    const crisisAnalysis = crisisDetector.analyzeMessage(message);

    // If critical crisis, don't process with AI
    if (crisisAnalysis.level === 'CRITICAL') {
      // Log crisis event
      await prisma.crisisEvent.create({
        data: {
          userId: therapySession.userId,
          level: 'CRITICAL',
          triggers: crisisAnalysis.triggers,
          resourcesShown: true,
          contactsProvided: ['CVV', 'SAMU', 'CAPS'],
          userAcknowledged: false,
          followUpNeeded: true,
        },
      });

      // Update session with crisis flag
      await prisma.therapySession.update({
        where: { id: therapySession.id },
        data: {
          crisisDetected: true,
          crisisLevel: 'CRITICAL',
        },
      });

      // Audit log
      auditLog.logAccess(
        therapySession.userId || 'anonymous',
        'crisis_detected',
        sessionId
      );

      return NextResponse.json({
        message:
          'Por sua segurança, detectamos sinais que requerem atenção profissional imediata. Por favor, entre em contato com um dos serviços de emergência: CVV (188), SAMU (192) ou procure o CAPS mais próximo. Sua vida tem valor e há pessoas prontas para ajudar.',
        crisis: true,
        crisisLevel: 'CRITICAL',
        emergencyContacts: crisisDetector.getEmergencyContacts(),
        suggestProfessionalHelp: true,
      });
    }

    // Store user message (encrypted)
    const encryptedUserMessage = sessionEncryption.encryptMessage(message);
    await prisma.message.create({
      data: {
        sessionId: therapySession.id,
        role: 'user',
        encryptedContent: encryptedUserMessage.data,
        encryptionIv: encryptedUserMessage.iv,
        timestamp: new Date(),
      },
    });

    // Create appropriate prompt based on crisis level
    let systemPrompt: string;
    if (crisisAnalysis.level === 'HIGH' || crisisAnalysis.level === 'MEDIUM') {
      systemPrompt = promptSystem.createCrisisPrompt(
        message,
        crisisAnalysis.level
      );
    } else {
      // Use technique-specific prompt if requested
      const technique = context.preferredTechnique || 'CBT';
      const issue = context.detectedIssue || 'general emotional support';
      systemPrompt = promptSystem.createTechniquePrompt(technique, issue);
    }

    // Prepare context for AI
    const conversationHistory = therapySession.messages.map(msg => ({
      role: msg.role,
      content: '[Previous message]', // Don't send actual encrypted content
    }));

    // Generate AI response using Gemini
    const model = genAI.getGenerativeModel({
      model: process.env.GOOGLE_GEMINI_MODEL || 'gemini-1.5-flash',
      generationConfig: {
        temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
        topK: 40,
        topP: parseFloat(process.env.AI_TOP_P || '0.95'),
        maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || '1000'),
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
    });

    // Create the full prompt
    const fullPrompt = `
${systemPrompt}

Contexto da sessão:
- Humor do usuário: ${context.mood || 'não especificado'}
- Nível de crise: ${crisisAnalysis.level}
- Técnica preferida: ${context.preferredTechnique || 'geral'}

Mensagem do usuário: "${message}"

Responda de forma empática e útil, seguindo as diretrizes de segurança.
`;

    // Generate response
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const aiMessage = response.text();

    // Check if AI response is appropriate
    const aiCrisisCheck = crisisDetector.analyzeMessage(aiMessage);
    if (aiCrisisCheck.level === 'CRITICAL' || aiCrisisCheck.level === 'HIGH') {
      // AI generated inappropriate response, use fallback
      const fallbackMessage =
        'Percebo que você está passando por um momento difícil. É importante lembrar que você não está sozinho. Existem pessoas e recursos disponíveis para apoiá-lo. Como posso ajudar você a encontrar o suporte necessário neste momento?';

      // Store fallback message
      const encryptedAiMessage =
        sessionEncryption.encryptMessage(fallbackMessage);
      await prisma.message.create({
        data: {
          sessionId: therapySession.id,
          role: 'assistant',
          encryptedContent: encryptedAiMessage.data,
          encryptionIv: encryptedAiMessage.iv,
          timestamp: new Date(),
          flagged: true,
          flagReason: 'AI response contained crisis content',
        },
      });

      return NextResponse.json({
        message: fallbackMessage,
        suggestProfessionalHelp: true,
      });
    }

    // Store AI response (encrypted)
    const encryptedAiMessage = sessionEncryption.encryptMessage(aiMessage);
    await prisma.message.create({
      data: {
        sessionId: therapySession.id,
        role: 'assistant',
        encryptedContent: encryptedAiMessage.data,
        encryptionIv: encryptedAiMessage.iv,
        timestamp: new Date(),
      },
    });

    // Update session metadata
    await prisma.therapySession.update({
      where: { id: therapySession.id },
      data: {
        updatedAt: new Date(),
        techniques: {
          push: context.preferredTechnique || 'general',
        },
        ...(crisisAnalysis.level !== 'LOW' && {
          crisisDetected: true,
          crisisLevel: crisisAnalysis.level,
        }),
      },
    });

    // Determine if professional help should be suggested
    const suggestProfessionalHelp =
      crisisAnalysis.level === 'HIGH' ||
      crisisAnalysis.level === 'MEDIUM' ||
      crisisDetector.checkDeteriorationPattern();

    // Audit log
    auditLog.logAccess(
      therapySession.userId || 'anonymous',
      'message_processed',
      sessionId
    );

    return NextResponse.json({
      message: aiMessage,
      suggestProfessionalHelp,
      crisisLevel: crisisAnalysis.level,
      ...(crisisAnalysis.level !== 'LOW' && {
        resources: crisisDetector.getEmergencyContacts(),
      }),
    });
  } catch (error) {
    console.error('Error processing message:', error);

    // Check if it's a safety block from Gemini
    if (error instanceof Error && error.message.includes('SAFETY')) {
      return NextResponse.json({
        message:
          'Desculpe, não posso responder a essa mensagem por razões de segurança. Se você está passando por dificuldades, considere buscar ajuda profissional.',
        suggestProfessionalHelp: true,
        error: 'safety_block',
      });
    }

    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

// Get message history for a session
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const therapySession = await prisma.therapySession.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!therapySession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Decrypt messages
    const sessionEncryption = new SessionEncryption(sessionId);
    const decryptedMessages = therapySession.messages.map(msg => {
      try {
        const decrypted = sessionEncryption.decryptMessage({
          data: msg.encryptedContent,
          iv: msg.encryptionIv,
          salt: '', // Not used in session encryption
          timestamp: msg.timestamp.getTime(),
        });

        return {
          id: msg.id,
          role: msg.role,
          content: decrypted,
          timestamp: msg.timestamp,
          flagged: msg.flagged,
        };
      } catch (error) {
        console.error('Error decrypting message:', error);
        return {
          id: msg.id,
          role: msg.role,
          content: '[Message could not be decrypted]',
          timestamp: msg.timestamp,
          flagged: msg.flagged,
        };
      }
    });

    return NextResponse.json({
      sessionId: therapySession.sessionId,
      messages: decryptedMessages,
      startedAt: therapySession.startedAt,
      moodStart: therapySession.moodStart,
      moodEnd: therapySession.moodEnd,
      techniques: therapySession.techniques,
    });
  } catch (error) {
    console.error('Error fetching message history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch message history' },
      { status: 500 }
    );
  }
}

