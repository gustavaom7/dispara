#!/usr/bin/env node
// Publica os testes da pasta da autora em /publicados (que vai para o Git).
// Uso: npm run publicar -- --de ~/meus-rascunhos --autor "Gustavo"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { userInfo } from 'node:os';
import { RAIZ, argumentos, hash, lerJson, listarSpecs } from './lib/util.mjs';
import { sanitizar, cabecalhoDeAvisos } from './lib/sanitizar.mjs';
import { metadados } from './lib/manifesto.mjs';

const a = argumentos();
const de = resolve(a.de ?? process.env.DISPARA_AUTOR ?? join(RAIZ, 'exemplo-autor'));
const para = resolve(a.para ?? join(RAIZ, 'publicados'));
const autor = a.autor ?? process.env.DISPARA_AUTOR_NOME ?? userInfo().username;

if (!existsSync(de)) sair(`Pasta de origem não encontrada: ${de}`);
if ((para + sep).startsWith(de + sep) || (de + sep).startsWith(para + sep)) {
  sair('A pasta de origem e /publicados não podem estar uma dentro da outra.');
}

const caminhoManifesto = join(para, 'manifest.json');
const caminhoHistorico = join(para, 'historico.json');
const anterior = new Map(lerJson(caminhoManifesto, { testes: [] }).testes.map(t => [t.arquivo, t]));

const arquivos = listarSpecs(de);
if (!arquivos.length) sair(`Nenhum .spec.ts em ${de}`);

const ids = new Map();
for (const arq of arquivos) {
  const id = metadados(arq, '').id;
  if (ids.has(id)) sair(`Dois testes com o mesmo nome "${id}": ${ids.get(id)} e ${arq}. Renomeie um deles.`);
  ids.set(id, arq);
}

const mudancas = { adicionados: [], alterados: [], removidos: [] };
const testes = [];
let totalAvisos = 0;

for (const arq of arquivos) {
  const original = readFileSync(join(de, arq), 'utf8');
  const { codigo, avisos } = sanitizar(original);
  const final = cabecalhoDeAvisos(avisos) + codigo;
  const h = hash(final);
  const antes = anterior.get(arq);
  const meta = metadados(arq, codigo);

  if (!antes) mudancas.adicionados.push(meta.id);
  else if (antes.hash !== h) mudancas.alterados.push(meta.id);

  if (!antes || antes.hash !== h || !existsSync(join(para, arq))) {
    mkdirSync(dirname(join(para, arq)), { recursive: true });
    writeFileSync(join(para, arq), final);
  }

  testes.push({
    ...meta,
    hash: h,
    atualizadoEm: antes?.hash === h && antes.atualizadoEm ? antes.atualizadoEm : new Date().toISOString(),
    avisos: avisos.map(({ regra, linha, dica }) => ({ regra, linha, dica })),
  });

  if (avisos.length) {
    totalAvisos += avisos.length;
    console.log(`\n⚠  ${arq}`);
    for (const av of avisos) console.log(`   linha ${av.linha}: ${av.regra} → ${av.dica}`);
  }
}

for (const [arq, t] of anterior) {
  if (!arquivos.includes(arq)) {
    rmSync(join(para, arq), { force: true });
    mudancas.removidos.push(t.id);
  }
}

writeFileSync(caminhoManifesto, JSON.stringify({ geradoEm: new Date().toISOString(), testes }, null, 2) + '\n');

const houveMudanca = Object.values(mudancas).some(l => l.length);
if (houveMudanca) {
  const historico = lerJson(caminhoHistorico, []);
  historico.unshift({ quando: new Date().toISOString(), autor, ...mudancas });
  writeFileSync(caminhoHistorico, JSON.stringify(historico.slice(0, 50), null, 2) + '\n');
}

console.log(`\n${testes.length} teste(s) em /publicados · +${mudancas.adicionados.length} ~${mudancas.alterados.length} -${mudancas.removidos.length}`);
if (totalAvisos) console.log(`${totalAvisos} valor(es) sensível(is) removido(s). Corrija na origem para o aviso sumir.`);
if (houveMudanca) console.log('Próximo passo: git add publicados && git commit && git push');

function sair(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}
