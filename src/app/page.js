'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      
      // Se não tem login, manda para a tela de Login
      if (!data.user) {
        router.push('/login');
      } else {
        setUser(data.user);
      }
    };
    checkAuth();
  }, [router]);

  // Tela de carregamento rápida
  if (!user) return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center text-[#009ee3] font-bold text-xl">
      Carregando sistema...
    </div>
  );

  // TELA INICIAL TOTALMENTE LIBERADA (Sem travas)
  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-[#111827] pt-12 pb-8 px-6 text-white rounded-b-[2rem] shadow-lg">
        <h1 className="text-3xl font-black mb-2">Olá, Empreendedor! 🚀</h1>
        <p className="text-gray-400">O que vamos fazer hoje?</p>
      </div>
      
      <div className="px-6 mt-8 grid grid-cols-2 gap-4">
        <Link href="/vender" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
          <span className="text-4xl">🛒</span>
          <span className="font-bold text-gray-800">Vender</span>
        </Link>
        
        <Link href="/estoque" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform">
          <span className="text-4xl">📦</span>
          <span className="font-bold text-gray-800">Estoque</span>
        </Link>
        
        <Link href="/relatorios" className="col-span-2 bg-gradient-to-r from-[#009ee3] to-blue-500 p-6 rounded-3xl shadow-md text-white flex items-center justify-between active:scale-95 transition-transform">
          <div>
            <h3 className="font-black text-xl mb-1">Relatórios</h3>
            <p className="text-sm text-blue-100">Acompanhe seus lucros</p>
          </div>
          <span className="text-5xl drop-shadow-md">📊</span>
        </Link>
      </div>
      
      <BottomNav />
    </div>
  );
}
