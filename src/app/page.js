'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';

export default function Inicio() {
  const [faturamento, setFaturamento] = useState(0);
  const [lucroTotal, setLucroTotal] = useState(0);
  const [gastoEstoque, setGastoEstoque] = useState(0);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [temAssinaturaAtiva, setTemAssinaturaAtiva] = useState(false);
  const [assinando, setAssinando] = useState(false);
  const [userAuth, setUserAuth] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserAuth(user);

      const { data: subData } = await supabase.from('assinaturas').select('status').eq('user_id', user.id).single();

      if (subData && (subData.status === 'active' || subData.status === 'trialing')) {
        setTemAssinaturaAtiva(true);
      } else {
        setTemAssinaturaAtiva(false);
        setLoading(false);
        return; 
      }

      const { data: vendas } = await supabase.from('vendas').select('valor_total, lucro_realizado').eq('user_id', user.id);
      if (vendas) {
        setFaturamento(vendas.reduce((acc, v) => acc + (Number(v.valor_total) || 0), 0));
        setLucroTotal(vendas.reduce((acc, v) => acc + (Number(v.lucro_realizado) || 0), 0));
      }

      const { data: prods } = await supabase.from('produtos').select('*').eq('user_id', user.id).order('nome');
      if (prods) {
        setProdutos(prods);
        setGastoEstoque(prods.reduce((acc, p) => acc + ((Number(p.custo_aquisicao) || 0) * (Number(p.quantidade_estoque) || 0)), 0));
      }
    }
    setLoading(false);
  };

  const iniciarAssinatura = async () => {
    setAssinando(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userAuth.id, email: userAuth.email })
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
      else alert("Erro: " + data.error);
    } catch (err) {
      alert("Erro: " + err.message);
    }
    setAssinando(false);
  };

  const apagarProduto = async (id, nome) => {
    if (confirm(`Deseja realmente apagar o produto "${nome}" do estoque?`)) {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (!error) carregarDados();
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-bold">Carregando...</div>;

  if (!temAssinaturaAtiva) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col justify-center items-center text-center">
        <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 w-full shadow-2xl">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-black mb-2">Assinatura Necessária</h2>
          <p className="text-gray-400 text-sm mb-6">Ative seu plano para liberar o sistema completo.</p>
          <button onClick={iniciarAssinatura} disabled={assinando} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl">
            {assinando ? 'Aguarde...' : 'Assinar Agora 💳'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-[#111827] p-6 shadow-sm rounded-b-3xl">
        <h1 className="text-2xl font-bold text-white">Meu Negócio 🏪</h1>
      </div>
      <div className="p-6 -mt-4 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-xl col-span-2"><p className="text-xs text-gray-500 font-bold">Faturamento</p><h2 className="text-3xl font-black text-emerald-500">R$ {faturamento.toFixed(2)}</h2></div>
          <div className="bg-white p-4 rounded-2xl shadow-md"><p className="text-[10px] text-gray-500 font-bold">Lucro</p><h3 className="text-xl font-black text-blue-600">R$ {lucroTotal.toFixed(2)}</h3></div>
          <div className="bg-white p-4 rounded-2xl shadow-md"><p className="text-[10px] text-gray-500 font-bold">Estoque</p><h3 className="text-xl font-black text-red-500">R$ {gastoEstoque.toFixed(2)}</h3></div>
        </div>
        <div>
          <h3 className="font-bold text-gray-800 mb-3 ml-1">Acesso Rápido</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/vender" className="bg-emerald-500 p-4 rounded-2xl text-white flex flex-col items-center justify-center gap-2"><span className="text-3xl">💰</span><span className="font-bold text-sm">Vender</span></Link>
            <Link href="/produtos/novo" className="bg-white border p-4 rounded-2xl flex flex-col items-center justify-center gap-2"><span className="text-3xl">📦</span><span className="font-bold text-sm">Adicionar</span></Link>
            <Link href="/fiados" className="bg-white border p-4 rounded-2xl flex flex-col items-center justify-center gap-2"><span className="text-3xl">📝</span><span className="font-bold text-sm">Fiados</span></Link>
            <Link href="/relatorios" className="bg-white border p-4 rounded-2xl flex flex-col items-center justify-center gap-2"><span className="text-3xl">📊</span><span className="font-bold text-sm">Relatórios</span></Link>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-gray-800 mb-3 ml-1 mt-4">Estoque</h3>
          <div className="space-y-3">
            {produtos.map(produto => (
              <div key={produto.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                <div>
                  <p className="font-bold">{produto.nome}</p>
                  <p className="text-xs text-gray-500">Qtd: {produto.quantidade_estoque}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-black text-emerald-500 mr-2">R$ {Number(produto.preco_venda).toFixed(2)}</p>
                  <button onClick={() => apagarProduto(produto.id, produto.nome)} className="text-red-500 p-2 text-xl">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
