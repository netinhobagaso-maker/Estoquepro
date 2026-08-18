'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Estados dos cálculos
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
    // FUNÇÃO RIGOROSA PARA NÚMEROS: Garante que "10,50" ou "R$ 10" virem números exatos para o cálculo não falhar.
    const parseCurrency = (value) => {
      if (!value) return 0;
      if (typeof value === 'number') return value;
      // Remove tudo que não for número, vírgula ou sinal de menos
      const str = String(value).replace(/[^0-9,-]/g, '');
      const num = parseFloat(str.replace(',', '.'));
      return isNaN(num) ? 0 : num;
    };

    // 1. CÁLCULO EXATO DE ESTOQUE E LUCRO PROJETADO (A matemática original do seu app)
    const { data: produtos } = await supabase
      .from('produtos')
      .select('*')
      .eq('user_id', userId);

    if (produtos) {
      let calcValorEstoque = 0;
      let calcLucroEsperado = 0;

      produtos.forEach(p => {
        const qtd = parseInt(p.quantidade || p.qtd || p.estoque || 0, 10);
        const precoCusto = parseCurrency(p.preco_custo || p.custo);
        const precoVenda = parseCurrency(p.preco_venda || p.preco || p.valor);

        // O Valor em Estoque é o capital que você investiu (Custo x Qtd)
        const capitalInvestidoProduto = precoCusto * qtd;
        calcValorEstoque += capitalInvestidoProduto;

        // O Lucro Esperado é o Valor Bruto de Venda menos o Custo (Lucro Líquido Projetado)
        const faturamentoEsperadoProduto = precoVenda * qtd;
        calcLucroEsperado += (faturamentoEsperadoProduto - capitalInvestidoProduto);
      });

      setValorEstoque(calcValorEstoque);
      setLucroEsperado(calcLucroEsperado);
    }

    // 2. CÁLCULO EXATO DE VENDAS JÁ REALIZADAS
    const { data: vendas } = await supabase
      .from('vendas')
      .select('*')
      .eq('user_id', userId);

    if (vendas) {
      let calcFaturamento = 0;
      let calcLucroReal = 0;

      vendas.forEach(v => {
        calcFaturamento += parseCurrency(v.valor_total || v.total || v.valor);
        calcLucroReal += parseCurrency(v.lucro || v.lucro_total);
      });

      setFaturamento(calcFaturamento);
      setLucroReal(calcLucroReal);
    }
  };

  // Botão seguro: Apaga só o relatório de vendas
  const zerarHistoricoVendas = async () => {
    const confirmar = window.confirm(
      "⚠️ Deseja zerar apenas os Relatórios de Venda?\n\nSeu ESTOQUE e PRODUTOS não serão apagados."
    );
    if (!confirmar) return;

    if (user) {
      const { error } = await supabase.from('vendas').delete().eq('user_id', user.id);
      if (error) {
        alert("Erro: " + error.message);
      } else {
        buscarDados(user.id);
        alert("✅ Histórico de vendas e relatórios zerados com sucesso!");
      }
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center text-[#009ee3] font-bold text-xl">
      Calculando dados...
    </div>
  );

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-[#111827] pt-12 pb-8 px-6 text-white rounded-b-[2rem] shadow-lg">
        <h1 className="text-3xl font-black mb-2">Painel de Controle 📊</h1>
        <p className="text-gray-400">Resumo financeiro do seu negócio</p>
      </div>
      
      <div className="px-6 mt-6 space-y-4">
        {/* Bloco de Vendas */}
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

        {/* Bloco de Estoque */}
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
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Link href="/vender" className="bg-[#009ee3] text-white p-4 rounded-2xl shadow-md flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform">
            <span className="text-xl">🛒</span> Vender
          </Link>
          <Link href="/estoque" className="bg-white text-gray-800 border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform">
            <span className="text-xl">📦</span> Estoque
          </Link>
        </div>

        <button 
          onClick={zerarHistoricoVendas}
          className="w-full mt-8 bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform"
        >
          <span>🗑️</span> Zerar Vendas e Relatórios
        </button>
      </div>
      
      <BottomNav />
    </div>
  );
}
