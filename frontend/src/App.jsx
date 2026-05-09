import React, { useState, useEffect } from 'react';
// Removi o axios que não estava sendo usado e causava aviso
import logoImg from './assets/logo.png';

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bairroAberto, setBairroAberto] = useState(null);
  const [tipoAberto, setTipoAberto] = useState(null); // Para o segundo nível do accordion

  const bairrosDiadema = [
    "Campanário", "Canhema", "Casa Grande", "Centro", 
    "Conceição", "Eldorado", "Inamar", "Piraporinha", 
    "Serraria", "Taboão", "Vila Nogueira"
  ];

  const tiposOcorrencia = ["Atividade Suspeita", "Assalto", "Furto", "Assédio", "Vandalismo", "Briga", "Tráfico de drogas", "Ameaça", "Sequestro", "Outro.."];

  // APENAS UMA DECLARAÇÃO DE STATS
  const [stats, setStats] = useState(
    bairrosDiadema.map(nome => ({ nome, qtd: 0, detalhes: {}, cor: 'bg-cyan-500' }))
  );

  const [formData, setFormData] = useState({
    bairro: '', rua: '', tipo: '', descricao: ''
  });

  const API_URL = 'https://alerta-diadema-production.up.railway.app/api/ocorrencias';

  // 2. BUSCA DE DADOS E LÓGICA DO ACCORDION
  const fetchStats = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Erro na API');
      const data = await response.json();

      const novosStats = bairrosDiadema.map(nomeBairro => {
        const ocorrenciasBairro = data.filter(o => o.bairro === nomeBairro);
        
        // Agrupamento para o Accordion de segundo nível
        const detalhesAgrupados = {};
        ocorrenciasBairro.forEach(oc => {
          if (!detalhesAgrupados[oc.tipo]) detalhesAgrupados[oc.tipo] = [];
          detalhesAgrupados[oc.tipo].push(oc);
        });

        return {
          nome: nomeBairro,
          qtd: ocorrenciasBairro.length,
          detalhes: detalhesAgrupados,
          cor: ocorrenciasBairro.length > 5 ? 'bg-red-500' : 'bg-cyan-500'
        };
      });

      setStats(novosStats);
    } catch (error) {
      console.error("Erro ao atualizar dashboard:", error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000); // Atualiza a cada 1 min
    return () => clearInterval(interval);
  }, []);

  // 3. HANDLERS
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ bairro: '', rua: '', tipo: '', descricao: '' });
        fetchStats();
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const pegarLocalizacao = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const data = await res.json();
          setFormData(prev => ({ ...prev, rua: data.address.road || "" }));
        } catch (err) { console.error(err); }
      });
    }
  };

  return (
    <div className="min-h-screen p-4 pb-32 max-w-lg mx-auto text-white bg-black font-sans selection:bg-cyan-500/30">
      <header className="flex justify-center mb-10 pt-8">
        <img src={logoImg} alt="Logo" className="h-24 object-contain" />
      </header>

      {/* DASHBOARD COM ACCORDIONS */}
      <section className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 mb-8 backdrop-blur-sm">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex justify-between items-center">
          <span>Ocorrências por Bairro</span>
          <span className="text-cyan-500 animate-pulse">● Live</span>
        </h2>

        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
          {stats.map((item) => (
            <div key={item.nome} className="border-b border-white/5 pb-4 last:border-0">
              <button 
                onClick={() => setBairroAberto(bairroAberto === item.nome ? null : item.nome)}
                className="w-full text-left group"
              >
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold group-hover:text-cyan-400 transition-colors">
                    {bairroAberto === item.nome ? '▼ ' : '▶ '}{item.nome}
                  </span>
                  <span className="text-xs text-cyan-400 font-mono">{item.qtd}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-950 rounded-full overflow-hidden">
                  <div className={`h-full ${item.cor} transition-all duration-1000`} style={{ width: `${Math.min((item.qtd / 10) * 100, 100)}%` }}></div>
                </div>
              </button>

              {/* Nível 1: Tipos de Crime */}
              {bairroAberto === item.nome && (
                <div className="mt-4 ml-2 space-y-2 border-l-2 border-cyan-500/30 pl-3">
                  {Object.keys(item.detalhes).length > 0 ? (
                    Object.entries(item.detalhes).map(([tipo, lista]) => (
                      <div key={tipo}>
                        <div 
                          onClick={() => setTipoAberto(tipoAberto === `${item.nome}-${tipo}` ? null : `${item.nome}-${tipo}`)}
                          className="flex justify-between items-center text-[11px] cursor-pointer hover:bg-white/5 p-1 rounded"
                        >
                          <span className="text-gray-300">{tipoAberto === `${item.nome}-${tipo}` ? '▼ ' : '▶ '}{tipo}</span>
                          <span className="bg-cyan-900/40 text-cyan-400 px-2 rounded-full">{lista.length}</span>
                        </div>
                        
                        {/* Nível 2: Detalhes/Descrições */}
                        {tipoAberto === `${item.nome}-${tipo}` && (
                          <div className="mt-2 ml-4 space-y-2">
                            {lista.map((oc, idx) => (
                              <div key={idx} className="bg-black/40 p-2 rounded border border-white/5 text-[10px]">
                                <p className="text-gray-300 italic">"{oc.descricao || 'Sem descrição'}"</p>
                                <p className="text-gray-500 mt-1">📍 {oc.rua}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : <p className="text-[10px] text-gray-600">Nenhum dado recente.</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <button onClick={() => setIsModalOpen(true)} className="w-full bg-cyan-600 py-4 rounded-xl font-black uppercase text-black shadow-lg mb-8">
        ⚡ Registrar Alerta
      </button>

      {/* FOOTER FIXO (POLÍCIA, SAMU, BOMBEIRO) */}
      <footer className="fixed bottom-0 left-0 w-full bg-black/95 border-t border-white/10 py-4 px-10 flex justify-between z-40">
        <a href="tel:190" className="text-center"><div className="w-12 h-12 rounded-full border border-red-600 flex items-center justify-center mb-1">📞</div><span className="text-[8px] text-red-500 font-bold">190</span></a>
        <a href="tel:192" className="text-center"><div className="w-12 h-12 rounded-full border border-gray-500 flex items-center justify-center mb-1">🚑</div><span className="text-[8px] text-gray-400 font-bold">192</span></a>
        <a href="tel:193" className="text-center"><div className="w-12 h-12 rounded-full border border-orange-600 flex items-center justify-center mb-1">🔥</div><span className="text-[8px] text-orange-500 font-bold">193</span></a>
      </footer>

      {/* MODAL DE REGISTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 w-full max-w-md p-6 rounded-2xl border border-cyan-500/30">
            <h3 className="text-lg font-black uppercase text-cyan-400 mb-6">Novo Alerta</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <select id="bairro" required value={formData.bairro} onChange={handleChange} className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm">
                <option value="">Selecione o Bairro...</option>
                {bairrosDiadema.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <div className="flex flex-col gap-1">
                <button type="button" onClick={pegarLocalizacao} className="text-[10px] text-cyan-500 self-end font-bold">📍 USAR GPS</button>
                <input id="rua" type="text" required value={formData.rua} onChange={handleChange} placeholder="Rua ou Avenida..." className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm" />
              </div>
              <select id="tipo" required value={formData.tipo} onChange={handleChange} className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm">
                <option value="">Tipo de Ocorrência...</option>
                {tiposOcorrencia.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea id="descricao" rows="3" value={formData.descricao} onChange={handleChange} placeholder="Detalhes (Opcional)" className="w-full bg-black border border-gray-700 rounded-lg p-3 text-sm resize-none"></textarea>
              <button type="submit" disabled={loading} className="w-full bg-cyan-600 text-black font-black py-4 rounded-lg">
                {loading ? 'ENVIANDO...' : 'CONFIRMAR'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-gray-500 text-xs mt-2">CANCELAR</button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #0891b2; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;