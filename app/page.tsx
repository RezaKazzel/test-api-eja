"use client";
import Link from "next/link";

export default function HomePage() {
  const apiList = [
    {
      name: "Crypto Tool UI",
      description: "Halaman antarmuka untuk enkripsi dan dekripsi teks secara visual.",
      path: "/encrypt",
      type: "UI",
      color: "bg-blue-600"
    },
    {
      name: "Encryption API",
      description: "Dokumentasi endpoint API untuk integrasi pihak ketiga.",
      path: "/api/encrypt",
      type: "JSON",
      color: "bg-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
        Eja API Dashboard
      </h1>
      <p className="text-gray-400 mb-10">Pilih layanan yang ingin kamu gunakan</p>

      <div className="grid gap-6 w-full max-w-2xl">
        {apiList.map((api, index) => (
          <Link key={index} href={api.path}>
            <div className="group bg-gray-800 border border-gray-700 p-6 rounded-2xl hover:border-blue-500 transition-all cursor-pointer shadow-lg hover:shadow-blue-900/20">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-xl font-bold group-hover:text-blue-400 transition-colors">
                  {api.name}
                </h2>
                <span className={`${api.color} text-[10px] px-2 py-1 rounded-full font-bold uppercase`}>
                  {api.type}
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                {api.description}
              </p>
              <div className="mt-4 flex items-center text-xs text-blue-500 font-semibold group-hover:translate-x-1 transition-transform">
                Buka Layanan 
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <footer className="mt-20 text-gray-600 text-xs">
        &copy; {new Date().getFullYear()} Eja Digital Service. All rights reserved.
      </footer>
    </div>
  );
}
