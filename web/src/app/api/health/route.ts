import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Docker/Kubernetes probes
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      service: 'devlog-hub-web',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    },
    { status: 200 }
  );
}
