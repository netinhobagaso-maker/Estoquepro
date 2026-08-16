'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';
import { useRouter } from 'next/navigation';

export default function Vender() {
  const router = useRouter();
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [busca, setBusca] = useState('');
  
  // Controles do Fiado Automático
  const [modalFiado, setModalFiado] = useState(false);
  const [clientesFiado, setClientesFiado] = useState([]);
  const [clienteSelecionado, setClienteSelecionado] = useState('');
  const [novoClienteNome, setNovoClienteNome] = useState('');

  useEffect(() => {
    carregarProdutos();
    carregarClientesFiado();
  }, []);

  const carregarProdutos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Puxa só os produtos que tem estoque > 0
      const { data } = await supabase.from('produtos').select('*').eq('user_id', user.id).gt('quantidade_estoque', 0).order('nome');
      if (data) setProdutos(data);
    }
  };

  const carregarClientesFiado = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('fiados').select('*').eq('user_id', user.id).order('nome_cliente');
      if (data) setClientesFiado(data);
    }
  };

  const adicionarAoCarrinho = (produto) => {
    const itemExistente = carrinho.find(item => item.id === produto.id);
    if (itemExistente) {
      if (itemExistente.quantidade >= produto.quantidade_estoque) return alert("Estoque insuficiente!");
      setCarrinho(carrinho.map(item => item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item));
    } else {
      setCarrinho([...carrinho, { ...produto, quantidade: 1 }]);
    }
  };

  const removerDoCarrinho = (id) => {
    setCarrinho(carrinho.filter(item => item.id !== id));
  };

  const totalCarrinho = carrinho.reduce((acc, item) => acc + (Number(item.preco_venda) * item.quantidade), 0);

  // Venda Comum (Dinheiro, Cartão, Pix) - Registra e Desconta Estoque
  const finalizarVenda = async (formaPagamento = 'Dinheiro') => {
    if (carrinho.length === 0) return alert("Carrinho vazio!");
    const { data: { user } } = await supabase.auth.getUser();
    
    // 1. Desconta do estoque
    for (const item of carrinho) {
      const novoEstoque = item.quantidade_estoque - item.quantidade;
      await supabase.from('produtos').update({ quantidade_estoque: novoEstoque }).eq('id', item.id);
    }

    // 2. Salva a venda para aparecer no RELATÓRIO
    const { error } = await supabase.from('vendas').insert({
      user_id: user.id, 
      total: totalCarrinho, 
      itens: carrinho, 
      forma_pagamento: formaPagamento
    });

    if (!error) {
      alert("✅ Venda finalizada com sucesso!");
      setCarrinho([]);
      carregarProdutos();
    } else {
      alert("Erro ao registrar venda.");
    }
  };

  // Venda Fiado - ENVIO AUTOMÁTICO PARA A TELA DE FIADOS
  const finalizarVendaFiado = async () => {
    if (!clienteSelecionado && !novoClienteNome) return alert("Selecione ou digite o nome do cliente.");
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Cria o texto que vai pro histórico do cliente. Ex: "2x Coca Cola + 1x Redbull"
    const descItens = carrinho.map(item => `${item.quantidade}x ${item.nome}`).join(' + ');
    
    let clienteId = clienteSelecionado;
    
    // Se for cliente novo, cria a ficha dele
    if (clienteId === 'novo') {
      const { data: novoCliente, error } = await supabase.from('fiados').insert({
        user_id: user.id, 
        nome_cliente: novoClienteNome, 
        valor: totalCarrinho, 
        status: 'pendente',
        historico: [{ data: new Date().toISOString(), desc: descItens, val: totalCarrinho }]
      }).select().single();
      
      if (error) return alert("Erro ao criar cliente.");
      clienteId = novoCliente.id;
    } else {
      // Se já existe, atualiza a dívida dele
      const clienteData = clientesFiado.find(c => c.id === clienteId);
      const historicoAtual = clienteData.status === 'pago' ? [] : (clienteData.historico || []);
      const novoHistorico = [...historicoAtual, { data: new Date().toISOString(), desc: descItens, val: totalCarrinho }];
      const novoValor = (clienteData.status === 'pago' ? 0 : Number(clienteData.valor)) + totalCarrinho;
      
      await supabase.from('fiados').update({ 
        valor: novoValor, 
        status: 'pendente', 
        historico: novoHistorico 
      }).eq('id', clienteId);
    }

    // 1. Desconta o estoque
    for (const item of carrinho) {
      const novoEstoque = item.quantidade_estoque - item.quantidade;
      await supabase.from('produtos').update({ quantidade_estoque: novoEstoque }).eq('id', item.id);
    }

    // 2. Salva a venda para aparecer no RELATÓRIO (como Fiado)
    await supabase.from('vendas').insert({
      user_id: user.id, 
      total: totalCarrinho, 
      itens: carrinho, 
      forma_pagamento: 'Fiado'
    });

    alert("📝 Pendurado com sucesso! Fatura do cliente atualizada.");
    setModalFiado(false);
    setCarrinho([]);
    setClienteSelecionado('');
    setNovoClienteNome('');
    carregarProdutos();
    carregarClientesFiado();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#111827] pt-8 pb-6 px-6 text-white rounded-b-[2rem] shadow-md">
        <h1 className="text-2xl font-bold mb-4">🛒 Nova Venda</h1>
        <input type="text" placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full p-3 rounded-xl bg-gray-800 text-white placeholder-gray-400 border border-gray-700 outline-none focus:border-[#10b981]" />
      </div>

      <div className="px-6 mt-6 grid grid-cols-1 gap-6">
        <div>
          <h2 className="font-bold text-gray-800 mb-3">Toque para vender:</h2>
          <div className="grid grid-cols-2 gap-3">
            {produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase())).map(produto => (
              <div key={produto.id} onClick={() => adicionarAoCarrinho(produto)} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-95 transition-transform cursor-pointer">
                <p className="font-bold text-gray-800 text-sm truncate">{produto.nome}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[#10b981] font-black">R$ {Number(produto.preco_venda).toFixed(2)}</span>
                  <span className="text-[10px] bg-gray-100 px-2 py-1 rounded text-gray-500 font-bold">{produto.quantidade_estoque} un.</span>
                </div>
              </div>
            ))}
            {produtos.length === 0 && <p className="text-gray-500 text-sm col-span-2">Nenhum produto em estoque.</p>}
          </div>
        </div>

        {carrinho.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-lg border border-[#10b981]">
            <h2 className="font-black text-gray-800 mb-4 border-b pb-2">🛒 Seu Carrinho</h2>
            <div className="space-y-3 mb-4">
              {carrinho.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 w-6 h-6 flex items-center justify-center rounded text-xs font-bold">{item.quantidade}x</span>
                    <span className="text-sm font-semibold text-gray-700 truncate w-32">{item.nome}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">R$ {(item.preco_venda * item.quantidade).toFixed(2)}</span>
                    <button onClick={() => removerDoCarrinho(item.id)} className="text-red-500 font-black text-lg p-1">×</button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl mb-4">
              <span className="font-bold text-gray-600 uppercase text-xs">Total:</span>
              <span className="font-black text-2xl text-[#10b981]">R$ {totalCarrinho.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => finalizarVenda('Dinheiro')} className="bg-[#10b981] text-white p-3 rounded-xl font-bold shadow-md active:scale-95 text-sm">
                💵 Receber
              </button>
              <button onClick={() => setModalFiado(true)} className="bg-blue-600 text-white p-3 rounded-xl font-bold shadow-md active:scale-95 text-sm">
                📝 Pendurar (Fiado)
              </button>
            </div>
          </div>
        )}
      </div>

      {modalFiado && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-black text-xl mb-1 text-gray-800">Finalizar no Fiado</h3>
            <p className="text-sm text-gray-500 mb-5">Valor a pendurar: <span className="font-bold text-[#10b981]">R$ {totalCarrinho.toFixed(2)}</span></p>
            
            <label className="text-xs font-bold text-gray-600 block mb-2">Qual o cliente?</label>
            <select 
              className="w-full p-3 border-2 border-gray-100 rounded-xl mb-4 text-sm bg-gray-50 outline-none focus:border-blue-500"
              value={clienteSelecionado}
              onChange={(e) => setClienteSelecionado(e.target.value)}
            >
              <option value="" disabled>Selecione um cliente...</option>
              <option value="novo">➕ Cadastrar Novo Cliente</option>
              {clientesFiado.map(c => (
                <option key={c.id} value={c.id}>{c.nome_cliente}</option>
              ))}
            </select>

            {clienteSelecionado === 'novo' && (
              <input type="text" placeholder="Digite o nome dele..." value={novoClienteNome} onChange={(e) => setNovoClienteNome(e.target.value)} className="w-full p-3 border-2 border-gray-100 rounded-xl mb-6 text-sm bg-gray-50 outline-none focus:border-blue-500" />
            )}
            
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModalFiado(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold p-3 rounded-xl active:scale-95">Cancelar</button>
              <button onClick={finalizarVendaFiado} className="flex-1 bg-blue-600 text-white font-black p-3 rounded-xl active:scale-95 shadow-md">Confirmar Fiado</button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
