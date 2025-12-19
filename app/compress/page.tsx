"use client";
import { useState } from "react";

export default function CompressPage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [mode, setMode] = useState("lua"); // 'lua' atau 'text'
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleProcess = async (action: "compress" | "decompress") => {
    if (!text) return;
    setLoading(true);
    try {
      const res = await fetch("/api/compress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, action, mode }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        setStats(data.stats || null);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Koneksi Error");
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
    <div className="min-h-screen bg-[#020617] text-slate-300 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            Eja Super Compressor
          </h1>
          <p className="text-slate-500 mt-2">Brotli L11 + Smart Minifier</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-4 bg-[#0f172a] p-6 rounded-3xl border border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-400">Input Raw Data</label>
              <select 
                value={mode} 
                onChange={(e) => setMode(e.target.value)}
                className="bg-slate-800 text-xs p-2 rounded-lg outline-none border border-slate-700"
              >
                <option value="lua">Mode: Lua Script</option>
                <option value="text">Mode: Story / Plain Text</option>
              </select>
            </div>
            <textarea
              className="w-full h-80 bg-[#020617] p-4 rounded-xl border border-slate-800 focus:border-emerald-500 outline-none font-mono text-sm resize-none"
              placeholder={mode === 'lua' ? "-- Paste your code..." : "Tulis cerita atau dongeng..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex gap-4">
              <button 
                onClick={() => handleProcess("compress")}
                disabled={loading}
                className="flex-1 bg-emerald-600 py-4 rounded-xl font-bold hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "Compressing..." : "Compress Now"}
              </button>
              <button 
                onClick={() => handleProcess("decompress")}
                disabled={loading}
                className="flex-1 bg-slate-800 py-4 rounded-xl font-bold hover:bg-slate-700 active:scale-95 transition-all"
              >
                Decompress
              </button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="space-y-4 flex flex-col">
            <div className="bg-[#0a0f1d] flex-1 p-6 rounded-3xl border border-slate-800 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-bold text-slate-400">Output Result</label>
                {result && (
                  <button onClick={copyToClipboard} className="text-xs text-emerald-400 hover:underline">
                    {copied ? "✅ Copied!" : "📋 Copy Result"}
                  </button>
                )}
              </div>
              <div className="flex-1 font-mono text-[11px] break-all text-emerald-500 bg-black/30 p-4 rounded-xl overflow-y-auto max-h-[300px]">
                {result || "Output will appear here..."}
              </div>
              
              {stats && (
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-3 bg-slate-900 rounded-xl">
                    <p className="text-[10px] text-slate-500">ORIGINAL</p>
                    <p className="font-bold text-slate-200">{stats.original} B</p>
                  </div>
                  <div className="text-center p-3 bg-slate-900 rounded-xl">
                    <p className="text-[10px] text-slate-500">FINAL</p>
                    <p className="font-bold text-emerald-400">{stats.final} B</p>
                  </div>
                  <div className="text-center p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <p className="text-[10px] text-emerald-500">SAVED</p>
                    <p className="font-bold text-emerald-400">{stats.ratio}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
