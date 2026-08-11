'use client';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const lidarComAcesso = async (tipo) => {
    setLoading(true);
    let { error } = {};

    if (tipo === 'cadastro') {
      ({ error } = await supabase.auth.signUp({ email, password: senha }));
      setMensagem('Conta criada! Verifique seu e-mail.');
    } else {
      ({ error } = await supabase.auth.signInWithPassword({ email, password: senha }));
      if (!error) window.location.href = '/';
    }

    if (error) setMensagem(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-4xl font-extrabold text-gray-900 text-center mb-2">
          Zipp<span className="text-emerald-500">.</span>
        </h1>
        <p className="text-gray-500 text-center mb-8">O motor do seu negócio.</p>

        <div className="space-y-4">
          <input type="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-4 border rounded-xl outline-none focus:border-emerald-500" />
          <input type="password" placeholder="Sua senha" value={senha} onChange={(e) => setSenha(e.target.value)} className="w-full p-4 border rounded-xl outline-none focus:border-emerald-500" />
        </div>

        {mensagem && <p className="mt-4 text-center text-sm text-emerald-600 font-bold">{mensagem}</p>}

        <div className="mt-8 space-y-3">
          <button onClick={() => lidarComAcesso('login')} className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl">
            {loading ? 'Carregando...' : 'Entrar'}
          </button>
          <button onClick={() => lidarComAcesso('cadastro')} className="w-full bg-transparent text-gray-600 font-bold py-4 rounded-xl border-2">
            Criar conta grátis
          </button>
        </div>
      </div>
    </div>
  );
}
