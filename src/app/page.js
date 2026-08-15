'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [produtoModal, setProdutoModal] = useState(null);
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState('');
  
  const [faturamento, setFaturamento] = useState(0);
  const [lucro, setLucro] = useState(0);
  const [estoqueTotal, setEstoqueTotal] = useState(0);

  useEffect(() => {
    carregarDadosDinamicos();
  }, []);

  const carregarDadosDinamicos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Carrega Produtos
      const { data: prodData } = await supabase.from('produtos').select('*').eq('user_id', user.id).order('nome');
      
      const custosProdutos = {};
      let valorEstoque = 0;

      if (prodData) {
        setProdutos(prodData);
        prodData.forEach(p => {
          custosProdutos[p.id] = Number(p.preco_custo || p.custo || 0);
          valorEstoque += Number(p.preco_venda || 0) * Number(p.quantidade_estoque || 0);
        });
        setEstoqueTotal(valorEstoque);
      }

      // 2. Carrega Vendas contornando o erro de NaN
      const { data: vendaData } = await supabase.from('vendas').select('*').eq('user_id', user.id);
      
      if (vendaData) {
        let totalFat = 0;
        let lucroRealVendas = 0;

        vendaData.forEach(v => {
          const valorDaVenda = Number(v.total || v.valor_total || 0);
          
          // Se o valor não for um erro NaN, ele soma no faturamento
          if (!isNaN(valorDaVenda)) {
            totalFat += valorDaVenda;
          }

          if (v.itens && Array.isArray(v.itens)) {
            v.itens.forEach(item => {
              const precoVendaItem = Number(item.preco_venda || item.preco || 0);
              const qtdItem = Number(item.quantidade || 1);
              
              // Busca o ID correto para achar o custo
              const idDoProduto = item.produto_id || item.id;
              const custoUnitario = custosProdutos[idDoProduto] !== undefined ? custosProdutos[idDoProduto] : Number(item.custo || 0);
              
              // Se os números estiverem certinhos, ele calcula o lucro daquela venda
              if (!isNaN(precoVendaItem) && !isNaN(custoUnitario)) {
                lucroRealVendas += (precoVendaItem - custoUnitario) * qtdItem;
              }
            });
          }
        });

        setFaturamento(totalFat);
        setLucro(lucroRealVendas);
      }
    }
    setLoading(false);
  };

  const recarregarEstoque = async () => {
    if (!quantidadeAdicionar || Number(quantidadeAdicionar) <= 0) return alert("Digite uma quantidade válida.");
    
    const novaQtd = Number(produtoModal.quantidade_estoque) + Number(quantidadeAdicionar);
    const { error } = await supabase.from('produtos')
      .update({ quantidade_estoque: novaQtd })
      .eq('id', produtoModal.id);
      
    if (!error) {
      alert("Estoque atualizado com sucesso!");
      setProdutoModal(null);
      setQuantidadeAdicionar('');
      carregarDadosDinamicos();
    }
  };

  const apagarProduto = async (id) => {
    if (confirm("Deseja apagar este produto?")) {
      await supabase.from('produtos').delete().eq('id', id);
      carregarDadosDinamicos();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#111827] pt-8 pb-14 px-6 rounded-b-[2rem]">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2">
          Meu Negócio 🏪
        </h1>
      </div>

      <div className="-mt-10 px-6 space-y-4">
        <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100">
          <p className="text-sm text-gray-500 font-bold mb-1">Faturamento Total</p>
          <h2 className="text-4xl font-black text-[#10b981]">R$ {faturamento.toFixed(2)}</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
            <p className="text-[11px] text-gray-500 font-bold mb-1">Lucro Obtido (Vendas)</p>
            <h2 className="text-xl font-black text-blue-600">R$ {lucro.toFixed(2)}</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
            <p className="text-[11px] text-gray-500 font-bold mb-1">Valor em Estoque</p>
            <h2 className="text-xl font-black text-red-500">R$ {estoqueTotal.toFixed(2)}</h2>
          </div>
        </div>
      </div>

      <div className="px-6 mt-8">
        <h3 className="font-bold text-gray-800 text-lg mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => router.push('/venda')} className="bg-[#10b981] flex flex-col items-center justify-center p-6 rounded-2xl shadow-md active:scale-95 transition-transform">
            <span className="text-3xl mb-2">💰</span>
            <span className="text-white font-bold">Vender</span>
          </button>
          
          <button onClick={() => router.push('/produtos/novo')} className="bg-white flex flex-col items-center justify-center p-6 rounded-2xl shadow-md border border-gray-100 active:scale-95 transition-transform">
            <span className="text-3xl mb-2">📦</span>
            <span className="text-gray-800 font-bold">Adicionar</span>
          </button>
          
          <button onClick={() => router.push('/fiados')} className="bg-white flex flex-col items-center justify-center p-6 rounded-2xl shadow-md border border-gray-100 active:scale-95 transition-transform">
            <span className="text-3xl mb-2">📝</span>
            <span className="text-gray-800 font-bold">Fiados</span>
          </button>
          
          <button onClick={() => router.push('/relatorio')} className="bg-white flex flex-col items-center justify-center p-6 rounded-2xl shadow-md border border-gray-100 active:scale-95 transition-transform">
            <span className="text-3xl mb-2">📊</span>
            <span className="text-gray-800 font-bold">Relatórios</span>
          </button>
        </div>
      </div>

      <div className="px-6 mt-8">
        <h3 className="font-bold text-gray-800 text-lg mb-4">Estoque</h3>
        
        {loading ? (
           <p className="text-gray-500 text-sm">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {produtos.map(p => {
              const esgotado = p.quantidade_estoque === 0;
              const baixo = p.quantidade_estoque > 0 && p.quantidade_estoque <= 5;
              
              return (
                <div key={p.id} className={`p-4 rounded-2xl shadow-sm border flex justify-between items-center ${esgotado ? 'bg-red-50 border-red-300' : baixo ? 'bg-orange-50 border-orange-300' : 'bg-white border-gray-100'}`}>
                  <div>
                    <h4 className="font-bold text-gray-800 text-[15px]">{p.nome}</h4>
                    <p className={`text-[12px] mt-0.5 font-bold ${esgotado ? 'text-red-600' : baixo ? 'text-orange-600' : 'text-gray-500'}`}>
                      Qtd: {p.quantidade_estoque} 
                      {esgotado && <span className="ml-2 uppercase bg-red-200 px-2 py-0.5 rounded text-[10px]">🔴 Esgotado</span>}
                      {baixo && <span className="ml-2 uppercase bg-orange-200 px-2 py-0.5 rounded text-[10px]">⚠️ Baixo</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#10b981] font-bold text-[15px]">R$ {Number(p.preco_venda).toFixed(2)}</span>
                    <button onClick={() => setProdutoModal(p)} className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 shadow-sm">
                      + Repor
                    </button>
                    <button onClick={() => apagarProduto(p.id)} className="text-gray-400 text-lg active:scale-90 ml-1">🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {produtoModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-black text-xl mb-1 text-gray-800">Repor Estoque</h3>
            <p className="text-sm text-gray-500 mb-5">Produto: <span className="font-bold text-gray-800">{produtoModal.nome}</span> (Atual: {produtoModal.quantidade_estoque})</p>
            
            <input 
              type="number" 
              placeholder="Quantidade a adicionar..." 
              value={quantidadeAdicionar} 
              onChange={(e) => setQuantidadeAdicionar(e.target.value)} 
              className="w-full p-4 border-2 border-gray-100 rounded-xl mb-6 text-lg bg-gray-50 focus:outline-none focus:border-[#10b981]"
            />
            
            <div className="flex gap-2">
              <button onClick={() => setProdutoModal(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold p-4 rounded-xl active:scale-95">
                Cancelar
              </button>
              <button onClick={recarregarEstoque} className="flex-1 bg-[#10b981] text-white font-black p-4 rounded-xl active:scale-95 shadow-md">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
