#!/usr/bin/env node
// Guarda do CI: os rascunhos de IA que estavam prontos continuam passando nas checagens?
// (Fixtures, page objects ou o mapa de seletores mudam; um rascunho bom pode deixar de ser.)
import { join } from 'node:path';
import { RAIZ, lerJson } from './lib/util.mjs';
import { listarRascunhos } from './lib/ia/saida.mjs';
import { checarTudo } from './lib/ia/checagens.mjs';

const mapa = lerJson(join(RAIZ, 'ref', 'toolshop-seletores.json'));
const rascunhos = listarRascunhos().filter(r => r.status !== 'reprovado');
let quebrados = 0;
for (const r of rascunhos) {
  const erros = checarTudo({ codigo: r.codigo, slug: r.id }, { mapa });
  console.log(`${erros.length ? '✖' : '✔'} ${r.id}${r.aprovado ? ' (aprovado)' : ''}${erros.length ? `: ${erros.length} problema(s)` : ''}`);
  for (const e of erros) console.log(`    · ${e.linha ? `linha ${e.linha} · ` : ''}${e.tipo}: ${e.mensagem}`);
  if (erros.length) quebrados++;
}
console.log(`${rascunhos.length - quebrados} de ${rascunhos.length} rascunho(s) passando nas checagens.`);
process.exit(quebrados ? 1 : 0);
