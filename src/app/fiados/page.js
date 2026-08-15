'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Fiados() {
  const [fiados, setFiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idExpandido, setIdExpandido] = useState(null);

  // Nome da Loja
  const [nomeLoja, setNomeLoja] = useState('');
  const [editandoLoja, setEditandoLoja] = useState(false);
  const [inputLoja, setInputLoja] = useState('');

  // Estados para nova dívida
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoValor, setNovoValor] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Carrega fiados
      const { data: dadosFiados } = await supabase.from('fiados').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (dadosFiados) setFiados(dadosFiados);

      // Carrega nome da loja
      const { data: config } = await supabase.from('configuracoes').select('*').eq('user_id', user.id).single();
      if (config && config.nome_loja) {
        setNomeLoja(config.nome_loja);
        setInputLoja(config.nome_loja);
      }
    }
    setLoading(false);
  };

  const salvarNomeLoja = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Tenta atualizar ou inserir
    const { error } = await supabase.from('configuracoes').upsert({
      user_id: user.id,
      nome_loja: inputLoja
    }, { onConflict: 'user_id' });

    if (!error) {
      setNomeLoja(inputLoja);
      setEditandoLoja(false);
      alert("Nome da loja salvo com sucesso! 🏪");
    } else {
      alert("Erro ao salvar nome da loja: " + error.message);
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
    const historicoAtual = fiado.historico || [];
    
    if (historicoAtual.length === 0 && fiado.descricao) {
       historicoAtual.push({ data: fiado.created_at, desc: fiado.descricao, val: fiado.valor });
    }

    const itemNovo = { data: new Date().toISOString(), desc: novaDescricao, val: valorAdicional };
    const novoHistorico = [...historicoAtual, itemNovo];

    const { error } = await supabase.from('fiados')
      .update({ valor: novoTotal, historico: novoHistorico, descricao: 'Vários itens (clique para ver)' })
      .eq('id', fiado.id);

    if (!error) {
      alert("Conta adicionada!");
      setNovaDescricao('');
      setNovoValor('');
      carregarDados();
    } else {
      alert("Erro: " + error.message);
    }
  };

  const pagarEEnviarComprovante = async (fiado) => {
    if (!fiado.telefone) {
      alert("Este cliente não tem telefone cadastrado para enviar o comprovante.");
      return;
    }

    const lojaFinal = nomeLoja || 'Meu Comércio';
    const valorPago = Number(fiado.valor).toFixed(2);

    // Mensagem formatada para o WhatsApp
    const mensagem = `Olá *${fiado.nome_cliente}*! 👋\nAqui é da *${lojaFinal}*.\n\nPassando para confirmar que o seu fiado no valor de *R$ ${valorPago}* foi pago e quitado com sucesso! ✅\n\nMuito obrigado pela preferência e volte sempre! 🙏✨`;

    const telefoneLimpo = fiado.telefone.replace(/\D/g, '');
    const linkWhatsApp = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;

    // Marca como pago no banco de dados (Zera o valor e muda status)
    const { error } = await supabase.from('fiados')
      .update({ valor: 0, status: 'pago' })
      .eq('id', fiado.id);

    if (!error) {
      window.open(linkWhatsApp, '_blank');
      carregarDados();
    } else {
      alert("Erro ao atualizar status: " + error.message);
    }
  };

  const apagarFiado = async (id, nomeCliente) => {
    if (confirm(`Deseja excluir permanentemente o registro de ${nomeCliente}?`)) {
      const { error } = await supabase.from('fiados').delete().eq('id', id);
      if (!error) carregarDados();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* CABEÇALHO COM NOME DA LOJA */}
      <div className="bg-[#111827] p-6 rounded-b-3xl text-white shadow-md">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold">📝 Fiados</h1>
          <button onClick={() => window.location.href='/fiados/novo'} className="bg-emerald-500 px-3 py-1.5 text-xs font-bold rounded-lg active:scale-95">
            + Novo Cliente
          </button>
        </div>

        {/* Bloco do Nome do Estabelecimento */}
        <div className="bg-gray-800/80 p-3 rounded-xl border border-gray-700 mt-3">
          {editandoLoja ? (
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 block">Nome da sua Loja no Comprovante:</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={inputLoja} 
                  onChange={e => setInputLoja(e.target.value)} 
                  placeholder="Ex: Mercearia do João" 
                  className="w-full p-2 text-sm bg-gray-900 border border-gray-600 rounded-lg text-white"
                />
                <button onClick={salvarNomeLoja} className="bg-blue-600 text-white font-bold px-3 py-2 rounded-lg text-xs">Salvar</button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Loja / Estabelecimento:</p>
                <p className="text-sm font-bold text-emerald-400">{nomeLoja || '⚠️ Clique em "Alterar" para definir o nome da sua loja'}</p>
              </div>
              <button onClick={() => setEditandoLoja(true)} className="text-xs text-blue-400 font-bold underline">
                Alterar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 -mt-2">
        {loading ? <p className="text-center text-gray-500">Carregando...</p> : (
          <div className="space-y-4">
            {fiados.map(fiado => {
              const estaPago = fiado.status === 'pago' || Number(fiado.valor) === 0;

              return (
                <div key={fiado.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${estaPago ? 'border-emerald-300 bg-emerald-50/20' : ''}`}>
                  <div onClick={() => alternarExpandido(fiado.id)} className="p-4 flex justify-between items-center bg-white active:bg-gray-50 transition-all cursor-pointer">
                    <div>
                      <p className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        {fiado.nome_cliente} {idExpandido === fiado.id ? '👇' : '👉'}
                      </p>
                      <p className="text-xs text-gray-400">{fiado.telefone || 'Sem telefone'}</p>
                    </div>
                    <div className="text-right">
                      {estaPago ? (
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full">
                          ✅ PAGO
                        </span>
                      ) : (
                        <div>
                          <p className="font-black text-red-500 text-lg">R$ {Number(fiado.valor).toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400">Total Devendo</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {idExpandido === fiado.id && (
                    <div className="bg-gray-50 p-4 border-t border-gray-100">
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

                      {!estaPago && (
                        <div className="bg-white p-3 rounded-xl border mb-4">
                          <p className="text-xs font-bold text-gray-800 mb-2">Adicionar mais itens para {fiado.nome_cliente}:</p>
                          <div className="flex gap-2">
                            <input type="text" placeholder="O que levou?" value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} className="w-full p-2 border rounded-lg bg-gray-50 text-sm text-gray-800" />
                            <input type="number" placeholder="R$" value={novoValor} onChange={e => setNovoValor(e.target.value)} className="w-20 p-2 border rounded-lg bg-gray-50 text-sm text-gray-800" />
                          </div>
                          <button onClick={() => adicionarConta(fiado)} className="w-full mt-2 bg-blue-600 text-white font-bold p-2 rounded-lg text-sm active:scale-95">
                            Somar na Conta +
                          </button>
                        </div>
                      )}

                      <div className="space-y-2 mt-2">
                        {!estaPago && (
                          <button 
                            onClick={() => pagarEEnviarComprovante(fiado)} 
                            className="w-full bg-emerald-600 text-white font-bold p-3 rounded-xl text-sm active:scale-95 shadow-sm flex items-center justify-center gap-2"
                          >
                            ✅ Pagar Conta & Enviar Recibo WhatsApp
                          </button>
                        )}

                        <div className="flex gap-2">
                          {fiado.telefone && (
                            <a href={`https://wa.me/55${fiado.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 text-white text-center font-bold p-3 rounded-xl text-sm active:scale-95">
                              💬 WhatsApp
                            </a>
                          )}
                          <button onClick={() => apagarFiado(fiado.id, fiado.nome_cliente)} className="flex-1 bg-red-100 text-red-600 font-bold p-3 rounded-xl text-sm active:scale-95">
                            🗑️ Excluir Registro
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
