'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

export default function NovoProduto() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [custoAquisicao, setCustoAquisicao] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [loading, setLoading] = useState(false);

  // Cálculos automáticos para exibição do Lucro Previsto
  const custoNum = parseFloat(custoAquisicao) || 0;
  const vendaNum = parseFloat(precoVenda) || 0;
  const qtdNum = parseInt(quantidade) || 0;

  const lucroUnitario = vendaNum - custoNum;
  const lucroTotalPrevisto = lucroUnitario * qtdNum;
  const margemLucro = custoNum > 0 ? ((lucroUnitario / custoNum) * 100).toFixed(0) : 0;

  const salvarProduto = async (e) => {
    e.preventDefault();
    if (!nome || vendaNum <= 0 || qtdNum <= 0) {
      alert('Por favor, preencha o nome, preço de venda e quantidade.');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase.from('produtos').insert([
        {
          user_id: user.id,
          nome,
          custo_aquisicao: custoNum,
          preco_venda: vendaNum,
          quantidade_estoque: qtdNum
        }
      ]);

      if (error) {
        alert('Erro ao cadastrar produto: ' + error.message);
      } else {
        alert('Produto cadastrado com sucesso! 🎉');
        router.push('/estoque');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 p-6">
      <div className="max-w-md mx-auto bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Cadastrar Produto 📦</h1>

        <form onSubmit={salvarProduto} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome do Produto</label>
            <input
              type="text"
              placeholder="Ex: Coca-Cola 2L"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                💸 Custo de Compra (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 4.50"
                value={custoAquisicao}
                onChange={(e) => setCustoAquisicao(e.target.value)}
                className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800"
                required
              />
              <span className="text-[10px] text-gray-400">Quanto você gastou</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                🏷️ Preço Venda (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 8.00"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(e.target.value)}
                className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800"
                required
              />
              <span className="text-[10px] text-gray-400">Preço final ao cliente</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Quantidade em Estoque</label>
            <input
              type="number"
              placeholder="Ex: 24"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800"
              required
            />
          </div>

          {/* PAINEL DE LUCRO PREVISTO EM TEMPO REAL */}
          {vendaNum > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl space-y-2 text-sm mt-4">
              <div className="flex justify-between items-center text-emerald-900 font-bold">
                <span>Lucro Unitário:</span>
                <span className="text-emerald-600 font-black">R$ {lucroUnitario.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-emerald-800">
                <span>Margem de Lucro:</span>
                <span className="font-bold">{margemLucro}%</span>
              </div>
              <div className="border-t border-emerald-200 pt-2 flex justify-between items-center text-emerald-950 font-black">
                <span>Lucro Total Previsto:</span>
                <span className="text-lg text-emerald-700">R$ {lucroTotalPrevisto.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-2xl text-lg shadow-md active:scale-95 transition-all mt-4"
          >
            {loading ? 'Cadastrando...' : 'Salvar Produto'}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
