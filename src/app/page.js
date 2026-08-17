'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';

export default function Dashboard() {
  const [faturamento, setFaturamento] = useState(0);
  const [lucro, setLucro] = useState(0);
  const [valorEstoque, setValorEstoque] = useState(0);
  const [listaProdutos, setListaProdutos] = useState([]);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. CARREGAR PRODUTOS E MAPEAR CUSTOS POR ID E POR NOME
    const { data: produtos } = await supabase.from('produtos').select('*').eq('user_id', user.id).order('nome');
    
    let totalEstoque = 0;
    let custoPorId = {};
    let custoPorNome = {};

    if (produtos) {
      setListaProdutos(produtos); 
      
      produtos.forEach(produto => {
        // Tenta pegar o custo unitário direto
        let custoUnitario = Number(produto.custo_unidade || produto.preco_custo || produto.custo || produto.valor_custo || 0);

        // Se não tiver, calcula com base no Gasto Total / Unidades (Ex: 35 / 5 = 7.00)
        if (custoUnitario === 0) {
          const gastoTotal = Number(produto.gasto_total || produto.valor_gasto || produto.total_gasto || produto.custo_total || 0);
          const qtdCaixas = Number(produto.qtd_caixas || produto.quantidade_caixas || produto.caixas || 1);
          const unidadesNaCaixa = Number(produto.unidades_caixa || produto.unidades_por_caixa || produto.unidades || produto.quantidade_por_caixa || 1);
          
          const totalUnidades = qtdCaixas * unidadesNaCaixa;
          if (gastoTotal > 0 && totalUnidades > 0) {
            custoUnitario = gastoTotal / totalUnidades;
          }
        }

        const precoVenda = Number(produto.preco_venda || produto.preco || 0);
        const qtdEstoque = Number(produto.quantidade_estoque || produto.quantidade || 0);
        
        if (produto.id) custoPorId[produto.id] = custoUnitario;
        if (produto.nome) custoPorNome[produto.nome.trim().toLowerCase()] = custoUnitario;
        
        const valorBaseEstoque = custoUnitario > 0 ? custoUnitario : precoVenda;
        totalEstoque += (valorBaseEstoque * qtdEstoque);
      });
    }
    
    setValorEstoque(totalEstoque); 

    // 2. CARREGAR VENDAS E CALCULAR O LUCRO REAL COM SEGURANÇA MÁXIMA
    const { data: vendas } = await supabase.from('vendas').select('*').eq('user_id', user.id);
    
    let totalFat = 0;
    let totalCustoVendas = 0;

    if (vendas) {
      vendas.forEach(venda => {
        totalFat += Number(venda.valor_total || venda.total || 0);
        
        if (venda.itens && Array.isArray(venda.itens)) {
          venda.itens.forEach(item => {
            let custoItem = Number(item.custo_unidade || item.preco_custo || item.custo || 0);
            
            // Garantia dupla: se faltar no item, busca no mapa de produtos por ID ou por Nome
            if (custoItem === 0) {
              if (item.id && custoPorId[item.id]) {
                custoItem = custoPorId[item.id];
              } else if (item.nome) {
                custoItem = custoPorNome[item.nome.trim().toLowerCase()] || 0;
              }
            }

            const qtdVendida = Number(item.quantidade || item.qtd || 1);
            totalCustoVendas += (custoItem * qtdVendida);
          });
        }
      });
    }

    setFaturamento(totalFat);
    
    // Lucro Real = Faturamento - Custo de fábrica dos produtos vendidos
    const lucroCalculado = totalFat - totalCustoVendas;
    setLucro(lucroCalculado >= 0 ? lucroCalculado : 0);
  };

  const apagarProduto = async (id) => {
    const confirmar = window.confirm("Tem certeza que deseja apagar este produto?");
    if (confirmar) {
      await supabase.from('produtos').delete().eq('id', id);
      carregarDados();
    }
  };

  const reporEstoque = async (produto) => {
    const qtd = window.prompt(`Quantas unidades de "${produto.nome}" você quer adicionar ao estoque?`);
    if (qtd && !isNaN(qtd) && Number(qtd) > 0) {
      const novaQtd = Number(produto.quantidade_estoque || produto.quantidade || 0) + Number(qtd);
      await supabase.from('produtos').update({ quantidade_estoque: novaQtd }).eq('id', produto.id);
      carregarDados();
    }
  };

  const zerarVendas = async () => {
    const confirmar = window.confirm("⚠️ ATENÇÃO: Deseja apagar TODAS as vendas para reiniciar o faturamento e o lucro com os custos corretos?");
    if (confirmar) {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('vendas').delete().eq('user_id', user.id);
      if (!error) {
        alert("✅ Histórico de vendas zerado com sucesso!");
        carregarDados();
      } else {
        alert("Erro: " + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
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

      {/* Gerenciar Estoque */}
      <div className="px-6 mt-10">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Gerenciar Estoque</h3>
        <div className="space-y-3">
          {listaProdutos.map((produto) => (
            <div key={produto.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-800 text-[15px]">{produto.nome}</p>
                <p className="text-xs text-gray-500 mt-1">Estoque atual: <span className="font-black text-[#10b981] text-sm">{produto.quantidade_estoque}</span></p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => reporEstoque(produto)} 
                  className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-xl active:scale-90"
                >
                  +
                </button>
                <button 
                  onClick={() => apagarProduto(produto.id)} 
                  className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold text-lg active:scale-90"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
          {listaProdutos.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">Você ainda não possui produtos no estoque.</p>
          )}
        </div>
      </div>

      {/* Botão de Zerar Vendas */}
      <div className="px-6 mt-10 mb-4">
        <button 
          onClick={zerarVendas}
          className="w-full bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform"
        >
          🗑️ Zerar Faturamento e Vendas
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
