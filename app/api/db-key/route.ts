import { NextResponse } from "next/server";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.cihuy_DATABASE_URL ||
  process.env.cihuy_POSTGRES_URL ||
  process.env.cihuy_POSTGRES_HOST;

// Password untuk admin (simpan di environment variable)
const ADMIN_PASSWORD = process.env.ADMIN_API_PASSWORD || "Verz";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// DISABLE GET - Selalu return 404
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// POST: Satu endpoint untuk semua fungsi
export async function POST(req: Request) {
  try {
    const { key, password, product, user_id, roblox_id } = await req.json();

    // Validasi: Key wajib ada
    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    // ========== MODE 1: ADA PASSWORD = TAMBAH KEY ==========
    if (password) {
      // Verifikasi password
      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
      }

      // Validasi: Product wajib ada untuk tambah key
      if (!product) {
        return NextResponse.json({ error: "Product is required to add key" }, { status: 400 });
      }

      // Cek apakah key sudah ada
      const checkResult = await pool.query(
        `SELECT * FROM product_keys WHERE key_value = $1`,
        [key]
      );

      if (checkResult.rows.length > 0) {
        return NextResponse.json({ 
          success: false, 
          error: "Key already exists" 
        }, { status: 400 });
      }

      // Tambah key baru
      await pool.query(
        `INSERT INTO product_keys (product_name, key_value, status)
         VALUES ($1, $2, 'available')`,
        [product, key]
      );

      return NextResponse.json({ 
        success: true, 
        message: "Key added successfully" 
      });
    }

    // ========== MODE 2: TANPA PASSWORD = CEK KEY ==========
    else {
      // Cari key di database
      const result = await pool.query(
        `SELECT * FROM product_keys WHERE key_value = $1`,
        [key]
      );

      // Key tidak ditemukan
      if (result.rows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: "Key not found" 
        });
      }

      const keyData = result.rows[0];
      
      // Key sudah dipakai
      if (keyData.status !== "available") {
        return NextResponse.json({ 
          success: false, 
          error: "Key already used",
          used_at: keyData.used_at
        });
      }

      // Key valid dan available
      // Update status key menjadi used
      await pool.query(
        `UPDATE product_keys 
         SET status = 'used', user_id = $1, roblox_id = $2, used_at = CURRENT_TIMESTAMP
         WHERE key_value = $3`,
        [user_id || null, roblox_id || null, key]
      );

      return NextResponse.json({ 
        success: true, 
        message: "Key valid",
        product: keyData.product_name
      });
    }

  } catch (err: any) {
    console.error("POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}