import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const bairros = new Set([
  'Campanário',
  'Canhema',
  'Casa Grande',
  'Centro',
  'Conceição',
  'Eldorado',
  'Inamar',
  'Piraporinha',
  'Serraria',
  'Taboão',
  'Vila Nogueira'
]);

const tiposOcorrencia = new Set([
  'Atividade Suspeita',
  'Assalto',
  'Furto',
  'Assédio',
  'Vandalismo',
  'Briga',
  'Tráfico de drogas',
  'Ameaça',
  'Sequestro',
  'Outro..'
]);

const frontendDirectory = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));

export function createApp(database) {
  const app = express();
  const listRecent = database.prepare(`
    SELECT id, bairro, rua, tipo, descricao, created_at AS createdAt
    FROM ocorrencias
    WHERE created_at >= ?
    ORDER BY created_at DESC
  `);
  const insertOccurrence = database.prepare(`
    INSERT INTO ocorrencias (bairro, rua, tipo, descricao, created_at)
    VALUES (@bairro, @rua, @tipo, @descricao, @createdAt)
  `);
  const deleteExpired = database.prepare('DELETE FROM ocorrencias WHERE created_at < ?');

  app.set('trust proxy', 'loopback');
  app.use(helmet());
  app.use(express.json({ limit: '10kb' }));
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Muitas solicitações. Tente novamente em alguns minutos.' }
  }));
  app.use('/api/ocorrencias', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Limite de envios atingido. Tente novamente mais tarde.' }
  }));

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' });
  });

  app.get('/api/ocorrencias', (_request, response) => {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    response.json(listRecent.all(since));
  });

  app.post('/api/ocorrencias', (request, response) => {
    const body = request.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return response.status(400).json({ error: 'Dados inválidos.' });
    }

    const bairro = typeof body.bairro === 'string' ? body.bairro.trim() : '';
    const rua = typeof body.rua === 'string' ? body.rua.trim() : '';
    const tipo = typeof body.tipo === 'string' ? body.tipo.trim() : '';
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';

    if (!bairros.has(bairro) || !tiposOcorrencia.has(tipo) || !rua) {
      return response.status(400).json({ error: 'Bairro, rua ou tipo de ocorrência inválido.' });
    }
    if (rua.length > 160 || descricao.length > 1000) {
      return response.status(400).json({ error: 'Rua ou descrição excede o tamanho permitido.' });
    }

    try {
      const createdAt = new Date().toISOString();
      deleteExpired.run(
        new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      );
      const result = insertOccurrence.run({ bairro, rua, tipo, descricao, createdAt });
      return response.status(201).json({
        message: 'Alerta registrado.',
        data: {
          id: Number(result.lastInsertRowid),
          bairro,
          rua,
          tipo,
          descricao,
          createdAt
        }
      });
    } catch (error) {
      console.error('Erro ao salvar ocorrência:', error);
      return response.status(500).json({ error: 'Não foi possível salvar o alerta.' });
    }
  });

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: 'Rota da API não encontrada.' });
  });

  if (existsSync(frontendDirectory)) {
    app.use(express.static(frontendDirectory, { index: false }));
    app.get('/{*path}', (request, response, next) => {
      if (!request.accepts('html')) return next();
      return response.sendFile(join(frontendDirectory, 'index.html'));
    });
  } else {
    app.get('/', (_request, response) => {
      response.status(503).send('Frontend não compilado. Execute npm run build na pasta raiz.');
    });
  }

  app.use((error, _request, response, next) => {
    if (response.headersSent) return next(error);

    if (error.type === 'entity.too.large') {
      return response.status(413).json({ error: 'Solicitação excede o tamanho permitido.' });
    }
    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({ error: 'JSON inválido.' });
    }

    console.error('Erro não tratado na API:', error);
    return response.status(500).json({ error: 'Erro interno do servidor.' });
  });

  return app;
}
