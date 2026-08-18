'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  const [faturamento, setFaturamento] = useState(0);
  const [lucroReal, setLucroReal] = useState(0);
  const [valorEstoque, setValorEstoque] = useState(0);
  const [lucroEsperado, setLucroEsperado] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Busca Produtos
      const { data: produtos } = await supabase
        .from('produtos')
        .select('preco_venda, preco_custo, quantidade')
        .eq('user_id', user.id);

      // Busca Vendas
      const { data: vendas } = await supabase
        .from('vendas')
        .select('valor_total, lucro')
        .eq('user_id', user.id);

      // Cálculos do Estoque (Lógica original)
      if (produtos) {
        let vEstoque = 0;
        let lEsperado = 0;
        produtos.forEach(p => {
          const qtd = Number(p.quantidade) || 0;
          const pVenda = Number(p.preco_venda) || 0;
          const pCusto = Number(p.preco_custo) || 0;
          
          vEstoque += (pCusto * qtd);
          lEsperado += ((pVenda - pCusto) * qtd);
        });
        setValorEstoque(vEstoque);
        setLucroEsperado(lEsperado);
      }

      // Cálculos das Vendas (Lógica original)
      if (vendas) {
        let fat = 0;
        let lReal = 0;
        vendas.forEach(v => {
          fat += Number(v.valor_total) || 0;
          lReal += Number(v.lucro) || 0;
        });
        setFaturamento(fat);
        setLucroReal(lReal);
      }
    };
    fetchData();
  }, [router]);

  const zerarRelatorios = async () => {
    if (!confirm("Tem certeza que deseja apagar o histórico de vendas?")) return;
    const { error } = await supabase.from('vendas').delete().eq('user_id', user.id);
    if (!error) {
      setFaturamento(0);
      setLucroReal(0);
      alert("Relatórios zerados!");
    }
  };

  const formatarMoeda = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (!user) return <div className="p-10 text-white">Carregando...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-[#111827] pt-12 pb-8 px-6 text-white rounded-b-[2rem] shadow-lg">
        <h1 className="text-3xl font-black mb-2">Painel de Controle 📊</h1>
      </div>
      
      <div className="px-6 mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-bold mb-1">Faturamento Obtido</p>
            <p className="text-xl font-black text-green-600">{formatarMoeda(faturamento)}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-bold mb-1">Lucro Real</p>
            <p className="text-xl font-black text-blue-600">{formatarMoeda(lucroReal)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-bold mb-1">Valor em Estoque</p>
            <p className="text-xl font-black text-gray-800">{formatarMoeda(valorEstoque)}</p>
          </div>
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-xs text-gray-500 font-bold mb-1">Lucro Esperado</p>
            <p className="text-xl font-black text-purple-600">{formatarMoeda(lucroEsperado)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Link href="/vender" className="bg-[#009ee3] text-white p-4 rounded-2xl shadow-md flex items-center justify-center font-bold">🛒 Vender</Link>
          <Link href="/estoque" className="bg-white text-gray-800 border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center justify-center font-bold">📦 Estoque</Link>
        </div>

        <button onClick={zerarRelatorios} className="w-full mt-8 bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl font-bold">
          🗑️ Zerar Vendas e Relatórios
        </button>
      </div>
      <BottomNav />
    </div>
  );
}
