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
    const carregarDados = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authData?.user) {
          router.push('/login');
          return;
        }
        
        setUser(authData.user);

        // Busca todos os dados sem filtrar colunas para evitar erros de "coluna não encontrada"
        const { data: produtos } = await supabase.from('produtos').select('*').eq('user_id', authData.user.id);
        const { data: vendas } = await supabase.from('vendas').select('*').eq('user_id', authData.user.id);

        // Função segura para conversão de números
        const pegarNumero = (valor) => {
          const num = Number(valor);
          return isNaN(num) ? 0 : num;
        };

        // 1. CÁLCULO DE ESTOQUE E LUCRO ESPERADO
        if (produtos && produtos.length > 0) {
          let calcValorEstoque = 0;
          let calcLucroEsperado = 0;

          produtos.forEach(p => {
            const qtd = pegarNumero(p.quantidade || p.qtd);
            const vVenda = pegarNumero(p.preco_venda || p.preco);
            const vCusto = pegarNumero(p.preco_custo || p.custo);

            calcValorEstoque += (vCusto * qtd);
            calcLucroEsperado += ((vVenda - vCusto) * qtd);
          });

          setValorEstoque(calcValorEstoque);
          setLucroEsperado(calcLucroEsperado);
        }

        // 2. CÁLCULO DE VENDAS E LUCRO REAL (Usando as colunas identificadas nos seus prints)
        if (vendas && vendas.length > 0) {
          let calcFaturamento = 0;
          let calcLucroReal = 0;

          vendas.forEach(v => {
            calcFaturamento += pegarNumero(v.valor_total || v.total);
            calcLucroReal += pegarNumero(v.total_lucro || v.lucro_realizado || v.lucro);
          });

          setFaturamento(calcFaturamento);
          setLucroReal(calcLucroReal);
        }
      } catch (error) {
        console.error("Erro ao carregar os dados:", error);
      }
    };

    carregarDados();
  }, [router]);

  // Formatação de moeda segura
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(valor || 0);
  };

  const zerarVendas = async () => {
    const confirmar = window.confirm("⚠️ Tem certeza que deseja zerar os relatórios de vendas?\n\nIsso não afetará seus produtos no estoque.");
    if (!confirmar) return;

    if (user) {
      const { error } = await supabase.from('vendas').delete().eq('user_id', user.id);
      if (!error) {
        setFaturamento(0);
        setLucroReal(0);
        alert("✅ Relatórios zerados com sucesso!");
      } else {
        alert("Erro ao zerar vendas: " + error.message);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center text-[#009ee3] font-bold text-xl">
        Carregando painel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-[#111827] pt-12 pb-8 px-6 text-white rounded-b-[2rem] shadow-lg">
        <h1 className="text-3xl font-black mb-2">Painel de Controle 📊</h1>
        <p className="text-gray-400 text-sm">Resumo financeiro do seu negócio</p>
      </div>
      
      <div className="px-6 mt-6 space-y-4">
        {/* VENDAS */}
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

        {/* ESTOQUE */}
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
        
        {/* BOTÕES DE AÇÃO */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Link href="/vender" className="bg-[#009ee3] text-white p-4 rounded-2xl shadow-md flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform">
            <span className="text-xl">🛒</span> Vender
          </Link>
          <Link href="/estoque" className="bg-white text-gray-800 border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform">
            <span className="text-xl">📦</span> Estoque
          </Link>
        </div>

        {/* BOTÃO DE ZERAR */}
        <button 
          onClick={zerarVendas} 
          className="w-full mt-8 bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform"
        >
          <span>🗑️</span> Zerar Vendas e Relatórios
        </button>
      </div>
      
      <BottomNav />
    </div>
  );
}
