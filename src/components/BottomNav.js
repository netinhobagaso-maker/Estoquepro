import Link from 'next/link';

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
      <Link href="/" className="flex flex-col items-center text-gray-500 hover:text-emerald-500">
        <span className="text-2xl">🏠</span>
        <span className="text-[10px] font-medium mt-1">Início</span>
      </Link>
      
      <Link href="/produtos/novo" className="flex flex-col items-center text-gray-500 hover:text-emerald-500">
        <span className="text-2xl">📦</span>
        <span className="text-[10px] font-medium mt-1">Novo Produto</span>
      </Link>

      <Link href="/assinatura" className="flex flex-col items-center text-gray-500 hover:text-emerald-500">
        <span className="text-2xl">⭐</span>
        <span className="text-[10px] font-medium mt-1">Plano Pro</span>
      </Link>
      
      <Link href="/vender" className="flex flex-col items-center">
        <div className="bg-emerald-500 text-white rounded-full p-3 -mt-6 shadow-lg shadow-emerald-200 flex items-center justify-center">
          <span className="text-2xl">💰</span>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 mt-1">Vender</span>
      </Link>
    </div>
  );
}
