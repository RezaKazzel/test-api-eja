"use client";
import { useState } from "react";

export default function EncryptPage() {
  const [text, setText] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "encode" | "decode") => {
    setLoading(true);
    try {
      const res = await fetch("/api/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, password, action }),
      });
      const data = await res.json();
      setResult(data.result || data.error);
    } catch (err) {
      setResult("Terjadi kesalahan koneksi");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8 text-blue-400">Eja Crypto Tool</h1>
      
      <div className="w-full max-w-md bg-gray-800 p-6 rounded-xl shadow-lg space-y-4">
        <textarea
          placeholder="Masukkan teks di sini..."
          className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <input
          type="password"
          placeholder="Password / Kunci"
          className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-4">
          <button
            onClick={() => handleAction("encode")}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition disabled:opacity-50"
          >
            Encrypt
          </button>
          <button
            onClick={() => handleAction("decode")}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 p-3 rounded font-bold transition disabled:opacity-50"
          >
            Decrypt
          </button>
        </div>

        {result && (
          <div className="mt-6">
            <label className="text-sm text-gray-400">Hasil:</label>
            <div className="p-3 bg-black rounded border border-gray-700 break-all">
              {result}
            </div>
            <button 
              onClick={() => navigator.clipboard.writeText(result)}
              className="text-xs text-blue-400 mt-2 hover:underline"
            >
              Salin ke Clipboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
