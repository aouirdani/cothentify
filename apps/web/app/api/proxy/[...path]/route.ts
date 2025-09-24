import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { SignJWT } from 'jose';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_JWT_SECRET = (process.env.API_JWT_SECRET || process.env.JWT_SECRET || '').trim();

async function signApiJwt(payload: Record<string, unknown>) {
  if (!API_JWT_SECRET) throw new Error('API_JWT_SECRET or JWT_SECRET not set');
  const key = new TextEncoder().encode(API_JWT_SECRET);
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(key);
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params);
}

export async function PUT(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params);
}

export async function DELETE(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params);
}

async function handleProxy(req: NextRequest, { path }: { path: string[] }) {
  const session = await getServerSession(authOptions);
  const url = `${API_BASE}/${path.join('/')}`;
  const method = req.method;
  const headers = new Headers(req.headers);
  headers.delete('host');

  // Only force JSON content-type if sending a body
  const hasBody = !['GET', 'HEAD'].includes(method);
  if (hasBody && !headers.has('content-type')) headers.set('content-type', 'application/json');

  // If the user is signed in, sign a JWT and attach Authorization.
  if (session?.user?.email) {
    const role = (session as any).role || 'MEMBER';
    const token = await signApiJwt({ sub: session.user.email, email: session.user.email, role });
    headers.set('authorization', `Bearer ${token}`);
  } else {
    // Otherwise, forward without Authorization header (public API endpoints will work; protected ones will return 401).
    headers.delete('authorization');
  }

  const body = hasBody ? await req.text() : undefined;
  const res = await fetch(url, { method, headers, body, redirect: 'manual' });
  const data = await res.text();
  return new NextResponse(data, { status: res.status, headers: res.headers });
}
