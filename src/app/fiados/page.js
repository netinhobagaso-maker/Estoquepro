'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Fiados() {
  const [fiados, setFiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idExpandido, setIdExpandido] = useState(null);

  // Estados para nova dívida do cliente expandido
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoValor, setNovoValor] = useState('');

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
    if (confirm(`A conta de ${nomeCliente} foi paga? Deseja excluir?`)) {
      const { error } = await supabase.from('fiados').delete().eq('id', id);
      if (!error) carregarFiados();
    }
  };

  const alternarExpandido = (id) => {
    setIdExpandido(idExpandido === id ? null : id);
    setNovaDescricao('');
    setNovoValor('');
  };

  const adicionarConta = async (fiado) => {
    if (!novaDescricao || !novoValor) return alert("Preencha item e valor.");
    
    const valorAdicional = Number(novoValor);
    const novoTotal = Number(fiado.valor) + valorAdicional;
    
    // Pega o histórico atual ou cria um vazio
    const historicoAtual = fiado.historico || [];
    
    // Se o histórico estiver vazio, adiciona a dívida original primeiro
    if (historicoAtual.length === 0 && fiado.descricao) {
       historicoAtual.push({ data: fiado.created_at, desc: fiado.descricao, val: fiado.valor });
    }

    // Adiciona o novo item
    const itemNovo = { data: new Date().toISOString(), desc: novaDescricao, val: valorAdicional };
    const novoHistorico = [...historicoAtual, itemNovo];

    const { error } = await supabase.from('fiados')
      .update({ valor: novoTotal, historico: novoHistorico, descricao: 'Vários itens (clique para ver)' })
      .eq('id', fiado.id);

    if (!error) {
      alert("Conta adicionada!");
      setNovaDescricao('');
      setNovoValor('');
      carregarFiados();
    } else {
      alert("Erro: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#111827] p-6 rounded-b-3xl text-white shadow-md flex justify-between items-center">
        <h1 className="text-2xl font-bold">Fiados 📝</h1>
        <button onClick={() => window.location.href='/fiados/novo'} className="bg-emerald-500 px-3 py-1 text-sm font-bold rounded-lg">+ Novo Cliente</button>
      </div>
      <div className="p-6 -mt-4">
        {loading ? <p className="text-center text-gray-500">Carregando...</p> : (
          <div className="space-y-4">
            {fiados.map(fiado => (
              <div key={fiado.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                {/* CABEÇALHO DO CARD - CLICÁVEL PARA ABRIR */}
                <div onClick={() => alternarExpandido(fiado.id)} className="p-4 flex justify-between items-center bg-white active:bg-gray-50 transition-all">
                  <div>
                    <p className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      {fiado.nome_cliente} {idExpandido === fiado.id ? '👇' : '👉'}
                    </p>
                    <p className="text-xs text-gray-400">{fiado.telefone || 'Sem telefone'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-red-500 text-lg">R$ {Number(fiado.valor).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">Total Devendo</p>
                  </div>
                </div>

                {/* ÁREA EXPANDIDA (Detalhes e Adicionar) */}
                {idExpandido === fiado.id && (
                  <div className="bg-gray-50 p-4 border-t border-gray-100">
                    
                    {/* Histórico da Conta */}
                    <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase">Histórico da Conta</h4>
                    <ul className="mb-4 space-y-1">
                      {fiado.historico && fiado.historico.length > 0 ? (
                        fiado.historico.map((h, i) => (
                          <li key={i} className="flex justify-between text-sm text-gray-700 border-b border-gray-200 border-dashed pb-1">
                            <span>{h.desc}</span>
                            <span className="font-bold">R$ {Number(h.val).toFixed(2)}</span>
                          </li>
                        ))
                      ) : (
                        <li className="flex justify-between text-sm text-gray-700 border-b border-gray-200 border-dashed pb-1">
                            <span>{fiado.descricao}</span>
                            <span className="font-bold">R$ {Number(fiado.valor).toFixed(2)}</span>
                        </li>
                      )}
                    </ul>

                    {/* Formulário para adicionar mais dívidas */}
                    <div className="bg-white p-3 rounded-xl border mb-4">
                      <p className="text-xs font-bold text-gray-800 mb-2">Adicionar mais itens para {fiado.nome_cliente}:</p>
                      <div className="flex gap-2">
                        <input type="text" placeholder="O que levou?" value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm" />
                        <input type="number" placeholder="R$" value={novoValor} onChange={e => setNovoValor(e.target.value)} className="w-20 p-2 border rounded-lg bg-gray-50 text-sm" />
                      </div>
                      <button onClick={() => adicionarConta(fiado)} className="w-full mt-2 bg-blue-600 text-white font-bold p-2 rounded-lg text-sm active:scale-95">
                        Somar na Conta +
                      </button>
                    </div>

                    <div className="flex gap-2 mt-2">
                      {fiado.telefone && (
                        <a href={`https://wa.me/55${fiado.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 text-white text-center font-bold p-3 rounded-xl text-sm active:scale-95">
                          WhatsApp
                        </a>
                      )}
                      <button onClick={() => apagarFiado(fiado.id, fiado.nome_cliente)} className="flex-1 bg-red-100 text-red-600 font-bold p-3 rounded-xl text-sm active:scale-95">
                        💳 Apagar Tudo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
