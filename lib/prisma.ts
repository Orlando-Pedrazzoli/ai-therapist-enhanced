// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Middleware for auto-deletion of expired data
prisma.$use(async (params, next) => {
  // Auto-delete expired sessions
  if (params.model === 'TherapySession' && params.action === 'findMany') {
    const now = new Date();
    await prisma.therapySession.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
  }
  
  // Auto-delete old audit logs (keep 90 days)
  if (params.model === 'AuditLog' && params.action === 'create') {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: ninetyDaysAgo,
        },
      },
    });
  }
  
  return next(params);
});

export default prisma;
