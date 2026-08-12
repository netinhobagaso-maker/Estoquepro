'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Vender() {
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  // Busca os produtos do banco assim que a tela abre
  useEffect(() => {
    const buscarProdutos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('produtos').select('*').eq('user_id', user.id);
        if (data) setProdutos(data);
      }
    };
    buscarProdutos();
  }, []);

  const realizarVenda = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('Registrando venda...');

    const { data: { user } } = await supabase.auth.getUser();
    const produto = produtos.find(p => p.id === produtoSelecionado);

    if (!user || !produto) {
      setMensagem('❌ Selecione um produto.');
      setLoading(false);
      return;
    }

    if (produto.quantidade_estoque < quantidade) {
      setMensagem(`❌ Você só tem ${produto.quantidade_estoque} no estoque!`);
      setLoading(false);
      return;
    }

    const valorTotal = produto.preco_venda * quantidade;
    const lucroRealizado = (produto.preco_venda - produto.custo_aquisicao) * quantidade;

    // Registra a venda (O banco de dados vai dar baixa no estoque automaticamente via Trigger!)
    const { error } = await supabase.from('vendas').insert([{
      user_id: user.id,
      produto_id: produto.id,
      quantidade_vendida: parseInt(quantidade),
      valor_total: valorTotal,
      lucro_realizado: lucroRealizado
    }]);

    if (error) {
      setMensagem('❌ Erro: ' + error.message);
    } else {
      setMensagem(`✅ Venda de R$ ${valorTotal.toFixed(2)} registrada!`);
      setQuantidade(1);
      // Atualiza o estoque na tela diminuindo o que foi vendido
      setProdutos(produtos.map(p => p.id === produto.id ? {...p, quantidade_estoque: p.quantidade_estoque - quantidade} : p));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-emerald-500 p-6 shadow-sm rounded-b-3xl">
        <h1 className="text-2xl font-bold text-white">Nova Venda 💰</h1>
      </div>
      
      <div className="p-6 -mt-4">
        <form onSubmit={realizarVenda} className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 space-y-4">
          
          <div>
            <label className="text-xs text-gray-500 font-bold">O que você está vendendo?</label>
            <select required value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)} className="w-full p-3 border rounded-xl bg-white mt-1">
              <option value="">Selecione o produto...</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} (Estoque: {p.quantidade_estoque}) - R$ {p.preco_venda}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-bold">Quantas unidades?</label>
            <input required type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="w-full p-3 border rounded-xl mt-1 text-2xl text-center font-bold" />
          </div>

          {produtoSelecionado && (
            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Valor Total a Cobrar</p>
              <p className="text-3xl font-black text-gray-900">
                R$ {((produtos.find(p => p.id === produtoSelecionado)?.preco_venda || 0) * quantidade).toFixed(2)}
              </p>
            </div>
          )}
          
          {mensagem && <p className={`font-bold text-center ${mensagem.includes('❌') ? 'text-red-600' : 'text-emerald-600'}`}>{mensagem}</p>}
          
          <button type="submit" disabled={loading || !produtoSelecionado} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl active:scale-95 transition-all">
            {loading ? 'Processando...' : 'Finalizar Venda'}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
