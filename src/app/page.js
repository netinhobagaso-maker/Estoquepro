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
    // 🧠 LÓGICA DE SUPERMERCADO: Conversor inteligente que força qualquer texto ou vírgula a virar número para o cálculo não falhar
    const converterParaNumero = (valor) => {
      if (!valor) return 0;
      if (typeof valor === 'number') return valor;
      
      let texto = String(valor).replace(/[R$\s]/g, ''); // Remove 'R$' e espaços
      if (texto.includes(',')) {
        texto = texto.replace(/\./g, ''); // Remove o ponto de milhar se houver
        texto = texto.replace(',', '.');  // Troca a vírgula brasileira por ponto decimal
      }
      return Number(texto) || 0;
    };

    // 1. LER ESTOQUE E CALCULAR AUTOMATICAMENTE
    const { data: produtos } = await supabase
      .from('produtos')
      .select('*')
      .eq('user_id', userId);

    if (produtos) {
      let estoqueTotal = 0;
      let lucroEsp = 0;

      produtos.forEach(p => {
        // Puxa os dados ignorando erros de digitação de colunas
        const qtd = converterParaNumero(p.quantidade || p.qtd || p.estoque);
        const precoVenda = converterParaNumero(p.preco_venda || p.preco || p.valor);
        const precoCusto = converterParaNumero(p.preco_custo || p.custo);

        // Se o cliente não preencheu o preço de custo, o valor do estoque é baseado no preço de venda
        const valorBaseParaEstoque = precoCusto > 0 ? precoCusto : precoVenda;
        
        // Faz o cálculo automático invisível (Preço × Quantidade)
        estoqueTotal += (valorBaseParaEstoque * qtd);

        // Calcula o lucro que virá dessas vendas
        if (precoCusto > 0 && precoVenda > precoCusto) {
          lucroEsp += ((precoVenda - precoCusto) * qtd);
        } else {
          lucroEsp += (precoVenda * qtd);
        }
      });

      setValorEstoque(estoqueTotal);
      setLucroEsperado(lucroEsp);
    }

    // 2. LER VENDAS REAIS JÁ FEITAS
    const { data: vendas } = await supabase
      .from('vendas')
      .select('*')
      .eq('user_id', userId);

    if (vendas) {
      let fatTotal = 0;
      let lucroR = 0;

      vendas.forEach(v => {
        fatTotal += converterParaNumero(v.valor_total || v.total || v.valor);
        lucroR += converterParaNumero(v.lucro || v.lucro_total);
      });

      setFaturamento(fatTotal);
      setLucroReal(lucroR);
    }
  };

  // 🗑️ BOTÃO EXCLUSIVO PARA ZERAR VENDAS (MANTÉM ESTOQUE INTACTO)
  const zerarHistoricoVendas = async () => {
    const confirmar = window.confirm(
      "⚠️ ATENÇÃO: Deseja zerar seu histórico de VENDAS e RELATÓRIOS?\n\nNão se preocupe, seus produtos e estoque continuarão salvos!"
    );
    if (!confirmar) return;

    if (user) {
      const { error } = await supabase.from('vendas').delete().eq('user_id', user.id);

      if (error) {
        alert("Erro ao zerar relatórios: " + error.message);
      } else {
        buscarDados(user.id); // Atualiza os números da tela na mesma hora
        alert("✅ Histórico de Vendas zerado! Relatórios reiniciados.");
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
        {/* Métricas de VENDAS FEITAS */}
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

        {/* Métricas do ESTOQUE ATUAL */}
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
        
        {/* Botões Grandes */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Link href="/vender" className="bg-[#009ee3] text-white p-4 rounded-2xl shadow-md flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform">
            <span className="text-xl">🛒</span> Vender
          </Link>
          <Link href="/estoque" className="bg-white text-gray-800 border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform">
            <span className="text-xl">📦</span> Estoque
          </Link>
        </div>

        {/* O Botão de Limpar Relatórios */}
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
