import { NextResponse } from "next/server";
import { Pool } from "pg";

const connectionString =
  process.env.DATABASE_URL ||
  process.env.cihuy_DATABASE_URL ||
  process.env.cihuy_POSTGRES_URL ||
  process.env.cihuy_POSTGRES_HOST;

const ADMIN_PASSWORD = process.env.ADMIN_API_PASSWORD || "Verz";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

// DISABLE GET
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// Helper: Auto cleanup expired keys
async function cleanupExpiredKeys() {
  await pool.query(`
    UPDATE product_keys 
    SET status = 'expired', is_expired = TRUE 
    WHERE expires_at <= CURRENT_TIMESTAMP 
    AND status = 'active'
  `);
}

export async function POST(req: Request) {
  try {
    await cleanupExpiredKeys();
    
    const { key, password, product, valid_days } = await req.json();

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

      // Validasi: Product wajib ada
      if (!product) {
        return NextResponse.json({ error: "Product is required" }, { status: 400 });
      }

      // Cek duplikat
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

      let expiresAt = null;
      if (valid_days) {
        expiresAt = new Date(Date.now() + valid_days * 24 * 60 * 60 * 1000);
      }

      // Insert key - pake status 'active' bukan 'available'
      await pool.query(
        `INSERT INTO product_keys (product_name, key_value, status, expires_at)
         VALUES ($1, $2, 'active', $3)`,
        [product, key, expiresAt]
      );

      return NextResponse.json({ 
        success: true, 
        message: "Key added successfully",
        expires_at: expiresAt
      });
    }

    // ========== MODE 2: TANPA PASSWORD = CEK KEY ==========
    else {
      // Cari key
      const result = await pool.query(
        `SELECT * FROM product_keys WHERE key_value = $1`,
        [key]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: "Key not found" 
        });
      }

      const keyData = result.rows[0];
      
      // Cek expired
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        // Tandai expired di database
        await pool.query(
          `UPDATE product_keys SET status = 'expired', is_expired = TRUE WHERE key_value = $1`,
          [key]
        );
        
        return NextResponse.json({ 
          success: false, 
          error: "Key expired",
          expired_at: keyData.expires_at
        });
      }
      
      // Cek status (harus 'active')
      if (keyData.status !== "active") {
        return NextResponse.json({ 
          success: false, 
          error: "Key is not active",
          status: keyData.status
        });
      }

      // KEY VALID - bisa dipakai berkali-kali
      // Catat penggunaan (opsional, bisa ditambahkan tabel terpisah kalau perlu history)
      
      return NextResponse.json({ 
        success: true, 
        message: "Key valid",
        product: keyData.product_name,
        expires_at: keyData.expires_at
      });
    }

  } catch (err: any) {
    console.error("POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}