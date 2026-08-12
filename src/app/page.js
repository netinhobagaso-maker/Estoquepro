'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';

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
      const { data: vendas } = await supabase.from('vendas').select('valor_total').eq('user_id', user.id);
      if (vendas) {
        setFaturamento(vendas.reduce((acc, v) => acc + (Number(v.valor_total) || 0), 0));
      }

      const { data: produtos } = await supabase.from('produtos').select('custo_aquisicao, quantidade_estoque').eq('user_id', user.id);
      if (produtos) {
        setGastoEstoque(produtos.reduce((acc, p) => acc + ((Number(p.custo_aquisicao) || 0) * (Number(p.quantidade_estoque) || 0)), 0));
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#111827] p-6 shadow-sm rounded-b-3xl">
        <h1 className="text-2xl font-bold text-white">Meu Negócio 🏪</h1>
        <p className="text-gray-400 text-sm mt-1">Bem-vindo de volta!</p>
      </div>

      <div className="p-6 -mt-4 space-y-6">
        
        {/* CAIXAS DE RESUMO FINANCEIRO */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 col-span-2">
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Entradas (Faturamento)</p>
            <h2 className="text-4xl font-black text-emerald-500">R$ {faturamento.toFixed(2)}</h2>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 col-span-2">
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Valor Investido no Estoque Atual</p>
            <h3 className="text-2xl font-black text-red-500">R$ {gastoEstoque.toFixed(2)}</h3>
          </div>
        </div>

        {/* ACESSO RÁPIDO RESTAURADO */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 ml-1">Acesso Rápido</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/vender" className="bg-emerald-500 p-4 rounded-2xl shadow-sm text-white flex flex-col items-center justify-center gap-2 active:scale-95 transition-all">
              <span className="text-3xl">💰</span>
              <span className="font-bold text-sm">Nova Venda</span>
            </Link>
            <Link href="/produtos/novo" className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all">
              <span className="text-3xl">📦</span>
              <span className="font-bold text-sm text-gray-700">Adicionar Produto</span>
            </Link>
            <Link href="/fiados" className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all">
              <span className="text-3xl">📝</span>
              <span className="font-bold text-sm text-gray-700">Ver Fiados</span>
            </Link>
            <Link href="/relatorios" className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 active:scale-95 transition-all">
              <span className="text-3xl">📊</span>
              <span className="font-bold text-sm text-gray-700">Relatórios</span>
            </Link>
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
