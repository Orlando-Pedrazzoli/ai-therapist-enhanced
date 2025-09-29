// app/api/therapy/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { DataEncryption } from '@/lib/security/encryption';
import { getAuditLog } from '@/lib/security/encryption';
import { v4 as uuidv4 } from 'uuid';

// Create new therapy session
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { anonymous = false } = body;
    
    // Get user session if not anonymous
    let userId = null;
    if (!anonymous) {
      const session = await getServerSession();
      if (session?.user?.id) {
        userId = session.user.id;
      }
    }
    
    // Create session ID
    const sessionId = uuidv4();
    
    // Initialize encryption
    const encryption = new DataEncryption(process.env.ENCRYPTION_MASTER_KEY!);
    const initialData = {
      messages: [],
      metadata: {
        createdAt: new Date().toISOString(),
        language: 'pt-BR',
      },
    };
    
    // Encrypt session data
    const encryptedData = encryption.encryptObject(initialData);
    
    // Create session in database
    const therapySession = await prisma.therapySession.create({
      data: {
        sessionId,
        userId,
        encryptedData: encryptedData.data,
        encryptionIv: encryptedData.iv,
        encryptionSalt: encryptedData.salt,
        startedAt: new Date(),
        isActive: true,
        techniques: [],
        topics: [],
      },
    });
    
    // Audit log
    const auditLog = getAuditLog();
    auditLog.logAccess(userId || 'anonymous', 'create_session', sessionId);
    
    return NextResponse.json({
      sessionId: therapySession.sessionId,
      isActive: therapySession.isActive,
      startedAt: therapySession.startedAt,
      anonymous: !userId,
    });
    
  } catch (error) {
    console.error('Error creating therapy session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

// Get all sessions for authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const sessions = await prisma.therapySession.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        sessionId: true,
        startedAt: true,
        endedAt: true,
        moodStart: true,
        moodEnd: true,
        techniques: true,
        topics: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 20,
    });
    
    return NextResponse.json({ sessions });
    
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
