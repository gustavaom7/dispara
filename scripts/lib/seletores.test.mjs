import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mapearFonte, seletoresDosTestes, existe } from './seletores.mjs';

function pasta(arquivos) {
  const raiz = mkdtempSync(join(tmpdir(), 'sel-'));
  for (const [nome, conteudo] of Object.entries(arquivos)) {
    mkdirSync(join(raiz, nome, '..'), { recursive: true });
    writeFileSync(join(raiz, nome), conteudo);
  }
  return raiz;
}

test('mapeia ids fixos, dinâmicos, do componente de senha e estados', () => {
  const app = pasta({
    'auth/login.html': '<input data-test="email"><app-password-input formControlName="password" id="password"></app-password-input>',
    'products/overview.html': '<a attr.data-test="product-{{item.id}}"><h5 data-test="product-name"></h5></a>',
    'products/overview.ts': "this.resultState = 'search_completed';",
  });
  try {
    const mapa = mapearFonte(app);
    assert.deepEqual(Object.keys(mapa.fixos).sort(), ['email', 'password', 'product-name']);
    assert.deepEqual(mapa.dinamicos, ['product-']);
    assert.deepEqual(mapa.estados, ['search_completed']);
  } finally { rmSync(app, { recursive: true, force: true }); }
});

test('acha getByTestId com texto e com regex, e aponta o que falta', () => {
  const specs = pasta({
    'a.spec.ts': "page.getByTestId('email');\npage.getByTestId(/^product-/);\npage.getByTestId('nao-existe');",
  });
  try {
    const mapa = { fixos: { email: ['x'] }, dinamicos: ['product-'], estados: [] };
    const usados = seletoresDosTestes(specs);
    assert.equal(usados.length, 3);
    assert.deepEqual(usados.filter(u => !existe(u, mapa)).map(u => [u.id, u.linha]), [['nao-existe', 3]]);
  } finally { rmSync(specs, { recursive: true, force: true }); }
});
