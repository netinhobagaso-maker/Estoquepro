'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Relatorios() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarRelatorios();
  }, []);

  const buscarRelatorios = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: vendasData } = await supabase.from('vendas').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      const { data: produtosData } = await supabase.from('produtos').select('id, nome').eq('user_id', user.id);

      if (vendasData) {
        const vendasCompletas = vendasData.map(venda => {
          // Mantém compatibilidade com vendas antigas (1 item só)
          const produtoAntigo = produtosData?.find(p => p.id === venda.produto_id);
          return { ...venda, nome_produto: produtoAntigo ? produtoAntigo.nome : 'Produto apagado' };
        });
        setVendas(vendasCompletas);
      }
    }
    setLoading(false);
  };

  const apagarVenda = async (venda) => {
    if (confirm("Deseja cancelar esta venda? Os itens voltarão para o estoque.")) {
      
      // 1. Devolver os itens para o estoque
      if (venda.itens && venda.itens.length > 0) {
        for (const item of venda.itens) {
          const { data: prod } = await supabase.from('produtos').select('quantidade_estoque').eq('id', item.id).single();
          if (prod) {
            await supabase.from('produtos').update({ quantidade_estoque: prod.quantidade_estoque + item.quantidade }).eq('id', item.id);
          }
        }
      } else if (venda.produto_id) { // Caso seja uma venda antiga (antes do carrinho)
        const { data: prod } = await supabase.from('produtos').select('quantidade_estoque').eq('id', venda.produto_id).single();
        if (prod) {
          await supabase.from('produtos').update({ quantidade_estoque: prod.quantidade_estoque + venda.quantidade_vendida }).eq('id', venda.produto_id);
        }
      }

      // 2. Apagar o registro da venda
      const { error } = await supabase.from('vendas').delete().eq('id', venda.id);
      if (!error) {
        alert("Venda cancelada e estoque restaurado!");
        buscarRelatorios();
      } else {
        alert("Erro ao cancelar: " + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#111827] p-6 rounded-b-3xl text-white shadow-md">
        <h1 className="text-2xl font-bold">Relatórios 📊</h1>
      </div>
      <div className="p-6 -mt-4">
        <h3 className="font-bold text-gray-800 mb-4 ml-1">Últimas Vendas</h3>
        {loading ? <p className="text-center text-gray-500">Carregando...</p> : (
          <div className="space-y-3">
            {vendas.map(venda => (
              <div key={venda.id} className="bg-white p-4 rounded-xl border flex flex-col gap-2 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    {/* Mostra itens do carrinho OU o produto antigo */}
                    {venda.itens && venda.itens.length > 0 ? (
                      <div className="mb-1">
                        <p className="font-bold text-gray-800 text-sm">Venda Múltipla:</p>
                        {venda.itens.map((it, idx) => (
                          <p key={idx} className="text-xs text-gray-600">- {it.quantidade}x {it.nome}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="font-bold text-gray-800">{venda.nome_produto} <span className="text-xs font-normal text-gray-500">({venda.quantidade_vendida}x)</span></p>
                    )}
                    <p className="text-[10px] text-gray-400">{new Date(venda.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-emerald-500">R$ {Number(venda.valor_total).toFixed(2)}</p>
                    <button onClick={() => apagarVenda(venda)} className="bg-red-50 text-red-500 p-2 rounded-lg text-lg active:scale-95">🗑️</button>
                  </div>
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
