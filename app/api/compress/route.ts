import { NextResponse } from 'next/server';
import zlib from 'zlib';
import { promisify } from 'util';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

function superMinifyLua(code: string) {
  return code
    .replace(/--\[\[[\s\S]*?\]\]/g, '') // Hapus komentar blok
    .replace(/--.*$/gm, '')             // Hapus komentar baris
    .replace(/\s+/g, ' ')               // Kecilkan spasi jadi satu
    .replace(/\s*([=+\-*/%^#<>~,;:{}\[\]()])\s*/g, '$1') // Rapatkan operator
    .trim();
}

export async function POST(req: Request) {
  try {
    const { text, action, mode } = await req.json();

    if (action === "compress") {
      // TAHAP 1: Pre-processing berdasarkan Mode
      let processedText = text;
      if (mode === "lua") {
        processedText = superMinifyLua(text);
      } else {
        // Mode Teks: Hapus baris kosong berlebih, jaga spasi kata
        processedText = text.replace(/\n\s*\n/g, '\n').trim();
      }

      // TAHAP 2: Brotli Compression Level 11
      const buffer = await brotliCompress(Buffer.from(processedText), {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 }
      });

      const result = buffer.toString('base64');
      return NextResponse.json({
        success: true,
        result: result,
        stats: {
          original: text.length,
          final: result.length,
          ratio: Math.round((1 - result.length / text.length) * 100) + "%"
        }
      });
    } 

    if (action === "decompress") {
      const buffer = await brotliDecompress(Buffer.from(text, 'base64'));
      return NextResponse.json({ success: true, result: buffer.toString() });
    }

  } catch (err: any) {
    return NextResponse.json({ error: "Gagal memproses data. Pastikan format benar." }, { status: 500 });
  }
}

// Handler GET untuk cURL atau Roblox game:HttpGet
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');
  const action = searchParams.get('action');

  if (action === "decompress" && text) {
    try {
      const buffer = await brotliDecompress(Buffer.from(decodeURIComponent(text), 'base64'));
      return new NextResponse(buffer.toString());
    } catch {
      return new NextResponse("Error: Invalid compressed data", { status: 400 });
    }
  }
  return new NextResponse("Eja Compressor API Active", { status: 200 });
}
