import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from '../util.mjs';
import { classificarPorRegras, diagnosticar, sinais, validarDiagnostico } from './triagem.mjs';
import { falhasDetalhadas } from '../coletar.mjs';

const mapa = JSON.parse(readFileSync(join(RAIZ, 'ref', 'toolshop-seletores.json'), 'utf8'));
const falha = (extra = {}) => ({ id: 'f1', teste: 'busca', arquivo: 'catalogo/busca.spec.ts', ambiente: 'estavel', status: 'falhou', quando: '2026-10-22T10:00:00Z', erro: 'expect(received).toMatch(expected)', ...extra });
const exec = (ambiente, status, quando = '2026-10-21T10:00:00Z', extra = {}) => ({ id: `${ambiente}-${status}-${quando}`, teste: 'busca', ambiente, status, quando, ...extra });
const regras = (f, historico = []) => classificarPorRegras(sinais({ falha: f, historico, mapa }));

test('regras: erro de rede é problema de ambiente', () => {
  const d = regras(falha({ erro: 'apiRequestContext.get: getaddrinfo ENOTFOUND api.practicesoftwaretesting.com' }));
  assert.deepEqual([d.categoria, d.confianca], ['ambiente', 'alta']);
});

test('regras: credencial faltando no .env é problema de ambiente, não bug', () => {
  const d = regras(falha({ erro: 'Error: Preencha CLIENTE_EMAIL e CLIENTE_SENHA no seu .env para usar a conta "Cliente" (veja .env.example).' }));
  assert.deepEqual([d.categoria, d.confianca], ['ambiente', 'alta']);
  assert.match(d.resumo, /configuração/);
});

test('regras: seletor que não existe mais é teste desatualizado', () => {
  const d = regras(falha({ erro: "Timeout 10000ms waiting for getByTestId('search-button')" }));
  assert.equal(d.categoria, 'teste-desatualizado');
  assert.match(d.evidencias[0], /search-button/);
});

test('regras: seletor que existe não acusa teste desatualizado', () => {
  const d = regras(falha({ erro: "Timeout 10000ms waiting for getByTestId('search-submit')" }));
  assert.notEqual(d.categoria, 'teste-desatualizado');
});

test('regras: falha só no com-bugs, passando no estável, é bug no produto com confiança alta', () => {
  const d = regras(falha({ ambiente: 'com-bugs' }), [exec('estavel', 'passou')]);
  assert.deepEqual([d.categoria, d.confianca], ['bug-no-produto', 'alta']);
});

test('regras: alternância no mesmo ambiente é instabilidade', () => {
  const d = regras(falha(), [exec('estavel', 'passou', '2026-10-21T10:00:00Z'), exec('estavel', 'falhou', '2026-10-20T10:00:00Z')]);
  assert.equal(d.categoria, 'instabilidade');
});

test('regras: muitas falhas por timeout na mesma execução apontam para o ambiente', () => {
  const quando = '2026-10-22T10:00:00Z';
  const historico = Array.from({ length: 6 }, (_, i) => ({ id: `x${i}`, teste: `t${i}`, ambiente: 'estavel', status: 'falhou', quando }));
  const d = regras(falha({ erro: 'Test timeout of 60000ms exceeded.' }), historico);
  assert.equal(d.categoria, 'ambiente');
});

test('regras: sem nenhum sinal, assume bug com confiança baixa', () => {
  const d = regras(falha());
  assert.deepEqual([d.categoria, d.confianca], ['bug-no-produto', 'baixa']);
  assert.deepEqual(validarDiagnostico(d), []);
});

test('sinais: não compara o celular com o desktop', () => {
  const s = sinais({ falha: falha({ dispositivo: 'celular' }), historico: [exec('estavel', 'passou'), exec('estavel', 'falhou', '2026-10-20T10:00:00Z')], mapa });
  assert.equal(s.intermitente, false);
});

test('diagnosticar: usa a resposta da IA quando ela é válida', async () => {
  const resposta = { categoria: 'instabilidade', confianca: 'media', resumo: 'x', evidencias: ['y'], proximoPasso: 'z' };
  const cliente = { modo: 'real', modelo: 'claude-teste', chamar: async args => { assert.match(args.mensagens[0].content, /<sinais>/); return { entrada: resposta }; } };
  const d = await diagnosticar({ falha: falha(), historico: [], mapa, codigo: 'test()', cliente });
  assert.deepEqual([d.categoria, d.modo, d.modelo], ['instabilidade', 'ia', 'claude-teste']);
});

test('diagnosticar: volta para as regras se a IA responder fora do formato', async () => {
  const cliente = { modo: 'real', modelo: 'm', chamar: async () => ({ entrada: { categoria: 'talvez' } }) };
  const d = await diagnosticar({ falha: falha({ erro: 'ECONNRESET' }), historico: [], mapa, cliente });
  assert.deepEqual([d.categoria, d.modo], ['ambiente', 'regras']);
  assert.match(d.aviso, /inválida/);
});

test('diagnosticar: volta para as regras se a chamada falhar', async () => {
  const cliente = { modo: 'real', modelo: 'm', chamar: async () => { throw new Error('401 invalid x-api-key'); } };
  const d = await diagnosticar({ falha: falha(), historico: [], mapa, cliente });
  assert.equal(d.modo, 'regras');
  assert.match(d.aviso, /401/);
});

test('falhasDetalhadas: pega a mensagem completa da primeira falha de cada arquivo', () => {
  const relatorio = JSON.parse(readFileSync(join(RAIZ, 'scripts', 'lib', 'amostras', 'relatorio-playwright.json'), 'utf8'));
  const mapaFalhas = falhasDetalhadas(relatorio);
  assert.deepEqual([...mapaFalhas.keys()], ['api/produtos.spec.ts::']);
  const f = mapaFalhas.get('api/produtos.spec.ts::');
  assert.equal(f.caso, 'falha de verdade');
  assert.match(f.mensagem, /Expected: 200\nReceived: 404/);
  assert.doesNotMatch(f.mensagem, /\u001b/);
});
