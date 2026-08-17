'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

export default function Vender() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [quantidades, setQuantidades] = useState({});
  const [modalPagamento, setModalPagamento] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('produtos').select('*').eq('user_id', user.id).gt('quantidade_estoque', 0).order('nome');
      if (data) setProdutos(data);
    }
  };

  // Função bancária: Garante que tudo seja lido e calculado como decimal (Ex: 2.50)
  const formatarDinheiro = (valor) => {
    let numero = parseFloat(String(valor || 0).replace(',', '.')) || 0;
    return Number(numero.toFixed(2));
  };

  const incrementar = (p) => {
    const qtd = quantidades[p.id] || 0;
    if (qtd >= p.quantidade_estoque) return alert("Estoque insuficiente!");
    setQuantidades({ ...quantidades, [p.id]: qtd + 1 });
  };

  const decrementar = (p) => {
    const qtd = quantidades[p.id] || 0;
    if (qtd <= 1) {
      const copy = { ...quantidades };
      delete copy[p.id];
      setQuantidades(copy);
    } else {
      setQuantidades({ ...quantidades, [p.id]: qtd - 1 });
    }
  };

  const itensCarrinho = produtos.filter(p => quantidades[p.id] > 0).map(p => ({
    ...p,
    quantidade: quantidades[p.id]
  }));

  // Aplica a formatação estrita nos totais para evitar bugs de dízima do JavaScript
  const totalCarrinho = formatarDinheiro(
    itensCarrinho.reduce((acc, item) => acc + (formatarDinheiro(item.preco_venda) * item.quantidade), 0)
  );
  
  const lucroCarrinho = formatarDinheiro(
    itensCarrinho.reduce((acc, item) => acc + (formatarDinheiro(item.lucro_unitario) * item.quantidade), 0)
  );

  const finalizarVenda = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    for (const item of itensCarrinho) {
      const novoEstoque = item.quantidade_estoque - item.quantidade;
      await supabase.from('produtos').update({ quantidade_estoque: novoEstoque }).eq('id', item.id);
    }

    // Salva exatamente o valor decimal no banco
    const { error } = await supabase.from('vendas').insert({
      user_id: user.id,
      valor_total: totalCarrinho,
      total_lucro: lucroCarrinho,
      itens: itensCarrinho
    });

    if (error) {
      alert("Erro ao gravar venda: " + error.message);
    } else {
      alert("✅ Venda finalizada com sucesso!");
      setQuantidades({});
      setModalPagamento(false);
      carregarDados();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-[#111827] pt-8 pb-6 px-6 text-white rounded-b-[2rem]">
        <h1 className="text-2xl font-bold mb-4">🛒 Ponto de Venda</h1>
        <input type="text" placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full p-3 rounded-xl bg-gray-800 text-white border border-gray-700 outline-none" />
      </div>

      <div className="px-6 mt-6 space-y-3">
        {produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase())).map(produto => (
          <div key={produto.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800">{produto.nome}</p>
              <p className="text-[#10b981] font-black text-sm">R$ {formatarDinheiro(produto.preco_venda).toFixed(2)}</p>
              <p className="text-[11px] text-gray-400">Estoque: {produto.quantidade_estoque}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {quantidades[produto.id] ? (
                <>
                  <button onClick={() => decrementar(produto)} className="w-8 h-8 bg-red-100 text-red-600 rounded-full font-black text-lg">-</button>
                  <span className="font-black text-gray-800 w-4 text-center">{quantidades[produto.id]}</span>
                  <button onClick={() => incrementar(produto)} className="w-8 h-8 bg-[#10b981] text-white rounded-full font-black text-lg">+</button>
                </>
              ) : (
                <button onClick={() => incrementar(produto)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs">Adicionar</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {totalCarrinho > 0 && (
        <div className="fixed bottom-[80px] left-0 right-0 px-6 z-40">
          <button onClick={() => setModalPagamento(true)} className="w-full bg-[#10b981] text-white p-4 rounded-2xl font-black text-lg shadow-lg flex justify-between items-center">
            <span>Cobrar ({itensCarrinho.reduce((a, b) => a + b.quantidade, 0)})</span>
            <span>R$ {totalCarrinho.toFixed(2)}</span>
          </button>
        </div>
      )}

      {modalPagamento && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-28">
            <h3 className="font-black text-xl text-gray-800 mb-4">Finalizar Venda</h3>
            <div className="bg-gray-50 p-4 rounded-2xl mb-4 space-y-1">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Total a cobrar:</span>
                <span className="font-bold text-gray-800">R$ {totalCarrinho.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-emerald-600 font-bold">
                <span>Lucro real desta venda:</span>
                <span>R$ {lucroCarrinho.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={finalizarVenda} className="w-full p-4 bg-[#10b981] text-white rounded-2xl font-black text-center">
              💵 Confirmar Recebimento
            </button>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
