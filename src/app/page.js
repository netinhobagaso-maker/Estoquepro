'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';

export default function Home() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [produtoModal, setProdutoModal] = useState(null);
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState('');

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('produtos').select('*').eq('user_id', user.id).order('nome');
      if (data) setProdutos(data);
    }
    setLoading(false);
  };

  const recarregarEstoque = async () => {
    if (!quantidadeAdicionar || Number(quantidadeAdicionar) <= 0) return alert("Digite uma quantidade válida.");
    const novaQtd = Number(produtoModal.quantidade_estoque) + Number(quantidadeAdicionar);
    const { error } = await supabase.from('produtos').update({ quantidade_estoque: novaQtd }).eq('id', produtoModal.id);
    if (!error) {
      alert("Estoque atualizado!");
      setProdutoModal(null);
      setQuantidadeAdicionar('');
      carregarProdutos();
    }
  };

  const produtosFiltrados = produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-[#111827] p-6 rounded-b-3xl text-white shadow-md">
        <h1 className="text-2xl font-bold mb-3">📦 EstoquePro</h1>
        <input type="text" placeholder="🔍 Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-700 text-sm focus:outline-none"/>
      </div>

      <div className="p-6 -mt-2">
        <div className="space-y-3">
          {produtosFiltrados.map(p => {
            const estoqueZerado = p.quantidade_estoque === 0;
            const estoqueBaixo = p.quantidade_estoque > 0 && p.quantidade_estoque <= 5;
            return (
              <div key={p.id} className={`bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center ${estoqueZerado ? 'border-red-500 bg-red-50' : estoqueBaixo ? 'border-orange-400 bg-orange-50' : 'border-gray-100'}`}>
                <div>
                  <h3 className="font-bold text-gray-800">{p.nome}</h3>
                  {estoqueZerado && <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full">🔴 ESGOTADO</span>}
                  {estoqueBaixo && <span className="text-[10px] font-black text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">⚠️ ESTOQUE BAIXO</span>}
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

      {produtoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">Repor {produtoModal.nome}</h3>
            <input type="number" placeholder="Quantidade a adicionar" value={quantidadeAdicionar} onChange={(e) => setQuantidadeAdicionar(e.target.value)} className="w-full p-3 border rounded-xl mb-4"/>
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
