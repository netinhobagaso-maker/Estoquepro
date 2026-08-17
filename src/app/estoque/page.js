'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import BottomNav from '../../components/BottomNav';

export default function Estoque() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');

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

  const excluirProduto = async (id) => {
    if (window.confirm("Tem certeza que deseja excluir este produto do estoque?")) {
      await supabase.from('produtos').delete().eq('id', id);
      carregarEstoque();
    }
  };

  const formatarDinheiro = (valor) => {
    let numero = parseFloat(String(valor || 0).replace(',', '.')) || 0;
    return Number(numero.toFixed(2));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-[#111827] pt-8 pb-6 px-6 text-white rounded-b-[2rem]">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">📦 Meu Estoque</h1>
          <Link
            href="/novo-produto"
            className="bg-[#10b981] text-white px-4 py-2 rounded-xl text-xs font-bold"
          >
            + Novo
          </Link>
        </div>
        <input
          type="text"
          placeholder="Buscar no estoque..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-700 outline-none"
        />
      </div>

      <div className="px-6 mt-6 space-y-3">
        {produtos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📦</p>
            <p className="font-semibold">Nenhum produto cadastrado.</p>
            <Link
              href="/novo-produto"
              className="inline-block mt-4 bg-[#10b981] text-white px-6 py-3 rounded-xl font-bold text-sm"
            >
              Cadastrar Primeiro Produto
            </Link>
          </div>
        ) : (
          produtos
            .filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
            .map((produto) => (
              <div
                key={produto.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-gray-800">{produto.nome}</p>
                  <p className="text-xs text-gray-500">
                    Qtd: <strong className="text-gray-800">{produto.quantidade_estoque} unid.</strong>
                  </p>
                  <p className="text-xs text-emerald-600 font-bold mt-1">
                    Venda: R$ {formatarDinheiro(produto.preco_venda).toFixed(2)} | Lucro Un: R$ {formatarDinheiro(produto.lucro_unitario).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => excluirProduto(produto.id)}
                  className="p-2 text-red-400 hover:text-red-600 font-bold text-sm"
                >
                  🗑️
                </button>
              </div>
            ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
