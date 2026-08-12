'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';

export default function Inicio() {
  const [faturamento, setFaturamento] = useState(0);
  const [gastoEstoque, setGastoEstoque] = useState(0);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Puxa Faturamento
      const { data: vendas } = await supabase.from('vendas').select('valor_total').eq('user_id', user.id);
      if (vendas) {
        setFaturamento(vendas.reduce((acc, v) => acc + (Number(v.valor_total) || 0), 0));
      }

      // 2. Puxa Produtos (Para a lista e para calcular o gasto total)
      const { data: prods } = await supabase.from('produtos').select('*').eq('user_id', user.id).order('nome');
      if (prods) {
        setProdutos(prods);
        setGastoEstoque(prods.reduce((acc, p) => acc + ((Number(p.custo_aquisicao) || 0) * (Number(p.quantidade_estoque) || 0)), 0));
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
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

        {/* ACESSO RÁPIDO */}
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

        {/* LISTA DE PRODUTOS DE VOLTA NA TELA */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 ml-1 mt-4">Meus Produtos no Estoque</h3>
          {loading ? (
            <p className="text-center text-gray-500 text-sm py-4">Carregando produtos...</p>
          ) : produtos.length === 0 ? (
            <div className="text-center bg-white p-6 rounded-2xl border border-gray-200">
              <p className="text-gray-500 text-sm">Nenhum produto cadastrado ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {produtos.map(produto => (
                <div key={produto.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{produto.nome}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      Em estoque: <span className={`font-bold ${produto.quantidade_estoque <= 5 ? 'text-red-500' : 'text-blue-500'}`}>{produto.quantidade_estoque} un</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Preço de Venda</p>
                    <p className="font-black text-emerald-500 text-lg">R$ {Number(produto.preco_venda).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
      <BottomNav />
    </div>
  );
}
