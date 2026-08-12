'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Inicio() {
  const [faturamento, setFaturamento] = useState(0);
  const [gastoEstoque, setGastoEstoque] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarResumo();
  }, []);

  const carregarResumo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. PUXA O VALOR ATUALIZADO DAS VENDAS
      const { data: vendas } = await supabase.from('vendas').select('valor_total').eq('user_id', user.id);
      if (vendas) {
        const totalVendido = vendas.reduce((acc, v) => acc + (Number(v.valor_total) || 0), 0);
        setFaturamento(totalVendido);
      }

      // 2. PUXA O VALOR TOTAL GASTO NO ESTOQUE ATUAL
      const { data: produtos } = await supabase.from('produtos').select('custo_aquisicao, quantidade_estoque').eq('user_id', user.id);
      if (produtos) {
        const totalGasto = produtos.reduce((acc, p) => {
          const custo = Number(p.custo_aquisicao) || 0;
          const qtd = Number(p.quantidade_estoque) || 0;
          return acc + (custo * qtd);
        }, 0);
        setGastoEstoque(totalGasto);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#111827] p-6 shadow-sm rounded-b-3xl">
        <h1 className="text-2xl font-bold text-white">Meu Negócio 🏪</h1>
        <p className="text-gray-400 text-sm mt-1">Resumo em tempo real</p>
      </div>

      <div className="p-6 -mt-4 space-y-4">
        {/* CAIXA DE FATURAMENTO QUE ATUALIZA AUTOMATICAMENTE */}
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Entradas (Caixa Atual)</p>
          {loading ? (
             <p className="text-gray-400">Calculando...</p>
          ) : (
             <h2 className="text-4xl font-black text-emerald-500">R$ {faturamento.toFixed(2)}</h2>
          )}
        </div>

        {/* CAIXA DE TOTAL GASTO (CUSTO) */}
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Gasto em Estoque</p>
          {loading ? (
             <p className="text-gray-400">Calculando...</p>
          ) : (
             <h3 className="text-2xl font-black text-red-500">R$ {gastoEstoque.toFixed(2)}</h3>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
