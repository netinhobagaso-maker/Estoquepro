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

  // Variável para guardar o e-mail do dono configurado no código
  const [emailDonoConfigurado, setEmailDonoConfigurado] = useState('');

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
      const emailLogado = usuarioAtual.email?.trim().toLowerCase();
      
      // >>> 1. COLOQUE SEU E-MAIL EXATO AQUI EMBAIXO <<<
      const meuEmailDeDono = 'raidias0007@gmail.com';
      
      setEmailDonoConfigurado(meuEmailDeDono); // Salva para mostrar no diagnóstico

      if (emailLogado === meuEmailDeDono) {
        setTemAssinatura(true); // É o dono? Libera acesso total!
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
  
  const sairDaConta = async () => {
    await supabase.auth.signOut();
    setTemAssinatura(false);
    setUser(null);
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white font-bold">Carregando...</div>;

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

  if (!temAssinatura) {
    return (
      <div className="min-h-screen bg-[#111827] text-white flex flex-col justify-center items-center p-6 text-center">
        <div className="bg-gray-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl border border-gray-700">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-black mb-2">Assinatura do App</h2>
          <p className="text-gray-400 text-sm mb-4">Pague R$ 20,00 no 1º mês para liberar seu sistema completo. (Meses 2 e 3 grátis!)</p>
          
          {/* --- CAIXA DE DIAGNÓSTICO (NOVA) --- */}
          <div className="bg-gray-900 p-3 rounded-lg mb-6 text-xs text-left border border-red-500/30">
            <p className="text-red-400 font-bold mb-2">🛠️ Diagnóstico de Acesso:</p>
            <p className="text-gray-400 mb-1">Logado como: <br/><span className="text-white font-mono">{user.email}</span></p>
            <p className="text-gray-400">Dono no código: <br/><span className="text-white font-mono">{emailDonoConfigurado}</span></p>
          </div>
          {/* ---------------------------------- */}

          <button onClick={iniciarAssinatura} disabled={assinando} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl active:scale-95 transition-all">
            {assinando ? 'Gerando Pagamento...' : 'Liberar Acesso 💳'}
          </button>
          <button onClick={sairDaConta} className="w-full mt-6 text-sm text-gray-500 hover:text-white">Sair da conta</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
