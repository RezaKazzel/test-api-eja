"use client";
import { useState } from "react";

export default function EncryptPage() {
  const [text, setText] = useState("");
  const [password, setPassword] = useState("");
  const [amount, setAmount] = useState(1);
  const [showPassword, setShowPassword] = useState(false); // State show/hide
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleAction = async (action: "encode" | "decode") => {
    if (!text || !password) return alert("Isi teks dan password!");
    setResult("");
    setLoading(true);
    try {
      const res = await fetch("/api/encrypt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text, 
          password, 
          action, 
          amount: Number(amount) 
        }),
      });
      const data = await res.json();
      setResult(data.result || data.error);
    } catch (err) {
      setResult("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
          Eja Crypto Tool
        </h1>
        <p className="text-slate-400 mt-2">Recursive Encryption System</p>
      </div>
      
      <div className="w-full max-w-lg bg-[#1e293b] p-8 rounded-2xl shadow-2xl border border-slate-700/50 space-y-6">
        
        {/* Input Textarea */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-400">Input Message</label>
          <textarea
            placeholder="Ketik pesan rahasia..."
            className="w-full p-4 bg-[#0f172a] rounded-xl border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none text-blue-100 placeholder:text-slate-600"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Password Input with Show/Hide */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Security Key</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password..."
                className="w-full p-3 bg-[#0f172a] rounded-xl border border-slate-700 focus:border-blue-500 outline-none pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                )}
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Iterations (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              className="w-full p-3 bg-[#0f172a] rounded-xl border border-slate-700 focus:border-blue-500 outline-none"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-2">
          <button
            onClick={() => handleAction("encode")}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white p-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-900/20"
          >
            {loading ? "Processing..." : "Encrypt"}
          </button>
          <button
            onClick={() => handleAction("decode")}
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white p-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-900/20"
          >
            {loading ? "Processing..." : "Decrypt"}
          </button>
        </div>

        {/* Result Area */}
        {result && (
          <div className="mt-8 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-400">Result Output</label>
              <button 
                onClick={copyToClipboard}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center gap-1"
              >
                {copied ? "✅ Copied!" : "📋 Copy Result"}
              </button>
            </div>
            <div className="p-4 bg-[#0a0f1d] rounded-xl border border-slate-700/50 break-all text-emerald-400 font-mono text-sm leading-relaxed shadow-inner">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
