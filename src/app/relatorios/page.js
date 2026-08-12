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
          const produto = produtosData?.find(p => p.id === venda.produto_id);
          return { ...venda, nome_produto: produto ? produto.nome : 'Produto apagado' };
        });
        setVendas(vendasCompletas);
      }
    }
    setLoading(false);
  };

  const apagarVenda = async (id) => {
    if (confirm("Deseja apagar esta venda? O valor será removido do sistema.")) {
      const { error } = await supabase.from('vendas').delete().eq('id', id);
      if (!error) buscarRelatorios();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#111827] p-6 rounded-b-3xl text-white">
        <h1 className="text-2xl font-bold">Relatórios 📊</h1>
      </div>
      <div className="p-6 -mt-4">
        <h3 className="font-bold text-gray-800 mb-4 ml-1">Últimas Vendas</h3>
        {loading ? <p className="text-center text-gray-500">Carregando...</p> : (
          <div className="space-y-3">
            {vendas.map(venda => (
              <div key={venda.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">{venda.nome_produto}</p>
                  <p className="text-xs text-gray-400">{new Date(venda.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-black text-emerald-500">R$ {Number(venda.valor_total).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{venda.quantidade_vendida} unid.</p>
                  </div>
                  <button onClick={() => apagarVenda(venda.id)} className="text-red-500 text-xl ml-2">🗑️</button>
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
