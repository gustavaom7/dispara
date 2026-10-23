import { test } from 'node:test';
import assert from 'node:assert/strict';
import { falhasDoRelatorio, detalhesMarkdown } from './detalhes-falhas.mjs';

const relatorio = {
  suites: [{
    file: 'conta/login.spec.ts',
    specs: [
      { title: 'entra', tests: [{ projectName: 'chromium', results: [
        { status: 'failed', errors: [{ message: '\u001b[31mError: nav-menu\u001b[39m' }], attachments: [] },
        { status: 'failed', errors: [{ message: 'Error: nav-menu' }], attachments: [{ name: 'error-context', path: '/x/error-context.md' }] },
      ] }] },
      { title: 'passa', tests: [{ projectName: 'chromium', results: [{ status: 'passed', errors: [] }] }] },
      { title: 'instável', tests: [{ projectName: 'chromium', results: [{ status: 'failed', errors: [{ message: 'x' }] }, { status: 'passed' }] }] },
    ],
  }],
};

test('pega só o que falhou em todas as tentativas, com o contexto da página', () => {
  const falhas = falhasDoRelatorio(relatorio, { lerArquivo: () => '- heading "Login" [level=3]\n- alert: Account locked' });
  assert.equal(falhas.length, 1);
  assert.equal(falhas[0].titulo, 'entra');
  assert.equal(falhas[0].mensagem, 'Error: nav-menu');
  assert.match(falhas[0].contexto, /Account locked/);
});

test('markdown vazio sem falhas e com blocos de código quando há', () => {
  assert.equal(detalhesMarkdown([]), '');
  const md = detalhesMarkdown(falhasDoRelatorio(relatorio, { lerArquivo: () => null }));
  assert.match(md, /Detalhes das 1 falha/);
  assert.match(md, /```\nError: nav-menu\n```/);
  assert.doesNotMatch(md, /Página no momento/);
});
