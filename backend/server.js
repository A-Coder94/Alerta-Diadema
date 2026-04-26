import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors()); 
app.use(express.json()); 

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

// Rota de Teste
app.get('/health', (req, res) => {
  res.status(200).json({ status: "ok" });
});

// SALVAR OCORRÊNCIA (Com Validação de Rua e Bairro)
app.post('/api/ocorrencias', async (req, res) => {
  try {
    const { bairro, rua, tipo, descricao } = req.body;

    // Lista oficial para validar se o bairro é de Diadema
    const bairrosValidos = ["Campanário", "Canhema", "Casa Grande", "Centro", "Conceição", "Eldorado", "Inamar", "Piraporinha", "Serraria", "Taboão", "Vila Nogueira"];
    
    const ruaLimpa = rua ? rua.trim().toLowerCase() : "";
    const ruaEhValida = ruaLimpa.length >= 5 && 
      (ruaLimpa.includes("rua") || ruaLimpa.includes("av") || ruaLimpa.includes("estrada") || ruaLimpa.includes("praça"));

    if (!bairrosValidos.includes(bairro)) {
      return res.status(400).json({ error: "Selecione um bairro válido de Diadema." });
    }

    if (!ruaEhValida) {
      return res.status(400).json({ error: "Digite o nome da rua completo (Ex: Rua...)" });
    }

    const novaOcorrencia = new Ocorrencia({ bairro, rua, tipo, descricao });
    await novaOcorrencia.save();

    res.status(201).json({ message: "Registrado!", data: novaOcorrencia });
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar." });
  }
});

// BUSCAR OCORRÊNCIAS (Filtro 48h para o Dashboard)
app.get('/api/ocorrencias', async (req, res) => {
  try {
    const quarentaEOitoHorasAtras = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const ocorrencias = await Ocorrencia.find({
      createdAt: { $gte: quarentaEOitoHorasAtras }
    }).sort({ createdAt: -1 });

    res.json(ocorrencias);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));