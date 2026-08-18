'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

export default function Cadastro() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const criarConta = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      alert('Erro ao criar conta: ' + error.message);
      setLoading(false);
    } else {
      alert('✅ Conta VIP criada com sucesso! Entrando no sistema...');
      router.push('/'); 
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col justify-center px-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full mx-auto border-t-8 border-[#009ee3]">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🤝</span>
          <h1 className="text-2xl font-black text-gray-800">Pagamento Aprovado!</h1>
          <p className="text-sm text-gray-500 mt-2">
            Seu pagamento via Mercado Pago foi confirmado. Crie seu acesso abaixo para liberar o sistema agora mesmo.
          </p>
        </div>

        <form onSubmit={criarConta} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Qual será seu E-mail de acesso?</label>
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
            <label className="text-sm font-bold text-gray-700 block mb-2">Crie uma Senha (mínimo 6 dígitos)</label>
            <input 
              type="password" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#009ee3] text-gray-800"
              placeholder="••••••••"
              minLength="6"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#009ee3] text-white p-4 rounded-xl font-black text-lg mt-4 shadow-lg shadow-blue-200 hover:bg-blue-500 transition-colors"
          >
            {loading ? 'Liberando Acesso...' : 'Criar Acesso e Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
