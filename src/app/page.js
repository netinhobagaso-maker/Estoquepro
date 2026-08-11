'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

export default function Dashboard() {
  const [faturamentoHoje, setFaturamentoHoje] = useState(145.50);

  useEffect(() => {
    const checarLogin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) window.location.href = '/login';
    };
    checarLogin();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-6 rounded-b-3xl shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">Olá, Empreendedor! 👋</h1>
        
        <div className="mt-6 bg-emerald-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
          <p className="text-emerald-50 text-sm">Faturamento de Hoje</p>
          <h2 className="text-4xl font-extrabold mt-2">
            R$ {faturamentoHoje.toFixed(2).replace('.', ',')}
          </h2>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border text-center">
            <span className="text-3xl">🏷️</span>
            <p className="text-sm font-semibold mt-2">Ver Estoque</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border text-center">
            <span className="text-3xl">📊</span>
            <p className="text-sm font-semibold mt-2">Relatórios</p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
