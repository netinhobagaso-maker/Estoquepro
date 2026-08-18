'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';

export default function Home() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Estados
  const [faturamento, setFaturamento] = useState(0);
  const [lucroReal, setLucroReal] = useState(0);
  const [valorEstoque, setValorEstoque] = useState(0);
  const [lucroEsperado, setLucroEsperado] = useState(0);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authData?.user) {
          router.push('/login');
          return;
        }
        setUser(authData.user);

        // 1. Busca das Vendas (Já comprovado que funciona)
        const { data: vendas } = await supabase.from('vendas').select('*').eq('user_id', authData.user.id);

        // 2. Busca dos Produtos (Com destravamento caso a tabela não tenha user_id)
        let { data: produtos, error: errProdutos } = await supabase.from('produtos').select('*').eq('user_id', authData.user.id);
        
        // Se a busca falhar por causa do user_id, ele tenta buscar tudo
        if (errProdutos) {
          const fallback = await supabase.from('produtos').select('*');
          produtos = fallback.data;
        }

        // Tradutor avançado de números (Lida com R$, vírgulas, textos e espaços)
        const pegarNumero = (valor) => {
          if (valor === undefined || valor === null || valor === '') return 0;
          if (typeof valor === 'number') return valor;
          let str = String(valor).replace(/R\$/gi, '').replace(/\s/g, '').trim();
          
          if (str.includes('.') && str.includes(',')) {
            str = str.replace(/\./g, '').replace(',', '.'); // Se for 1.200,50 -> 1200.50
          } else if (str.includes(',')) {
            str = str.replace(',', '.'); // Se for 10,50 -> 10.50
          }
          const num = parseFloat(str);
          return isNaN(num) ? 0 : num;
        };

        // ==========================================
        // CÁLCULO ESTOQUE - CAÇADOR AUTOMÁTICO DE COLUNAS
        // ==========================================
        if (produtos && produtos.length > 0) {
          let calcValorEstoque = 0;
          let calcLucroEsperado = 0;

          produtos.forEach(p => {
            let rawQtd, rawCusto, rawVenda;

            // Varre o banco procurando por qualquer coluna que signifique Quantidade, Custo ou Venda
            Object.keys(p).forEach(k => {
              const lower = k.toLowerCase();
              if (lower === 'quantidade' || lower === 'qtd' || lower === 'estoque' || lower.includes('quant')) {
                rawQtd = rawQtd ?? p[k];
              }
              if (lower === 'preco_custo' || lower === 'custo' || lower.includes('custo') || lower.includes('compra')) {
                rawCusto = rawCusto ?? p[k];
              }
              if (lower === 'preco_venda' || lower === 'preco' || lower === 'valor' || (lower.includes('venda') && !lower.includes('custo'))) {
                rawVenda = rawVenda ?? p[k];
              }
            });

            // Converte os valores encontrados em números exatos
            const qtd = pegarNumero(rawQtd ?? p.quantidade ?? p.estoque ?? 0);
            const vCusto = pegarNumero(rawCusto ?? p.preco_custo ?? p.custo ?? 0);
            const vVenda = pegarNumero(rawVenda ?? p.preco_venda ?? p.preco ?? 0);

            // Matemática Final Exata
            calcValorEstoque += (vCusto * qtd);
            calcLucroEsperado += ((vVenda - vCusto) * qtd);
          });

          setValorEstoque(calcValorEstoque);
          setLucroEsperado(calcLucroEsperado);
        }

        // ==========================================
        // CÁLCULO VENDAS (Aquele que já deu certo)
        // ==========================================
        if (vendas && vendas.length > 0) {
          let calcFaturamento = 0;
          let calcLucroReal = 0;

          vendas.forEach(v => {
            calcFaturamento += pegarNumero(v.valor_total || v.total);
            calcLucroReal += pegarNumero(v.total_lucro || v.lucro_realizado || v.lucro);
          });

          setFaturamento(calcFaturamento);
          setLucroReal(calcLucroReal);
        }

      } catch (error) {
        console.error("Erro interno ao calcular:", error);
      }
    };

    carregarDados();
  }, [router]);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  };

  const zerarVendas = async () => {
    const confirmar = window.confirm("⚠️ Deseja zerar os relatórios de VENDAS?\nSeu estoque ficará intacto.");
    if (!confirmar) return;

    if (user) {
      const { error } = await supabase.from('vendas').delete().eq('user_id', user.id);
      if (!error) {
        setFaturamento(0);
        setLucroReal(0);
        alert("✅ Vendas zeradas com sucesso!");
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#111827] flex items-center justify-center text-[#009ee3] font-bold text-xl">
        Calculando os dados...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="bg-[#111827] pt-12 pb-8 px-6 text-white rounded-b-[2rem] shadow-lg">
        <h1 className="text-3xl font-black mb-2">Painel de Controle 📊</h1>
        <p className="text-gray-400 text-sm">Resumo financeiro do seu negócio</p>
      </div>
      
      <div className="px-6 mt-6 space-y-4">
        {/* VENDAS */}
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

        {/* ESTOQUE */}
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
        
        {/* BOTÕES */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Link href="/vender" className="bg-[#009ee3] text-white p-4 rounded-2xl shadow-md flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform">
            <span className="text-xl">🛒</span> Vender
          </Link>
          <Link href="/estoque" className="bg-white text-gray-800 border border-gray-200 p-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform">
            <span className="text-xl">📦</span> Estoque
          </Link>
        </div>

        <button 
          onClick={zerarVendas} 
          className="w-full mt-8 bg-red-50 text-red-600 border border-red-200 p-4 rounded-2xl font-bold flex justify-center items-center gap-2 active:scale-95 transition-transform"
        >
          <span>🗑️</span> Zerar Vendas e Relatórios
        </button>
      </div>
      
      <BottomNav />
    </div>
  );
}
