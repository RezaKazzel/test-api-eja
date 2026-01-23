import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '../../lib/crypto';

const API_PASSWORD = "VeRaA";
const FIXED_AMOUNT = 1;
const RAW_PREFIX = 'raw_';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, action, raw = false } = body;

    if (!text || !action) {
      return NextResponse.json({
        error: 'Missing fields',
        details: 'text dan action wajib diisi'
      }, { status: 400 });
    }

    let result = text;

    if (action === 'encode') {
      if (raw === true) {
        result = RAW_PREFIX + result;
      }

      for (let i = 0; i < FIXED_AMOUNT; i++) {
        result = encrypt(result, API_PASSWORD);
      }

      return NextResponse.json({
        success: true,
        stage: raw ? 'raw-encrypted' : 'encrypted',
        result
      });
    }

    if (action === 'decode') {
      for (let i = 0; i < FIXED_AMOUNT; i++) {
        try {
          result = decrypt(result, API_PASSWORD);
        } catch {
          return NextResponse.json({
            error: 'Decryption failed',
            details: `gagal di putaran ${i + 1}`
          }, { status: 422 });
        }
      }

      if (!result.startsWith(RAW_PREFIX)) {
        return NextResponse.json({
          error: 'Invalid raw key',
          details: 'prefix raw_ tidak ditemukan'
        }, { status: 400 });
      }

      result = result.slice(RAW_PREFIX.length);

      for (let i = 0; i < FIXED_AMOUNT; i++) {
        result = encrypt(result, API_PASSWORD);
      }

      return NextResponse.json({
        success: true,
        stage: 'decoded-clean-reencrypted',
        result
      });
    }

    return NextResponse.json({
      error: 'Invalid action',
      details: "action harus 'encode' atau 'decode'"
    }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({
      error: 'Internal server error',
      details: err.message
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
