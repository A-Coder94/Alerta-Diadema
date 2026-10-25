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

O Vite abre o frontend em `http://localhost:5173` e encaminha as chamadas `/api` para o backend na porta 3001.

### Testes

```powershell
npm.cmd test
```

## Acesso pela internet sem abrir portas

O backend escuta somente em `127.0.0.1`, portanto não fica diretamente acessível pela rede. Para compartilhar o app pela internet, use um túnel de saída. Com o app compilado e rodando, abra outro terminal e execute:

```powershell
cloudflared tunnel --url http://127.0.0.1:3001
```

O Cloudflare Tunnel Quick Tunnel exibirá um endereço HTTPS aleatório `*.trycloudflare.com`. Compartilhe esse endereço. Não é necessário abrir portas no roteador. Qualquer pessoa com o endereço poderá visualizar os alertas e enviar novos; não compartilhe o endereço se não quiser acesso público.

O Quick Tunnel é temporário: o endereço muda ao reiniciar o túnel e o acesso depende de o PC, o backend e o processo `cloudflared` permanecerem ligados. Para um endereço estável, é necessário configurar um túnel nomeado no Cloudflare e usar um domínio próprio; o domínio não faz parte do Quick Tunnel.

## Configuração

Copie `backend/.env.example` para `backend/.env` se precisar alterar a porta ou o caminho do banco. Por exemplo:

```dotenv
PORT=3001
DATABASE_PATH=./data/alerts.sqlite
```

Se alterar a porta, use a mesma porta no comando do túnel. Faça cópias de segurança periódicas do banco local. Ele não é replicado para outro computador nem para a nuvem.

## Proteções e limitações

- O backend valida bairro, tipo, tamanhos dos campos e formato JSON.
- Limites de requisição reduzem spam básico: até 10 envios de alerta por IP a cada 15 minutos, além de um limite geral da API. Os contadores são mantidos em memória e reiniciam quando o backend reinicia.
- Os envios são anônimos e públicos; esses limites não substituem moderação, CAPTCHA ou autenticação. Para uma divulgação ampla, considere adicionar essas medidas.
- Os dados são armazenados somente neste PC. Se ele desligar, reiniciar ou perder a conexão, o site ficará indisponível até o backend e o túnel voltarem.
- A localização por GPS e a conversão para nome de rua dependem da permissão do navegador, de HTTPS e do serviço público Nominatim.
- O banco local começa vazio. Os registros da antiga hospedagem Railway não são importados.
