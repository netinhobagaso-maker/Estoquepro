'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import BottomNav from '../../../components/BottomNav';

export default function NovoProduto() {
  const [nome, setNome] = useState('');
  const [custo, setCusto] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [mensagem, setMensagem] = useState('');

  const salvar = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMensagem('Faça login primeiro.');

    const { error } = await supabase.from('produtos').insert([{
      user_id: user.id,
      nome,
      custo_aquisicao: parseFloat(custo),
      preco_venda: parseFloat(preco),
      quantidade_estoque: parseInt(quantidade)
    }]);

    if (error) setMensagem('Erro: ' + error.message);
    else {
      setMensagem('✅ Produto Salvo!');
      setNome(''); setCusto(''); setPreco(''); setQuantidade('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold">Novo Produto 📦</h1></div>
      
      <div className="p-6">
        <form onSubmit={salvar} className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
          <input required type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome (Ex: Capinha)" className="w-full p-3 border rounded-xl outline-none focus:border-emerald-500" />
          
          <div className="grid grid-cols-2 gap-4">
            <input required type="number" step="0.01" value={custo} onChange={(e) => setCusto(e.target.value)} placeholder="Custo R$" className="w-full p-3 border rounded-xl outline-none focus:border-emerald-500" />
            <input required type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="Venda R$" className="w-full p-3 border rounded-xl outline-none focus:border-emerald-500" />
          </div>
          
          <input required type="number" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="Estoque inicial" className="w-full p-3 border rounded-xl outline-none focus:border-emerald-500" />
          
          {mensagem && <p className="text-emerald-600 font-bold text-center">{mensagem}</p>}
          
          <button type="submit" className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl">Salvar Produto</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
