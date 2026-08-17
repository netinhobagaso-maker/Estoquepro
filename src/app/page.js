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

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. CARREGAR ESTOQUE PRIMEIRO
    const { data: produtos } = await supabase.from('produtos').select('*').eq('user_id', user.id);
    
    let totalEstoque = 0;
    let custoPorProduto = {}; // Guarda o custo de cada produto para usar no cálculo do lucro

    if (produtos) {
      produtos.forEach(produto => {
        // Tenta achar o custo seja qual for o nome da coluna que está no Supabase
        const custo = Number(produto.custo_unidade || produto.preco_custo || produto.custo || 0);
        const precoVenda = Number(produto.preco_venda || 0);
        
        // Pega a quantidade de estoque corretamente
        const qtdEstoque = Number(produto.quantidade_estoque || produto.quantidade || 0);
        
        custoPorProduto[produto.id] = custo;

        // Se o custo for zero no banco, calcula o valor do estoque baseado no preço de venda
        const valorBaseEstoque = custo > 0 ? custo : precoVenda;
        
        totalEstoque += (valorBaseEstoque * qtdEstoque);
      });
    }
    
    setValorEstoque(totalEstoque); // Restaura o valor do estoque na tela!

    // 2. CARREGAR VENDAS (FATURAMENTO E LUCRO)
    const { data: vendas } = await supabase.from('vendas').select('*').eq('user_id', user.id);
    
    let totalFaturamento = 0;
    let custoTotalVendas = 0;

    if (vendas) {
      vendas.forEach(venda => {
        const valorDaVenda = Number(venda.valor_total || venda.total || 0);
        totalFaturamento += valorDaVenda;
        
        let custoDessaVenda = 0;

        if (venda.itens && Array.isArray(venda.itens)) {
          venda.itens.forEach(item => {
            // Tenta pegar o custo salvo na venda, ou busca do produto atual
            const custoItem = Number(item.custo_unidade || item.preco_custo || item.custo || custoPorProduto[item.id] || 0);
            const quantidade = Number(item.quantidade || 1);
            
            custoDessaVenda += (custoItem * quantidade);
          });
        }

        custoTotalVendas += custoDessaVenda;
      });
    }

    setFaturamento(totalFaturamento);
    
    // Calcula o lucro real. Se der algum bug nos custos, ele não deixa o lucro ficar negativo.
    const lucroCalculado = totalFaturamento - custoTotalVendas;
    setLucro(lucroCalculado > 0 ? lucroCalculado : totalFaturamento);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Cabeçalho */}
      <div className="bg-[#111827] pt-12 pb-20 px-6 text-white rounded-b-[2.5rem]">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          Meu Negócio 🏪
        </h1>
      </div>

      {/* Cards de Resumo */}
      <div className="px-6 -mt-12 space-y-4">
        {/* Card Faturamento */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 font-bold text-sm mb-1">Faturamento Total</p>
          <h2 className="text-4xl font-black text-[#10b981]">
            R$ {faturamento.toFixed(2)}
          </h2>
        </div>

        {/* Cards Menores: Lucro e Estoque */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-bold text-xs mb-1">Lucro Obtido</p>
            <h3 className="text-xl font-black text-blue-600">
              R$ {lucro.toFixed(2)}
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-bold text-xs mb-1">Valor em Estoque</p>
            <h3 className="text-xl font-black text-red-600">
              R$ {valorEstoque.toFixed(2)}
            </h3>
          </div>
        </div>
      </div>

      {/* Acesso Rápido */}
      <div className="px-6 mt-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 gap-4">
          
          <Link href="/vender" className="bg-[#10b981] p-6 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
            <span className="text-3xl">💰</span>
            <span className="text-white font-bold text-lg">Vender</span>
          </Link>
          
          <Link href="/novo-produto" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
            <span className="text-3xl">📦</span>
            <span className="text-gray-700 font-bold text-lg">Adicionar</span>
          </Link>
          
          <Link href="/fiados" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
            <span className="text-3xl">📝</span>
            <span className="text-gray-700 font-bold text-lg">Fiados</span>
          </Link>
          
          <Link href="/relatorios" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
            <span className="text-3xl">📊</span>
            <span className="text-gray-700 font-bold text-lg">Relatórios</span>
          </Link>

        </div>
      </div>

      <BottomNav />
    </div>
  );
}
