'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BottomNav from '../../components/BottomNav';

export default function Relatorios() {
  const [vendasHoje, setVendasHoje] = useState({ total: 0, lucro: 0 });
  const [vendasSemana, setVendasSemana] = useState({ total: 0, lucro: 0 });
  const [vendasMes, setVendasMes] = useState({ total: 0, lucro: 0 });

  useEffect(() => {
    carregarRelatorios();
  }, []);

  const carregarRelatorios = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Pega todas as vendas cadastradas pelo usuário
    const { data: vendas } = await supabase.from('vendas').select('*').eq('user_id', user.id);
    if (!vendas) return;

    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    
    const inicioSemana = new Date(inicioHoje);
    inicioSemana.setDate(inicioHoje.getDate() - hoje.getDay()); // Define para o domingo da semana atual
    
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    let tHoje = 0, lHoje = 0;
    let tSemana = 0, lSemana = 0;
    let tMes = 0, lMes = 0;

    vendas.forEach(v => {
      const dataVenda = new Date(v.created_at);
      const valor = parseFloat(v.valor_total) || 0;
      const lucro = parseFloat(v.total_lucro) || 0;

      if (dataVenda >= inicioMes) {
        tMes += valor; lMes += lucro;
      }
      if (dataVenda >= inicioSemana) {
        tSemana += valor; lSemana += lucro;
      }
      if (dataVenda >= inicioHoje) {
        tHoje += valor; lHoje += lucro;
      }
    });

    setVendasHoje({ total: tHoje, lucro: lHoje });
    setVendasSemana({ total: tSemana, lucro: lSemana });
    setVendasMes({ total: tMes, lucro: lMes });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-[#111827] pt-8 pb-12 px-6 text-white rounded-b-[2rem]">
        <h1 className="text-2xl font-bold mb-2">📊 Relatórios Inteligentes</h1>
        <p className="text-gray-400 text-sm">Acompanhe o crescimento do seu negócio.</p>
      </div>

      <div className="px-6 -mt-6 space-y-4">
        
        {/* HOJE */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-bold text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
            <span>📅</span> Vendas de Hoje
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold text-gray-400 mb-1">FATURAMENTO</p>
              <p className="text-xl font-black text-gray-800">R$ {vendasHoje.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600 mb-1">LUCRO REAL</p>
              <p className="text-xl font-black text-[#10b981]">R$ {vendasHoje.lucro.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* SEMANA */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 font-bold text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
            <span>📆</span> Esta Semana
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold text-gray-400 mb-1">FATURAMENTO</p>
              <p className="text-xl font-black text-gray-800">R$ {vendasSemana.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600 mb-1">LUCRO REAL</p>
              <p className="text-xl font-black text-[#10b981]">R$ {vendasSemana.lucro.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* MÊS */}
        <div className="bg-[#111827] p-6 rounded-3xl shadow-md text-white">
          <h3 className="text-gray-400 font-bold text-sm mb-4 uppercase tracking-wider flex items-center gap-2">
            <span>🏆</span> Mês Atual
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-1">FATURAMENTO</p>
              <p className="text-2xl font-black text-white">R$ {vendasMes.total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-500 mb-1">LUCRO REAL</p>
              <p className="text-2xl font-black text-[#10b981]">R$ {vendasMes.lucro.toFixed(2)}</p>
            </div>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  );
}
