import React, { useState, useEffect } from 'react';

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para os números do Dashboard (agora começam zerados)
  const [stats, setStats] = useState([
    { nome: 'Centro', qtd: 0, cor: 'bg-cyan-500' },
    { nome: 'Eldorado', qtd: 0, cor: 'bg-blue-600' },
    { nome: 'Inamar', qtd: 0, cor: 'bg-cyan-400' },
    { nome: 'Conceição', qtd: 0, cor: 'bg-blue-400' },
  ]);

  const [formData, setFormData] = useState({
    bairro: '', rua: '', tipo: '', descricao: ''
  });

  // FUNÇÃO PARA BUSCAR DADOS REAIS DO BACKEND
  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/ocorrencias');
      const data = await response.json();

      // Lógica simples para contar ocorrências por bairro
      const novosStats = stats.map(bairro => ({
        ...bairro,
        qtd: data.filter(o => o.bairro === bairro.nome).length
      }));

      setStats(novosStats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  // Busca os dados assim que o app abre
  useEffect(() => {
    fetchStats();
  }, []);

  const bairrosDiadema = ["Campanário", "Canhema", "Casa Grande", "Centro", "Conceição", "Eldorado", "Inamar", "Piraporinha", "Serraria", "Taboão", "Vila Nogueira"];
  const tiposOcorrencia = ["Atividade Suspeita", "Assalto", "Furto", "Vandalismo", "Outros"];

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/ocorrencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert("✅ Alerta registrado!");
        setIsModalOpen(false);
        setFormData({ bairro: '', rua: '', tipo: '', descricao: '' });
        fetchStats(); // ATUALIZA O DASH LIVE
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor.");
    }
  };
  const pegarLocalizacao = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await response.json();
          // Tenta pegar o nome da rua ou avenida
          const nomeRua = data.address.road || data.address.street || data.address.suburb || "";

          setFormData(prev => ({ ...prev, rua: nomeRua }));
        } catch (err) {
          alert("Não foi possível obter o nome da rua.");
        }
      });
    }
  };
  return (
    <div className="min-h-screen p-4 pb-32 max-w-lg mx-auto relative text-white bg-black font-sans">
      {/* HEADER */}
      <header className="flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-br-2xl flex items-center justify-center shadow-[0_0_15px_rgba(0,242,255,0.4)]">
            <span className="text-black font-black text-xl">D</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-widest italic">ALERTA <span className="text-cyan-500">DIADEMA</span></h1>
            <p className="text-[9px] text-gray-500 tracking-[0.2em] font-bold">MONITORAMENTO POPULAR</p>
          </div>
        </div>
      </header>

      {/* DASHBOARD REAL */}
      <section className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 mb-8">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex justify-between">
          <span>Relatório Local</span>
          <span className="text-cyan-500 animate-pulse">● Live</span>
        </h2>
        <div className="space-y-6">
          {stats.map((item) => (
            <div key={item.nome}>
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold">{item.nome}</span>
                <span className="text-xs text-cyan-400 font-mono">{item.qtd} alertas</span>
              </div>
              <div className="h-1.5 w-full bg-gray-950 rounded-full overflow-hidden">
                <div className={`h-full ${item.cor} transition-all duration-700`} style={{ width: `${Math.min((item.qtd / 20) * 100, 100)}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTÃO PRINCIPAL */}
      <button onClick={() => setIsModalOpen(true)} className="w-full bg-cyan-600 py-5 rounded-xl font-black uppercase tracking-widest text-black hover:bg-cyan-400 transition-all shadow-[0_10px_30px_rgba(0,186,199,0.2)]">
        ⚡ Registrar Ocorrência
      </button>

      {/* AVISO LEGAL */}
      <div className="border-l-2 border-red-600 bg-red-950/10 p-4 mb-8">
        <p className="text-[10px] leading-relaxed text-gray-400 uppercase">
          <strong className="text-red-500 block mb-1 underline">Atenção: Protocolo de Segurança</strong>
          Esta plataforma é para fins de alerta comunitário. Em emergências graves, ligue imediatamente para as autoridades. Não substitui o B.O.
        </p>
      </div>

      {/* FOOTER  */}
      <footer className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-lg border-t border-white/10 py-4 px-8 flex justify-between items-center z-40">
        <div className="flex flex-col items-center gap-1 group">
          <button className="w-12 h-12 rounded-full bg-red-600/20 border border-red-600 flex items-center justify-center text-xl hover:scale-110 transition-all">📞</button>
          <span className="text-[8px] text-red-500 font-bold uppercase">Polícia</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button className="w-12 h-12 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-xl hover:scale-110 transition-all">🚑</button>
          <span className="text-[8px] text-gray-400 font-bold uppercase">Samu</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <button className="w-12 h-12 rounded-full bg-orange-600/20 border border-orange-600 flex items-center justify-center text-xl hover:scale-110 transition-all">🔥</button>
          <span className="text-[8px] text-orange-500 font-bold uppercase">Bombeiro</span>
        </div>
      </footer>


      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 w-full max-w-md p-6 rounded-2xl border border-cyan-500/30 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 text-xl">✕</button>
            <h3 className="text-lg font-black uppercase text-cyan-400 mb-6 tracking-widest">Nova Ocorrência</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <select id="bairro" value={formData.bairro} onChange={handleChange} className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none">
                <option value="">Bairro...</option>
                {bairrosDiadema.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase text-gray-400">Rua / Avenida</label>
                <button
                  type="button"
                  onClick={pegarLocalizacao}
                  className="text-[10px] text-cyan-500 font-bold hover:underline"
                >
                  📍 USAR MINHA LOCALIZAÇÃO
                </button>
              </div>
              <input id="rua" type="text" value={formData.rua} onChange={handleChange} placeholder="Rua / Avenida..." className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none" />
              <select id="tipo" value={formData.tipo} onChange={handleChange} className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none">
                <option value="">Tipo...</option>
                {tiposOcorrencia.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea id="descricao" rows="3" value={formData.descricao} onChange={handleChange} placeholder="Detalhes..." className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none resize-none"></textarea>
              <button type="submit" className="w-full bg-cyan-600 text-black font-black uppercase py-4 rounded-lg">Enviar Alerta</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;