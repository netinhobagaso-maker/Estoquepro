'use client';
import { useState } from 'react';
import BottomNav from '../../components/BottomNav';

export default function Planos() {
  const [loading, setLoading] = useState(false);

  const irParaPagamento = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao redirecionar para pagamento. Verifique as chaves do Stripe.');
      }
    } catch (err) {
      alert('Erro na conexão com o servidor de pagamento.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-32">
      
      {/* HEADER DA PROMOÇÃO */}
      <div className="p-6 text-center pt-10 bg-gradient-to-b from-emerald-900/40 to-slate-950">
        <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-emerald-500/30">
          🔥 Oferta Exclusiva de Lançamento
        </span>
        <h1 className="text-3xl font-black mt-4 tracking-tight">
          Assuma o controle total da sua empresa com o <span className="text-emerald-400">Zipp PRO</span>
        </h1>
        <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
          Sistema automático de caixa, gestão de estoque por caixa/unidade e comprovantes via WhatsApp.
        </p>
      </div>

      {/* CARD DA OFERTA PRINCIPAL */}
      <div className="px-5 mt-2">
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          
          <div className="text-center pb-6 border-b border-slate-800">
            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider">Entrada Hoje</span>
            <div className="flex items-center justify-center gap-1 my-2">
              <span className="text-2xl font-bold text-emerald-400">R$</span>
              <span className="text-6xl font-black text-white">20</span>
              <span className="text-slate-400 text-sm font-semibold self-end mb-2">,00</span>
            </div>
            <p className="text-emerald-400 font-bold text-sm bg-emerald-500/10 py-1.5 px-3 rounded-xl inline-block border border-emerald-500/20">
              🎁 2 Meses Seguintes Totalmente GRÁTIS!
            </p>
          </div>

          {/* CRONOGRAMA DAS PARCELAS */}
          <div className="py-6 border-b border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              📅 Como funciona o pagamento:
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-500 text-slate-950 font-black rounded-lg w-7 h-7 flex items-center justify-center text-xs">1º</span>
                  <span>Mês 1 (Hoje)</span>
                </div>
                <strong className="text-emerald-400">R$ 20,00</strong>
              </div>

              <div className="flex items-center justify-between text-sm bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-700 text-slate-300 font-black rounded-lg w-7 h-7 flex items-center justify-center text-xs">2º</span>
                  <span>Mês 2</span>
                </div>
                <strong className="text-emerald-400 uppercase text-xs bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-500/30">Grátis R$ 0</strong>
              </div>

              <div className="flex items-center justify-between text-sm bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-700 text-slate-300 font-black rounded-lg w-7 h-7 flex items-center justify-center text-xs">3º</span>
                  <span>Mês 3</span>
                </div>
                <strong className="text-emerald-400 uppercase text-xs bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-500/30">Grátis R$ 0</strong>
              </div>

              <div className="flex items-center justify-between text-sm bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-700 text-slate-300 font-black rounded-lg w-7 h-7 flex items-center justify-center text-xs">4º+</span>
                  <span>Mês 4 em diante</span>
                </div>
                <strong className="text-white">R$ 49,99 <span className="text-xs text-slate-400 font-normal">/mês</span></strong>
              </div>
            </div>
          </div>

          {/* O QUE O SISTEMA FAZ AUTO */}
          <div className="py-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              🚀 O que você recebe no Zipp PRO:
            </h3>

            <div className="flex items-start gap-3 text-sm">
              <span className="text-emerald-400 text-base">✓</span>
              <span><strong>Cálculo de Caixas:</strong> Converte caixas/fardos em unidades e calcula o custo exato.</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-emerald-400 text-base">✓</span>
              <span><strong>Vendas Automáticas:</strong> Dá baixa no estoque no exato momento da venda.</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-emerald-400 text-base">✓</span>
              <span><strong>Comprovante no WhatsApp:</strong> Envie o recibo do cliente com 1 toque no Zap.</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <span className="text-emerald-400 text-base">✓</span>
              <span><strong>Relatório de Lucro Real:</strong> Veja faturamento diário e margem de lucro sem planilhas.</span>
            </div>
          </div>

          {/* BOTÃO DE COMPRA */}
          <button 
            onClick={irParaPagamento}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl text-lg shadow-lg shadow-emerald-500/20 active:scale-95 transition-all mt-2"
          >
            {loading ? 'Carregando Pagamento...' : 'Garantir Acesso por R$ 20'}
          </button>

          <p className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-1">
            🔒 Cartão de Crédito / Pix • Cancele quando quiser
          </p>

        </div>
      </div>

      <BottomNav />
    </div>
  );
}
