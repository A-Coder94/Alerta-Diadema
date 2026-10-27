# Alerta Diadema

Aplicativo comunitário para registrar e consultar alertas recentes por bairro em Diadema. O frontend React/Vite e a API Express são executados no mesmo computador; o backend serve os arquivos compilados e guarda os registros em SQLite.

## Requisitos 

- Node.js 20.19 ou superior (ou 22.12 ou superior)
- npm
- Para acesso público sem encaminhar portas no roteador: `cloudflared`

## Instalação e execução local

No PowerShell, se a política do Windows bloquear `npm`, use `npm.cmd` no lugar de `npm`:

```powershell
npm.cmd install --prefix frontend
npm.cmd install --prefix backend
npm.cmd run build
npm.cmd start
```

Abra `http://127.0.0.1:3001`. A API e o site são servidos pelo mesmo processo. O banco é criado automaticamente em `backend/data/alerts.sqlite`; os alertas ficam disponíveis na lista por 48 horas e são removidos após 15 dias.

### Desenvolvimento

Inicie cada processo em um terminal separado:

```powershell
npm.cmd run dev:backend
npm.cmd run dev:frontend
```

## Proteções e limitações

- O backend valida bairro, tipo, tamanhos dos campos e formato JSON.
- Limites de requisição reduzem spam básico: até 10 envios de alerta por IP a cada 15 minutos, além de um limite geral da API. Os contadores são mantidos em memória e reiniciam quando o backend reinicia.
- Os envios são anônimos e públicos; esses limites não substituem moderação, CAPTCHA ou autenticação. Para uma divulgação ampla, considere adicionar essas medidas.
- Os dados são armazenados somente neste PC. Se ele desligar, reiniciar ou perder a conexão, o site ficará indisponível até o backend e o túnel voltarem.
- A localização por GPS e a conversão para nome de rua dependem da permissão do navegador, de HTTPS e do serviço público Nominatim.
- O banco local começa vazio. Os registros da antiga hospedagem Railway não são importados.
