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

// Helper: Auto delete expired keys
async function deleteExpiredKeys() {
  await pool.query(`
    DELETE FROM product_keys 
    WHERE expires_at <= CURRENT_TIMESTAMP 
    AND status = 'expired'
  `);
}

// Helper: Auto cleanup expired keys
async function cleanupExpiredKeys() {
  await pool.query(`
    UPDATE product_keys 
    SET status = 'expired', is_expired = TRUE 
    WHERE expires_at <= CURRENT_TIMESTAMP 
    AND status = 'active'
  `);
  await deleteExpiredKeys();
}

// ========== DELETE ENDPOINT ==========
export async function DELETE(req: Request) {
  try {
    const { key, password } = await req.json();

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const checkResult = await pool.query(
      `SELECT * FROM product_keys WHERE key_value = $1`,
      [key]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Key not found" 
      }, { status: 404 });
    }

    await pool.query(
      `DELETE FROM product_keys WHERE key_value = $1`,
      [key]
    );

    return NextResponse.json({ 
      success: true, 
      message: "Key deleted successfully" 
    });

  } catch (err: any) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await cleanupExpiredKeys();
    
    const { key, password, product, valid_days, action, hwid, max_devices } = await req.json();

    // Validasi: Key wajib ada
    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    // ========== MODE 1: ADA PASSWORD = TAMBAH KEY ==========
    if (password && !action) {
      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Invalid password" }, { status: 401 });
      }

      if (!product) {
        return NextResponse.json({ error: "Product is required" }, { status: 400 });
      }

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
    if (!password && !action) {
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
      
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
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
      
      if (keyData.status !== "active") {
        return NextResponse.json({ 
          success: false, 
          error: "Key is not active",
          status: keyData.status
        });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "Key valid",
        product: keyData.product_name,
        expires_at: keyData.expires_at
      });
    }

    // ========== MODE 3: USE KEY (DENGAN HWID) ==========
    if (action === "use") {
      if (!hwid) {
        return NextResponse.json({ error: "HWID is required" }, { status: 400 });
      }

      const result = await pool.query(
        `SELECT * FROM product_keys WHERE key_value = $1 AND status = 'active'`,
        [key]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Key not found or inactive" });
      }

      const keyData = result.rows[0];
      const now = new Date();

      if (keyData.expires_at && new Date(keyData.expires_at) < now) {
        await pool.query(`UPDATE product_keys SET status = 'expired' WHERE key_value = $1`, [key]);
        return NextResponse.json({ success: false, error: "Key expired" });
      }

      let hwids = keyData.hwids || [];

      if (hwids.includes(hwid)) {
        return NextResponse.json({ success: true, message: "HWID recognized" });
      }

      const maxDevices = keyData.max_devices ?? 0;
      if (maxDevices !== 0 && hwids.length >= maxDevices) {
        return NextResponse.json({ success: false, error: "Maximum devices reached" });
      }

      hwids.push(hwid);
      await pool.query(
        `UPDATE product_keys SET hwids = $1 WHERE key_value = $2`,
        [JSON.stringify(hwids), key]
      );

      return NextResponse.json({ success: true, message: "HWID registered" });
    }

    // ========== MODE 4: REFRESH HWID (OWNER) ==========
    if (action === "refresh-hwid") {
      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const result = await pool.query(
        `SELECT * FROM product_keys WHERE key_value = $1`,
        [key]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Key not found" });
      }

      await pool.query(
        `UPDATE product_keys SET hwids = $1 WHERE key_value = $2`,
        [JSON.stringify([]), key]
      );

      return NextResponse.json({ success: true, message: "HWID reset successfully" });
    }

    // ========== MODE 5: SET MAX DEVICES ==========
    if (action === "set-max") {
      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (typeof max_devices !== 'number' || max_devices < 0) {
        return NextResponse.json({ error: "Invalid max_devices" }, { status: 400 });
      }

      const result = await pool.query(
        `UPDATE product_keys SET max_devices = $1 WHERE key_value = $2 RETURNING *`,
        [max_devices, key]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: "Key not found" });
      }

      return NextResponse.json({ success: true, message: "Max devices updated" });
    }

    // ========== MODE 6: AUTO RESET HWID (BOT CALLS) ==========
    if (action === "auto-reset") {
      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const result = await pool.query(
        `UPDATE product_keys 
         SET hwids = '[]' 
         WHERE status = 'active' 
         AND (expires_at IS NULL OR expires_at > NOW())
         RETURNING key_value`
      );

      return NextResponse.json({
        success: true,
        reset_count: result.rows.length
      });
    }

    return NextResponse.json(
      { error: "Invalid action or missing parameters" },
      { status: 400 }
    );

  } catch (err: any) {
    console.error("POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}