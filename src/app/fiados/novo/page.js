'use client';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/navigation';
import BottomNav from '../../../components/BottomNav';

export default function NovoFiado() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [salvando, setSalvando] = useState(false);

  const salvarCliente = async () => {
    if (!nome) return alert("O nome do cliente é obrigatório.");
    setSalvando(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const valorInicial = Number(valor) || 0;
      const historicoInicial = valorInicial > 0 ? [{
        data: new Date().toISOString(),
        desc: descricao || 'Abertura de conta / Saldo inicial',
        val: valorInicial
      }] : [];

      // Enviando dados básicos à prova de falhas
      const { error } = await supabase.from('fiados').insert([{
        user_id: user.id,
        nome_cliente: nome,
        cliente: nome, // Mantendo por segurança (compatibilidade com colunas antigas)
        telefone: telefone || null,
        descricao: descricao || 'Cliente cadastrado',
        valor: valorInicial,
        historico: historicoInicial,
        status: 'pendente'
      }]);

      if (error) {
        console.error("Erro Supabase:", error);
        alert("Erro ao salvar no banco: " + error.message);
        setSalvando(false);
      } else {
        alert("Cliente cadastrado com sucesso! ✅");
        router.push('/fiados');
      }
    } catch (err) {
      alert("Erro inesperado: " + err.message);
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#111827] p-6 rounded-b-3xl text-white shadow-md">
        <h1 className="text-2xl font-bold">Novo Cliente 📝</h1>
      </div>
      <div className="p-6 -mt-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border space-y-4">
          
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Nome do Cliente *</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: João da Silva" className="w-full p-3 border rounded-xl bg-gray-50 text-gray-800" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Telefone / WhatsApp</label>
            <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="Ex: 11999999999" className="w-full p-3 border rounded-xl bg-gray-50 text-gray-800" />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm font-bold text-gray-800 mb-2">Já quer adicionar uma dívida?</p>
            <div className="flex gap-2">
              <div className="w-2/3">
                <label className="text-[10px] font-bold text-gray-500 block mb-1">O que levou?</label>
                <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: 2 Cervejas" className="w-full p-3 border rounded-xl bg-gray-50 text-sm text-gray-800" />
              </div>
              <div className="w-1/3">
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Valor (R$)</label>
                <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0.00" className="w-full p-3 border rounded-xl bg-gray-50 text-sm text-gray-800" />
              </div>
            </div>
          </div>

          <button onClick={salvarCliente} disabled={salvando} className="w-full bg-[#10b981] text-white font-black p-4 rounded-xl mt-4 active:scale-95">
            {salvando ? 'Salvando...' : 'Cadastrar Cliente'}
          </button>

          <button onClick={() => router.push('/fiados')} className="w-full text-gray-500 font-bold p-3 mt-2">
            Cancelar
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
