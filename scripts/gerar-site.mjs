#!/usr/bin/env node
// Gera o site estático a partir de /publicados e /config.
// Uso: npm run site -- [--demo] [--repo https://github.com/voce/dispara.git] [--execucoes resultados/execucoes.json]
// Execuções: usa as reais (resultados/execucoes.json, gerado pelo CI) quando existem;
// sem elas, --demo gera exemplos marcados como tal; sem --demo, a tela fica vazia.
// Saída: site/dist/index.html (GitHub Pages) e site/dist/fragmento.html (sem <html>, para embutir).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { RAIZ, argumentos, lerJson } from './lib/util.mjs';
import { listarRascunhos } from './lib/ia/saida.mjs';
import { classificarPorRegras, sinais } from './lib/ia/triagem.mjs';

const a = argumentos();
const manifesto = lerJson(join(RAIZ, 'publicados', 'manifest.json'), null);
if (!manifesto) {
  console.error('✖ Sem publicados/manifest.json. Rode "npm run publicar" antes.');
  process.exit(1);
}

const ambientes = lerJson(join(RAIZ, 'config', 'ambientes.json'), [])
  .map(({ id, nome, descricao, padrao, protegido }) => ({ id, nome, descricao, padrao: Boolean(padrao), protegido: Boolean(protegido) }));
const avatares = lerJson(join(RAIZ, 'config', 'avatares.json'), [])
  .map(({ id, nome, descricao, prefixo, padrao }) => ({ id, nome, descricao, prefixo, padrao: Boolean(padrao) }));

const testes = manifesto.testes.map(({ hash, ...t }) => ({
  ...t,
  avisos: Array.isArray(t.avisos) ? t.avisos : [],
  codigo: readFileSync(join(RAIZ, 'publicados', t.arquivo), 'utf8'),
}));

const caminhoExecucoes = resolve(RAIZ, a.execucoes ?? 'resultados/execucoes.json');
const reais = existsSync(caminhoExecucoes) ? JSON.parse(readFileSync(caminhoExecucoes, 'utf8')) : [];
const execucoes = reais.length ? reais : a.demo ? comTriagem(execucoesDemo(testes)) : [];
const fonteExecucoes = reais.length ? 'real' : execucoes.length ? 'exemplo' : 'nenhuma';

const dados = {
  manifesto: { geradoEm: manifesto.geradoEm, testes },
  ambientes,
  avatares,
  historico: lerJson(join(RAIZ, 'publicados', 'historico.json'), []),
  nomesAreas: lerJson(join(RAIZ, 'config', 'areas.json'), {}),
  execucoes,
  fonteExecucoes,
  rascunhos: listarRascunhos().map(({ pasta, ...r }) => r),
  demo: Boolean(a.demo),
  repo: a.repo ?? 'https://github.com/SEU-USUARIO/dispara.git',
};

/** Fontes do design system embutidas como data URI: o site não depende de CDN de fontes (nem o artifact da demo). */
function fontesEmbutidas() {
  const fontes = [
    ['Familjen Grotesk', 'familjen-grotesk', [600, 700]],
    ['Public Sans', 'public-sans', [400, 500, 600]],
    ['Martian Mono', 'martian-mono', [400, 500]],
  ];
  return fontes.flatMap(([familia, pacote, pesos]) => pesos.map(peso => {
    const arquivo = join(RAIZ, 'node_modules', '@fontsource', pacote, 'files', `${pacote}-latin-${peso}-normal.woff2`);
    if (!existsSync(arquivo)) return '';
    const b64 = readFileSync(arquivo).toString('base64');
    return `@font-face{font-family:"${familia}";font-style:normal;font-weight:${peso};font-display:swap;src:url(data:font/woff2;base64,${b64}) format("woff2")}`;
  })).join('\n');
}

// As URLs dos ambientes ficam fora do site de propósito: o site pode ser público.
const json = JSON.stringify(dados).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, c => `\\u${c.charCodeAt(0).toString(16)}`);
const fragmento = readFileSync(join(RAIZ, 'site', 'template.html'), 'utf8')
  .replace('/*__FONTES__*/', () => fontesEmbutidas())
  .replace('"__DADOS__"', () => json);
