'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [faturamentoHoje, setFaturamentoHoje] = useState(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const buscarFaturamento = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return; // Se não tiver usuário, não busca
      }

      // Pega a data de hoje (começo e fim do dia)
      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);
      const hojeFim = new Date();
      hojeFim.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('vendas')
        .select('valor_total')
        .eq('user_id', user.id)
        .gte('created_at', hojeInicio.toISOString())
        .lte('created_at', hojeFim.toISOString());

      if (data && !error) {
        const total = data.reduce((acc, venda) => acc + (venda.valor_total || 0), 0);
        setFaturamentoHoje(total);
      }
      setLoading(false);
    };

    buscarFaturamento();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 mt-4">Olá, Empreendedor! 👋</h1>
        
        <div className="bg-emerald-500 rounded-3xl p-6 text-white shadow-lg mb-8">
          <p className="text-emerald-100 text-sm mb-1">Faturamento de Hoje</p>
          <h2 className="text-4xl font-black">
            {loading ? 'R$ ...' : `R$ ${faturamentoHoje.toFixed(2)}`}
          </h2>
        </div>

        <h3 className="text-lg font-bold mb-4 text-gray-800">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-4">
          
          <button 
            onClick={() => router.push('/estoque')} // Agora o botão funciona!
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <div className="text-3xl">🏷️</div>
            <span className="font-bold text-gray-700">Ver Estoque</span>
          </button>

          <button 
             onClick={() => router.push('/relatorios')} // Agora o botão funciona!
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <div className="text-3xl">📊</div>
            <span className="font-bold text-gray-700">Relatórios</span>
          </button>

        </div>
      </div>
      <BottomNav />
    </div>
  );
}
