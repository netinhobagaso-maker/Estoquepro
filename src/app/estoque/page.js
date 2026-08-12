'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';
import Link from 'next/link';

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    buscarEstoque();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-6 shadow-sm flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Seu Estoque 🏷️</h1>
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
                  <p className="text-sm text-gray-500">Venda: R$ {produto.preco_venda.toFixed(2)}</p>
                  <p className="text-xs text-gray-400 mt-1">Custo: R$ {produto.custo_aquisicao.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${produto.quantidade_estoque <= 5 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {produto.quantidade_estoque}
                  </span>
                  <p className="text-xs text-gray-500 uppercase font-bold">Unid.</p>
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
