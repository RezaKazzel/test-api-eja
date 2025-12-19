"use client";
import { useState } from "react";

export default function EncryptPage() {
  const [text, setText] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState(1); // State baru untuk amount
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "encode" | "decode") => {
    if (!text || !password) return alert("Isi teks dan password!");
    
    setLoading(true);
    try {
      const res = await fetch("/api/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text, 
          password, 
          action, 
          amount: Number(amount) // Mengirim amount ke API
        }),
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
          className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <input
          type="password"
          placeholder="Password / Kunci"
          className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-400">Jumlah Lapisan (Amount):</label>
          <input
            type="number"
            min="1"
            max="10"
            className="w-full p-3 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>

        <div className="flex gap-4 pt-2">
          <button
            onClick={() => handleAction("encode")}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold transition disabled:opacity-50"
          >
            {loading ? "Processing..." : "Encrypt"}
          </button>
          <button
            onClick={() => handleAction("decode")}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 p-3 rounded font-bold transition disabled:opacity-50"
          >
            {loading ? "Processing..." : "Decrypt"}
          </button>
        </div>

        {result && (
          <div className="mt-6 animate-fade-in">
            <label className="text-sm text-gray-400">Hasil:</label>
            <div className="p-3 bg-black rounded border border-gray-700 break-all text-green-400 font-mono">
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
