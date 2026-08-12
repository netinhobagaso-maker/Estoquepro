'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 pb-safe z-50">
      {/* CORRIGIDO PARA APONTAR PARA '/' E NÃO DAR 404 */}
      <Link href="/" className={`flex flex-col items-center ${pathname === '/' ? 'text-emerald-500' : 'text-gray-400'}`}>
        <span className="text-xl">🏠</span>
        <span className="text-[10px] mt-1 font-medium">Início</span>
      </Link>
      
      <Link href="/produtos/novo" className={`flex flex-col items-center ${pathname === '/produtos/novo' ? 'text-emerald-500' : 'text-gray-400'}`}>
        <span className="text-xl">📦</span>
        <span className="text-[10px] mt-1 font-medium">Novo Produto</span>
      </Link>

      <div className="relative -top-5">
        <Link href="/vender" className="bg-emerald-500 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200 text-2xl active:scale-95 transition-transform border-4 border-white">
          💰
        </Link>
      </div>

      <Link href="/fiados" className={`flex flex-col items-center ${pathname === '/fiados' ? 'text-orange-500' : 'text-gray-400'}`}>
        <span className="text-xl">📝</span>
        <span className="text-[10px] mt-1 font-medium">Fiados</span>
      </Link>
      
      <Link href="/relatorios" className={`flex flex-col items-center ${pathname === '/relatorios' ? 'text-emerald-500' : 'text-gray-400'}`}>
        <span className="text-xl">📊</span>
        <span className="text-[10px] mt-1 font-medium">Relatório</span>
      </Link>
    </div>
  );
}
