import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sincronizar } from '../sincronizar.mjs';

function cenario() {
  const raiz = mkdtempSync(join(tmpdir(), 'dispara-'));
  const de = join(raiz, 'publicados');
  const para = join(raiz, 'meus');
  mkdirSync(join(de, 'conta'), { recursive: true });
  const publicar = (conteudo, testes = [{ id: 'login', arquivo: 'conta/login.spec.ts' }]) => {
    writeFileSync(join(de, 'conta/login.spec.ts'), conteudo);
    writeFileSync(join(de, 'manifest.json'), JSON.stringify({ testes }));
  };
  return { raiz, de, para, publicar, local: () => join(para, 'conta/login.spec.ts') };
}

test('copia novo, atualiza intocado e preserva alterado', () => {
  const c = cenario();
  try {
    c.publicar('v1');
    assert.deepEqual(sincronizar(c).novos, ['login']);

    c.publicar('v2');
    assert.deepEqual(sincronizar(c).atualizados, ['login']);
    assert.equal(readFileSync(c.local(), 'utf8'), 'v2');

    writeFileSync(c.local(), 'v2 + ajuste da pessoa');
    c.publicar('v3');
    const r = sincronizar(c);
    assert.deepEqual(r.preservados, ['login']);
    assert.equal(readFileSync(c.local(), 'utf8'), 'v2 + ajuste da pessoa');
    assert.equal(readFileSync(join(c.para, '.novidades/conta/login.spec.ts'), 'utf8'), 'v3');
  } finally {
    rmSync(c.raiz, { recursive: true, force: true });
  }
});

test('nunca escreve de volta na origem', () => {
  const c = cenario();
  try {
    c.publicar('v1');
    sincronizar(c);
    writeFileSync(c.local(), 'mudança local');
    sincronizar(c);
    assert.equal(readFileSync(join(c.de, 'conta/login.spec.ts'), 'utf8'), 'v1');
  } finally {
    rmSync(c.raiz, { recursive: true, force: true });
  }
});

test('teste removido do catálogo é avisado e a cópia local fica', () => {
  const c = cenario();
  try {
    c.publicar('v1');
    sincronizar(c);
    c.publicar('v1', []);
    const r = sincronizar(c);
    assert.deepEqual(r.removidosNaOrigem, ['conta/login.spec.ts']);
    assert.ok(existsSync(c.local()));
  } finally {
    rmSync(c.raiz, { recursive: true, force: true });
  }
});
