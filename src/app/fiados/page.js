'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';
import { useRouter } from 'next/navigation';

export default function Fiados() {
  const router = useRouter();
  const [fiados, setFiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [idExpandido, setIdExpandido] = useState(null);

  // Configuração da Loja
  const [nomeLoja, setNomeLoja] = useState('');
  const [editandoLoja, setEditandoLoja] = useState(false);
  const [inputLoja, setInputLoja] = useState('');

  // Estados para adicionar nova dívida
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novoValor, setNovoValor] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: dadosFiados } = await supabase.from('fiados').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (dadosFiados) setFiados(dadosFiados);

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
    const { error } = await supabase.from('configuracoes').upsert({ user_id: user.id, nome_loja: inputLoja }, { onConflict: 'user_id' });
    if (!error) {
      setNomeLoja(inputLoja);
      setEditandoLoja(false);
      alert("Nome da loja salvo com sucesso! 🏪");
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
    const novoTotal = Number(fiado.valor || 0) + valorAdicional;
    const historicoAtual = fiado.historico || [];
    
    if (historicoAtual.length === 0 && fiado.descricao) {
       historicoAtual.push({ data: fiado.created_at, desc: fiado.descricao, val: fiado.valor });
    }

    const itemNovo = { data: new Date().toISOString(), desc: novaDescricao, val: valorAdicional };
    const novoHistorico = [...historicoAtual, itemNovo];

    // A MÁGICA DE VOLTAR PARA DEVENDO (status: 'pendente')
    const { error } = await supabase.from('fiados')
      .update({ valor: novoTotal, status: 'pendente', historico: novoHistorico, descricao: 'Vários itens' })
      .eq('id', fiado.id);

    if (!error) {
      alert("Produto adicionado à conta com sucesso!");
      setNovaDescricao('');
      setNovoValor('');
      carregarDados();
    } else {
      alert("Erro ao adicionar: " + error.message);
    }
  };

  const pagarEEnviarComprovante = async (fiado) => {
    if (!fiado.telefone) return alert("Este cliente não tem telefone cadastrado.");

    const lojaFinal = nomeLoja || 'Meu Comércio';
    const valorPago = Number(fiado.valor).toFixed(2);
    const mensagem = `Olá *${fiado.nome_cliente}*! 👋\nAqui é da *${lojaFinal}*.\n\nPassando para confirmar que o seu fiado no valor de *R$ ${valorPago}* foi pago e quitado com sucesso! ✅\n\nMuito obrigado pela preferência e volte sempre! 🙏✨`;
    const telefoneLimpo = fiado.telefone.replace(/\D/g, '');
    const linkWhatsApp = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;

    // Zera o valor e muda para PAGO
    const { error } = await supabase.from('fiados')
      .update({ valor: 0, status: 'pago' })
      .eq('id', fiado.id);

    if (!error) {
      window.open(linkWhatsApp, '_blank');
      carregarDados();
    }
  };

  const apagarFiado = async (id, nomeCliente) => {
    if (confirm(`Deseja excluir permanentemente o cliente ${nomeCliente}?`)) {
      await supabase.from('fiados').delete().eq('id', id);
      carregarDados();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* CABEÇALHO */}
      <div className="bg-[#111827] pt-8 pb-8 px-6 rounded-b-[2rem] text-white shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">📝 Fiados</h1>
          {/* BOTÃO DE NOVO CLIENTE AQUI */}
          <button onClick={() => router.push('/fiados/novo')} className="bg-[#10b981] px-4 py-2 text-sm font-bold rounded-xl shadow-md active:scale-95 transition-transform">
            + Novo Cliente
          </button>
        </div>

        {/* NOME DA LOJA */}
        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          {editandoLoja ? (
            <div className="space-y-2">
              <label className="text-xs uppercase font-bold text-gray-400 block">Nome no Comprovante:</label>
              <div className="flex gap-2">
                <input type="text" value={inputLoja} onChange={e => setInputLoja(e.target.value)} placeholder="Ex: Mercearia do João" className="w-full p-2 text-sm bg-gray-900 border border-gray-600 rounded-lg text-white" />
                <button onClick={salvarNomeLoja} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-sm">Salvar</button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Loja / Estabelecimento:</p>
                <p className="text-base font-bold text-[#10b981]">{nomeLoja || '⚠️ Clique em "Alterar" para definir sua loja'}</p>
              </div>
              <button onClick={() => setEditandoLoja(true)} className="text-sm text-blue-400 font-bold underline p-2">Alterar</button>
            </div>
          )}
        </div>
      </div>

      {/* LISTA DE CLIENTES */}
      <div className="px-6 mt-6">
        {loading ? <p className="text-center text-gray-500">Carregando...</p> : (
          <div className="space-y-4">
            {fiados.map(fiado => {
              const estaPago = fiado.status === 'pago' || Number(fiado.valor) === 0;

              return (
                <div key={fiado.id} className={`bg-white rounded-2xl shadow-sm border ${estaPago ? 'border-emerald-300' : 'border-gray-100'} overflow-hidden`}>
                  <div onClick={() => alternarExpandido(fiado.id)} className={`p-5 flex justify-between items-center active:bg-gray-50 transition-all cursor-pointer ${estaPago ? 'bg-emerald-50/30' : ''}`}>
                    <div>
                      <p className="font-bold text-gray-800 text-lg">{fiado.nome_cliente}</p>
                      <p className="text-xs text-gray-400 mt-1">{fiado.telefone || 'Sem telefone'}</p>
                    </div>
                    <div className="text-right">
                      {estaPago ? (
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-full">✅ PAGO</span>
                      ) : (
                        <div>
                          <p className="font-black text-red-500 text-xl">R$ {Number(fiado.valor).toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Devendo</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ÁREA EXPANDIDA DO CLIENTE */}
                  {idExpandido === fiado.id && (
                    <div className="bg-gray-50 p-5 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-gray-500 mb-3 uppercase">Histórico</h4>
                      <ul className="mb-5 space-y-2">
                        {fiado.historico && fiado.historico.length > 0 ? (
                          fiado.historico.map((h, i) => (
                            <li key={i} className="flex justify-between text-sm text-gray-700 border-b border-gray-200 border-dashed pb-2">
                              <span>{h.desc}</span>
                              <span className="font-bold text-gray-900">R$ {Number(h.val).toFixed(2)}</span>
                            </li>
                          ))
                        ) : (
                          <li className="flex justify-between text-sm text-gray-700 border-b border-gray-200 border-dashed pb-2">
                              <span>{fiado.descricao}</span>
                              <span className="font-bold text-gray-900">R$ {Number(fiado.valor).toFixed(2)}</span>
                          </li>
                        )}
                      </ul>

                      {/* ADICIONAR NOVO PRODUTO NA CONTA */}
                      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-4 shadow-sm">
                        <p className="text-xs font-bold text-gray-800 mb-3">Adicionar na conta de {fiado.nome_cliente}:</p>
                        <div className="flex gap-2">
                          <input type="text" placeholder="Item" value={novaDescricao} onChange={e => setNovaDescricao(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 text-sm text-gray-800" />
                          <input type="number" placeholder="R$" value={novoValor} onChange={e => setNovoValor(e.target.value)} className="w-24 p-3 border rounded-xl bg-gray-50 text-sm text-gray-800" />
                        </div>
                        <button onClick={() => adicionarConta(fiado)} className="w-full mt-3 bg-blue-600 text-white font-bold p-3 rounded-xl text-sm active:scale-95 shadow-md">
                          ➕ Somar na Conta
                        </button>
                      </div>

                      {/* BOTÕES DE AÇÃO (PAGAR, WHATSAPP, EXCLUIR) */}
                      <div className="space-y-3 mt-2">
                        {!estaPago && (
                          <button onClick={() => pagarEEnviarComprovante(fiado)} className="w-full bg-[#10b981] text-white font-bold p-4 rounded-xl text-sm active:scale-95 shadow-md flex items-center justify-center gap-2">
                            ✅ Pagar Conta e Enviar Recibo 
                          </button>
                        )}

                        <div className="flex gap-3">
                          {fiado.telefone && (
                            <a href={`https://wa.me/55${fiado.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 bg-green-500 text-white text-center font-bold p-3 rounded-xl text-sm active:scale-95 shadow-sm">
                              💬 WhatsApp
                            </a>
                          )}
                          <button onClick={() => apagarFiado(fiado.id, fiado.nome_cliente)} className="flex-1 bg-red-50 text-red-600 font-bold p-3 rounded-xl text-sm active:scale-95 border border-red-100">
                            🗑️ Excluir Cliente
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
