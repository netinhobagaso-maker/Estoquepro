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
    // 1. Buscar Produtos e calcular Valor em Estoque e Lucro Esperado automaticamente
    const { data: produtos } = await supabase
      .from('produtos')
      .select('*')
      .eq('user_id', userId);

    if (produtos) {
      let estoqueTotal = 0;
      let lucroEsp = 0;

      produtos.forEach(p => {
        // Captura flexível de quantidade e preços
        const qtd = Number(p.quantidade ?? p.qtd ?? p.estoque ?? 0);
        const precoVenda = Number(p.preco_venda ?? p.preco ?? p.valor ?? 0);
        const precoCusto = Number(p.preco_custo ?? p.custo ?? 0);

        // Se o custo não foi cadastrado, considera o valor de venda para o total em estoque
        const valorUnitarioEstoque = precoCusto > 0 ? precoCusto : precoVenda;
        
        estoqueTotal += valorUnitarioEstoque * qtd;

        // Se houver preço de custo, calcula a margem exata; senão, estima com base na venda
        if (precoCusto > 0 && precoVenda > precoCusto) {
          lucroEsp += (precoVenda - precoCusto) * qtd;
        } else {
          lucroEsp += precoVenda * qtd;
        }
      });

      setValorEstoque(estoqueTotal);
      setLucroEsperado(lucroEsp);
    }

    // 2. Buscar Vendas e calcular Faturamento e Lucro Real
    const { data: vendas } = await supabase
      .from('vendas')
      .select('*')
      .eq('user_id', userId);

    if (vendas) {
      let fatTotal = 0;
      let lucroR = 0;

      vendas.forEach(v => {
        const valorVenda = Number(v.valor_total ?? v.total ?? v.valor ?? 0);
        const valorLucro = Number(v.lucro ?? v.lucro_total ?? 0);

        fatTotal += valorVenda;
        lucroR += valorLucro;
      });

      setFaturamento(fatTotal);
      setLucroReal(lucroR);
    }
  };

  // Botão alterado: ZERA APENAS AS VENDAS (Relatórios e Lucro Real), PRESERVANDO O ESTOQUE
  const zerarHistoricoVendas = async () => {
    const confirmar = window.confirm(
      "⚠️ Deseja zerar apenas o histórico de vendas e relatórios?\n\nSeus produtos e o estoque NÃO serão apagados."
    );
    if (!confirmar) return;

    if (user) {
      const { error } = await supabase.from('vendas').delete().eq('user_id', user.id);

      if (error) {
        alert("Erro ao zerar vendas: " + error.message);
      } else {
        buscarDados(user.id);
        alert("✅ Histórico de vendas zerado! Seu estoque continua intacto.");
      }
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-[#111827] flex items-center justify-center text-[#009ee3] font-bold text-xl">
      Carregando painel...
    </div>
  );

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
        {/* Vendas (Realizado) */}
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

        {/* Estoque (Projetado) */}
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
        
        {/* Ações Principais */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Link href="/vender" className="bg-[#009ee3] text-white p-4 rounded-2xl shadow-md flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform">
            <span className="text-xl">🛒</span> Vender
          </Link>
          <Link href="/estoque" className="bg-white text-gray-800 border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform">
            <span className="text-xl">📦</span> Estoque
          </Link>
        </div>

        {/* Botão de Zerar Relatório/Vendas */}
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
