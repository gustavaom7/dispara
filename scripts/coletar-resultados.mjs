#!/usr/bin/env node
// Lê relatorio-json/resultado.json e acrescenta as execuções ao histórico.
// Uso: npm run coletar -- [--relatorio-json relatorio-json/resultado.json] [--historico resultados/execucoes.json]
//                         [--ambiente estavel] [--avatar cliente] [--quem "Ana"] [--origem ci] [--url-relatorio https://...]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { userInfo } from 'node:os';
import { RAIZ, argumentos, executadoDireto, lerJson } from './lib/util.mjs';
import { coletar, juntar } from './lib/coletar.mjs';

export function salvarResultados(opcoes = {}) {
  const origemJson = resolve(RAIZ, opcoes.relatorioJson ?? 'relatorio-json/resultado.json');
  if (!existsSync(origemJson)) throw new Error(`Relatório não encontrado: ${origemJson}`);
  const destino = resolve(RAIZ, opcoes.historico ?? 'resultados/execucoes.json');
  const novas = coletar(JSON.parse(readFileSync(origemJson, 'utf8')), {
    ambiente: opcoes.ambiente,
    avatar: opcoes.avatar,
    quem: opcoes.quem ?? process.env.GITHUB_ACTOR ?? userInfo().username,
    origem: opcoes.origem ?? (process.env.CI ? 'ci' : 'local'),
    relatorio: opcoes.urlRelatorio,
  });
  const historico = juntar(lerJson(destino, []), novas);
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, JSON.stringify(historico, null, 2) + '\n');
  return { novas, destino };
}

/** Junta vários arquivos de execuções (ex.: um por ambiente no CI) num histórico só. */
export function juntarArquivos(arquivos, historico) {
  const destino = resolve(RAIZ, historico ?? 'resultados/execucoes.json');
  let total = lerJson(destino, []);
  for (const arq of arquivos) total = juntar(total, lerJson(resolve(arq), []));
  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, JSON.stringify(total, null, 2) + '\n');
  return { total: total.length, destino };
}

if (executadoDireto(import.meta.url)) {
  const a = argumentos();
  if (a.juntar) {
    const arquivos = [...(typeof a.juntar === 'string' ? [a.juntar] : []), ...a._];
    const { total, destino } = juntarArquivos(arquivos, a.historico);
    console.log(`${arquivos.length} arquivo(s) juntados em ${destino.replace(RAIZ + '/', '')}: ${total} execuções no histórico`);
    process.exit(0);
  }
  try {
    const { novas, destino } = salvarResultados({
      relatorioJson: a['relatorio-json'], historico: a.historico, ambiente: a.ambiente, avatar: a.avatar,
      quem: a.quem, origem: a.origem, urlRelatorio: a['url-relatorio'],
    });
    const cont = s => novas.filter(e => e.status === s).length;
    console.log(`${novas.length} arquivo(s) registrados em ${destino.replace(RAIZ + '/', '')}: ${cont('passou')} passou · ${cont('falhou')} falhou · ${cont('pulado')} pulado`);
  } catch (e) {
    console.error(`✖ ${e.message}`);
    process.exit(1);
  }
}

