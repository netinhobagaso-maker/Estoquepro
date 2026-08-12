'use client';
import BottomNav from '../../components/BottomNav';
import { useState } from 'react';

export default function Planos() {
  const [loading, setLoading] = useState(false);

  const assinarPlano = async () => {
    setLoading(true);
    // Aqui no futuro você chamará a API do Stripe que criamos
    alert('Integração com Stripe em andamento! Em breve o redirecionamento acontecerá.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 pb-24 text-white">
      <div className="p-6 text-center pt-12">
        <h1 className="text-4xl font-black mb-2">Zipp <span className="text-emerald-400">PRO</span></h1>
        <p className="text-gray-400">A ferramenta definitiva para o seu negócio.</p>
      </div>

      <div className="px-6">
        <div className="bg-white text-gray-900 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">Oferta Especial de Lançamento 🚀</h2>
          
          <div className="flex items-baseline mb-6 border-b pb-6">
            <span className="text-5xl font-black tracking-tight">R$ 20</span>
            <span className="text-gray-500 ml-2 font-medium">pagamento único inicial</span>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex gap-3 items-start">
              <span className="text-emerald-500 text-xl">✅</span>
              <div>
                <strong className="block text-gray-800">Acesso Imediato</strong>
                <span className="text-sm text-gray-500">Comece a vender e controlar seu estoque hoje mesmo.</span>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-emerald-500 text-xl">🎁</span>
              <div>
                <strong className="block text-gray-800">Ganhe 2 Meses Grátis</strong>
                <span className="text-sm text-gray-500">Você não paga NADA nos próximos 60 dias. Fique tranquilo!</span>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-emerald-500 text-xl">🔄</span>
              <div>
                <strong className="block text-gray-800">Apenas R$ 49,99 a partir do 4º Mês</strong>
                <span className="text-sm text-gray-500">Assinatura mensal recorrente só inicia após o período grátis acabar. Cancele quando quiser.</span>
              </div>
            </div>
          </div>

          <button 
            onClick={assinarPlano}
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl text-lg transition-all"
          >
            {loading ? 'Redirecionando...' : 'Garantir Oferta Agora'}
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            Pagamento seguro via Cartão de Crédito ou Pix.
          </p>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
