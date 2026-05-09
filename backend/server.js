import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json()); 
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// 1. CONEXÃO MONGODB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Conectado!'))
  .catch((err) => console.error('❌ Erro MongoDB:', err));

// 2. MODELO COM TTL (15 dias)
const OcorrenciaSchema = new mongoose.Schema({
  bairro: { type: String, required: true },
  rua: { type: String, required: true },
  tipo: { type: String, required: true },
  descricao: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now, expires: '15d' }
});

const Ocorrencia = mongoose.model('Ocorrencia', OcorrenciaSchema);

// 3. ROTAS

app.get('/', (req, res) => {
  res.send('Servidor Alerta Diadema está Online!');
});

// SALVAR OCORRÊNCIA
app.post('/api/ocorrencias', async (req, res) => {
  try {
    const { bairro, rua, tipo, descricao } = req.body;
    
    // Validação básica de segurança no servidor
    if (!bairro || !rua || !tipo) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    const novaOcorrencia = new Ocorrencia({ bairro, rua, tipo, descricao });
    await novaOcorrencia.save();

    res.status(201).json({ message: "Registrado!", data: novaOcorrencia });
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar no banco de dados." });
  }
});

// BUSCAR OCORRÊNCIAS (Últimas 48h)
app.get('/api/ocorrencias', async (req, res) => {
  try {
    const quarentaEOitoHorasAtras = new Date(Date.now() - 48 * 60 * 60 * 1000);
    // Buscamos tudo das últimas 48h para processar o Accordion no Frontend
    const ocorrencias = await Ocorrencia.find({
      createdAt: { $gte: quarentaEOitoHorasAtras }
    }).sort({ createdAt: -1 });

    res.json(ocorrencias);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar ocorrências." });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));