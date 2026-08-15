'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [produtos, setProdutos] = useState([]);
  const [produtoModal, setProdutoModal] = useState(null);
  const [quantidadeAdicionar, setQuantidadeAdicionar] = useState('');
  // Estados dos resumos financeiros originais
  const [faturamento, setFaturamento] = useState(470.00); 
  const [lucro, setLucro] = useState(128.34);
  const [estoqueTotal, setEstoqueTotal] = useState(516.30);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('produtos').select('*').eq('user_id', user.id).order('nome');
      if (data) setProdutos(data);
    }
  };

  const recarregarEstoque = async () => {
    if (!quantidadeAdicionar || Number(quantidadeAdicionar) <= 0) return alert("Qtd inválida.");
    const novaQtd = Number(produtoModal.quantidade_estoque) + Number(quantidadeAdicionar);
    await supabase.from('produtos').update({ quantidade_estoque: novaQtd }).eq('id', produtoModal.id);
    setProdutoModal(null);
    setQuantidadeAdicionar('');
    carregarProdutos();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* HEADER ORIGINAL */}
      <div className="bg-[#111827] p-6 rounded-b-3xl text-white shadow-md">
        <h1 className="text-2xl font-bold flex items-center gap-2">Meu Negócio 🏪</h1>
      </div>

      {/* CARDS FINANCEIROS ORIGINAIS */}
      <div className="px-6 -mt-6 space-y-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <p className="text-sm text-gray-500">Faturamento</p>
          <h2 className="text-3xl font-black text-emerald-500">R$ {faturamento.toFixed(2)}</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border">
            <p className="text-xs text-gray-500">Lucro</p>
            <h2 className="text-xl font-bold text-gray-800">R$ {lucro.toFixed(2)}</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border">
            <p className="text-xs text-gray-500">Estoque</p>
            <h2 className="text-xl font-bold text-gray-800">R$ {estoqueTotal.toFixed(2)}</h2>
          </div>
        </div>

        {/* ACESSO RÁPIDO ORIGINAL */}
        <h3 className="font-bold text-gray-800 pt-2">Acesso Rápido</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => router.push('/venda')} className="bg-emerald-500 text-white p-4 rounded-2xl font-bold shadow-md">💰 Vender</button>
          <button onClick={() => router.push('/novo-produto')} className="bg-white p-4 rounded-2xl font-bold shadow-sm border border-gray-100">📦 Adicionar</button>
          <button onClick={() => router.push('/fiados')} className="bg-white p-4 rounded-2xl font-bold shadow-sm border border-gray-100">📝 Fiados</button>
          <button onClick={() => router.push('/relatorio')} className="bg-white p-4 rounded-2xl font-bold shadow-sm border border-gray-100">📊 Relatórios</button>
        </div>

        {/* LISTA DE ESTOQUE COM AVISO DE BAIXO */}
        <h3 className="font-bold text-gray-800 pt-2">Estoque</h3>
        <div className="space-y-3">
          {produtos.map(p => {
            const baixo = p.quantidade_estoque <= 5;
            return (
              <div key={p.id} className={`bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center ${baixo ? 'border-orange-400' : ''}`}>
                <div>
                  <p className="font-bold">{p.nome}</p>
                  <p className="text-xs text-gray-500">Qtd: {p.quantidade_estoque} {baixo && <span className="text-orange-600 font-bold">⚠️ BAIXO</span>}</p>
                </div>
                <button onClick={() => setProdutoModal(p)} className="bg-blue-500 text-white px-3 py-1 rounded-lg text-xs font-bold">+ Repor</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL DE REPOSIÇÃO */}
      {produtoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
            <h3 className="font-bold mb-4">Repor {produtoModal.nome}</h3>
            <input type="number" value={quantidadeAdicionar} onChange={e => setQuantidadeAdicionar(e.target.value)} className="w-full p-3 border rounded-xl mb-4" placeholder="Qtd" />
            <div className="flex gap-2">
              <button onClick={recarregarEstoque} className="flex-1 bg-emerald-500 text-white p-3 rounded-xl font-bold">Confirmar</button>
              <button onClick={() => setProdutoModal(null)} className="flex-1 bg-gray-200 p-3 rounded-xl font-bold">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
