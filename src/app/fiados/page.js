'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Fiados() {
  const [fiados, setFiados] = useState([]);
  const [cliente, setCliente] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarFiados();
  }, []);

  const carregarFiados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('fiados')
        .select('*')
        .eq('user_id', user.id)
        .order('status', { ascending: false }) // Pendentes primeiro
        .order('created_at', { ascending: false });
      if (data) setFiados(data);
    }
  };

  const adicionarFiado = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('fiados').insert([
      {
        user_id: user.id,
        cliente,
        valor: parseFloat(valor),
        descricao,
        status: 'pendente'
      }
    ]);

    if (!error) {
      setCliente('');
      setValor('');
      setDescricao('');
      carregarFiados();
    } else {
      alert('Erro ao anotar fiado: ' + error.message);
    }
    setLoading(false);
  };

  const marcarComoPago = async (id) => {
    const { error } = await supabase
      .from('fiados')
      .update({ status: 'pago' })
      .eq('id', id);

    if (!error) {
      carregarFiados(); // Atualiza a lista
    }
  };

  // Calcula o total que as pessoas te devem
  const totalPendente = fiados
    .filter(f => f.status === 'pendente')
    .reduce((acc, f) => acc + parseFloat(f.valor), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-orange-500 p-6 shadow-sm rounded-b-3xl text-white">
        <h1 className="text-2xl font-bold">Caderno de Fiados 📝</h1>
        <p className="text-orange-100 text-sm mt-1">Anotações de quem deve na loja</p>
      </div>

      <div className="p-6 -mt-4 space-y-6">
        
        {/* RESUMO A RECEBER */}
        <div className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 text-center">
          <p className="text-xs text-gray-500 font-bold uppercase">Total a Receber</p>
          <h2 className="text-3xl font-black text-orange-500 mt-1">R$ {totalPendente.toFixed(2)}</h2>
        </div>

        {/* FORMULÁRIO PARA ANOTAR NOVO FIADO */}
        <form onSubmit={adicionarFiado} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-800">Anotar novo Fiado</h3>
          
          <div>
            <input required type="text" placeholder="Nome do Cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" step="0.01" placeholder="Valor (R$)" value={valor} onChange={(e) => setValor(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
            <input type="text" placeholder="Ex: 2 Coca 2L" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl active:scale-95 transition-all">
            {loading ? 'Anotando...' : 'Salvar no Caderno'}
          </button>
        </form>

        {/* LISTA DE DEVEDORES */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 ml-1">Lista de Clientes</h3>
          <div className="space-y-3">
            {fiados.map(fiado => (
              <div key={fiado.id} className={`p-4 rounded-xl border flex justify-between items-center ${fiado.status === 'pago' ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-orange-200 shadow-sm'}`}>
                <div>
                  <p className={`font-bold ${fiado.status === 'pago' ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                    {fiado.cliente}
                  </p>
                  <p className="text-xs text-gray-500">{fiado.descricao || 'Sem descrição'}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(fiado.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                
                <div className="text-right flex flex-col items-end">
                  <p className={`font-black ${fiado.status === 'pago' ? 'text-gray-400' : 'text-orange-500'}`}>
                    R$ {Number(fiado.valor).toFixed(2)}
                  </p>
                  {fiado.status === 'pendente' && (
                    <button onClick={() => marcarComoPago(fiado.id)} className="mt-2 text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold">
                      Marcar como Pago
                    </button>
                  )}
                  {fiado.status === 'pago' && (
                    <span className="mt-2 text-[10px] font-bold text-emerald-500">PAGO ✅</span>
                  )}
                </div>
              </div>
            ))}
            
            {fiados.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">Nenhum fiado anotado.</p>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
