'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Relatorios() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarVendas();
  }, []);

  const carregarVendas = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('vendas').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setVendas(data);
    }
    setLoading(false);
  };

  // AQUI ESTÁ A CORREÇÃO DE CANCELAR VENDA E DEVOLVER ESTOQUE
  const cancelarVenda = async (venda) => {
    if (!confirm("Tem certeza que deseja cancelar esta venda? O estoque será devolvido.")) return;

    try {
      // 1. Devolver os itens para o estoque
      if (venda.itens && venda.itens.length > 0) {
        for (const item of venda.itens) {
          const { data: produto } = await supabase.from('produtos').select('quantidade_estoque').eq('id', item.produto_id).single();

          if (produto) {
            const estoqueDevolvido = Number(produto.quantidade_estoque) + Number(item.quantidade);
            await supabase.from('produtos').update({ quantidade_estoque: estoqueDevolvido }).eq('id', item.produto_id);
          }
        }
      }

      // 2. Apagar a venda do sistema
      const { error } = await supabase.from('vendas').delete().eq('id', venda.id);

      if (!error) {
        alert("Venda cancelada! Estoque e valores revertidos com sucesso.");
        carregarVendas();
      }
    } catch (erro) {
      console.error(erro);
      alert("Ocorreu um erro ao cancelar a venda.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#111827] pt-8 pb-8 px-6 rounded-b-[2rem] text-white shadow-md">
        <h1 className="text-2xl font-bold">📊 Relatórios de Vendas</h1>
      </div>

      <div className="px-6 mt-6 space-y-4">
        {loading ? <p>Carregando...</p> : (
          vendas.map(venda => (
            <div key={venda.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center border-b pb-3 mb-3">
                <div>
                  <p className="font-black text-emerald-600 text-xl">R$ {Number(venda.total).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{new Date(venda.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{venda.forma_pagamento}</span>
              </div>
              
              <div className="space-y-1 mb-4">
                {venda.itens && venda.itens.map((item, i) => (
                  <p key={i} className="text-sm text-gray-700 flex justify-between">
                    <span>{item.quantidade}x {item.nome}</span>
                    <span className="font-bold">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                  </p>
                ))}
              </div>

              <button onClick={() => cancelarVenda(venda)} className="w-full bg-red-50 text-red-500 font-bold p-3 rounded-xl text-sm border border-red-100 active:scale-95">
                ❌ Cancelar Venda e Devolver Estoque
              </button>
            </div>
          ))
        )}
        {vendas.length === 0 && !loading && (
          <p className="text-center text-gray-500 mt-10">Nenhuma venda registrada ainda.</p>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
