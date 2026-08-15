'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import BottomNav from '../../components/BottomNav';

export default function Vender() {
  const router = useRouter();
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('produtos').select('*').eq('user_id', user.id).order('nome');
      if (data) setProdutos(data);
    }
  };

  const adicionarAoCarrinho = () => {
    if (!produtoSelecionado || quantidade < 1) return;
    const prod = produtos.find(p => p.id === produtoSelecionado);
    if (!prod) return;

    if (prod.quantidade_estoque < quantidade) {
      alert(`Você só tem ${prod.quantidade_estoque} unidades de ${prod.nome} no estoque!`);
      return;
    }

    const itemNovo = {
      id: prod.id,
      nome: prod.nome,
      preco_venda: prod.preco_venda,
      custo_aquisicao: prod.custo_aquisicao,
      quantidade: Number(quantidade)
    };

    setCarrinho([...carrinho, itemNovo]);
    setProdutoSelecionado('');
    setQuantidade(1);
  };

  const removerDoCarrinho = (index) => {
    const novoCarrinho = [...carrinho];
    novoCarrinho.splice(index, 1);
    setCarrinho(novoCarrinho);
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) return alert("O carrinho está vazio!");
    setSalvando(true);

    const { data: { user } } = await supabase.auth.getUser();
    let valorTotal = 0;
    let lucroTotal = 0;

    carrinho.forEach(item => {
      valorTotal += item.preco_venda * item.quantidade;
      lucroTotal += (item.preco_venda - item.custo_aquisicao) * item.quantidade;
    });

    // 1. Salva a Venda com o JSON dos itens
    const { error } = await supabase.from('vendas').insert([{
      user_id: user.id,
      valor_total: valorTotal,
      lucro_realizado: lucroTotal,
      itens: carrinho
    }]);

    if (error) {
      alert("Erro ao vender: " + error.message);
      setSalvando(false);
      return;
    }

    // 2. Desconta do estoque cada item do carrinho
    for (const item of carrinho) {
      const prodBanco = produtos.find(p => p.id === item.id);
      await supabase.from('produtos').update({
        quantidade_estoque: prodBanco.quantidade_estoque - item.quantidade
      }).eq('id', item.id);
    }

    alert("Venda finalizada com sucesso!");
    router.push('/');
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.preco_venda * item.quantidade), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="bg-[#111827] p-6 rounded-b-3xl text-white shadow-md">
        <h1 className="text-2xl font-bold">Nova Venda 💰</h1>
      </div>
      <div className="p-6 -mt-4 space-y-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border">
          <label className="text-xs font-bold text-gray-500 mb-1 block">Escolha o Produto</label>
          <select value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 mb-3 text-gray-800">
            <option value="">Selecione...</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} (Estoque: {p.quantidade_estoque})</option>)}
          </select>
          
          <div className="flex gap-3 mb-4">
            <div className="w-1/3">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Qtd</label>
              <input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 text-center" />
            </div>
            <div className="w-2/3 flex items-end">
              <button onClick={adicionarAoCarrinho} className="w-full bg-blue-600 text-white font-bold p-3 rounded-xl active:scale-95">
                + Add ao Carrinho
              </button>
            </div>
          </div>
        </div>

        {carrinho.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border">
            <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">🛒 Carrinho</h3>
            {carrinho.map((item, index) => (
              <div key={index} className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-700">{item.quantidade}x {item.nome}</span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600">R$ {(item.preco_venda * item.quantidade).toFixed(2)}</span>
                  <button onClick={() => removerDoCarrinho(index)} className="text-red-500 bg-red-50 rounded p-1 text-xs">X</button>
                </div>
              </div>
            ))}
            <div className="mt-4 pt-3 border-t flex justify-between items-center">
              <span className="font-bold text-gray-500 text-sm">TOTAL:</span>
              <span className="text-2xl font-black text-emerald-500">R$ {totalCarrinho.toFixed(2)}</span>
            </div>
            <button onClick={finalizarVenda} disabled={salvando} className="w-full bg-emerald-500 text-white font-black p-4 rounded-xl mt-4 active:scale-95">
              {salvando ? 'Salvando...' : 'Finalizar Venda'}
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
