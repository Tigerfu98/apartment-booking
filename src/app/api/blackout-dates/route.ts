import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { blackoutDates } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { verifyAdminFromRequest } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createBlackoutSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  reason: z.string().optional(),
}).refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: 'End date must be on or after start date', path: ['end_date'] }
);

export async function GET(request: NextRequest) {
  if (!verifyAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const results = await db
      .select()
      .from(blackoutDates)
      .orderBy(asc(blackoutDates.startDate));

    return NextResponse.json({ blackoutDates: results });
  } catch (error) {
    console.error('Error fetching blackout dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blackout dates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const result = createBlackoutSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { start_date, end_date, reason } = result.data;
    const db = getDb();

    const [newBlackout] = await db
      .insert(blackoutDates)
      .values({
        startDate: start_date,
        endDate: end_date,
        reason: reason || null,
      })
      .returning();

    return NextResponse.json({ blackoutDate: newBlackout }, { status: 201 });
  } catch (error) {
    console.error('Error creating blackout date:', error);
    return NextResponse.json(
      { error: 'Failed to create blackout date' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const db = getDb();

    const [deleted] = await db
      .delete(blackoutDates)
      .where(eq(blackoutDates.id, id))
      .returning({ id: blackoutDates.id });

    if (!deleted) {
      return NextResponse.json({ error: 'Blackout date not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blackout date:', error);
    return NextResponse.json(
      { error: 'Failed to delete blackout date' },
      { status: 500 }
    );
  }
}
