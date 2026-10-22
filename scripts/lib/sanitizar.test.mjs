import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizar } from './sanitizar.mjs';

test('troca caminho pessoal de macOS, Linux e Windows', () => {
  const { codigo, avisos } = sanitizar(
    `a('/Users/gustavo/Downloads/rg.png'); b('/home/ana/x.pdf'); c('C:\\\\Users\\\\joao\\\\doc.png');`,
  );
  assert.equal(codigo, `a('~/Downloads/rg.png'); b('~/x.pdf'); c('~\\\\doc.png');`);
  assert.equal(avisos.length, 3);
});

test('remove senha e token atribuídos no código', () => {
  const { codigo } = sanitizar(`const c = { senha: 'Toolshop#2026', token = "abc123" };`);
  assert.equal(codigo, `const c = { senha: '***', token = "***" };`);
});

test('remove senha digitada direto no campo', () => {
  const { codigo } = sanitizar(`await page.getByLabel('Senha').fill('segredo1');`);
  assert.equal(codigo, `await page.getByLabel('Senha').fill('***');`);
});

test('não mexe em valor gerado na hora nem em conta.senha', () => {
  const entrada = "await page.getByLabel('Senha').fill(`Qa!${Date.now()}`);\nawait page.getByLabel('Senha').fill(conta.senha);";
  const { codigo, avisos } = sanitizar(entrada);
  assert.equal(codigo, entrada);
  assert.equal(avisos.length, 0);
});

test('troca e-mail real e mantém example.com', () => {
  const { codigo } = sanitizar(`fill('gustavo@gmail.com'); fill('qa+1@example.com');`);
  assert.equal(codigo, `fill('***@example.com'); fill('qa+1@example.com');`);
});

test('remove telefone, CPF, JWT e Bearer', () => {
  const { codigo, avisos } = sanitizar(
    `t='35 99876-5432'; c='123.456.789-09'; j='eyJhbGciOiJI.eyJzdWIiOiIx.SflKxwRJSMeK'; h='Bearer abcdefghijklmnop';`,
  );
  assert.equal(codigo, `t='***'; c='***.***.***-**'; j='***'; h='Bearer ***';`);
  assert.equal(avisos.length, 4);
});

test('remove ambiente e avatar fixados no teste', () => {
  const { codigo } = sanitizar(`process.env.AMBIENTE = 'prod';\nprocess.env.AVATAR = 'eu';\ntest('x', () => {});\n`);
  assert.equal(codigo, `test('x', () => {});\n`);
});

test('é idempotente: rodar duas vezes não gera avisos novos', () => {
  const sujo = `const c = { senha: 'x1' }; fill('a@b.com'); go('/Users/g/f');`;
  const primeira = sanitizar(sujo);
  const segunda = sanitizar(primeira.codigo);
  assert.equal(segunda.codigo, primeira.codigo);
  assert.equal(segunda.avisos.length, 0);
});

test('informa a linha de cada troca', () => {
  const { avisos } = sanitizar(`ok\nok\nfill('maria@empresa.com.br')`);
  assert.equal(avisos[0].linha, 3);
});
