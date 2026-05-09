router.get('/stats-bairros', async (req, res) => {
  try {
    const stats = await Alerta.aggregate([
      {
        $group: {
          _id: "$bairro",
          qtd: { $sum: 1 },
          // Cria o objeto de detalhes com os tipos de crime
          detalhes: { 
            $push: "$tipoCrime" 
          }
        }
      }
    ]);

    // Formatando para o padrão que o seu App.jsx espera
    const formatado = stats.map(item => ({
      nome: item._id,
      qtd: item.qtd,
      detalhes: item.detalhes.reduce((acc, crime) => {
        acc[crime] = (acc[crime] || 0) + 1;
        return acc;
      }, {}),
      cor: item.qtd > 5 ? "bg-red-500" : "bg-cyan-500"
    }));

    res.json(formatado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});