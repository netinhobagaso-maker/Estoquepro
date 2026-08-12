'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Vender() {
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('produtos')
        .select('*')
        .eq('user_id', user.id)
        .gt('quantidade_estoque', 0)
        .order('nome');
      if (data) setProdutos(data);
    }
  };

  const registrarVenda = async (e) => {
    e.preventDefault();
    if (!produtoSelecionado || quantidade <= 0) {
      alert('Selecione um produto e a quantidade.');
      return;
    }

    const prod = produtos.find(p => p.id === produtoSelecionado);
    if (!prod) return;

    if (quantidade > prod.quantidade_estoque) {
      alert(`Estoque insuficiente! Você só tem ${prod.quantidade_estoque} unidades.`);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const valorTotal = prod.preco_venda * quantidade;
    const lucroRealizado = (prod.preco_venda - (prod.custo_aquisicao || 0)) * quantidade;

    // 1. GRAVA A VENDA NO HISTÓRICO (Para os relatórios)
    const { error: erroVenda } = await supabase.from('vendas').insert([
      {
        user_id: user.id,
        produto_id: prod.id,
        quantidade_vendida: parseInt(quantidade),
        valor_total: valorTotal,
        lucro_realizado: lucroRealizado
      }
    ]);

    if (erroVenda) {
      alert('Erro ao registrar venda: ' + erroVenda.message);
      setLoading(false);
      return;
    }

    // 2. DAR BAIXA NO ESTOQUE
    const { error: erroEstoque } = await supabase
      .from('produtos')
      .update({ quantidade_estoque: prod.quantidade_estoque - parseInt(quantidade) })
      .eq('id', prod.id);

    if (erroEstoque) {
      alert('Erro ao dar baixa no estoque: ' + erroEstoque.message);
    } else {
      alert(`Venda realizada com sucesso! 💰 Total: R$ ${valorTotal.toFixed(2)}`);
      setProdutoSelecionado('');
      setQuantidade(1);
      carregarProdutos(); // Atualiza a lista com o novo estoque
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 p-6">
      <div className="max-w-md mx-auto bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Registrar Venda 💰</h1>

        <form onSubmit={registrarVenda} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Selecione o Produto</label>
            <select
              value={produtoSelecionado}
              onChange={(e) => setProdutoSelecionado(e.target.value)}
              className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800 bg-white"
              required
            >
              <option value="">-- Selecione o produto --</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} - R$ {p.preco_venda.toFixed(2)} ({p.quantidade_estoque} un em estoque)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Quantidade Vendida</label>
            <input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl text-lg shadow-md active:scale-95 transition-all mt-4"
          >
            {loading ? 'Concluindo Venda...' : 'Finalizar Venda 🚀'}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
