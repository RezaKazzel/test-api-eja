import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '@/app/lib/crypto'; // Sesuaikan path jika perlu

export async function POST(req: Request) {
  try {
    const { text, password, action } = await req.json();

    if (action === 'encode') {
      return NextResponse.json({ result: encrypt(text, password) });
    } else if (action === 'decode') {
      return NextResponse.json({ result: decrypt(text, password) });
    }

    return NextResponse.json({ error: "Action must be encode or decode" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Invalid Request" }, { status: 500 });
  }
}
