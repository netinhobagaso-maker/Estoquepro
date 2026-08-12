'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';
import Link from 'next/link';

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  const buscarEstoque = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('produtos')
        .select('*')
        .eq('user_id', user.id)
        .order('nome', { ascending: true });
      if (data) setProdutos(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    buscarEstoque();
  }, []);

  // FUNÇÃO PARA APAGAR O PRODUTO
  const apagarProduto = async (id, nome) => {
    const confirmou = confirm(`Tem certeza que deseja apagar o produto "${nome}" do estoque?`);
    if (!confirmou) return;

    const { error } = await supabase
      .from('produtos')
      .delete()
      .eq('id', id);

    if (error) {
      alert('Erro ao apagar produto: ' + error.message);
    } else {
      // Remove o item apagado da lista na tela
      setProdutos(produtos.filter(p => p.id !== id));
      alert('Produto apagado com sucesso!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-6 shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Seu Estoque 🏷️</h1>
        <Link href="/produtos/novo" className="bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl text-sm">
          + Novo
        </Link>
      </div>
      
      <div className="p-6">
        {loading ? (
          <p className="text-center text-gray-500 mt-10">Carregando produtos...</p>
        ) : produtos.length === 0 ? (
          <div className="text-center mt-10 space-y-4">
            <p className="text-gray-500">Seu estoque está vazio.</p>
            <Link href="/produtos/novo" className="inline-block bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl">
              Adicionar Primeiro Produto
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {produtos.map(produto => (
              <div key={produto.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{produto.nome}</h3>
                  <p className="text-sm text-gray-500">Venda: R$ {(produto.preco_venda || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">Custo: R$ {(produto.custo_aquisicao || 0).toFixed(2)}</p>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <div>
                    <span className={`text-2xl font-black ${produto.quantidade_estoque <= 5 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {produto.quantidade_estoque}
                    </span>
                    <span className="text-xs text-gray-500 uppercase font-bold ml-1">un</span>
                  </div>

                  {/* BOTÃO DE APAGAR */}
                  <button 
                    onClick={() => apagarProduto(produto.id, produto.nome)}
                    className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold py-1 px-3 rounded-lg active:scale-95 transition-all"
                  >
                    🗑️ Apagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