const pagina = `<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n${fragmento}\n</body>\n</html>\n`;

const saida = join(RAIZ, 'site', 'dist');
mkdirSync(saida, { recursive: true });
writeFileSync(join(saida, 'index.html'), pagina);
writeFileSync(join(saida, 'fragmento.html'), fragmento);
console.log(`Site gerado em site/dist/ com ${testes.length} teste(s) e ${execucoes.length} execução(ões) ${{ real: 'reais', exemplo: 'de exemplo', nenhuma: '' }[fonteExecucoes]}.`.replace(/ \.$/, '.'));

/** Nos exemplos, as falhas também ganham diagnóstico (pelas regras), para a tela mostrar como fica. */
function comTriagem(lista) {
  const mapa = lerJson(join(RAIZ, 'ref', 'toolshop-seletores.json'), null);
  const historico = lista.map(e => ({ ...e, quando: new Date(Date.now() - e.atras).toISOString() }));
  return lista.map((e, i) => {
    if (e.status !== 'falhou') return e;
    const d = classificarPorRegras(sinais({ falha: historico[i], historico, mapa }));
    return { ...e, triagem: { categoria: d.categoria, confianca: d.confianca, resumo: d.resumo, evidencias: d.evidencias, proximoPasso: d.proximoPasso, modo: 'regras', modelo: null } };
  });
}

/**
 * Execuções fictícias para a demo, usadas só quando ainda não há resultados reais.
 * Guardam "há quanto tempo" (atras, em ms) para a demo parecer recente em qualquer dia.
 * No ambiente "com-bugs" falham bem mais, como acontece de verdade.
 */
function execucoesDemo(lista) {
  let semente = 20261022;
  const r = () => (semente = (semente * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const escolher = (xs) => xs[Math.floor(r() * xs.length)];
  const pessoas = ['Ana Ribeiro', 'Bruno Lima', 'Carla Souza', 'GitHub Actions', 'Gustavo'];
  const erros = {
    'adicionar-produto': 'line-price: esperado 28.30, recebido 14.15',
    busca: "product-name 'Thor Hammer' não corresponde a /pliers/i",
    'compra-como-convidado': 'Timeout 10000ms: #order-confirmation não apareceu',
    produtos: 'status da API · Expected: 200 · Received: 500',
    'filtro-e-ordenacao': 'Lista fora de ordem: 12.01 aparece antes de 9.17',
    login: "page-title · Expected: 'My account' · Received: 'Sales over the years'",
  };
  const padrao = ambientes.find(x => x.padrao) ?? ambientes[0];
  const avPadrao = avatares.find(x => x.padrao)?.id ?? avatares[0].id;

  return Array.from({ length: 72 }, (_, i) => {
    const t = escolher(lista);
    const ambiente = r() < 0.6 ? padrao : escolher(ambientes);
    const avatar = t.exigeAvatar ?? (r() < 0.7 ? avPadrao : escolher(avatares).id);
    const chance = ambiente.id === 'com-bugs' ? (erros[t.id] ? 0.6 : 0.15) : ambiente.id === 'sprint4' ? 0.2 : 0.04;
    const falhou = r() < chance;
    const total = t.qtdTestes;
    return {
      id: `exemplo-${String(i + 1).padStart(3, '0')}`,
      exemplo: true,
      teste: t.id,
      arquivo: t.arquivo,
      ambiente: ambiente.id,
      avatar,
      quem: escolher(pessoas),
      origem: 'exemplo',
      status: falhou ? 'falhou' : 'passou',
      casos: { passou: falhou ? total - 1 : total, falhou: falhou ? 1 : 0, pulado: 0, instavel: 0 },
      duracaoMs: Math.round((2 + r() * 25) * 1000),
      atras: Math.floor(Math.pow(r(), 1.5) * 14 * 864e5) + 3 * 60e3,
      ...(falhou ? { erro: erros[t.id] ?? `Timeout 10000ms excedido em ${t.arquivo}` } : {}),
    };
  });
}
