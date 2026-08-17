'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';

export default function Dashboard() {
  const [faturamento, setFaturamento] = useState(0);
  const [lucro, setLucro] = useState(0);
  const [valorEstoque, setValorEstoque] = useState(0);

  useEffect(() => {
    carregarDados();
  }, []);

  const parseNum = (val) => parseFloat(String(val || 0).replace(',', '.')) || 0;

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. VALOR TOTAL EM ESTOQUE (Baseado no custo por unidade)
    const { data: produtos } = await supabase.from('produtos').select('*').eq('user_id', user.id);
    if (produtos) {
      const totEstoque = produtos.reduce((acc, p) => acc + (parseNum(p.custo_unitario) * parseNum(p.quantidade_estoque)), 0);
      setValorEstoque(totEstoque);
    }

    // 2. FATURAMENTO E LUCRO DIRETO DAS VENDAS
    const { data: vendas } = await supabase.from('vendas').select('*').eq('user_id', user.id);
    if (vendas) {
      const totalFat = vendas.reduce((acc, v) => acc + parseNum(v.valor_total || v.total), 0);
      const totalLucro = vendas.reduce((acc, v) => acc + parseNum(v.total_lucro), 0);

      setFaturamento(totalFat);
      setLucro(totalLucro);
    }
  };

  const zerarVendas = async () => {
    if (window.confirm("⚠️ Deseja apagar todas as vendas antigas para iniciar os cálculos com os novos produtos?")) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('vendas').delete().eq('user_id', user.id);
      alert("✅ Histórico zerado com sucesso!");
      carregarDados();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-[#111827] pt-12 pb-20 px-6 text-white rounded-b-[2.5rem]">
        <h1 className="text-2xl font-bold">Meu Negócio 🏪</h1>
      </div>

      <div className="px-6 -mt-12 space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 font-bold text-sm mb-1">Faturamento Total</p>
          <h2 className="text-4xl font-black text-[#10b981]">R$ {faturamento.toFixed(2)}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-bold text-xs mb-1">Lucro Obtido</p>
            <h3 className="text-xl font-black text-blue-600">R$ {lucro.toFixed(2)}</h3>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-bold text-xs mb-1">Valor em Custo Estoque</p>
            <h3 className="text-xl font-black text-red-600">R$ {valorEstoque.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8">
        <div className="grid grid-cols-2 gap-4">
          <Link href="/vender" className="bg-[#10b981] p-6 rounded-2xl flex flex-col items-center justify-center text-white font-bold text-lg">💰 Vender</Link>
          <Link href="/novo-produto" className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-gray-700 font-bold text-lg">📦 Adicionar</Link>
        </div>
      </div>

      <div className="px-6 mt-10">
        <button onClick={zerarVendas} className="w-full bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl font-bold">
          🗑️ Zerar Vendas Antigas
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
