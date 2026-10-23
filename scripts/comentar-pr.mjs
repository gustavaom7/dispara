#!/usr/bin/env node
// Monta o comentário do PR de um ambiente: resumo com diagnóstico + detalhes de cada falha.
// Uso: npm run -s comentario -- parcial/estavel.json relatorio-json/cliente.json relatorio-json/admin.json > comentario.md
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RAIZ, argumentos, executadoDireto } from './lib/util.mjs';
import { resumoMarkdown } from './resumo-ci.mjs';
import { falhasDoRelatorio, detalhesMarkdown } from './lib/detalhes-falhas.mjs';

const lerJson = arq => { try { return JSON.parse(readFileSync(arq, 'utf8')); } catch { return null; } };

export function comentario(execucoes, relatorios, { ambiente, relatorio } = {}) {
  const falhas = relatorios.filter(Boolean).flatMap(r => falhasDoRelatorio(r));
  return [
    `<!-- dispara:${ambiente ?? execucoes[0]?.ambiente ?? 'ambiente'} -->`,
    resumoMarkdown(execucoes, { relatorio }),
    detalhesMarkdown(falhas),
  ].join('\n');
}

if (executadoDireto(import.meta.url)) {
  const a = argumentos();
  const [parcial, ...jsons] = a._.map(c => resolve(RAIZ, c));
  const execucoes = (parcial && existsSync(parcial) && lerJson(parcial)) || [];
  process.stdout.write(comentario(execucoes, jsons.map(lerJson), { ambiente: a.ambiente, relatorio: a.relatorio }));
}
