'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [produtoModal, setProdutoModal] = useState(null);
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState('');

  // Estados para cálculos do painel
  const [totalValor, setTotalValor] = useState(0);
  const [qtdBaixoEstoque, setQtdBaixoEstoque] = useState(0);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('produtos').select('*').eq('user_id', user.id).order('nome');
      if (data) {
        setProdutos(data);
        // Calcular totais
        const valor = data.reduce((acc, p) => acc + (Number(p.preco_venda || 0) * p.quantidade_estoque), 0);
        const baixo = data.filter(p => p.quantidade_estoque > 0 && p.quantidade_estoque <= 5).length;
        setTotalValor(valor);
        setQtdBaixoEstoque(baixo);
      }
    }
    setLoading(false);
  };

  const recarregarEstoque = async () => {
    if (!quantidadeAdicionar || Number(quantidadeAdicionar) <= 0) return alert("Digite uma quantidade válida.");
    const novaQtd = Number(produtoModal.quantidade_estoque) + Number(quantidadeAdicionar);
    const { error } = await supabase.from('produtos').update({ quantidade_estoque: novaQtd }).eq('id', produtoModal.id);
    if (!error) {
      alert("Estoque atualizado com sucesso!");
      setProdutoModal(null);
      setQuantidadeAdicionar('');
      carregarProdutos();
    }
  };

  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* HEADER E RESUMO */}
      <div className="bg-[#111827] p-6 rounded-b-3xl text-white shadow-md">
        <h1 className="text-xl font-bold mb-4">EstoquePro 📦</h1>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 p-3 rounded-xl border border-gray-700">
            <p className="text-[10px] text-gray-400 uppercase">Valor em Estoque</p>
            <p className="text-lg font-black text-emerald-400">R$ {totalValor.toFixed(2)}</p>
          </div>
          <div className={`p-3 rounded-xl border ${qtdBaixoEstoque > 0 ? 'bg-orange-900 border-orange-700' : 'bg-gray-800 border-gray-700'}`}>
            <p className="text-[10px] text-gray-400 uppercase">Atenção (Baixo)</p>
            <p className="text-lg font-black text-white">{qtdBaixoEstoque} itens</p>
          </div>
        </div>
      </div>

      {/* BOTÕES DE ACESSO RÁPIDO */}
      <div className="px-6 -mt-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/venda')} className="bg-emerald-500 text-white font-bold p-3 rounded-xl shadow-lg active:scale-95">Nova Venda</button>
          <button onClick={() => router.push('/fiados')} className="bg-white text-gray-800 font-bold p-3 rounded-xl shadow-sm border border-gray-200 active:scale-95">Ver Fiados</button>
        </div>
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="px-6">
        <input 
          type="text" 
          placeholder="🔍 Buscar produto..." 
          value={busca} 
          onChange={(e) => setBusca(e.target.value)} 
          className="w-full p-3 mb-4 rounded-xl bg-white border border-gray-200 shadow-sm text-sm"
        />

        <div className="space-y-3">
          {produtosFiltrados.map(p => {
            const estoqueZerado = p.quantidade_estoque === 0;
            const estoqueBaixo = p.quantidade_estoque > 0 && p.quantidade_estoque <= 5;
            
            return (
              <div key={p.id} className={`bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center ${estoqueZerado ? 'border-red-500 bg-red-50' : estoqueBaixo ? 'border-orange-400 bg-orange-50' : 'border-gray-100'}`}>
                <div>
                  <h3 className="font-bold text-gray-800">{p.nome}</h3>
                  {estoqueZerado && <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full">🔴 ESGOTADO</span>}
                  {estoqueBaixo && <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">⚠️ BAIXO</span>}
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xl font-black ${estoqueZerado ? 'text-red-600' : 'text-gray-800'}`}>{p.quantidade_estoque}</span>
                  <button onClick={() => setProdutoModal(p)} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold active:scale-95">➕ Repor</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE REPOSIÇÃO */}
      {produtoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-lg mb-4">Repor {produtoModal.nome}</h3>
            <p className="text-sm text-gray-600 mb-4">Quantidade atual: {produtoModal.quantidade_estoque}</p>
            <input 
              type="number" 
              placeholder="Qtd para adicionar" 
              value={quantidadeAdicionar} 
              onChange={(e) => setQuantidadeAdicionar(e.target.value)} 
              className="w-full p-3 border rounded-xl mb-4 text-lg"
            />
            <div className="flex gap-2">
              <button onClick={recarregarEstoque} className="flex-1 bg-emerald-500 text-white font-bold p-3 rounded-xl">Confirmar</button>
              <button onClick={() => setProdutoModal(null)} className="flex-1 bg-gray-200 font-bold p-3 rounded-xl">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
