'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import BottomNav from '../components/BottomNav';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Valores estáticos por enquanto, igual estava na sua tela
  const faturamento = 470.00;
  const lucro = 128.34;
  const estoqueTotal = 516.30;

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

  const apagarProduto = async (id) => {
    if (confirm("Deseja apagar este produto?")) {
      await supabase.from('produtos').delete().eq('id', id);
      carregarProdutos();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* CABEÇALHO AZUL ESCURO */}
      <div className="bg-[#111827] pt-8 pb-14 px-6 rounded-b-[2rem]">
        <h1 className="text-white text-2xl font-bold flex items-center gap-2">
          Meu Negócio 🏪
        </h1>
      </div>

      {/* CARDS FINANCEIROS */}
      <div className="-mt-10 px-6 space-y-4">
        <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100">
          <p className="text-sm text-gray-500 font-bold mb-1">Faturamento</p>
          <h2 className="text-4xl font-black text-[#10b981]">R$ {faturamento.toFixed(2)}</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
            <p className="text-[11px] text-gray-500 font-bold mb-1">Lucro</p>
            <h2 className="text-xl font-black text-blue-600">R$ {lucro.toFixed(2)}</h2>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
            <p className="text-[11px] text-gray-500 font-bold mb-1">Estoque</p>
            <h2 className="text-xl font-black text-red-500">R$ {estoqueTotal.toFixed(2)}</h2>
          </div>
        </div>
      </div>

      {/* ACESSO RÁPIDO */}
      <div className="px-6 mt-8">
        <h3 className="font-bold text-gray-800 text-lg mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => router.push('/venda')} className="bg-[#10b981] flex flex-col items-center justify-center p-6 rounded-2xl shadow-md active:scale-95 transition-transform">
            <span className="text-3xl mb-2">💰</span>
            <span className="text-white font-bold">Vender</span>
          </button>
          
          <button onClick={() => router.push('/produtos/novo')} className="bg-white flex flex-col items-center justify-center p-6 rounded-2xl shadow-md border border-gray-100 active:scale-95 transition-transform">
            <span className="text-3xl mb-2">📦</span>
            <span className="text-gray-800 font-bold">Adicionar</span>
          </button>
          
          <button onClick={() => router.push('/fiados')} className="bg-white flex flex-col items-center justify-center p-6 rounded-2xl shadow-md border border-gray-100 active:scale-95 transition-transform">
            <span className="text-3xl mb-2">📝</span>
            <span className="text-gray-800 font-bold">Fiados</span>
          </button>
          
          <button onClick={() => router.push('/relatorio')} className="bg-white flex flex-col items-center justify-center p-6 rounded-2xl shadow-md border border-gray-100 active:scale-95 transition-transform">
            <span className="text-3xl mb-2">📊</span>
            <span className="text-gray-800 font-bold">Relatórios</span>
          </button>
        </div>
      </div>

      {/* ESTOQUE */}
      <div className="px-6 mt-8">
        <h3 className="font-bold text-gray-800 text-lg mb-4">Estoque</h3>
        
        {loading ? (
           <p className="text-gray-500 text-sm">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {produtos.map(p => {
              const estoqueBaixo = p.quantidade_estoque <= 5;
              
              return (
                <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-800 text-[15px]">{p.nome}</h4>
                    <p className="text-gray-500 text-[12px] mt-0.5">
                      Qtd: {p.quantidade_estoque} {estoqueBaixo && <span className="text-orange-500 font-bold ml-1">⚠️ Baixo</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#10b981] font-bold text-[15px]">R$ {Number(p.preco_venda).toFixed(2)}</span>
                    <button onClick={() => apagarProduto(p.id)} className="text-gray-400 text-lg active:scale-90">🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
