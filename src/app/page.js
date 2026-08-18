'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Estados do Painel Financeiro
  const [faturamento, setFaturamento] = useState(0);
  const [lucroReal, setLucroReal] = useState(0);
  const [valorEstoque, setValorEstoque] = useState(0);
  const [lucroEsperado, setLucroEsperado] = useState(0);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      
      if (!authData.user) {
        router.push('/login');
        return;
      }
      setUser(authData.user);
      buscarDados(authData.user.id);
    };
    checkAuthAndFetchData();
  }, [router]);

  const buscarDados = async (userId) => {
    // 1. Buscar Produtos (Para calcular Valor em Estoque e Lucro Esperado)
    const { data: produtos } = await supabase
      .from('produtos')
      .select('*')
      .eq('user_id', userId);

    if (produtos) {
      let estoqueTotal = 0;
      let lucroEsp = 0;
      produtos.forEach(p => {
        estoqueTotal += (Number(p.preco_custo) || 0) * (Number(p.quantidade) || 0);
        lucroEsp += ((Number(p.preco_venda) || 0) - (Number(p.preco_custo) || 0)) * (Number(p.quantidade) || 0);
      });
      setValorEstoque(estoqueTotal);
      setLucroEsperado(lucroEsp);
    }

    // 2. Buscar Vendas (Para calcular Faturamento e Lucro Real)
    const { data: vendas } = await supabase
      .from('vendas')
      .select('*')
      .eq('user_id', userId);

    if (vendas) {
      let fatTotal = 0;
      let lucroR = 0;
      vendas.forEach(v => {
        fatTotal += Number(v.valor_total) || 0;
        lucroR += Number(v.lucro) || 0;
      });
      setFaturamento(fatTotal);
      setLucroReal(lucroR);
    }
  };

  const reporBancoDeDados = async () => {
    const confirmar = window.confirm("⚠️ TEM CERTEZA? Isso vai apagar TODAS as suas vendas e zerar o seu estoque. Essa ação não pode ser desfeita.");
    if (!confirmar) return;

    if (user) {
       await supabase.from('vendas').delete().eq('user_id', user.id);
       await supabase.from('produtos').delete().eq('user_id', user.id);
       buscarDados(user.id);
       alert("✅ Banco de dados resetado com sucesso!");
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center text-[#009ee3] font-bold text-xl">
      Carregando painel...
    </div>
  );

  // Função para formatar os valores em Reais (R$)
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Cabeçalho */}
      <div className="bg-[#111827] pt-12 pb-8 px-6 text-white rounded-b-[2rem] shadow-lg">
        <h1 className="text-3xl font-black mb-2">Painel de Controle 📊</h1>
        <p className="text-gray-400">Resumo financeiro do seu negócio</p>
      </div>
      
      <div className="px-6 mt-6 space-y-4">
        {/* Métricas de Vendas (Realizado) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-bold mb-1">Faturamento Obtido</p>
            <p className="text-xl font-black text-green-600">{formatarMoeda(faturamento)}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-bold mb-1">Lucro Real</p>
            <p className="text-xl font-black text-blue-600">{formatarMoeda(lucroReal)}</p>
          </div>
        </div>

        {/* Métricas de Estoque (Projetado) */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-bold mb-1">Valor em Estoque</p>
            <p className="text-xl font-black text-gray-800">{formatarMoeda(valorEstoque)}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-bold mb-1">Lucro Esperado</p>
            <p className="text-xl font-black text-purple-600">{formatarMoeda(lucroEsperado)}</p>
          </div>
        </div>
        
        {/* Botões Principais */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Link href="/vender" className="bg-[#009ee3] text-white p-4 rounded-2xl shadow-md flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform">
            <span className="text-xl">🛒</span> Vender
          </Link>
          <Link href="/estoque" className="bg-white text-gray-800 border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform">
            <span className="text-xl">📦</span> Estoque
          </Link>
        </div>

        {/* Botão de Repor Banco de Dados */}
        <button 
          onClick={reporBancoDeDados}
          className="w-full mt-8 bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform"
        >
          <span>🗑️</span> Repor Banco de Dados
        </button>
      </div>
      
      <BottomNav />
    </div>
  );
}
