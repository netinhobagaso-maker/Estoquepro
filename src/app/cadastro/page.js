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

    // Cria o usuário no Supabase. Como desligamos a confirmação de e-mail,
    // ele já entra logado e o banco já registra o acesso na hora!
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error) {
      alert('Erro ao criar conta: ' + error.message);
      setLoading(false);
    } else {
      alert('✅ Conta criada com sucesso! Redirecionando para o sistema...');
      router.push('/'); // Manda direto para o início do sistema
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex flex-col justify-center px-6">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full mx-auto border-t-8 border-[#10b981]">
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🎉</span>
          <h1 className="text-2xl font-black text-gray-800">Pagamento Aprovado!</h1>
          <p className="text-sm text-gray-500 mt-2">Crie seu e-mail e senha abaixo para liberar o sistema agora mesmo.</p>
        </div>

        <form onSubmit={criarConta} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-2">Qual será seu E-mail de acesso?</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#10b981] text-gray-800"
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
              className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-[#10b981] text-gray-800"
              placeholder="••••••••"
              minLength="6"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#10b981] text-white p-4 rounded-xl font-black text-lg mt-4 shadow-lg shadow-emerald-200 hover:bg-emerald-500 transition-colors"
          >
            {loading ? 'Liberando Acesso...' : 'Criar Conta e Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
