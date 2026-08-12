'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Vender() {
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [loading, setLoading] = useState(false);
  const [vendaFinalizada, setVendaFinalizada] = useState(null); // Guarda os dados da venda feita
  const [erro, setErro] = useState('');

  useEffect(() => {
    const buscarProdutos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('produtos').select('*').eq('user_id', user.id);
        if (data) setProdutos(data);
      }
    };
    buscarProdutos();
  }, []);

  const realizarVenda = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    const { data: { user } } = await supabase.auth.getUser();
    const produto = produtos.find(p => p.id === produtoSelecionado);

    if (!user || !produto) {
      setErro('Selecione um produto.');
      setLoading(false); return;
    }
    if (produto.quantidade_estoque < quantidade) {
      setErro(`Você só tem ${produto.quantidade_estoque} no estoque!`);
      setLoading(false); return;
    }

    const valorTotal = produto.preco_venda * quantidade;
    const lucroRealizado = (produto.preco_venda - produto.custo_aquisicao) * quantidade;

    const { data: vendaCadastrada, error } = await supabase.from('vendas').insert([{
      user_id: user.id,
      produto_id: produto.id,
      quantidade_vendida: parseInt(quantidade),
      valor_total: valorTotal,
      lucro_realizado: lucroRealizado
    }]).select(); // .select() para retornar os dados inseridos

    if (error) {
      setErro(error.message);
    } else {
      // Atualiza o estoque na tela
      setProdutos(produtos.map(p => p.id === produto.id ? {...p, quantidade_estoque: p.quantidade_estoque - quantidade} : p));
      
      // Mostra a tela de sucesso
      setVendaFinalizada({
        produtoNome: produto.nome,
        qtd: quantidade,
        valor: valorTotal.toFixed(2),
        data: new Date().toLocaleTimeString()
      });
    }
    setLoading(false);
  };

  const compartilharWhatsApp = () => {
    if (!vendaFinalizada) return;
    const texto = `🧾 *Comprovante de Compra*\n\n*Item:* ${vendaFinalizada.produtoNome}\n*Quantidade:* ${vendaFinalizada.qtd}\n*Total:* R$ ${vendaFinalizada.valor}\n\n_Obrigado por comprar conosco!_`;
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  const novaVenda = () => {
    setVendaFinalizada(null);
    setQuantidade(1);
    setProdutoSelecionado('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-emerald-500 p-6 shadow-sm rounded-b-3xl">
        <h1 className="text-2xl font-bold text-white">Nova Venda 💰</h1>
      </div>
      
      <div className="p-6 -mt-4">
        
        {/* TELA DE SUCESSO PÓS-VENDA */}
        {vendaFinalizada ? (
          <div className="bg-white p-6 rounded-2xl shadow-xl border text-center space-y-6">
            <div className="text-6xl">✅</div>
            <h2 className="text-2xl font-black text-gray-800">Venda Concluída!</h2>
            <div className="bg-gray-50 p-4 rounded-xl text-left border">
              <p><strong>Item:</strong> {vendaFinalizada.produtoNome}</p>
              <p><strong>Quantidade:</strong> {vendaFinalizada.qtd}</p>
              <p className="text-xl font-bold mt-2">Total: R$ {vendaFinalizada.valor}</p>
            </div>
            
            <button onClick={compartilharWhatsApp} className="w-full bg-[#25D366] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
              📱 Enviar Comprovante no Zap
            </button>
            <button onClick={novaVenda} className="w-full bg-gray-200 text-gray-800 font-bold py-4 rounded-xl">
              Fazer Nova Venda
            </button>
          </div>
        ) : (
          /* FORMULÁRIO DE VENDA NORMAL */
          <form onSubmit={realizarVenda} className="bg-white p-5 rounded-2xl shadow-xl border border-gray-100 space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-bold">O que você está vendendo?</label>
              <select required value={produtoSelecionado} onChange={(e) => setProdutoSelecionado(e.target.value)} className="w-full p-3 border rounded-xl bg-white mt-1">
                <option value="">Selecione o produto...</option>
                {produtos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} (Estoque: {p.quantidade_estoque}) - R$ {p.preco_venda}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 font-bold">Quantas unidades?</label>
              <input required type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="w-full p-3 border rounded-xl mt-1 text-2xl text-center font-bold" />
            </div>

            {produtoSelecionado && (
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-sm text-gray-500">Valor Total a Cobrar</p>
                <p className="text-3xl font-black text-gray-900">
                  R$ {((produtos.find(p => p.id === produtoSelecionado)?.preco_venda || 0) * quantidade).toFixed(2)}
                </p>
              </div>
            )}
            
            {erro && <p className="font-bold text-center text-red-600">❌ {erro}</p>}
            
            <button type="submit" disabled={loading || !produtoSelecionado} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl">
              {loading ? 'Processando...' : 'Finalizar Venda'}
            </button>
          </form>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
