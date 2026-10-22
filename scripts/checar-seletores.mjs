#!/usr/bin/env node
// Confere se cada getByTestId dos testes existe no código-fonte do Toolshop.
// Uso: npm run checar                 (usa o mapa versionado em ref/)
//      npm run checar -- --atualizar  (clona o Toolshop e refaz o mapa antes)
//      npm run checar -- --pasta publicados
// Roda antes dos testes no CI: se o Toolshop mudar um seletor, a falha aponta o motivo na hora.
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { RAIZ, argumentos, lerJson } from './lib/util.mjs';
import { existe, seletoresDosTestes } from './lib/seletores.mjs';

const a = argumentos();
if (a.atualizar) {
  const r = spawnSync(process.execPath, [join(RAIZ, 'scripts', 'mapear-toolshop.mjs')], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const mapa = lerJson(join(RAIZ, 'ref', 'toolshop-seletores.json'), null);
if (!mapa) {
  console.error('✖ Sem ref/toolshop-seletores.json. Rode "npm run mapear" antes.');
  process.exit(1);
}

const pasta = resolve(RAIZ, a.pasta ?? 'exemplo-autor');
const usados = seletoresDosTestes(pasta);
const faltando = usados.filter(u => !existe(u, mapa));
const unicos = new Set(usados.map(u => u.id));

console.log(`${usados.length} usos de ${unicos.size} seletores em ${pasta.replace(RAIZ + '/', '')}, conferidos contra ${mapa.sprint} @ ${mapa.commit.slice(0, 7)}`);
if (!faltando.length) {
  console.log('✔ Todos existem no código do Toolshop.');
  process.exit(0);
}
console.error(`✖ ${faltando.length} seletor(es) sem correspondência:`);
for (const f of faltando) console.error(`  ${f.arquivo}:${f.linha}  ${f.id}`);
process.exit(1);
