// app/api/health/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: false,
      encryption: false,
      ai: false,
    },
  };

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = true;
  } catch (error) {
    checks.status = 'degraded';
    console.error('Database health check failed:', error);
  }

  // Check encryption keys are set
  if (process.env.ENCRYPTION_MASTER_KEY && process.env.AUDIT_ENCRYPTION_KEY) {
    checks.checks.encryption = true;
  } else {
    checks.status = 'degraded';
  }

  // Check AI API key is set
  if (process.env.GOOGLE_GEMINI_API_KEY || process.env.OPENAI_API_KEY) {
    checks.checks.ai = true;
  } else {
    checks.status = 'degraded';
  }

  // Determine overall status
  const allChecksPass = Object.values(checks.checks).every(v => v === true);
  if (!allChecksPass) {
    checks.status = 'unhealthy';
  }

  const statusCode = checks.status === 'healthy' ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}
