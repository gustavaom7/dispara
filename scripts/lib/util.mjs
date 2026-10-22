import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const hash = (texto) => createHash('sha256').update(texto).digest('hex').slice(0, 16);

export const idDe = (arquivo) => arquivo.split('/').pop().replace(/\.spec\.ts$/, '');

export function lerJson(caminho, padrao) {
  if (!existsSync(caminho)) return padrao;
  return JSON.parse(readFileSync(caminho, 'utf8'));
}

/** Lista os .spec.ts de uma pasta (caminhos relativos, sempre com "/"). */
export function listarSpecs(pasta) {
  const saida = [];
  (function andar(dir) {
    for (const nome of readdirSync(dir)) {
      if (nome.startsWith('.') || nome === 'node_modules') continue;
      const caminho = join(dir, nome);
      if (statSync(caminho).isDirectory()) andar(caminho);
      else if (nome.endsWith('.spec.ts')) saida.push(relative(pasta, caminho).split(sep).join('/'));
    }
  })(pasta);
  return saida.sort();
}

const BOOLEANOS = new Set(['todos', 'forcar', 'demo', 'sem-sync', 'headed', 'ui', 'debug']);

/** Parser mínimo: --chave=valor, --chave valor, --flag e posicionais em `_`. */
export function argumentos(argv = process.argv.slice(2)) {
  const saida = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { saida._.push(a); continue; }
    const [chave, valor] = a.slice(2).split(/=(.*)/s);
    if (valor !== undefined) saida[chave] = valor;
    else if (!BOOLEANOS.has(chave) && argv[i + 1] && !argv[i + 1].startsWith('--')) saida[chave] = argv[++i];
    else saida[chave] = true;
  }
  return saida;
}

export const executadoDireto = (metaUrl) =>
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(metaUrl);
