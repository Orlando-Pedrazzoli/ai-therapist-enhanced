// app/api/therapy/session/[sessionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DataEncryption, SessionEncryption } from '@/lib/security/encryption';
import { getAuditLog } from '@/lib/security/encryption';

// GET - Obter uma sessão específica
export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

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
          take: 50,
        },
      },
    });

    if (!therapySession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Decrypt session data if needed
    const encryption = new DataEncryption(process.env.ENCRYPTION_MASTER_KEY!);
    const sessionEncryption = new SessionEncryption(sessionId);

    // Decrypt messages
    const decryptedMessages = therapySession.messages.map(msg => {
      try {
        const decrypted = sessionEncryption.decryptMessage({
          data: msg.encryptedContent,
          iv: msg.encryptionIv,
          salt: '',
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
          content: '[Unable to decrypt message]',
          timestamp: msg.timestamp,
          flagged: msg.flagged,
        };
      }
    });

    // Audit log
    const auditLog = getAuditLog();
    auditLog.logAccess(
      therapySession.userId || 'anonymous',
      'get_session',
      sessionId
    );

    return NextResponse.json({
      sessionId: therapySession.sessionId,
      isActive: therapySession.isActive,
      startedAt: therapySession.startedAt,
      endedAt: therapySession.endedAt,
      messages: decryptedMessages,
      moodStart: therapySession.moodStart,
      moodEnd: therapySession.moodEnd,
      techniques: therapySession.techniques,
      topics: therapySession.topics,
      anonymous: !therapySession.userId,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar uma sessão (ex: finalizar, atualizar mood)
export async function PUT(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const body = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const { moodEnd, endSession } = body;

    const updateData: any = {};

    if (moodEnd !== undefined) {
      updateData.moodEnd = moodEnd;
    }

    if (endSession) {
      updateData.isActive = false;
      updateData.endedAt = new Date();
    }

    const updatedSession = await prisma.therapySession.update({
      where: { sessionId },
      data: updateData,
    });

    // Audit log
    const auditLog = getAuditLog();
    auditLog.logAccess(
      updatedSession.userId || 'anonymous',
      'update_session',
      sessionId
    );

    return NextResponse.json({
      success: true,
      sessionId: updatedSession.sessionId,
      isActive: updatedSession.isActive,
      endedAt: updatedSession.endedAt,
      moodEnd: updatedSession.moodEnd,
    });
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar uma sessão (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Soft delete - apenas marca como inativa
    const deletedSession = await prisma.therapySession.update({
      where: { sessionId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });

    // Audit log
    const auditLog = getAuditLog();
    auditLog.logAccess(
      deletedSession.userId || 'anonymous',
      'delete_session',
      sessionId
    );

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
