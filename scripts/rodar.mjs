#!/usr/bin/env node
// O comando que o site copia:  npm run t -- busca --ambiente=estavel --avatar=cliente
// Outros: --todos [--exceto=pedidos,cadastro]  --headed  --ui  --debug  --sem-sync
// 1. git pull (se for um clone)  2. sync de mão única  3. valida  4. roda o Playwright
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { RAIZ, argumentos, lerJson } from './lib/util.mjs';
import { sincronizar, imprimirResumo } from './sincronizar.mjs';
import { salvarResultados } from './coletar-resultados.mjs';

const a = argumentos();
const ambientes = lerJson(join(RAIZ, 'config', 'ambientes.json'), []);
const avatares = lerJson(join(RAIZ, 'config', 'avatares.json'), []);
const pasta = process.env.DISPARA_PASTA ?? join(RAIZ, 'meus-testes');

const ambiente = ambientes.find(x => x.id === (a.ambiente ?? process.env.AMBIENTE ?? ambientes.find(y => y.padrao)?.id));
if (!ambiente) sair(`Ambiente inválido. Opções: ${ambientes.map(x => x.id).join(', ')}`);
const avatar = avatares.find(x => x.id === (a.avatar ?? process.env.AVATAR ?? avatares.find(y => y.padrao)?.id ?? avatares[0]?.id));
if (!avatar) sair(`Avatar inválido. Opções: ${avatares.map(x => x.id).join(', ')}`);

if (!a['sem-sync']) {
  if (existsSync(join(RAIZ, '.git'))) {
    const pull = spawnSync('git', ['pull', '--ff-only', '--quiet'], { cwd: RAIZ, stdio: 'inherit' });
    if (pull.status !== 0) console.log('⚠  git pull falhou; seguindo com os testes que já estão aqui.');
  }
  try {
    imprimirResumo(sincronizar({ de: join(RAIZ, 'publicados'), para: pasta }));
  } catch (e) {
    sair(e.message);
  }
}

const catalogo = lerJson(join(pasta, '.dispara-manifest.json'), null);
if (!catalogo) sair('Catálogo local não encontrado. Rode sem --sem-sync uma vez.');

let selecionados;
const exceto = new Set(String(a.exceto ?? '').split(',').filter(Boolean));
if (a.todos) selecionados = catalogo.testes.filter(t => !exceto.has(t.id));
else {
  if (!a._.length) sair('Diga qual teste rodar (ex.: npm run t -- login) ou use --todos.');
  selecionados = a._.map(id => {
    const t = catalogo.testes.find(x => x.id === id);
    if (!t) {
      const parecidos = catalogo.testes.filter(x => x.id.includes(id) || id.includes(x.id)).map(x => x.id);
      sair(`Teste "${id}" não existe.${parecidos.length ? ` Você quis dizer: ${parecidos.join(', ')}?` : ''}`);
    }
    return t;
  });
}

if (ambiente.protegido && !a.forcar) {
  const destrutivos = selecionados.filter(t => t.tags.includes('destrutivo'));
  if (destrutivos.length) {
    sair(`${ambiente.nome} é protegido e estes testes alteram dados: ${destrutivos.map(t => t.id).join(', ')}.\n  Rode em outro ambiente ou, se for intencional, adicione --forcar.`);
  }
}

const arquivos = selecionados.map(t => relative(RAIZ, join(pasta, t.arquivo)).split('\\').join('/'));
const extras = ['headed', 'ui', 'debug'].filter(f => a[f]).map(f => `--${f}`);

console.log(`▶ ${selecionados.length} arquivo(s) · ${ambiente.nome} (${ambiente.baseURL}) · conta "${avatar.nome}"`);
const r = spawnSync('npx', ['playwright', 'test', ...arquivos, ...extras], {
  cwd: RAIZ,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, AMBIENTE: ambiente.id, AVATAR: avatar.id },
});

// Guarda o resultado desta execução no seu histórico local (o CI guarda o dele separado).
if (!process.env.CI) {
  try {
    const { novas } = salvarResultados({ ambiente: ambiente.id, avatar: avatar.id, historico: join(pasta, '.execucoes.json') });
    const falhas = novas.filter(e => e.status === 'falhou').length;
    console.log(`↳ Resultado salvo em ${relative(RAIZ, join(pasta, '.execucoes.json'))}${falhas ? ` (${falhas} arquivo(s) com falha)` : ''}`);
  } catch { /* sem relatório JSON: nada a guardar */ }
}
process.exit(r.status ?? 1);

function sair(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}
