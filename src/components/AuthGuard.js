'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [temAssinatura, setTemAssinatura] = useState(false);
  const [assinando, setAssinando] = useState(false);
  
  // Estados do Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    verificarAcesso();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      verificarAcesso(session?.user);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const verificarAcesso = async (authUser = null) => {
    setLoading(true);
    const usuarioAtual = authUser || (await supabase.auth.getUser()).data?.user;
    setUser(usuarioAtual);

    if (usuarioAtual) {
      // COLOCAR SEU EMAIL AQUI PARA VOCÊ ACESSAR TUDO SEM PAGAR
      if (usuarioAtual.email === 'raidias0007@gmail.com') {
        setTemAssinatura(true);
      } else {
        const { data: sub } = await supabase.from('assinaturas').select('status').eq('user_id', usuarioAtual.id).single();
        if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
          setTemAssinatura(true);
        } else {
          setTemAssinatura(false);
        }
      }
    }
    setLoading(false);
  };

  const autenticar = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Erro ao entrar: " + error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert("Erro ao criar conta: " + error.message);
      else alert("Conta criada! O primeiro acesso requer assinatura.");
    }
    setLoading(false);
  };

  const iniciarAssinatura = async () => {
    setAssinando(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email })
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Erro (verifique as variáveis na Vercel): " + data.error);
    } catch (err) {
      alert("Erro de conexão: " + err.message);
    }
    setAssinando(false);
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-bold">Carregando...</div>;

  // TELA DE LOGIN / CADASTRO
  if (!user) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex flex-col justify-center items-center p-6">
        <div className="bg-gray-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-700">
          <h2 className="text-2xl font-black text-center mb-6">{isLogin ? 'Bem-vindo de volta 👋' : 'Criar Conta 🚀'}</h2>
          <form onSubmit={autenticar} className="space-y-4">
            <input type="email" placeholder="Seu E-mail" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-white" />
            <input type="password" placeholder="Sua Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-4 rounded-xl bg-gray-900 border border-gray-700 text-white" />
            <button type="submit" className="w-full bg-emerald-500 py-4 rounded-xl font-bold text-lg active:scale-95 transition-all">{isLogin ? 'Entrar' : 'Cadastrar'}</button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-sm text-gray-400 hover:text-white">
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
          </button>
        </div>
      </div>
    );
  }

  // TELA DE BLOQUEIO STRIPE (PRIMEIRO ACESSO)
  if (!temAssinatura) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex flex-col justify-center items-center p-6 text-center">
        <div className="bg-gray-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-700">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-black mb-2">Assinatura do App</h2>
          <p className="text-gray-400 text-sm mb-6">Pague R$ 20,00 no 1º mês para liberar seu sistema completo. (Meses 2 e 3 grátis!)</p>
          <button onClick={iniciarAssinatura} disabled={assinando} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl active:scale-95 transition-all">
            {assinando ? 'Gerando Pagamento...' : 'Liberar Acesso 💳'}
          </button>
          <button onClick={() => supabase.auth.signOut()} className="w-full mt-6 text-sm text-gray-500">Sair da conta</button>
        </div>
      </div>
    );
  }

  // SE PASSOU POR TUDO (É DONO OU PAGOU), LIBERA O APP INTEIRO
  return <>{children}</>;
}
