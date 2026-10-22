// Extrai os data-test do código-fonte do Toolshop e os getByTestId dos nossos testes.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

function andar(dir, ext, saida = []) {
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome.startsWith('.')) continue;
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) andar(caminho, ext, saida);
    else if (nome.endsWith(ext)) saida.push(caminho);
  }
  return saida;
}

/**
 * Lê os templates Angular (src/app/**.html) e devolve:
 * - fixos: { "login-submit": ["auth/login/login.component.html", ...] }
 * - dinamicos: prefixos de ids montados em runtime ("product-" de data-test="product-{{item.id}}")
 * - estados: ids que vêm de uma variável conhecida (resultState)
 */
export function mapearFonte(appDir) {
  const fixos = {};
  const dinamicos = new Set();
  for (const arquivo of andar(appDir, '.html')) {
    const html = readFileSync(arquivo, 'utf8');
    const tela = relative(appDir, arquivo).split(sep).join('/');
    for (const m of html.matchAll(/(?<![\w-])(?:attr\.)?data-test="([^"]+)"/g)) {
      const valor = m[1];
      if (/^[\w-]+$/.test(valor)) (fixos[valor] ??= new Set()).add(tela);
      else {
        const prefixo = valor.split('{{')[0];
        if (prefixo) dinamicos.add(prefixo);
      }
    }
  }
  // O componente de senha usa [attr.data-test]="id": o id vem de quem usa o componente.
  for (const arquivo of andar(appDir, '.html')) {
    const html = readFileSync(arquivo, 'utf8');
    const tela = relative(appDir, arquivo).split(sep).join('/');
    for (const m of html.matchAll(/<app-password-input[^>]*?\sid="([\w-]+)"/gs)) (fixos[m[1]] ??= new Set()).add(tela);
  }
  // resultState no catálogo vira data-test em runtime
  const estados = new Set();
  for (const arquivo of andar(appDir, '.ts')) {
    for (const m of readFileSync(arquivo, 'utf8').matchAll(/resultState\s*=\s*'([\w-]+)'/g)) estados.add(m[1]);
  }
  return {
    fixos: Object.fromEntries(Object.entries(fixos).sort().map(([k, v]) => [k, [...v].sort()])),
    dinamicos: [...dinamicos].sort(),
    estados: [...estados].sort(),
  };
}

/** Todos os getByTestId('x') dos nossos specs, com arquivo e linha. */
export function seletoresDosTestes(pasta) {
  const usados = [];
  for (const arquivo of andar(pasta, '.ts')) {
    const linhas = readFileSync(arquivo, 'utf8').split('\n');
    linhas.forEach((linha, i) => {
      for (const m of linha.matchAll(/getByTestId\(\s*(['"`])([^'"`]+)\1/g)) {
        usados.push({ id: m[2], arquivo: relative(pasta, arquivo).split(sep).join('/'), linha: i + 1 });
      }
      for (const m of linha.matchAll(/getByTestId\(\s*(\/\^?[^/]+\/[a-z]*)/g)) {
        usados.push({ id: m[1], arquivo: relative(pasta, arquivo).split(sep).join('/'), linha: i + 1, regex: true });
      }
    });
  }
  return usados;
}

/** Confere um id usado contra o mapa. Regex só vale se casar com um prefixo dinâmico. */
export function existe(usado, mapa) {
  if (usado.regex) {
    const corpo = usado.id.replace(/^\/\^?/, '').replace(/\/[a-z]*$/, '');
    return mapa.dinamicos.some(p => corpo.startsWith(p));
  }
  return Boolean(mapa.fixos[usado.id]) || mapa.estados.includes(usado.id);
}
