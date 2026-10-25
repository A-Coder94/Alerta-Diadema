import 'dotenv/config';
import { createApp } from './src/app.js';
import { createDatabase } from './src/database.js';

const port = Number(process.env.PORT || 3001);
const database = createDatabase();
const app = createApp(database);
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Alerta Diadema disponível em http://127.0.0.1:${port}`);
});

function shutdown(signal) {
  console.log(`Recebido ${signal}; encerrando o servidor...`);
  server.close(() => {
    database.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
