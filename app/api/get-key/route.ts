import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '../../lib/crypto';

const maxAmount = 25;
const RAW_PREFIX = 'raw_';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      text,
      password,
      action,
      amount = 1,
      raw = false
    } = body;

    if (!text || !password || !action) {
      return NextResponse.json({
        error: 'Missing fields',
        details: 'text, password, action wajib diisi'
      }, { status: 400 });
    }

    if (amount < 1 || amount > maxAmount) {
      return NextResponse.json({
        error: 'Invalid amount',
        details: `amount harus 1 - ${maxAmount}`
      }, { status: 400 });
    }

    let result = text;

    // =====================
    // ENCODE
    // =====================
    if (action === 'encode') {
      if (raw === true) {
        result = RAW_PREFIX + result;
      }

      for (let i = 0; i < amount; i++) {
        result = encrypt(result, password);
      }

      return NextResponse.json({
        success: true,
        stage: raw ? 'raw-encrypted' : 'encrypted',
        result
      });
    }

    // =====================
    // DECODE
    // =====================
    if (action === 'decode') {
      for (let i = 0; i < amount; i++) {
        try {
          result = decrypt(result, password);
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

      // hapus raw_
      result = result.slice(RAW_PREFIX.length);

      // encrypt ulang biar aman dikirim balik
      for (let i = 0; i < amount; i++) {
        result = encrypt(result, password);
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
    console.error('GET-KEY ERROR:', err.message);
    return NextResponse.json({
      error: 'Internal server error',
      details: err.message
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
