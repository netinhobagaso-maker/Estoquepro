'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Vender() {
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  
  // Lista de itens na venda atual
  const [itensVenda, setItensVenda] = useState([]);
  
  // Controle de finalização (Fiado)
  const [isFiado, setIsFiado] = useState(false);
  const [nomeCliente, setNomeCliente] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => { carregarProdutos(); }, []);

  const carregarProdutos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('produtos').select('*').eq('user_id', user.id).order('nome');
      if (data) setProdutos(data);
    }
  };

  const adicionarNaLista = () => {
    if (!produtoSelecionado || quantidade <= 0) return;
    
    const prod = produtos.find(p => p.id === produtoSelecionado);
    if (!prod) return;

    // Calcula se já tem desse item na lista para não deixar vender mais que o estoque
    const qtdJaNaLista = itensVenda.filter(i => i.id === prod.id).reduce((acc, i) => acc + i.quantidade, 0);
    
    if ((qtdJaNaLista + parseInt(quantidade)) > prod.quantidade_estoque) {
      alert(`Estoque insuficiente! Você só tem ${prod.quantidade_estoque} un disponíveis.`);
      return;
    }

    const novoItem = {
      id: prod.id,
      nome: prod.nome,
      quantidade: parseInt(quantidade),
      preco_venda: prod.preco_venda,
      custo_aquisicao: prod.custo_aquisicao || 0,
      estoque_original: prod.quantidade_estoque,
      subtotal: prod.preco_venda * quantidade
    };

    setItensVenda([...itensVenda, novoItem]);
    setProdutoSelecionado('');
    setQuantidade(1);
  };

  const removerDaLista = (index) => {
    const novaLista = [...itensVenda];
    novaLista.splice(index, 1);
    setItensVenda(novaLista);
  };

  const totalGeral = itensVenda.reduce((acc, item) => acc + item.subtotal, 0);

  const finalizarVenda = async () => {
    if (itensVenda.length === 0) return;
    if (isFiado && !nomeCliente.trim()) {
      alert("Por favor, digite o nome do cliente para anotar no fiado.");
      return;
    }

    setLoading(true);
    setErro('');
    const { data: { user } } = await supabase.auth.getUser();

    try {
      // 1. DÁ BAIXA NO ESTOQUE E REGISTRA NO RELATÓRIO (Tabela 'vendas')
      for (const item of itensVenda) {
        // Baixa no estoque
        const novoEstoque = item.estoque_original - item.quantidade;
        await supabase.from('produtos').update({ quantidade_estoque: novoEstoque }).eq('id', item.id);

        // Registro no relatório
        const { error: erroVenda } = await supabase.from('vendas').insert([{
          user_id: user.id,
          produto_id: item.id,
          quantidade_vendida: item.quantidade,
          valor_total: item.subtotal,
          lucro_realizado: (item.preco_venda - item.custo_aquisicao) * item.quantidade
        }]);

        // ALERTA DE ERRO DE BANCO DE DADOS EXIBIDO NA TELA
        if (erroVenda) throw new Error("Erro na Tabela Vendas: " + erroVenda.message);
      }

      // 2. SE FOR FIADO, GRAVA NO CADERNO DE FIADOS
      if (isFiado) {
        const descricaoFiado = itensVenda.map(i => `${i.quantidade}x ${i.nome}`).join(', ');
        const { error: erroFiado } = await supabase.from('fiados').insert([{
          user_id: user.id,
          cliente: nomeCliente,
          valor: totalGeral,
          descricao: descricaoFiado,
          status: 'pendente'
        }]);

        if (erroFiado) throw new Error("Erro na Tabela Fiados: " + erroFiado.message);
      }

      // SUCESSO!
      setSucesso(isFiado ? `Venda anotada no fiado para ${nomeCliente}!` : 'Venda paga e finalizada com sucesso!');
      setItensVenda([]);
      setIsFiado(false);
      setNomeCliente('');
      carregarProdutos(); // Atualiza o estoque na tela
      
      setTimeout(() => setSucesso(''), 4000);

    } catch (error) {
      // ESSE ERRO VAI TE MOSTRAR EXATAMENTE O QUE O SUPABASE RECUSOU
      setErro(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32 p-6">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Registrar Venda 💰</h1>

        {/* ÁREA DE ADICIONAR ITENS */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Buscar Produto</label>
            <select value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)} className="w-full p-3 border rounded-xl bg-white mt-1">
              <option value="">Selecione o produto...</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>{p.nome} - R$ {p.preco_venda.toFixed(2)} (Estoque: {p.quantidade_estoque})</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="w-1/3">
              <label className="text-xs font-bold text-gray-500 uppercase">Qtd</label>
              <input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="w-full p-3 border rounded-xl mt-1 text-center font-bold" />
            </div>
            <div className="w-2/3 flex items-end">
              <button onClick={adicionarNaLista} className="w-full bg-blue-100 text-blue-700 font-bold py-3 rounded-xl border border-blue-200 active:scale-95">
                + Adicionar Item
              </button>
            </div>
          </div>
        </div>

        {/* LISTA DE ITENS DA VENDA */}
        {itensVenda.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-xl border border-emerald-100">
            <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">Itens na Venda:</h3>
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {itensVenda.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded-lg border">
                  <div>
                    <span className="font-bold text-gray-800">{item.quantidade}x</span> {item.nome}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-600">R$ {item.subtotal.toFixed(2)}</span>
                    <button onClick={() => removerDaLista(index)} className="text-red-500 font-black">X</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center bg-gray-900 text-white p-4 rounded-xl mb-4">
              <span className="font-bold uppercase">Total Geral:</span>
              <span className="text-2xl font-black text-emerald-400">R$ {totalGeral.toFixed(2)}</span>
            </div>

            {/* OPÇÕES DE FINALIZAÇÃO */}
            <div className="space-y-3 border-t pt-4">
              <label className="flex items-center gap-2 font-bold text-gray-700">
                <input type="checkbox" checked={isFiado} onChange={(e) => setIsFiado(e.target.checked)} className="w-5 h-5 accent-orange-500" />
                ⚠️ Marcar como Fiado (Não foi pago)
              </label>

              {isFiado && (
                <input type="text" placeholder="Nome do Cliente (Quem está devendo?)" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} className="w-full p-3 border-2 border-orange-300 rounded-xl outline-none focus:border-orange-500" />
              )}

              <button onClick={finalizarVenda} disabled={loading} className={`w-full text-white font-bold py-4 rounded-xl shadow-md active:scale-95 transition-all text-lg ${isFiado ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {loading ? 'Processando...' : (isFiado ? 'Anotar no Caderno de Fiados 📝' : 'Finalizar Venda (Pago) ✅')}
              </button>
            </div>
          </div>
        )}

        {/* ALERTAS NA TELA */}
        {erro && (
          <div className="bg-red-100 text-red-800 p-4 rounded-xl font-bold text-sm text-center border border-red-300">
            ⚠️ O BANCO DE DADOS RECUSOU: {erro} <br/> 
            (Verifique se você rodou o código SQL no Supabase!)
          </div>
        )}
        {sucesso && (
          <div className="bg-emerald-100 text-emerald-800 p-4 rounded-xl font-bold text-center border border-emerald-300">
            ✅ {sucesso}
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  );
}
