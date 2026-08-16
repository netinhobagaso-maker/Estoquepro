'use client';
import { useRouter, usePathname } from 'next/navigation';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center p-3 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <button onClick={() => router.push('/')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/') ? 'text-[#10b981] scale-110' : 'text-gray-400'}`}>
        <span className="text-xl mb-1">🏠</span>
        <span className="text-[10px] font-bold">Início</span>
      </button>
      
      <button onClick={() => router.push('/produtos/novo')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/produtos/novo') ? 'text-[#10b981] scale-110' : 'text-gray-400'}`}>
        <span className="text-xl mb-1">📦</span>
        <span className="text-[10px] font-bold">Novo Produto</span>
      </button>

      {/* BOTÃO DE VENDER CORRIGIDO AQUI */}
      <button onClick={() => router.push('/vender')} className="flex flex-col items-center -mt-8 bg-[#10b981] w-14 h-14 justify-center rounded-full shadow-lg shadow-emerald-500/40 text-white active:scale-95 transition-all">
        <span className="text-2xl">💰</span>
      </button>

      <button onClick={() => router.push('/fiados')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/fiados') ? 'text-[#10b981] scale-110' : 'text-gray-400'}`}>
        <span className="text-xl mb-1">📝</span>
        <span className="text-[10px] font-bold">Fiados</span>
      </button>
      
      {/* BOTÃO DE RELATÓRIO CORRIGIDO AQUI */}
      <button onClick={() => router.push('/relatorios')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${isActive('/relatorios') ? 'text-[#10b981] scale-110' : 'text-gray-400'}`}>
        <span className="text-xl mb-1">📊</span>
        <span className="text-[10px] font-bold">Relatório</span>
      </button>
    </div>
  );
}
