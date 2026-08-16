'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';
import { useRouter } from 'next/navigation';

export default function Vender() {
  const router = useRouter();
  const [produtos, setProdutos] = useState([]);
  const [clientesFiado, setClientesFiado] = useState([]);
  const [busca, setBusca] = useState('');
  
  // O carrinho agora é um objeto de quantidades { id_do_produto: quantidade }
  const [quantidades, setQuantidades] = useState({});
  
  // Controle de Modais
  const [modalPagamento, setModalPagamento] = useState(false);
  const [modalFiado, setModalFiado] = useState(false);
  
  // Estado para o Fiado
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [novoClienteNome, setNovoClienteNome] = useState('');

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Carrega produtos com estoque
      const { data: prodData } = await supabase.from('produtos')
        .select('*').eq('user_id', user.id).gt('quantidade_estoque', 0).order('nome');
      if (prodData) setProdutos(prodData);

      // Carrega clientes do fiado
      const { data: cliData } = await supabase.from('fiados')
        .select('*').eq('user_id', user.id).order('nome_cliente');
      if (cliData) setClientesFiado(cliData);
    }
  };

  // Funções do Carrinho Intuitivo (+ e -)
  const incrementar = (produto) => {
    const qtdAtual = quantidades[produto.id] || 0;
    if (qtdAtual >= produto.quantidade_estoque) return alert("Estoque insuficiente!");
    setQuantidades({ ...quantidades, [produto.id]: qtdAtual + 1 });
  };

  const decrementar = (produto) => {
    const qtdAtual = quantidades[produto.id] || 0;
    if (qtdAtual <= 1) {
      const novasQtds = { ...quantidades };
      delete novasQtds[produto.id];
      setQuantidades(novasQtds);
    } else {
      setQuantidades({ ...quantidades, [produto.id]: qtdAtual - 1 });
    }
  };

  const itensCarrinho = produtos.filter(p => quantidades[p.id] > 0).map(p => ({
    ...p,
    quantidade: quantidades[p.id]
  }));

  const totalCarrinho = itensCarrinho.reduce((acc, item) => acc + (Number(item.preco_venda) * item.quantidade), 0);

  // Função centralizada para registrar Venda (Dinheiro, Cartão, Pix ou Fiado)
  const processarVenda = async (formaPagamento) => {
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Desconta o estoque de cada produto
    for (const item of itensCarrinho) {
      const novoEstoque = item.quantidade_estoque - item.quantidade;
      await supabase.from('produtos').update({ quantidade_estoque: novoEstoque }).eq('id', item.id);
    }

    // 2. Sistema Inteligente de Salvamento (Tenta 'valor_total' e 'total' para evitar erros)
    let erroBanco = null;
    const { error: err1 } = await supabase.from('vendas').insert([{ 
      user_id: user.id, valor_total: totalCarrinho, itens: itensCarrinho, forma_pagamento: formaPagamento 
    }]);

    if (err1) {
      const { error: err2 } = await supabase.from('vendas').insert([{ 
        user_id: user.id, total: totalCarrinho, itens: itensCarrinho, forma_pagamento: formaPagamento 
      }]);
      if (err2) erroBanco = err2;
    }

    if (erroBanco) {
      alert("ERRO AO SALVAR VENDA: " + erroBanco.message);
      return false; // Falhou
    }
    
    return true; // Sucesso
  };

  // Venda Normal
  const finalizarVendaComum = async (formaPagamento) => {
    const sucesso = await processarVenda(formaPagamento);
    if (sucesso) {
      alert(`✅ Venda no ${formaPagamento} registrada com sucesso!`);
      limparTela();
    }
  };

  // Venda no Fiado (Pendurar)
  const finalizarFiado = async () => {
    if (!clienteSelecionado && !novoClienteNome) return alert("Selecione ou digite o nome do cliente.");
    const { data: { user } } = await supabase.auth.getUser();
    
    const descItens = itensCarrinho.map(item => `${item.quantidade}x ${item.nome}`).join(' + ');
    let clienteId = clienteSelecionado;
    
    // Cria ou atualiza a ficha do cliente
    if (clienteId === 'novo') {
      const { data: novoCliente, error } = await supabase.from('fiados').insert({
        user_id: user.id, nome_cliente: novoClienteNome, valor: totalCarrinho, status: 'pendente',
        historico: [{ data: new Date().toISOString(), desc: descItens, val: totalCarrinho }]
      }).select().single();
      
      if (error) return alert("Erro ao criar cliente: " + error.message);
      clienteId = novoCliente.id;
    } else {
      const clienteData = clientesFiado.find(c => c.id === clienteId);
      const historicoAtual = clienteData.status === 'pago' ? [] : (clienteData.historico || []);
      const novoHistorico = [...historicoAtual, { data: new Date().toISOString(), desc: descItens, val: totalCarrinho }];
      const novoValor = (clienteData.status === 'pago' ? 0 : Number(clienteData.valor)) + totalCarrinho;
      
      await supabase.from('fiados').update({ 
        valor: novoValor, status: 'pendente', historico: novoHistorico 
      }).eq('id', clienteId);
    }

    // Registra a venda no banco para o Relatório
    const sucesso = await processarVenda('Fiado');
    if (sucesso) {
      alert("📝 Pendurado com sucesso! Fatura do cliente atualizada.");
      limparTela();
    }
  };

  const limparTela = () => {
    setQuantidades({});
    setModalPagamento(false);
    setModalFiado(false);
    setClienteSelecionado('');
    setNovoClienteNome('');
    carregarDados();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Cabeçalho */}
      <div className="bg-[#111827] pt-8 pb-6 px-6 text-white rounded-b-[2rem] shadow-md">
        <h1 className="text-2xl font-bold mb-4">🛒 Ponto de Venda</h1>
        <input type="text" placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full p-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 border border-gray-700 outline-none focus:border-[#10b981]" />
      </div>

      {/* Lista Intuitiva de Produtos */}
      <div className="px-6 mt-6 space-y-3">
        {produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase())).map(produto => (
          <div key={produto.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-800 text-[15px]">{produto.nome}</p>
              <p className="text-[#10b981] font-black text-sm">R$ {Number(produto.preco_venda).toFixed(2)}</p>
              <p className="text-[11px] text-gray-400 mt-1 font-semibold">Em estoque: {produto.quantidade_estoque}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {quantidades[produto.id] ? (
                <>
                  <button onClick={() => decrementar(produto)} className="w-8 h-8 flex justify-center items-center bg-red-100 text-red-600 rounded-full font-black text-lg active:scale-90">-</button>
                  <span className="font-black text-gray-800 w-4 text-center">{quantidades[produto.id]}</span>
                  <button onClick={() => incrementar(produto)} className="w-8 h-8 flex justify-center items-center bg-[#10b981] text-white rounded-full font-black text-lg active:scale-90">+</button>
                </>
              ) : (
                <button onClick={() => incrementar(produto)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs active:scale-95 border border-gray-200">
                  Adicionar
                </button>
              )}
            </div>
          </div>
        ))}
        {produtos.length === 0 && <p className="text-center text-gray-500 text-sm mt-10">Nenhum produto em estoque.</p>}
      </div>

      {/* Botão Flutuante de Cobrar (Aparece só se tiver item no carrinho) */}
      {totalCarrinho > 0 && (
        <div className="fixed bottom-[80px] left-0 right-0 px-6 z-40">
          <button onClick={() => setModalPagamento(true)} className="w-full bg-[#10b981] text-white p-4 rounded-2xl font-black text-lg shadow-[0_10px_20px_rgba(16,185,129,0.3)] flex justify-between items-center active:scale-95 transition-transform">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-1 rounded-lg text-sm">{itensCarrinho.reduce((a, b) => a + b.quantidade, 0)} itens</span>
              <span>Cobrar</span>
            </div>
            <span>R$ {totalCarrinho.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modal 1: Escolher Forma de Pagamento */}
      {modalPagamento && !modalFiado && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
          <div className="bg-white w-full rounded-t-3xl p-6 pb-10 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-xl text-gray-800">Como vai pagar?</h3>
              <button onClick={() => setModalPagamento(false)} className="text-gray-400 font-bold text-xl px-2">×</button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-2xl mb-6 flex justify-between items-center">
              <span className="text-gray-500 font-bold text-sm">Total a cobrar</span>
              <span className="text-3xl font-black text-[#10b981]">R$ {totalCarrinho.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button onClick={() => finalizarVendaComum('Dinheiro')} className="p-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-700 active:bg-gray-50 shadow-sm text-sm">💵 Dinheiro</button>
              <button onClick={() => finalizarVendaComum('Pix')} className="p-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-700 active:bg-gray-50 shadow-sm text-sm">📱 Pix</button>
              <button onClick={() => finalizarVendaComum('Cartão')} className="p-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-700 active:bg-gray-50 shadow-sm text-sm">💳 Cartão</button>
              <button onClick={() => setModalFiado(true)} className="p-4 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-2xl font-bold active:bg-blue-100 shadow-sm text-sm">📝 Pendurar (Fiado)</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Escolher Cliente do Fiado */}
      {modalFiado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-black text-xl mb-1 text-gray-800 flex items-center gap-2">📝 Lançar Fiado</h3>
            <p className="text-sm text-gray-500 mb-5">Valor: <span className="font-bold text-[#10b981]">R$ {totalCarrinho.toFixed(2)}</span></p>
            
            <label className="text-xs font-bold text-gray-600 block mb-2">Para qual cliente?</label>
            <select 
              className="w-full p-4 border-2 border-gray-100 rounded-xl mb-4 text-sm bg-gray-50 outline-none focus:border-blue-500 font-semibold text-gray-700"
              value={clienteSelecionado}
              onChange={(e) => setClienteSelecionado(e.target.value)}
            >
              <option value="" disabled>Selecione um cliente...</option>
              <option value="novo">➕ NOVO CLIENTE</option>
              {clientesFiado.map(c => (
                <option key={c.id} value={c.id}>{c.nome_cliente}</option>
              ))}
            </select>

            {clienteSelecionado === 'novo' && (
              <input type="text" placeholder="Nome do novo cliente..." value={novoClienteNome} onChange={(e) => setNovoClienteNome(e.target.value)} className="w-full p-4 border-2 border-gray-100 rounded-xl mb-6 text-sm bg-gray-50 outline-none focus:border-blue-500 font-bold text-gray-800" />
            )}
            
            <div className="flex gap-2 mt-2">
              <button onClick={() => setModalFiado(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold p-4 rounded-xl active:scale-95">Voltar</button>
              <button onClick={finalizarFiado} className="flex-[2] bg-blue-600 text-white font-black p-4 rounded-xl active:scale-95 shadow-md">Confirmar Fiado</button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
