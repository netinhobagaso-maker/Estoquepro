'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function NovoProduto() {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('caixa'); // 'caixa' ou 'unidade'
  const [qtdCaixas, setQtdCaixas] = useState('');
  const [unidadesPorCaixa, setUnidadesPorCaixa] = useState('');
  const [gastoTotal, setGastoTotal] = useState('');
  const [precoVendaUnitario, setPrecoVendaUnitario] = useState('');

  const parseNum = (val) => {
    if (!val) return 0;
    let str = String(val).replace(',', '.');
    return parseFloat(str) || 0;
  };

  // CÁLCULOS MATEMÁTICOS DIRETOS
  const numQtdCaixas = parseNum(qtdCaixas);
  const numUnidadesPorCaixa = parseNum(unidadesPorCaixa);
  const numGastoTotal = parseNum(gastoTotal);
  const numPrecoVenda = parseNum(precoVendaUnitario);

  const totalUnidades = tipo === 'caixa' 
    ? (numQtdCaixas * numUnidadesPorCaixa) 
    : parseNum(qtdCaixas);

  const custoUnitario = totalUnidades > 0 ? (numGastoTotal / totalUnidades) : 0;
  const lucroUnitario = numPrecoVenda - custoUnitario;
  const faturamentoTotal = totalUnidades * numPrecoVenda;
  const lucroEsperadoTotal = totalUnidades * lucroUnitario;

  const salvarProduto = async (e) => {
    e.preventDefault();
    if (!nome || totalUnidades <= 0 || numPrecoVenda <= 0) {
      return alert("Preencha todos os campos corretamente!");
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('produtos').insert({
      user_id: user.id,
      nome,
      quantidade_estoque: totalUnidades,
      custo_unitario: custoUnitario,
      preco_venda: numPrecoVenda,
      lucro_unitario: lucroUnitario
    });

    if (error) {
      alert("Erro ao salvar produto: " + error.message);
    } else {
      alert("✅ Produto cadastrado com sucesso!");
      setNome('');
      setQtdCaixas('');
      setUnidadesPorCaixa('');
      setGastoTotal('');
      setPrecoVendaUnitario('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-[#111827] pt-8 pb-6 px-6 text-white rounded-b-[2rem]">
        <h1 className="text-2xl font-bold">📦 Cadastrar Produto</h1>
      </div>

      <form onSubmit={salvarProduto} className="px-6 mt-6 space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">Nome do Produto</label>
          <input type="text" placeholder="Ex: Cerveja Skol 350ml" value={nome} onChange={e => setNome(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 font-semibold outline-none focus:border-[#10b981]" required />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">Tipo de Entrada</label>
          <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 font-semibold outline-none">
            <option value="caixa">Comprei em Caixa / Fardo</option>
            <option value="unidade">Comprei em Unidades Avulsas</option>
          </select>
        </div>

        {tipo === 'caixa' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Qtd de Caixas</label>
              <input type="number" placeholder="Ex: 2" value={qtdCaixas} onChange={e => setQtdCaixas(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 font-semibold outline-none" required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">Unidades na Caixa</label>
              <input type="number" placeholder="Ex: 12" value={unidadesPorCaixa} onChange={e => setUnidadesPorCaixa(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 font-semibold outline-none" required />
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Qtd Total de Unidades</label>
            <input type="number" placeholder="Ex: 24" value={qtdCaixas} onChange={e => setQtdCaixas(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 font-semibold outline-none" required />
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">💰 Quanto você gastou nessa compra total? (R$)</label>
          <input type="text" placeholder="Ex: 36.00" value={gastoTotal} onChange={e => setGastoTotal(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 font-semibold outline-none" required />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">🏷️ Por quanto vai vender 1 UNIDADE? (R$)</label>
          <input type="text" placeholder="Ex: 5.00" value={precoVendaUnitario} onChange={e => setPrecoVendaUnitario(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 font-semibold outline-none focus:border-[#10b981]" required />
        </div>

        {/* RESUMO AUTOMÁTICO */}
        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 space-y-2 mt-4">
          <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-1 border-b border-emerald-200 pb-2">
            📊 Resumo Automático:
          </h3>
          <p className="text-xs font-medium text-emerald-800">📦 Estoque total: <strong className="text-emerald-950">{totalUnidades} unid.</strong></p>
          <p className="text-xs font-medium text-emerald-800">💸 Custo por 1 unidade: <strong className="text-emerald-950">R$ {custoUnitario.toFixed(2)}</strong></p>
          <p className="text-xs font-medium text-emerald-800">💎 Lucro por 1 unidade: <strong className="text-emerald-950">R$ {lucroUnitario.toFixed(2)}</strong></p>
          <p className="text-xs font-medium text-emerald-800">💰 Faturamento total: <strong className="text-emerald-950">R$ {faturamentoTotal.toFixed(2)}</strong></p>
          <p className="text-xs font-medium text-emerald-800">🚀 Lucro Esperado Total: <strong className="text-emerald-950">R$ {lucroEsperadoTotal.toFixed(2)}</strong></p>
        </div>

        <button type="submit" className="w-full bg-[#10b981] text-white p-4 rounded-2xl font-black text-lg shadow-md active:scale-95 transition-transform mt-6">
          Salvar Produto
        </button>
      </form>

      <BottomNav />
    </div>
  );
}
