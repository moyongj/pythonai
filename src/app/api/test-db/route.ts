import { NextResponse } from 'next/server';
import { getAdmin, isDatabaseReady } from '@/lib/db';

export async function GET() {
  try {
    console.log('[TEST] Checking database status...');
    const ready = isDatabaseReady();
    console.log('[TEST] Database ready:', ready);
    
    if (ready) {
      const admin = getAdmin();
      console.log('[TEST] Admin:', admin);
      return NextResponse.json({
        success: true,
        databaseReady: ready,
        admin: admin ? { username: admin.username, password: '******' } : null
      });
    } else {
      return NextResponse.json({
        success: true,
        databaseReady: false,
        admin: null
      });
    }
  } catch (error) {
    console.error('[TEST] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    });
  }
}