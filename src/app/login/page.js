'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fazerLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      alert('Erro ao entrar: E-mail ou senha incorretos.');
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col justify-center px-6">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-auto">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🛒</span>
          <h1 className="text-2xl font-black text-gray-800">Área do Cliente</h1>
          <p className="text-sm text-gray-500 mt-2">Faça login para acessar seu sistema.</p>
        </div>

        <form onSubmit={fazerLogin} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">E-mail cadastrado</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#009ee3] text-gray-800"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Senha</label>
            <input 
              type="password" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#009ee3] text-gray-800"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#009ee3] text-white p-4 rounded-xl font-black text-lg mt-4 shadow-lg hover:bg-blue-500 transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-500 mb-2">Ainda não tem uma assinatura?</p>
          <a 
            href="https://mpago.la/2s5HqNJ" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-bold text-[#009ee3] hover:underline"
          >
            Assinar agora com Mercado Pago
          </a>
        </div>
      </div>
    </div>
  );
}
