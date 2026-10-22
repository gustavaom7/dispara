import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from '../util.mjs';
import { ferramenta, validarResposta } from './esquema.mjs';
import { checarEstrutura, checarSeletores, checarSegredos, checarTipos } from './checagens.mjs';
import { gerarRascunho } from './gerador.mjs';
import { clienteSimulado } from './cliente.mjs';

const AREAS = ['conta', 'catalogo'];
const mapa = JSON.parse(readFileSync(join(RAIZ, 'ref', 'toolshop-seletores.json'), 'utf8'));
const gravado = JSON.parse(readFileSync(join(RAIZ, 'historias', 'contato.gravacao.json'), 'utf8')).respostas[0];
const contexto = { areas: ['conta', 'catalogo', 'carrinho'], sistema: 'sistema', usuario: '<historia>x</historia>' };
const tool = ferramenta(contexto.areas);

function clienteFalso(respostas) {
  const chamadas = [];
  return {
    chamadas,
    async chamar(args) {
      chamadas.push(structuredClone(args));
      return { entrada: structuredClone(respostas.at(Math.min(chamadas.length - 1, respostas.length - 1))), id: `toolu_${chamadas.length}` };
    },
  };
}

test('esquema: resposta gravada é válida', () => {
  assert.deepEqual(validarResposta(gravado, ['conta', 'catalogo']), []);
});

test('esquema: aponta tipo faltando, id fora do padrão e área inválida', () => {
  const r = structuredClone(gravado);
  r.area = 'financeiro';
  r.casos = r.casos.map(c => ({ ...c, tipo: 'positivo' }));
  r.casos[0].id = 'caso1';
  const erros = validarResposta(r, AREAS).join(' | ');
  assert.match(erros, /area/);
  assert.match(erros, /CT-01/);
  assert.match(erros, /tipo "negativo"/);
  assert.match(erros, /tipo "borda"/);
});

test('esquema: a ferramenta força os três tipos de caso no schema', () => {
  assert.deepEqual(tool.input_schema.properties.casos.items.properties.tipo.enum, ['positivo', 'negativo', 'borda']);
});

test('checagens: estrutura pega waitForTimeout, import errado, test.only, tag inexistente e locator com data-test', () => {
  const codigo = [
    "import { test } from '@playwright/test';",
    "test.only('x @urgente', async ({ page }) => {",
    '  await page.waitForTimeout(500);',
    "  await page.locator('[data-test=\"email\"]').fill('a');",
    '});',
  ].join('\n');
  const tipos = checarEstrutura(codigo).map(e => e.mensagem).join(' | ');
  assert.match(tipos, /importar test e expect de '..\/..\/fixtures'/);
  assert.match(tipos, /não de '@playwright\/test'/);
  assert.match(tipos, /waitForTimeout/);
  assert.match(tipos, /test.only/);
  assert.match(tipos, /@urgente/);
  assert.match(tipos, /getByTestId em vez de locator/);
});

test('checagens: seletor inventado aparece com a linha', () => {
  const erros = checarSeletores("ok\npage.getByTestId('email');\npage.getByTestId('add-to-favourites');", mapa);
  assert.deepEqual(erros.map(e => [e.linha, e.tipo]), [[3, 'seletor']]);
});

test('checagens: segredo no código é erro, example.com não é', () => {
  assert.equal(checarSegredos("fill('ana@empresa.com.br')").length, 1);
  assert.equal(checarSegredos("fill('qa@example.com')").length, 0);
});

test('checagens: typecheck real pega propriedade que não existe nas fixtures', () => {
  const codigo = "import { test, expect } from '../../fixtures';\ntest('x', async ({ catalogo }) => {\n  await catalogo.voar();\n  expect(1).toBe(1);\n});\n";
  const erros = checarTipos(codigo, 'teste-unitario-tipos');
  assert.equal(erros.length, 1);
  assert.equal(erros[0].linha, 3);
  assert.match(erros[0].mensagem, /voar/);
});

test('gerador: passa de primeira = pronto, sem correção', async () => {
  const cliente = clienteFalso([gravado]);
  const r = await gerarRascunho({ cliente, contexto, ferramenta: tool, checar: () => [] });
  assert.equal(r.status, 'pronto');
  assert.equal(cliente.chamadas.length, 1);
});

test('gerador: devolve os erros como tool_result e aceita a correção', async () => {
  const cliente = clienteFalso([gravado, gravado]);
  let n = 0;
  const checar = () => (n++ === 0 ? [{ tipo: 'seletor', linha: 7, mensagem: 'data-test "x" não existe' }] : []);
  const r = await gerarRascunho({ cliente, contexto, ferramenta: tool, checar });
  assert.equal(r.status, 'corrigido');
  assert.equal(r.tentativas.length, 2);
  const segunda = cliente.chamadas[1].mensagens;
  assert.equal(segunda[1].role, 'assistant');
  assert.equal(segunda[1].content[0].type, 'tool_use');
  assert.equal(segunda[2].content[0].type, 'tool_result');
  assert.equal(segunda[2].content[0].tool_use_id, segunda[1].content[0].id);
  assert.equal(segunda[2].content[0].is_error, true);
  assert.match(segunda[2].content[0].content, /linha 7 · seletor/);
});

test('gerador: reprova depois do limite de correções', async () => {
  const cliente = clienteFalso([gravado]);
  const r = await gerarRascunho({ cliente, contexto, ferramenta: tool, checar: () => [{ tipo: 'tipos', mensagem: 'erro' }], correcoes: 1 });
  assert.equal(r.status, 'reprovado');
  assert.equal(cliente.chamadas.length, 2);
});

test('gerador: erro de formato vai para correção sem rodar as checagens', async () => {
  const quebrada = { ...gravado, casos: [] };
  const cliente = clienteFalso([quebrada, gravado]);
  let checagens = 0;
  const r = await gerarRascunho({ cliente, contexto, ferramenta: tool, checar: () => { checagens++; return []; } });
  assert.equal(r.status, 'corrigido');
  assert.equal(r.tentativas[0].erros[0].tipo, 'formato');
  assert.equal(checagens, 1);
});

test('cliente simulado devolve as respostas em ordem e repete a última', async () => {
  const c = clienteSimulado({ respostas: [{ a: 1 }, { a: 2 }] });
  assert.deepEqual([(await c.chamar()).entrada, (await c.chamar()).entrada, (await c.chamar()).entrada], [{ a: 1 }, { a: 2 }, { a: 2 }]);
});
