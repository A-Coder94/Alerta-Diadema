import { useCallback, useEffect, useMemo, useState } from 'react';
import logoImg from './assets/logo.png';

const bairrosDiadema = [
  'Campanário', 'Canhema', 'Casa Grande', 'Centro',
  'Conceição', 'Eldorado', 'Inamar', 'Piraporinha',
  'Serraria', 'Taboão', 'Vila Nogueira'
];

const tiposOcorrencia = [
  'Atividade Suspeita', 'Assalto', 'Furto', 'Assédio', 'Vandalismo',
  'Briga', 'Tráfico de drogas', 'Ameaça', 'Sequestro', 'Outro..'
];

function Icon({ name, size = 20 }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    close: <><path d="m18 6-12 12" /><path d="m6 6 12 12" /></>,
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
    siren: <><path d="M10 2h4" /><path d="M12 14v-4" /><path d="M12 22a8 8 0 0 0 8-8H4a8 8 0 0 0 8 8Z" /><path d="M5 3 3 5" /><path d="m19 3 2 2" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
    pulse: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>,
    warning: <><path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>
  };

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Agora há pouco';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function categoryClass(type) {
  if (['Assalto', 'Ameaça', 'Sequestro'].includes(type)) return 'alert-tag alert-tag--urgent';
  if (['Atividade Suspeita', 'Assédio', 'Briga'].includes(type)) return 'alert-tag alert-tag--attention';
  return 'alert-tag alert-tag--neutral';
}

