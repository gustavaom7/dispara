import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { coletar, juntar, resumirErro } from './coletar.mjs';

// Relatório real do Playwright 1.5x: 1 passou, 1 pulado, 1 falhou e 1 instável (passou na 2ª tentativa)
const relatorio = JSON.parse(readFileSync(new URL('./amostras/relatorio-playwright.json', import.meta.url), 'utf8'));

test('gera uma execução por arquivo com a contagem de casos', () => {
  const execs = coletar(relatorio, { quem: 'Ana', origem: 'ci', avatar: 'admin' });
  assert.deepEqual(execs.map(e => [e.teste, e.status]), [['login', 'passou'], ['produtos', 'falhou']]);
  const [login, produtos] = execs;
  assert.deepEqual(login.casos, { passou: 1, falhou: 0, pulado: 1, instavel: 0 });
  assert.deepEqual(produtos.casos, { passou: 1, falhou: 1, pulado: 0, instavel: 1 });
  assert.equal(produtos.instavel, true);
  assert.equal(login.ambiente, 'com-bugs'); // lido de config.metadata
  assert.equal(login.quem, 'Ana');
  assert.equal(login.origem, 'ci');
});

test('resume o erro sem cores ANSI e com o nome do caso', () => {
  const [, produtos] = coletar(relatorio);
  assert.match(produtos.erro, /^falha de verdade: status da API/);
  assert.doesNotMatch(produtos.erro, /\u001b/);
  assert.match(produtos.erro, /Expected: 200 · Received: 404/);
});

test('arquivo só com casos pulados fica como pulado', () => {
  const r = { suites: [{ file: 'admin/pedidos.spec.ts', specs: [{ title: 'x', tests: [{ status: 'skipped', results: [{ duration: 3 }] }] }] }] };
  assert.equal(coletar(r, { ambiente: 'estavel' })[0].status, 'pulado');
});

test('junta ao histórico sem duplicar e mais recentes primeiro', () => {
  const antigo = [{ id: 'a', quando: '2026-10-20T10:00:00Z' }, { id: 'b', quando: '2026-10-21T10:00:00Z' }];
  const novas = [{ id: 'b', quando: '2026-10-21T10:00:00Z', nova: true }, { id: 'c', quando: '2026-10-22T10:00:00Z' }];
  const h = juntar(antigo, novas);
  assert.deepEqual(h.map(e => e.id), ['c', 'b', 'a']);
  assert.equal(h[1].nova, true);
  assert.equal(juntar(antigo, novas, 2).length, 2);
});

test('limita o tamanho da mensagem de erro', () => {
  assert.ok(resumirErro('x'.repeat(500)).length <= 220);
});

test('separa o mesmo arquivo rodado no desktop e no celular', () => {
  const t = (projectName, status) => ({ projectName, status, results: [{ duration: 10 }] });
  const r = { suites: [{ file: 'conta/login.spec.ts', specs: [{ title: 'x', tests: [t('chromium', 'expected'), t('celular', 'unexpected')] }] }] };
  const execs = coletar(r, { ambiente: 'estavel', agora: '2026-10-22T12:00:00Z' });
  assert.deepEqual(execs.map(e => [e.teste, e.status, e.dispositivo ?? 'desktop']), [['login', 'passou', 'desktop'], ['login', 'falhou', 'celular']]);
  assert.notEqual(execs[0].id, execs[1].id);
});

test('resumo do CI lista falhas primeiro e mostra o link do relatório', async () => {
  const { resumoMarkdown } = await import('../resumo-ci.mjs');
  const execs = coletar(relatorio, { ambiente: 'com-bugs', avatar: 'cliente' });
  const md = resumoMarkdown(execs, { relatorio: 'https://exemplo/relatorio/' });
  const linhas = md.split('\n');
  assert.match(linhas[0], /❌ Toolshop · com-bugs/);
  assert.match(md, /\[relatório do Playwright\]\(https:\/\/exemplo\/relatorio\/\)/);
  assert.match(linhas.find(l => l.startsWith('| ❌')), /api\/produtos\.spec\.ts.*instável.*status da API/);
});

test('resumo do CI mostra o diagnóstico da triagem', async () => {
  const { resumoMarkdown } = await import('../resumo-ci.mjs');
  const [e] = coletar(relatorio, { ambiente: 'estavel' }).filter(x => x.status === 'falhou');
  e.triagem = { categoria: 'ambiente', confianca: 'alta', modo: 'regras', proximoPasso: 'Rode de novo.' };
  assert.match(resumoMarkdown([e]), /Problema de ambiente \(alta\): Rode de novo\./);
});
