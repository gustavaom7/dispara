#!/usr/bin/env node
// Aprova um rascunho da IA: copia o .spec.ts para a pasta da autora e marca quem aprovou.
// Uso: npm run aprovar -- favoritos [--autor "Gustavo"] [--de exemplo-autor] [--forcar]
// Depois: npm run publicar (o teste entra no catálogo como qualquer outro)
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { userInfo } from 'node:os';
import { RAIZ, argumentos } from './lib/util.mjs';
import { PASTA_RASCUNHOS } from './lib/ia/saida.mjs';
import { checarTudo } from './lib/ia/checagens.mjs';

const a = argumentos();
const id = a._[0];
if (!id) sair('Diga qual rascunho aprovar: npm run aprovar -- <id> (os ids são as pastas em rascunhos-ia/)');

const pasta = join(PASTA_RASCUNHOS, id);
const caminhoStatus = join(pasta, 'status.json');
if (!existsSync(caminhoStatus)) sair(`Rascunho "${id}" não existe em rascunhos-ia/.`);
const status = JSON.parse(readFileSync(caminhoStatus, 'utf8'));
if (status.aprovado) sair(`"${id}" já foi aprovado por ${status.aprovado.por} em ${status.aprovado.em.slice(0, 10)}.`);

// A pessoa pode ter editado o rascunho na revisão: confere de novo antes de levar ao catálogo.
const origem = join(pasta, `${id}.spec.ts`);
const codigo = readFileSync(origem, 'utf8');
const mapa = JSON.parse(readFileSync(join(RAIZ, 'ref', 'toolshop-seletores.json'), 'utf8'));
const erros = checarTudo({ codigo, slug: id }, { mapa });
if (erros.length && !a.forcar) {
  console.error(`✖ O rascunho não passa nas checagens:`);
  for (const e of erros) console.error(`  · ${e.linha ? `linha ${e.linha} · ` : ''}${e.tipo}: ${e.mensagem}`);
  sair('Corrija o arquivo ou use --forcar.');
}

const destinoPasta = resolve(RAIZ, a.de ?? process.env.DISPARA_AUTOR ?? 'exemplo-autor', status.area);
const destino = join(destinoPasta, `${id}.spec.ts`);
if (existsSync(destino) && !a.forcar) sair(`Já existe ${relative(RAIZ, destino)}. Use --forcar para substituir.`);
mkdirSync(destinoPasta, { recursive: true });
copyFileSync(origem, destino);

status.aprovado = { por: a.autor ?? process.env.DISPARA_AUTOR_NOME ?? userInfo().username, em: new Date().toISOString(), destino: relative(RAIZ, destino) };
writeFileSync(caminhoStatus, JSON.stringify(status, null, 2) + '\n');

console.log(`✔ ${status.titulo} aprovado → ${relative(RAIZ, destino)}`);
console.log('Próximo passo: npm run publicar (e git push) para entrar no catálogo.');

function sair(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}