const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [gpsError, setGpsError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [bairroSelecionado, setBairroSelecionado] = useState('Todos');
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(
    bairrosDiadema.map(nome => ({ nome, qtd: 0, detalhes: {} }))
  );
  const [formData, setFormData] = useState({
    bairro: '', rua: '', tipo: '', descricao: ''
  });

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/ocorrencias');
      if (!response.ok) throw new Error('Não foi possível carregar os alertas.');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('A resposta do servidor é inválida.');

      setAlerts(data);
      setStats(bairrosDiadema.map(nome => {
        const occurrences = data.filter(alert => alert.bairro === nome);
        const details = {};
        occurrences.forEach(alert => {
          details[alert.tipo] = (details[alert.tipo] || 0) + 1;
        });
        return { nome, qtd: occurrences.length, detalhes: details };
      }));
      setApiError('');
    } catch (error) {
      console.error('Erro ao atualizar dashboard:', error);
      setApiError('Não foi possível conectar ao servidor. Os dados podem estar desatualizados.');
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    if (!isModalOpen) return undefined;
    const closeOnEscape = event => {
      if (event.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isModalOpen]);

  const totalAlerts = alerts.length;
  const activeNeighborhoods = stats.filter(item => item.qtd > 0).length;
  const topType = Object.entries(alerts.reduce((result, alert) => {
    result[alert.tipo] = (result[alert.tipo] || 0) + 1;
    return result;
  }, {})).sort((a, b) => b[1] - a[1])[0];
  const maxNeighborhoodCount = Math.max(1, ...stats.map(item => item.qtd));

  const visibleAlerts = useMemo(
    () => bairroSelecionado === 'Todos'
      ? alerts
      : alerts.filter(alert => alert.bairro === bairroSelecionado),
    [alerts, bairroSelecionado]
  );

  const handleChange = event => {
    const { id, value } = event.target;
    setFormData(previous => ({ ...previous, [id]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/ocorrencias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível registrar o alerta.');

      setIsModalOpen(false);
      setFormData({ bairro: '', rua: '', tipo: '', descricao: '' });
      setSuccessMessage('Alerta registrado. Obrigado por colaborar com a comunidade.');
      setBairroSelecionado('Todos');
      await fetchStats();
    } catch (error) {
      setSubmitError(error.message || 'Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const pegarLocalizacao = () => {
    setGpsError('');
    if (!navigator.geolocation) {
      setGpsError('Este navegador não oferece suporte à localização.');
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const params = new URLSearchParams({
          lat: String(position.coords.latitude),
          lon: String(position.coords.longitude),
          format: 'jsonv2',
          'accept-language': 'pt-BR'
        });
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
        if (!response.ok) throw new Error('O serviço de localização não respondeu.');
        const data = await response.json();
        const rua = data.address?.road || data.address?.pedestrian || data.address?.path;
        if (!rua) throw new Error('Não foi possível identificar a rua nesta localização.');
        setFormData(previous => ({ ...previous, rua }));
      } catch (error) {
        console.error('Erro ao obter endereço:', error);
        setGpsError(error.message || 'Não foi possível obter o endereço.');
      } finally {
        setGpsLoading(false);
      }
    }, error => {
      setGpsLoading(false);
      setGpsError(error.code === 1
        ? 'Permita o acesso à localização para usar o GPS.'
        : 'Não foi possível obter sua localização.');
    }, { timeout: 10000, maximumAge: 60000 });
  };

  const openReportModal = () => {
    setSubmitError('');
    setGpsError('');
    setSuccessMessage('');
    setIsModalOpen(true);
  };

  return (
    <div className="app-shell">
      <header className="topbar page-container">
        <a className="brand" href="#inicio" aria-label="Alerta Diadema, início">
          <img src={logoImg} alt="" className="brand-logo" />
          <span className="brand-caption">Rede comunitária de cuidado</span>
        </a>
        <div className={`connection-status ${apiError ? 'connection-status--offline' : ''}`} role="status">
          <span className="status-dot" />
          {apiError ? 'Reconectando' : 'Sistema ativo'}
        </div>
      </header>

      <main id="inicio" className="page-container">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow"><Icon name="location" size={15} /> DIADEMA, SP</span>
            <h1>Uma cidade mais segura começa com <span>informação.</span></h1>
            <p>Acompanhe o que acontece perto de você e ajude sua comunidade a ficar atenta.</p>
            <button className="button button--hero" onClick={openReportModal}>
              <Icon name="plus" size={18} /> Registrar alerta
            </button>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-orbit hero-orbit--outer" />
            <div className="hero-orbit hero-orbit--inner" />
            <div className="hero-art-center"><Icon name="shield" size={44} /></div>
            <span className="hero-art-label hero-art-label--top">CUIDADO COLETIVO</span>
            <span className="hero-art-label hero-art-label--bottom">Diadema · SP</span>
          </div>
          <div className="hero-footnote"><Icon name="pulse" size={16} /> Atualizado a cada minuto</div>
        </section>

        {apiError && <div className="notice notice--error" role="status"><Icon name="warning" size={18} />{apiError}</div>}
        {successMessage && <div className="notice notice--success" role="status"><Icon name="check" size={18} />{successMessage}<button onClick={() => setSuccessMessage('')} aria-label="Fechar aviso"><Icon name="close" size={16} /></button></div>}

        <section className="summary-grid" aria-label="Resumo das últimas 48 horas">
          <article className="summary-card summary-card--primary">
            <span className="summary-icon"><Icon name="pulse" /></span>
            <span className="summary-label">Alertas nas últimas 48h</span>
            <strong>{totalAlerts}</strong>
            <span className="summary-detail">Ocorrências registradas recentemente</span>
          </article>
          <article className="summary-card">
            <span className="summary-icon summary-icon--blue"><Icon name="location" /></span>
            <span className="summary-label">Bairros com registros</span>
            <strong>{activeNeighborhoods}<small> / {bairrosDiadema.length}</small></strong>
            <span className="summary-detail">Com atividade nas últimas 48 horas</span>
          </article>
          <article className="summary-card">
            <span className="summary-icon summary-icon--amber"><Icon name="spark" /></span>
            <span className="summary-label">Mais reportado</span>
            <strong className="summary-category">{topType?.[0] || '—'}</strong>
            <span className="summary-detail">{topType ? `${topType[1]} registro${topType[1] === 1 ? '' : 's'}` : 'Ainda sem registros recentes'}</span>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel neighborhood-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow eyebrow--muted">VISÃO DA CIDADE</span>
                <h2>Alertas por bairro</h2>
              </div>
              <span className="count-pill">{activeNeighborhoods} ativos</span>
            </div>
            <p className="panel-description">Selecione um bairro para filtrar os registros.</p>
            <div className="neighborhood-list">
              <button
                className={`neighborhood-row neighborhood-row--all ${bairroSelecionado === 'Todos' ? 'is-selected' : ''}`}
                onClick={() => setBairroSelecionado('Todos')}
                aria-pressed={bairroSelecionado === 'Todos'}
              >
                <span className="neighborhood-name"><span className="neighborhood-marker neighborhood-marker--all"><Icon name="pulse" size={15} /></span>Todos os bairros</span>
                <span className="neighborhood-total">{totalAlerts}</span>
              </button>
              {stats.map(item => (
                <button
                  key={item.nome}
                  className={`neighborhood-row ${bairroSelecionado === item.nome ? 'is-selected' : ''}`}
                  onClick={() => setBairroSelecionado(item.nome)}
                  aria-pressed={bairroSelecionado === item.nome}
                >
                  <span className="neighborhood-name"><span className={`neighborhood-marker ${item.qtd ? 'neighborhood-marker--active' : ''}`} />{item.nome}</span>
                  <span className="neighborhood-bar" aria-hidden="true"><span style={{ width: `${(item.qtd / maxNeighborhoodCount) * 100}%` }} /></span>
                  <span className="neighborhood-total">{item.qtd}</span>
                </button>
              ))}
            </div>
            <div className="chart-legend"><span className="legend-dot" /> Alertas registrados · últimas 48h</div>
          </article>

          <article className="panel feed-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow eyebrow--muted">ACOMPANHAMENTO</span>
                <h2>{bairroSelecionado === 'Todos' ? 'Alertas recentes' : bairroSelecionado}</h2>
              </div>
              <span className="live-pill"><span className="status-dot" /> AO VIVO</span>
            </div>
            <div className="feed-subheading">
              <span><Icon name="clock" size={15} /> Últimas 48 horas</span>
              <span>{visibleAlerts.length} {visibleAlerts.length === 1 ? 'registro' : 'registros'}</span>
            </div>

            {visibleAlerts.length > 0 ? (
              <div className="alert-feed">
                {visibleAlerts.map((alert, index) => (
                  <article className="alert-card" key={alert.id || `${alert.createdAt}-${index}`}>
                    <span className={`alert-symbol ${categoryClass(alert.tipo)}`}><Icon name={['Assalto', 'Ameaça', 'Sequestro'].includes(alert.tipo) ? 'warning' : 'pin'} size={18} /></span>
                    <div className="alert-content">
                      <div className="alert-title-row">
                        <h3>{alert.tipo}</h3>
                        <time dateTime={alert.createdAt}>{formatTime(alert.createdAt)}</time>
                      </div>
                      <p className="alert-location"><Icon name="location" size={14} /> {alert.rua} <span>·</span> {alert.bairro}</p>
                      {alert.descricao && <p className="alert-description">{alert.descricao}</p>}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-state-icon"><Icon name="shield" size={26} /></span>
                <h3>Nenhum alerta por aqui</h3>
                <p>{bairroSelecionado === 'Todos' ? 'Ainda não há registros nas últimas 48 horas.' : `Nenhum registro recente em ${bairroSelecionado}.`}</p>
                <button className="text-button" onClick={openReportModal}>Seja o primeiro a informar <Icon name="arrow" size={16} /></button>
              </div>
            )}
          </article>
        </section>

        <section className="emergency-panel" aria-labelledby="emergency-heading">
          <div className="emergency-copy">
            <span className="emergency-icon"><Icon name="siren" size={21} /></span>
            <div><h2 id="emergency-heading">Precisa de ajuda imediata?</h2><p>Em uma emergência, ligue diretamente para os serviços oficiais.</p></div>
          </div>
          <div className="emergency-actions">
            <a href="tel:190" className="emergency-link emergency-link--police"><span>Polícia Militar</span><strong>190</strong><Icon name="arrow" size={16} /></a>
            <a href="tel:192" className="emergency-link"><span>SAMU</span><strong>192</strong><Icon name="arrow" size={16} /></a>
            <a href="tel:193" className="emergency-link"><span>Bombeiros</span><strong>193</strong><Icon name="arrow" size={16} /></a>
          </div>
        </section>

        <footer className="page-footer">
          <span><Icon name="shield" size={15} /> Informação comunitária. Em emergências, ligue 190, 192 ou 193.</span>
          <button className="footer-report" onClick={openReportModal}>Registrar alerta <Icon name="arrow" size={15} /></button>
        </footer>
      </main>

      {isModalOpen && (
        <div className="modal-backdrop" onMouseDown={event => {
          if (event.target === event.currentTarget) setIsModalOpen(false);
        }}>
          <section className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
            <div className="modal-heading">
              <span className="modal-icon"><Icon name="plus" size={21} /></span>
              <button className="icon-button" type="button" onClick={() => setIsModalOpen(false)} aria-label="Fechar formulário"><Icon name="close" /></button>
              <span className="eyebrow eyebrow--muted">SUA COMUNIDADE CONTA COM VOCÊ</span>
              <h2 id="report-title">Registrar alerta</h2>
              <p>Compartilhe informações importantes com responsabilidade.</p>
            </div>
            <form className="report-form" onSubmit={handleSubmit}>
              <label htmlFor="bairro">Bairro</label>
              <select id="bairro" required value={formData.bairro} onChange={handleChange}>
                <option value="">Selecione o bairro</option>
                {bairrosDiadema.map(bairro => <option key={bairro} value={bairro}>{bairro}</option>)}
              </select>

              <div className="field-heading">
                <label htmlFor="rua">Rua ou avenida</label>
                <button className="location-button" type="button" onClick={pegarLocalizacao} disabled={gpsLoading}>
                  <Icon name="location" size={15} /> {gpsLoading ? 'Localizando...' : 'Usar GPS'}
                </button>
              </div>
              <input id="rua" type="text" maxLength="160" required value={formData.rua} onChange={handleChange} placeholder="Ex.: Rua São José" />
              {gpsError && <p className="form-error" role="status">{gpsError}</p>}

              <label htmlFor="tipo">Tipo de ocorrência</label>
              <select id="tipo" required value={formData.tipo} onChange={handleChange}>
                <option value="">Selecione uma categoria</option>
                {tiposOcorrencia.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>

              <label htmlFor="descricao">O que aconteceu? <span className="optional-label">Opcional</span></label>
              <textarea id="descricao" rows="3" maxLength="1000" value={formData.descricao} onChange={handleChange} placeholder="Descreva brevemente, sem incluir dados pessoais." />
              <span className="field-hint">Não inclua nomes, telefones ou informações que identifiquem pessoas.</span>
              {submitError && <p className="form-error" role="alert">{submitError}</p>}

              <button className="button button--submit" type="submit" disabled={loading}>
                {loading ? 'Enviando alerta...' : 'Enviar alerta'} {!loading && <Icon name="arrow" size={17} />}
              </button>
              <button className="cancel-button" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default App;
