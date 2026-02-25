import { NextRequest, NextResponse } from 'next/server';
import { setAdminCookie, clearAdminCookie, verifyAdminFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Admin password not configured' },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    return setAdminCookie(response);
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const isAdmin = verifyAdminFromRequest(request);
  return NextResponse.json({ authenticated: isAdmin });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  return clearAdminCookie(response);
}
