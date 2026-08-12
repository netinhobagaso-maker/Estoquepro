'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import BottomNav from '../../../components/BottomNav';

export default function NovoProduto() {
  const [nome, setNome] = useState('');
  const [tipoMedida, setTipoMedida] = useState('caixa'); // 'caixa' ou 'unidade'
  const [qtdCaixas, setQtdCaixas] = useState('');
  const [itensPorCaixa, setItensPorCaixa] = useState('');
  const [custoPacote, setCustoPacote] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  // Matemática em tempo real para mostrar na tela
  const totalUnidades = (parseFloat(qtdCaixas) || 0) * (tipoMedida === 'caixa' ? (parseFloat(itensPorCaixa) || 1) : 1);
  const custoPorUnidade = (parseFloat(custoPacote) || 0) / (tipoMedida === 'caixa' ? (parseFloat(itensPorCaixa) || 1) : 1);

  const salvar = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('Salvando...');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMensagem('❌ Você precisa fazer login primeiro!');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('produtos').insert([{
      user_id: user.id,
      nome: nome,
      custo_aquisicao: custoPorUnidade, // Salva o custo de UMA unidade
      preco_venda: parseFloat(precoVenda), // Salva o preço de venda de UMA unidade
      quantidade_estoque: totalUnidades // Salva o total de unidades soltas
    }]);

    if (error) {
      setMensagem('❌ Erro no banco: ' + error.message);
    } else {
      setMensagem('✅ Produto Salvo com sucesso!');
      setNome(''); setQtdCaixas(''); setItensPorCaixa(''); setCustoPacote(''); setPrecoVenda('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold">Novo Produto 📦</h1></div>
      
      <div className="p-6">
        <form onSubmit={salvar} className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
          <input required type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome (Ex: Coca-Cola)" className="w-full p-3 border rounded-xl" />
          
          <select value={tipoMedida} onChange={(e) => setTipoMedida(e.target.value)} className="w-full p-3 border rounded-xl bg-white">
            <option value="caixa">Comprei em Caixa / Fardo</option>
            <option value="unidade">Comprei por Unidades soltas</option>
          </select>

          {tipoMedida === 'caixa' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-bold">Qtd de Caixas</label>
                <input required type="number" value={qtdCaixas} onChange={(e) => setQtdCaixas(e.target.value)} placeholder="Ex: 2" className="w-full p-3 border rounded-xl" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-bold">Unidades na Caixa</label>
                <input required type="number" value={itensPorCaixa} onChange={(e) => setItensPorCaixa(e.target.value)} placeholder="Ex: 12" className="w-full p-3 border rounded-xl" />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-gray-500 font-bold">Total de Unidades compradas</label>
              <input required type="number" value={qtdCaixas} onChange={(e) => setQtdCaixas(e.target.value)} placeholder="Ex: 24" className="w-full p-3 border rounded-xl" />
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500 font-bold">{tipoMedida === 'caixa' ? 'Valor pago por 1 CAIXA (R$)' : 'Valor pago na compra total (R$)'}</label>
            <input required type="number" step="0.01" value={custoPacote} onChange={(e) => setCustoPacote(e.target.value)} placeholder="Ex: 36,00" className="w-full p-3 border rounded-xl" />
          </div>

          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-sm text-emerald-800">
            <strong>Resumo automático:</strong><br/>
            Estoque total: {totalUnidades || 0} unidades <br/>
            Custo por unidade: R$ {(custoPorUnidade || 0).toFixed(2)}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-800">Por quanto vai vender 1 UNIDADE? (R$)</label>
            <input required type="number" step="0.01" value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} placeholder="Ex: 5,00" className="w-full p-3 border rounded-xl border-emerald-500" />
          </div>
          
          {mensagem && <p className={`font-bold text-center ${mensagem.includes('❌') ? 'text-red-600' : 'text-emerald-600'}`}>{mensagem}</p>}
          
          <button type="submit" disabled={loading} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl active:scale-95 transition-all">
            {loading ? 'Salvando...' : 'Registrar no Estoque'}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
