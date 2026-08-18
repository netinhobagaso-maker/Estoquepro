'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import BottomNav from '../../components/BottomNav';

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [produtoRepor, setProdutoRepor] = useState(null);
  const [qtdRepor, setQtdRepor] = useState('');

  useEffect(() => {
    carregarEstoque();
  }, []);

  const carregarEstoque = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('produtos')
      .select('*')
      .eq('user_id', user.id)
      .order('nome');

    if (data) setProdutos(data);
  };

  const confirmarReposicao = async () => {
    if (!qtdRepor || parseInt(qtdRepor) <= 0) return alert("Digite uma quantidade válida!");
    
    const novaQuantidade = produtoRepor.quantidade_estoque + parseInt(qtdRepor);
    
    const { error } = await supabase
      .from('produtos')
      .update({ quantidade_estoque: novaQuantidade })
      .eq('id', produtoRepor.id);

    if (!error) {
      alert("✅ Estoque atualizado com sucesso!");
      setProdutoRepor(null);
      setQtdRepor('');
      carregarEstoque();
    } else {
      alert("Erro ao repor: " + error.message);
    }
  };

  const excluirProduto = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir?")) {
      await supabase.from('produtos').delete().eq('id', id);
      carregarEstoque();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-[#111827] pt-8 pb-6 px-6 text-white rounded-b-[2rem]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">📦 Estoque</h1>
          <Link href="/novo-produto" className="bg-[#10b981] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">
            + Novo
          </Link>
        </div>
        <input 
          type="text" 
          placeholder="Buscar produto..." 
          value={busca} 
          onChange={(e) => setBusca(e.target.value)} 
          className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-700 outline-none focus:border-[#10b981]" 
        />
      </div>

      <div className="px-6 mt-6 space-y-3">
        {produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase())).map((produto) => (
          <div key={produto.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">{produto.nome}</p>
              <p className="text-xs text-gray-500">Qtd: <strong className="text-gray-800">{produto.quantidade_estoque} unid.</strong></p>
              <p className="text-xs text-emerald-600 font-bold mt-1">
                R$ {parseFloat(produto.preco_venda || 0).toFixed(2)}
              </p>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setProdutoRepor(produto)} className="px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold text-xs transition-colors">
                🔄 Repor
              </button>
              <button onClick={() => excluirProduto(produto.id)} className="px-3 py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl font-bold text-xs transition-colors">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {produtoRepor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl">
            <h3 className="font-black text-xl text-gray-800 mb-2">Repor {produtoRepor.nome}</h3>
            <p className="text-sm text-gray-500 mb-4">Quantas unidades chegaram?</p>
            
            <input 
              type="number" 
              placeholder="Ex: 10" 
              value={qtdRepor} 
              onChange={(e) => setQtdRepor(e.target.value)} 
              className="w-full p-4 rounded-xl border border-gray-200 text-xl font-bold text-center outline-none focus:border-[#10b981] mb-4" 
            />
            
            <div className="flex gap-3">
              <button onClick={() => {setProdutoRepor(null); setQtdRepor('');}} className="w-1/2 p-4 bg-gray-100 text-gray-600 rounded-2xl font-bold">Cancelar</button>
              <button onClick={confirmarReposicao} className="w-1/2 p-4 bg-[#10b981] text-white rounded-2xl font-bold">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
