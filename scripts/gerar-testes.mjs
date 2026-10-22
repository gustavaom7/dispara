#!/usr/bin/env node
// Gera casos de teste e um rascunho Playwright a partir de uma história de usuário.
// Uso: npm run gerar -- --historia historias/favoritos.md
//      npm run gerar -- --historia historias/favoritos.md --simular            (usa historias/favoritos.gravacao.json)
//      npm run gerar -- --historia historias/favoritos.md --modelo claude-opus-5-5 --correcoes 2
// Saída em rascunhos-ia/<slug>/. Para levar ao catálogo: npm run aprovar -- <slug>
import { existsSync, readFileSync } from 'node:fs';
import { basename, join, relative, resolve } from 'node:path';
import { RAIZ, argumentos, lerJson } from './lib/util.mjs';
import { ferramenta } from './lib/ia/esquema.mjs';
import { montarContexto } from './lib/ia/contexto.mjs';
import { clienteReal, clienteSimulado, MODELO_PADRAO } from './lib/ia/cliente.mjs';
import { checarTudo } from './lib/ia/checagens.mjs';
import { gerarRascunho } from './lib/ia/gerador.mjs';
import { gravarRascunho } from './lib/ia/saida.mjs';

try { process.loadEnvFile(join(RAIZ, '.env')); } catch { /* sem .env */ }

const a = argumentos();
if (!a.historia) sair('Informe a história: npm run gerar -- --historia historias/favoritos.md');
const caminhoHistoria = resolve(RAIZ, a.historia);
if (!existsSync(caminhoHistoria)) sair(`História não encontrada: ${a.historia}`);
const historia = readFileSync(caminhoHistoria, 'utf8');

let cliente;
try {
  if (a.simular) {
    const gravacao = typeof a.simular === 'string' ? resolve(RAIZ, a.simular) : caminhoHistoria.replace(/\.md$/, '.gravacao.json');
    if (!existsSync(gravacao)) sair(`Sem gravação em ${relative(RAIZ, gravacao)}. Rode sem --simular (com ANTHROPIC_API_KEY) ou grave uma.`);
    cliente = clienteSimulado(JSON.parse(readFileSync(gravacao, 'utf8')));
  } else {
    cliente = await clienteReal({ modelo: a.modelo ?? process.env.DISPARA_MODELO ?? MODELO_PADRAO });
  }
} catch (e) {
  sair(e.message);
}

const contexto = montarContexto({ historia });
const mapa = lerJson(join(RAIZ, 'ref', 'toolshop-seletores.json'));
console.log(`▶ Gerando a partir de ${relative(RAIZ, caminhoHistoria)} · ${cliente.modo} · ${cliente.modelo}`);

try {
  const resultado = await gerarRascunho({
    cliente,
    contexto,
    ferramenta: ferramenta(contexto.areas),
    checar: resposta => checarTudo(resposta, { mapa }),
    correcoes: Number(a.correcoes ?? 1),
  });
  for (const t of resultado.tentativas) {
    console.log(`  tentativa ${t.numero}: ${t.erros.length ? `${t.erros.length} problema(s)` : 'passou nas checagens'}`);
    for (const e of t.erros) console.log(`    · ${e.linha ? `linha ${e.linha} · ` : ''}${e.tipo}: ${e.mensagem}`);
  }
  const { pasta, status } = gravarRascunho({ resultado, historia, arquivoHistoria: relative(RAIZ, caminhoHistoria), cliente });
  const tipos = ['positivo', 'negativo', 'borda'].map(t => `${status.casos.filter(c => c.tipo === t).length} ${t}`).join(', ');
  const icone = { pronto: '✔', corrigido: '✔', reprovado: '✖' }[status.status];
  console.log(`${icone} ${status.titulo}: ${status.casos.length} casos (${tipos}) · status ${status.status}`);
  console.log(`  ${relative(RAIZ, pasta)}/`);
  if (status.tokens.entrada) console.log(`  tokens: ${status.tokens.entrada} de entrada, ${status.tokens.saida} de saída`);
  if (status.status !== 'reprovado') console.log(`Revise e aprove: npm run aprovar -- ${status.id}`);
  process.exit(status.status === 'reprovado' ? 2 : 0);
} catch (e) {
  sair(`Falha ao gerar (${basename(caminhoHistoria)}): ${e.message}`);
}

function sair(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}
