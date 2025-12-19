import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '../../lib/crypto'; 
const maxAmount = 25;

export async function GET() {
  return NextResponse.json({
    status: "Online",
    endpoint: "/api/encrypt",
    method: "POST",
    description: "Layanan enkripsi dan dekripsi teks berlapis (Recursive Encryption).",
    
    usage: {
      parameters: {
        text: {
          type: "string",
          description: "Teks mentah yang ingin dienkripsi, atau kode hash yang ingin didekripsi.",
          required: true
        },
        password: {
          type: "string",
          description: "Kunci rahasia untuk proses kriptografi (Minimal 8 karakter disarankan).",
          required: true
        },
        action: {
          type: "string",
          options: ["encode", "decode"],
          description: "Gunakan 'encode' untuk mengenkripsi dan 'decode' untuk mengembalikan teks asli.",
          required: true
        },
        amount: {
          type: "number",
          default: 1,
          description: `Jumlah lapisan enkripsi/dekripsi. Maksimal ${maxAmount} kali pengulangan.`,
          required: false
        }
      },
      example_request: {
        action: "encode",
        text: "Halo Dunia",
        password: "rahasia_negara",
        amount: 3
      }
    },

    notes: [
      "Jika mengenkripsi dengan amount 3, maka dekripsi juga harus menggunakan amount 3 agar berhasil.",
      "Gagal memberikan password yang benar pada proses decode akan menghasilkan error 422.",
      `Batas maksimal pengulangan (amount) adalah ${maxAmount} untuk menjaga performa server.`
    ]
  }, { status: 200 });
}


export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const { text, password, action } = body;
    const amount = parseInt(body.amount) || 1;

    if (!text || !password || !action) {
      return NextResponse.json({ 
        error: "Missing fields", 
        details: "text, password, dan action wajib diisi." 
      }, { status: 400 });
    }

    if (amount < 1 || amount > maxAmount) {
      return NextResponse.json({ 
        error: "Invalid amount", 
        details: `Amount harus antara 1 sampai ${max}.`
      }, { status: 400 });
    }

    let result = text;

    if (action === 'encode') {
      for (let i = 0; i < amount; i++) {
        result = encrypt(result, password);
      }
    } else if (action === 'decode') {
      for (let i = 0; i < amount; i++) {
        try {
          result = decrypt(result, password);
        } catch (e) {
          return NextResponse.json({ 
            error: "Decryption Failed", 
            details: `Gagal mendeskripsi pada putaran ke-${i + 1}. Pastikan password/amount benar.` 
          }, { status: 422 });
        }
      }
    } else {
      return NextResponse.json({ error: "Action harus 'encode' atau 'decode'" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      action: action,
      amount: amount,
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

export const dynamic = 'force-dynamic';
