import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '../../lib/crypto'; 

export async function GET() {
  return NextResponse.json({ 
    status: "Online", 
    message: "Endpoint enkripsi aktif. Silakan gunakan metode POST." 
  });
}

export async function POST(req: Request) {
  try {
    // 1. Ambil data dari body request
    const body = await req.json();
    const { text, password, action } = body;

    // 2. Validasi input
    if (!text || !password || !action) {
      return NextResponse.json({ 
        error: "Missing fields", 
        details: "text, password, dan action wajib diisi." 
      }, { status: 400 });
    }

    // 3. Proses berdasarkan action (encode atau decode)
    let result = "";
    if (action === 'encode') {
      result = encrypt(text, password);
    } else if (action === 'decode') {
      result = decrypt(text, password);
    } else {
      return NextResponse.json({ error: "Action harus 'encode' atau 'decode'" }, { status: 400 });
    }

    // 4. Kirim hasil
    return NextResponse.json({ 
      success: true,
      action: action,
      result: result 
    });

  } catch (err: any) {
    console.error("Encryption Error:", err.message);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: err.message 
    }, { status: 500 });
  }
}

// Memastikan route selalu diproses fresh (tidak di-cache oleh Vercel)
export const dynamic = 'force-dynamic';
