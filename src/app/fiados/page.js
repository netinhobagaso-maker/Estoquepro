'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Fiados() {
  const [fiados, setFiados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarFiados();
  }, []);

  const carregarFiados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('fiados').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (data) setFiados(data);
    }
    setLoading(false);
  };

  const apagarFiado = async (id, nomeCliente) => {
    if (confirm(`Apagar a dívida de ${nomeCliente}?`)) {
      const { error } = await supabase.from('fiados').delete().eq('id', id);
      if (!error) carregarFiados();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#111827] p-6 rounded-b-3xl text-white">
        <h1 className="text-2xl font-bold">Fiados 📝</h1>
      </div>
      <div className="p-6 -mt-4">
        {loading ? <p className="text-center text-gray-500">Carregando...</p> : (
          <div className="space-y-3">
            {fiados.map(fiado => (
              <div key={fiado.id} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">{fiado.nome_cliente}</p>
                  <p className="text-xs text-gray-400">{fiado.descricao}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-black text-red-500">R$ {Number(fiado.valor).toFixed(2)}</p>
                  <button onClick={() => apagarFiado(fiado.id, fiado.nome_cliente)} className="text-red-500 text-xl ml-2">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
