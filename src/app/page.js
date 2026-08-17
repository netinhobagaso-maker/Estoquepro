'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';

export default function Dashboard() {
  const [faturamento, setFaturamento] = useState(0);
  const [lucroObtido, setLucroObtido] = useState(0);
  const [valorEstoqueCusto, setValorEstoqueCusto] = useState(0);
  const [lucroEsperadoEstoque, setLucroEsperadoEstoque] = useState(0);

  useEffect(() => {
    carregarDados();
  }, []);

  const formatarDinheiro = (valor) => {
    let numero = parseFloat(String(valor || 0).replace(',', '.')) || 0;
    return Number(numero.toFixed(2));
  };

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: produtos } = await supabase.from('produtos').select('*').eq('user_id', user.id);
    if (produtos) {
      let custoTotalEstoque = 0;
      let lucroPrevistoTotal = 0;

      produtos.forEach(p => {
        const qtd = formatarDinheiro(p.quantidade_estoque);
        const custoUn = formatarDinheiro(p.custo_unitario);
        const lucroUn = formatarDinheiro(p.lucro_unitario);

        custoTotalEstoque += (custoUn * qtd);
        lucroPrevistoTotal += (lucroUn * qtd);
      });

      setValorEstoqueCusto(custoTotalEstoque);
      setLucroEsperadoEstoque(lucroPrevistoTotal);
    }

    const { data: vendas } = await supabase.from('vendas').select('*').eq('user_id', user.id);
    if (vendas) {
      let faturamentoTotal = 0;
      let lucroTotalRealizado = 0;

      vendas.forEach(v => {
        faturamentoTotal += formatarDinheiro(v.valor_total || v.total);
        lucroTotalRealizado += formatarDinheiro(v.total_lucro);
      });

      setFaturamento(faturamentoTotal);
      setLucroObtido(lucroTotalRealizado);
    }
  };

  const zerarVendas = async () => {
    if (window.confirm("⚠️ Deseja apagar todas as vendas antigas para reiniciar?")) {
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
          <p className="text-gray-500 font-bold text-sm mb-1">💰 Faturamento (Entrou no Caixa)</p>
          <h2 className="text-4xl font-black text-[#10b981]">R$ {faturamento.toFixed(2)}</h2>
        </div>

        <div className="bg-emerald-50 p-6 rounded-2xl shadow-sm border border-emerald-100">
          <p className="text-emerald-700 font-bold text-sm mb-1">🚀 Lucro Obtido (Livre nas Vendas)</p>
          <h2 className="text-3xl font-black text-emerald-600">R$ {lucroObtido.toFixed(2)}</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-bold text-[11px] mb-1 uppercase tracking-wider">Investido no Estoque</p>
            <h3 className="text-xl font-black text-gray-800">R$ {valorEstoqueCusto.toFixed(2)}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-blue-500 font-bold text-[11px] mb-1 uppercase tracking-wider">Lucro Esperado (Estoque)</p>
            <h3 className="text-xl font-black text-blue-600">R$ {lucroEsperadoEstoque.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8">
        <div className="grid grid-cols-2 gap-4">
          <Link href="/vender" className="bg-[#10b981] p-6 rounded-2xl flex flex-col items-center justify-center text-white shadow-md active:scale-95 transition-transform">
            <span className="text-3xl mb-1">🛒</span>
            <span className="font-bold text-lg">Vender</span>
          </Link>
          <Link href="/novo-produto" className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-gray-700 shadow-sm active:scale-95 transition-transform">
            <span className="text-3xl mb-1">📦</span>
            <span className="font-bold text-lg">Adicionar</span>
          </Link>
        </div>
      </div>

      <div className="px-6 mt-10">
        <button onClick={zerarVendas} className="w-full bg-red-50 text-red-500 border border-red-100 p-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
          🗑️ Zerar Vendas Antigas
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
