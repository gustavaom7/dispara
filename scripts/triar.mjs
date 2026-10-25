#!/usr/bin/env node
// Triagem das falhas de uma execução: anota cada execução que falhou com um diagnóstico.
// Uso: npm run triar -- --execucoes parcial/estavel.json [--relatorio-json relatorio-json/cliente.json]
//                        [--historico resultados/execucoes.json] [--avatar cliente] [--max 10] [--regras] [--modelo ...]
// Com ANTHROPIC_API_KEY, usa o Claude; sem a chave (ou com --regras), usa as regras locais.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { RAIZ, argumentos, lerJson } from './lib/util.mjs';
import { falhasDetalhadas } from './lib/coletar.mjs';
import { CATEGORIAS, diagnosticar } from './lib/ia/triagem.mjs';
import { clienteReal, MODELO_PADRAO } from './lib/ia/cliente.mjs';

try { process.loadEnvFile(join(RAIZ, '.env')); } catch { /* sem .env */ }

const a = argumentos();
if (!a.execucoes) sair('Informe o arquivo de execuções: npm run triar -- --execucoes parcial/estavel.json');
const caminho = resolve(RAIZ, a.execucoes);
if (!existsSync(caminho)) sair(`Não achei ${a.execucoes}`);

const execucoes = JSON.parse(readFileSync(caminho, 'utf8'));
const historico = [...execucoes, ...lerJson(resolve(RAIZ, a.historico ?? 'resultados/execucoes.json'), [])];
const detalhes = a['relatorio-json'] && existsSync(resolve(RAIZ, a['relatorio-json']))
  ? falhasDetalhadas(JSON.parse(readFileSync(resolve(RAIZ, a['relatorio-json']), 'utf8')))
  : new Map();
const mapa = lerJson(join(RAIZ, 'ref', 'toolshop-seletores.json'), null);

const alvo = execucoes.filter(e => e.status === 'falhou' && !e.triagem && (!a.avatar || e.avatar === a.avatar));
const max = Number(a.max ?? 10);
let cliente = null;
if (!a.regras && process.env.ANTHROPIC_API_KEY && alvo.length) {
  cliente = await clienteReal({ modelo: a.modelo ?? process.env.DISPARA_MODELO ?? MODELO_PADRAO }).catch(() => null);
}
console.log(`Triagem de ${Math.min(alvo.length, max)} falha(s) · ${cliente ? `Claude (${cliente.modelo})` : 'regras locais'}`);

const codigoDe = arquivo => {
  for (const pasta of ['meus-testes', 'publicados', 'exemplo-autor']) {
    const p = join(RAIZ, pasta, arquivo ?? '');
    if (arquivo && existsSync(p)) return readFileSync(p, 'utf8');
  }
  return null;
};

for (const e of alvo.slice(0, max)) {
  const det = detalhes.get(`${e.arquivo}::${e.dispositivo === 'celular' ? 'celular' : ''}`);
  const falha = { ...e, caso: det?.caso, erroCompleto: det?.mensagem || e.erro };
  const d = await diagnosticar({ falha, historico, mapa, codigo: codigoDe(e.arquivo), cliente });
  e.triagem = { categoria: d.categoria, confianca: d.confianca, resumo: d.resumo, evidencias: d.evidencias, proximoPasso: d.proximoPasso, modo: d.modo, modelo: d.modelo };
  console.log(`  ${e.teste}${e.dispositivo ? ` (${e.dispositivo})` : ''}: ${CATEGORIAS[d.categoria]} · confiança ${d.confianca}${d.aviso ? ` · ${d.aviso}` : ''}`);
}
if (alvo.length > max) console.log(`  ${alvo.length - max} falha(s) ficaram sem triagem (limite --max ${max}).`);

writeFileSync(caminho, JSON.stringify(execucoes, null, 2) + '\n');

function sair(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}
