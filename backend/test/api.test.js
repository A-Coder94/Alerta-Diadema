import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/database.js';

let database;
let server;
let baseUrl;
let temporaryDirectory;

before(async () => {
  temporaryDirectory = mkdtempSync(join(tmpdir(), 'alerta-diadema-test-'));
  database = createDatabase(join(temporaryDirectory, 'test.sqlite'));
  server = createApp(database).listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
  database.close();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

test('creates a valid occurrence and returns it in the recent list', async () => {
  const response = await fetch(`${baseUrl}/api/ocorrencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bairro: 'Centro',
      rua: 'Rua de teste',
      tipo: 'Furto',
      descricao: 'Registro automatizado'
    })
  });

  assert.equal(response.status, 201);
  const created = await response.json();
  assert.equal(created.data.bairro, 'Centro');
  assert.equal(created.data.tipo, 'Furto');
  assert.ok(created.data.id);

  const listResponse = await fetch(`${baseUrl}/api/ocorrencias`);
  assert.equal(listResponse.status, 200);
  const occurrences = await listResponse.json();
  assert.equal(occurrences.length, 1);
  assert.equal(occurrences[0].rua, 'Rua de teste');
});

test('rejects invalid or oversized occurrence fields', async () => {
  const invalidResponse = await fetch(`${baseUrl}/api/ocorrencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bairro: 'Bairro inválido',
      rua: 'Rua de teste',
      tipo: 'Furto',
      descricao: ''
    })
  });
  assert.equal(invalidResponse.status, 400);

  const oversizedResponse = await fetch(`${baseUrl}/api/ocorrencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bairro: 'Centro',
      rua: 'Rua de teste',
      tipo: 'Furto',
      descricao: 'x'.repeat(1001)
    })
  });
  assert.equal(oversizedResponse.status, 400);
});

test('exposes a health endpoint and rejects unknown API routes', async () => {
  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.deepEqual(await healthResponse.json(), { status: 'ok' });

  const missingResponse = await fetch(`${baseUrl}/api/rota-inexistente`);
  assert.equal(missingResponse.status, 404);
});
