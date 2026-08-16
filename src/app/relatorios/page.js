'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';
import { useRouter } from 'next/navigation';

export default function Relatorio() {
  const router = useRouter();
  const [vendas, setVendas] = useState([]);
  const [faturamentoTotal, setFaturamentoTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const carregarRelatorios = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Puxa as vendas ordenadas da mais recente para a mais antiga
      const { data } = await supabase
        .from('vendas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setVendas(data);
        const total = data.reduce((acc, venda) => acc + Number(venda.total || 0), 0);
        setFaturamentoTotal(total);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#111827] pt-8 pb-14 px-6 rounded-b-[2rem] shadow-md">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2">📊 Relatórios</h1>
        <p className="text-gray-400 text-sm mt-1">Análise de vendas e faturamento</p>
      </div>

      <div className="-mt-8 px-6 space-y-4">
        <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
          <p className="text-sm text-gray-500 font-bold mb-1">Faturamento Geral</p>
          <h2 className="text-4xl font-black text-[#10b981]">R$ {faturamentoTotal.toFixed(2)}</h2>
        </div>
      </div>

      <div className="px-6 mt-8">
        <h3 className="font-bold text-gray-800 text-lg mb-4">Histórico de Vendas</h3>
        
        {loading ? (
          <p className="text-gray-500 text-sm">Carregando relatórios...</p>
        ) : vendas.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 text-center shadow-sm">
            <p className="text-gray-500 font-medium">Nenhuma venda registrada ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vendas.map(venda => {
              const dataVenda = new Date(venda.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              });

              return (
                <div key={venda.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-xs text-gray-500 font-bold">{dataVenda}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${venda.forma_pagamento === 'Fiado' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {venda.forma_pagamento || 'Dinheiro'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <div className="text-sm text-gray-600 truncate max-w-[60%]">
                      {venda.itens ? venda.itens.map(i => `${i.quantidade}x ${i.nome}`).join(', ') : 'Itens não detalhados'}
                    </div>
                    <span className="font-black text-lg text-gray-800">
                      R$ {Number(venda.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
