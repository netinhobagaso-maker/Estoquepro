'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Assinatura() {
  const [loading, setLoading] = useState(false);

  const assinar = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Faça login primeiro!");

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userEmail: user.email }),
    });

    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gray-900 p-8 rounded-b-3xl text-center shadow-lg">
        <h1 className="text-3xl font-extrabold text-white">Zipp <span className="text-emerald-400">PRO</span></h1>
      </div>

      <div className="p-6 -mt-8">
        <div className="bg-white rounded-3xl p-8 shadow-xl border">
          <h2 className="text-xl font-bold">Plano Ilimitado</h2>
          <div className="mt-4 text-5xl font-extrabold">R$ 49<span className="text-xl text-gray-500">/mês</span></div>
          
          <ul className="mt-8 space-y-4 text-sm text-gray-600">
            <li>✅ Produtos Ilimitados</li>
            <li>✅ Vendas Ilimitadas</li>
            <li>✅ Relatórios Inteligentes</li>
          </ul>

          <button onClick={assinar} disabled={loading} className="mt-8 w-full bg-gray-900 text-white font-bold py-4 rounded-xl">
            {loading ? 'Aguarde...' : 'Começar Agora'}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
