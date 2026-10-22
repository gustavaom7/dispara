#!/usr/bin/env node
// Gera ref/toolshop-seletores.json a partir do código-fonte do Toolshop.
// Uso: npm run mapear -- --fonte /caminho/practice-software-testing [--sprint sprint5]
// Sem --fonte, clona o repositório público (raso) numa pasta temporária.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RAIZ, argumentos } from './lib/util.mjs';
import { mapearFonte } from './lib/seletores.mjs';

const REPO = 'https://github.com/testsmith-io/practice-software-testing.git';
const a = argumentos();
const sprint = a.sprint ?? 'sprint5';
let fonte = a.fonte;
let temporaria;

if (!fonte) {
  temporaria = mkdtempSync(join(tmpdir(), 'toolshop-'));
  console.log(`Clonando ${REPO}...`);
  const r = spawnSync('git', ['clone', '--quiet', '--depth', '1', '--filter=blob:none', '--sparse', REPO, temporaria], { stdio: 'inherit' });
  if (r.status !== 0) sair('Não consegui clonar o Toolshop.');
  spawnSync('git', ['sparse-checkout', 'set', `${sprint}/UI/src/app`], { cwd: temporaria, stdio: 'inherit' });
  fonte = temporaria;
}

const appDir = join(fonte, sprint, 'UI', 'src', 'app');
if (!existsSync(appDir)) sair(`Não achei ${appDir}`);

const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: fonte, encoding: 'utf8' }).stdout.trim() || 'desconhecido';
const mapa = mapearFonte(appDir);
const saida = { fonte: REPO, sprint, commit, geradoEm: new Date().toISOString(), ...mapa };

mkdirSync(join(RAIZ, 'ref'), { recursive: true });
writeFileSync(join(RAIZ, 'ref', 'toolshop-seletores.json'), JSON.stringify(saida, null, 2) + '\n');
console.log(`${Object.keys(mapa.fixos).length} seletores fixos, ${mapa.dinamicos.length} prefixos dinâmicos (${sprint} @ ${commit.slice(0, 7)})`);
if (temporaria) rmSync(temporaria, { recursive: true, force: true });

function sair(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}
