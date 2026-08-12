'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(true);

  // COLOQUE SEU E-MAIL DE TESTE AQUI PARA LIBERAR ACESSO ILIMITADO
  const EMAIL_TESTE_LIBERADO = 'seuemaildeteste@gmail.com'; 

  useEffect(() => {
    const verificarAcesso = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Se não tiver usuário, manda pro login
      if (!user) return;

      // Se for o e-mail do dono/teste, libera 100% o acesso!
      if (user.email === EMAIL_TESTE_LIBERADO) {
        setAutorizado(true);
        return;
      }

      // Para novos clientes: verifica no Supabase se ele efetuou o pagamento dos R$ 20
      const { data: perfil } = await supabase
        .from('perfis')
        .select('pago')
        .eq('id', user.id)
        .single();

      if (!perfil || !perfil.pago) {
        setAutorizado(false);
        // Se tentar acessar outra tela sem pagar, envia direto para a página de vendas
        if (pathname !== '/planos') {
          router.push('/planos');
        }
      }
    };

    verificarAcesso();
  }, [pathname, router]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-around items-center z-50">
      <Link href="/" className={`flex flex-col items-center ${pathname === '/' ? 'text-emerald-500 font-bold' : 'text-gray-400'}`}>
        <span className="text-xl">🏠</span>
        <span className="text-xs mt-1">Início</span>
      </Link>

      <Link href="/produtos/novo" className={`flex flex-col items-center ${pathname === '/produtos/novo' ? 'text-emerald-500 font-bold' : 'text-gray-400'}`}>
        <span className="text-xl">📦</span>
        <span className="text-xs mt-1">Novo Produto</span>
      </Link>

      <Link href="/planos" className={`flex flex-col items-center ${pathname === '/planos' ? 'text-emerald-500 font-bold' : 'text-gray-400'}`}>
        <span className="text-xl">⭐</span>
        <span className="text-xs mt-1">Plano Pro</span>
      </Link>

      <Link href="/vender" className="flex flex-col items-center bg-emerald-500 text-white p-3 rounded-full shadow-lg -mt-6">
        <span className="text-2xl">💰</span>
      </Link>
    </nav>
  );
}
