'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Relatorios() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState({ faturamento: 0, lucro: 0, itensVendidos: 0 });

  useEffect(() => {
    buscarRelatorios();
  }, []);

  const buscarRelatorios = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          id,
          quantidade_vendida,
          valor_total,
          lucro_realizado,
          created_at,
          produtos (nome)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setVendas(data);

        const totalFaturamento = data.reduce((acc, v) => acc + (v.valor_total || 0), 0);
        const totalLucro = data.reduce((acc, v) => acc + (v.lucro_realizado || 0), 0);
        const totalItens = data.reduce((acc, v) => acc + (v.quantidade_vendida || 0), 0);

        setResumo({
          faturamento: totalFaturamento,
          lucro: totalLucro,
          itensVendidos: totalItens
        });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gray-900 p-6 shadow-sm rounded-b-3xl text-white">
        <h1 className="text-2xl font-bold">Estatísticas 📊</h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral do seu negócio</p>
      </div>
      
      <div className="p-6 -mt-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 col-span-2">
            <p className="text-xs text-gray-500 font-bold uppercase">Faturamento Total</p>
            <h2 className="text-3xl font-black text-emerald-500 mt-1">R$ {resumo.faturamento.toFixed(2)}</h2>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 font-bold uppercase">Lucro Livre</p>
            <h3 className="text-xl font-black text-blue-500 mt-1">R$ {resumo.lucro.toFixed(2)}</h3>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100">
            <p className="text-xs text-gray-500 font-bold uppercase">Itens Vendidos</p>
            <h3 className="text-xl font-black text-gray-800 mt-1">{resumo.itensVendidos} un</h3>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-800 mb-4 ml-1">Últimas Vendas</h3>
          {loading ? (
             <p className="text-center text-gray-500 text-sm">Carregando dados...</p>
          ) : vendas.length === 0 ? (
            <div className="text-center bg-white p-6 rounded-2xl border border-gray-200">
              <p className="text-gray-500 text-sm">Nenhuma venda registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendas.map(venda => (
                <div key={venda.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{venda.produtos?.nome || 'Produto'}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(venda.created_at).toLocaleDateString('pt-BR')} às {new Date(venda.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-500">R$ {(venda.valor_total || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{venda.quantidade_vendida}x unid.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
