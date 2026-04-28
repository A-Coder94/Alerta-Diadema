import React, { useState, useEffect } from 'react';
import logoImg from './assets/logo.png';

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Lista oficial de bairros de Diadema
  const bairrosDiadema = [
    "Campanário", "Canhema", "Casa Grande", "Centro", 
    "Conceição", "Eldorado", "Inamar", "Piraporinha", 
    "Serraria", "Taboão", "Vila Nogueira"
  ];

  const tiposOcorrencia = ["Atividade Suspeita", "Assalto", "Furto", "Assédio", "Vandalismo", "Briga", "Tráfico de drogas", "Ameaça", "Sequestro", "Outro.."];

  // Inicializa o dashboard com todos os bairros zerados
  const [stats, setStats] = useState(
    bairrosDiadema.map(nome => ({ nome, qtd: 0, cor: 'bg-cyan-500' }))
  );

  const [formData, setFormData] = useState({
    bairro: '', rua: '', tipo: '', descricao: ''
  });

  // URL da API na Railway
  const API_URL = 'https://alerta-diadema-production.up.railway.app/api/ocorrencias';

  // FUNÇÃO PARA BUSCAR DADOS REAIS DO BACKEND
  const fetchStats = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Erro ao buscar dados');
      
      const data = await response.json();

      // Mapeia todos os bairros e conta as ocorrências vindas do banco
      const novosStats = bairrosDiadema.map(nomeBairro => ({
        nome: nomeBairro,
        qtd: data.filter(o => o.bairro === nomeBairro).length,
        cor: nomeBairro === "Centro" || nomeBairro === "Eldorado" ? 'bg-cyan-500' : 'bg-blue-600'
      }));

      setStats(novosStats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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

      const result = await response.json();

      if (response.ok) {
        alert("✅ Alerta registrado com sucesso!");
        setIsModalOpen(false);
        setFormData({ bairro: '', rua: '', tipo: '', descricao: '' });
        fetchStats(); // Atualiza o dashboard imediatamente
      } else {
        // Exibe o erro exato vindo do servidor (ex: "Rua muito curta")
        alert(`❌ Erro: ${result.error || 'Falha ao registrar'}`);
      }
    } catch (error) {
      alert("❌ Erro crítico: Verifique sua conexão com a internet.");
    } finally {
      setLoading(false);
    }
  };

  const pegarLocalizacao = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await response.json();
          
          // Prioriza o nome da via (road) para evitar colocar o nome do bairro no campo rua
          const nomeRua = data.address.road || data.address.street || "";
          setFormData(prev => ({ ...prev, rua: nomeRua }));
        } catch (err) {
          alert("Não foi possível converter as coordenadas em endereço.");
        }
      }, () => {
        alert("Acesso à localização negado.");
      });
    }
  };

  return (
    <div className="min-h-screen p-4 pb-32 max-w-lg mx-auto relative text-white bg-black font-sans selection:bg-cyan-500/30">
    <header className="flex items-center justify-center mb-8 pt-4">
  <div className="flex items-center justify-center w-full">
    <img 
      src={logoImg} 
      alt="Logo Alerta Diadema" 
      className="h-16 md:h-20 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
    />
  </div>
</header>
     

      
      
      {/* DASHBOARD DINÂMICO */}
      <section className="bg-gray-900/40 border border-white/5 rounded-2xl p-6 mb-8 backdrop-blur-sm">
        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 flex justify-between items-center">
          <span>Relatório de Bairros</span>
          <span className="flex items-center gap-2">
            <span className="text-gray-500 lowercase font-normal italic">últimas 48h</span>
            <span className="text-cyan-500 animate-pulse">● Live</span>
          </span>
        </h2>
        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {stats.map((item) => (
            <div key={item.nome} className="group">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-bold group-hover:text-cyan-400 transition-colors">{item.nome}</span>
                <span className="text-xs text-cyan-400 font-mono">{item.qtd} alertas</span>
              </div>
              <div className="h-1.5 w-full bg-gray-950 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${item.cor} transition-all duration-1000 ease-out`} 
                  style={{ width: `${Math.min((item.qtd / 10) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTÃO DE AÇÃO */}
      <button 
        onClick={() => setIsModalOpen(true)} 
        className="w-full bg-cyan-600 py-5 rounded-xl font-black uppercase tracking-widest text-black hover:bg-cyan-400 active:scale-95 transition-all shadow-[0_10px_30px_rgba(0,186,199,0.2)] mb-8"
      >
        ⚡ Registrar Ocorrência
      </button>

      {/* AVISO DE SEGURANÇA */}
      <div className="border-l-2 border-red-600 bg-red-950/10 p-4">
        <p className="text-[10px] leading-relaxed text-gray-400 uppercase">
          <strong className="text-red-500 block mb-1 underline">Atenção: Protocolo de Segurança</strong>
          Esta plataforma é para fins de alerta comunitário. Em emergências graves, ligue 190. Não substitui o Boletim de Ocorrência oficial.
        </p>
      </div>

      {/* FOOTER FIXO */}
      <footer className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-md border-t border-white/10 py-4 px-8 flex justify-between items-center z-40">
        <a href="tel:190" className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-600 flex items-center justify-center text-xl group-hover:bg-red-600 group-hover:text-white transition-all">📞</div>
          <span className="text-[8px] text-red-500 font-bold uppercase">Polícia</span>
        </a>
        <a href="tel:192" className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/30 flex items-center justify-center text-xl group-hover:bg-white group-hover:text-black transition-all">🚑</div>
          <span className="text-[8px] text-gray-400 font-bold uppercase">Samu</span>
        </a>
        <a href="tel:193" className="flex flex-col items-center gap-1 group">
          <div className="w-12 h-12 rounded-full bg-orange-600/20 border border-orange-600 flex items-center justify-center text-xl group-hover:bg-orange-600 group-hover:text-white transition-all">🔥</div>
          <span className="text-[8px] text-orange-500 font-bold uppercase">Bombeiro</span>
        </a>
      </footer>

      {/* MODAL DE ENVIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 w-full max-w-md p-6 rounded-2xl border border-cyan-500/30 shadow-[0_0_50px_rgba(0,242,255,0.1)] relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">✕</button>
            
            <h3 className="text-lg font-black uppercase text-cyan-400 mb-6 tracking-widest">Nova Ocorrência</h3>
            
            <form className="space-y-4" onSubmit={handleSubmit}>
              <select id="bairro" required value={formData.bairro} onChange={handleChange} className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none transition-colors">
                <option value="">Selecione o Bairro...</option>
                {bairrosDiadema.map(b => <option key={b} value={b}>{b}</option>)}
              </select>

              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] uppercase text-gray-500 font-bold">Localização Exata</label>
                  <button type="button" onClick={pegarLocalizacao} className="text-[10px] text-cyan-500 font-black hover:text-cyan-300 transition-colors">
                    📍 AUTO-DETECTAR
                  </button>
                </div>
                <input id="rua" type="text" required value={formData.rua} onChange={handleChange} placeholder="Ex: Av. Fábio Eduardo Ramos Esquivel..." className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none" />
              </div>

              <select id="tipo" required value={formData.tipo} onChange={handleChange} className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none">
                <option value="">Tipo de Incidente...</option>
                {tiposOcorrencia.map(t => <option key={t} value={t}>{t}</option>)}
              </select>

              <textarea id="descricao" rows="3" value={formData.descricao} onChange={handleChange} placeholder="Algum detalhe adicional? (Opcional)" className="w-full bg-black border border-gray-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none resize-none"></textarea>
              
              <button 
                type="submit" 
                disabled={loading}
                className={`w-full ${loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500'} text-black font-black uppercase py-4 rounded-lg transition-all`}
              >
                {loading ? 'Enviando...' : 'Confirmar Alerta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CSS PARA SCROLLBAR PERSONALIZADA */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #06b6d4; border-radius: 10px; }
      `}</style>

    </div>
  );
};

export default App;
