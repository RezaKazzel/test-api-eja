import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '../../lib/crypto';

const API_PASSWORD = "VeRaA";
const FIXED_AMOUNT = 1;
const RAW_PREFIX = 'raw_';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, action, raw = false, check = true } = body;

    if (!text || !action) {
      return NextResponse.json(
        { error: 'Missing fields', details: 'text dan action wajib diisi' },
        { status: 400 }
      );
    }

    let result = text;

    // ================= ENCODE =================
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

    // ================= DECODE =================
    if (action === 'decode') {
      for (let i = 0; i < FIXED_AMOUNT; i++) {
        try {
          result = decrypt(result, API_PASSWORD);
        } catch {
          return NextResponse.json({ error: 'Invalid Key' }, { status: 422 });
        }
      }

      // potong raw_
      if (result.startsWith(RAW_PREFIX)) {
        result = result.slice(RAW_PREFIX.length);
      }

      // HARUS 22 = 12 HWID + 10 TIMESTAMP
      if (result.length !== 22) {
        return NextResponse.json({ error: 'Invalid Key Length' }, { status: 422 });
      }

      const hwidPart = result.slice(0, 12);
      const tsPart   = result.slice(12);

      // validasi hwid tail
      if (!/^[a-f0-9]{12}$/i.test(hwidPart)) {
        return NextResponse.json({ error: 'Invalid HWID' }, { status: 422 });
      }

      // validasi timestamp
      if (!/^\d{10}$/.test(tsPart)) {
        return NextResponse.json({ error: 'Invalid TimeStamp' }, { status: 422 });
      }

      const keyTimestamp = parseInt(tsPart, 10);
      const now = Math.floor(Date.now() / 1000);

      if (keyTimestamp < now && check) {
        return NextResponse.json({ error: 'Key Expired' }, { status: 422 });
      }

      // re-encrypt kalau raw=true
      if (raw) {
        for (let i = 0; i < FIXED_AMOUNT; i++) {
          result = encrypt(result, API_PASSWORD);
        }
      }

      return NextResponse.json({
        success: true,
        stage: 'decoded',
        result,
        timestamp: tsPart
      });
    }

    return NextResponse.json(
      { error: 'Invalid action', details: "action harus 'encode' atau 'decode'" },
      { status: 400 }
    );

  } catch (err: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
