import { NextResponse } from 'next/server';
import { encrypt, decrypt } from '../../lib/crypto';

export async function POST(req: Request) {
  return NextResponse.json({ status: "Koneksi Berhasil!" });
}

// Tambahkan GET juga untuk ngetes lewat browser
export async function GET() {
  return NextResponse.json({ message: "API ini aktif, silakan gunakan POST" });
}
