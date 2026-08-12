'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Relatorios() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erroLocal, setErroLocal] = useState('');
  const [resumo, setResumo] = useState({ faturamento: 0, lucro: 0, itensVendidos: 0 });

  useEffect(() => {
    buscarRelatoriosSemErro();
  }, []);

  const buscarRelatoriosSemErro = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Busca APENAS as vendas (Isso evita o erro de relacionamento do banco)
      const { data: vendasData, error: erroVenda } = await supabase
        .from('vendas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (erroVenda) {
        setErroLocal('Erro ao puxar dados: ' + erroVenda.message);
        setLoading(false);
        return;
      }

      // 2. Busca os produtos separadamente para pegar os nomes
      const { data: produtosData } = await supabase
        .from('produtos')
        .select('id, nome')
        .eq('user_id', user.id);

      if (vendasData) {
        // Junta o nome do produto na venda aqui pelo Javascript!
        const vendasCompletas = vendasData.map(venda => {
          const produto = produtosData?.find(p => p.id === venda.produto_id);
          return {
            ...venda,
            nome_produto: produto ? produto.nome : 'Produto apagado do sistema'
          };
        });

        setVendas(vendasCompletas);

        // Calcula os totais das caixas
        setResumo({
          faturamento: vendasData.reduce((acc, v) => acc + (Number(v.valor_total) || 0), 0),
          lucro: vendasData.reduce((acc, v) => acc + (Number(v.lucro_realizado) || 0), 0),
          itensVendidos: vendasData.reduce((acc, v) => acc + (Number(v.quantidade_vendida) || 0), 0)
        });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* CABEÇALHO IDÊNTICO AO SEU PRINT */}
      <div className="bg-[#111827] p-6 shadow-sm rounded-b-3xl text-white">
        <h1 className="text-2xl font-bold">Estatísticas 📊</h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral do seu negócio</p>
      </div>
      
      <div className="p-6 -mt-4 space-y-6">
        
        {/* CAIXA DE FATURAMENTO TOTAL */}
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
          
          {erroLocal && <p className="text-red-500 font-bold text-sm mb-4">{erroLocal}</p>}

          {loading ? (
             <p className="text-center text-gray-500 text-sm">Carregando...</p>
          ) : vendas.length === 0 ? (
            <div className="text-center bg-white p-6 rounded-2xl border border-gray-200">
              <p className="text-gray-500 text-sm">Nenhuma venda registrada ainda.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendas.map(venda => (
                <div key={venda.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{venda.nome_produto}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(venda.created_at).toLocaleDateString('pt-BR')} às {new Date(venda.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-emerald-500">R$ {Number(venda.valor_total).toFixed(2)}</p>
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
