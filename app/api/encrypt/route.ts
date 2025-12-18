import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '../../lib/crypto'; 

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { text, password, action } = body;

    if (!text || !password) {
      return NextResponse.json({ error: "Text dan Password wajib diisi" }, { status: 400 });
    }

    if (action === 'encode') {
      const result = encrypt(text, password);
      return NextResponse.json({ result });
    } else if (action === 'decode') {
      const result = decrypt(text, password);
      return NextResponse.json({ result });
    }

    return NextResponse.json({ error: "Action must be encode or decode" }, { status: 400 });
  } catch (err: any) {
    console.error("Error API:", err.message);
    return NextResponse.json({ error: "Invalid Request", details: err.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
