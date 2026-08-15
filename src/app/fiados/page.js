'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Fiados() {
  const [fiados, setFiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idExpandido, setIdExpandido] = useState(null);
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoValor, setNovoValor] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('fiados').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setFiados(data);
    }
    setLoading(false);
  };

  const adicionarConta = async (fiado) => {
    if (!novaDescricao || !novoValor) return alert("Preencha item e valor.");
    
    const valorAdicional = Number(novoValor);
    const novoTotal = Number(fiado.valor || 0) + valorAdicional;
    const historicoAtual = fiado.historico || [];
    const itemNovo = { data: new Date().toISOString(), desc: novaDescricao, val: valorAdicional };
    const novoHistorico = [...historicoAtual, itemNovo];

    // A MÁGICA ESTÁ AQUI: Forçamos o status para 'pendente' ao adicionar nova dívida
    const { error } = await supabase.from('fiados')
      .update({ 
        valor: novoTotal, 
        status: 'pendente', 
        historico: novoHistorico, 
        descricao: 'Vários itens' 
      })
      .eq('id', fiado.id);

    if (!error) {
      alert("Conta atualizada com sucesso!");
      setNovaDescricao('');
      setNovoValor('');
      carregarDados();
    } else {
      alert("Erro: " + error.message);
    }
  };

  const pagarEEnviarComprovante = async (fiado) => {
    const { error } = await supabase.from('fiados')
      .update({ valor: 0, status: 'pago' })
      .eq('id', fiado.id);

    if (!error) {
      const msg = `Olá ${fiado.nome_cliente}, sua conta foi quitada! ✅`;
      window.open(`https://wa.me/55${fiado.telefone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      carregarDados();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#111827] p-6 rounded-b-3xl text-white shadow-md">
        <h1 className="text-2xl font-bold">Fiados 📝</h1>
      </div>
      <div className="p-6 -mt-4 space-y-4">
        {fiados.map(fiado => {
          const estaPago = fiado.status === 'pago';
          return (
            <div key={fiado.id} className="bg-white rounded-2xl p-4 shadow-sm border">
              <div onClick={() => setIdExpandido(idExpandido === fiado.id ? null : fiado.id)} className="flex justify-between items-center cursor-pointer">
                <div>
                  <p className="font-bold text-lg">{fiado.nome_cliente}</p>
                  {estaPago ? <span className="text-emerald-500 font-bold text-xs">✅ PAGO</span> : <span className="text-red-500 font-bold text-xs">⚠️ DEVENDO</span>}
                </div>
                <p className="font-black text-xl">R$ {Number(fiado.valor).toFixed(2)}</p>
              </div>

              {idExpandido === fiado.id && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Item" value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} className="w-full p-2 border rounded-lg"/>
                    <input type="number" placeholder="R$" value={novoValor} onChange={e => setNovoValor(e.target.value)} className="w-20 p-2 border rounded-lg"/>
                  </div>
                  <button onClick={() => adicionarConta(fiado)} className="w-full bg-blue-600 text-white font-bold p-2 rounded-lg">Somar na Conta +</button>
                  {!estaPago && (
                    <button onClick={() => pagarEEnviarComprovante(fiado)} className="w-full bg-emerald-600 text-white font-bold p-2 rounded-lg">Pagar Conta</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}
