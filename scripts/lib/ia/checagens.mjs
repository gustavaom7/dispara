// Checagens automáticas de um rascunho gerado pela IA, antes de ele chegar a uma pessoa.
// Cada erro: { tipo, linha?, mensagem }. Os erros voltam para a IA na rodada de correção.
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { RAIZ } from '../util.mjs';
import { existe, seletoresDoTexto } from '../seletores.mjs';
import { sanitizar } from '../sanitizar.mjs';
import { TAGS } from './esquema.mjs';

const DECLARA_TESTE = /\btest(?:\.(?:describe|only|skip|fixme|serial))*\(\s*['"`]/;

/** Regras de qualidade que o prompt pede e que dá para conferir no texto. */
export function checarEstrutura(codigo) {
  const erros = [];
  const linhas = codigo.split('\n');
  if (!/from\s+['"]\.\.\/\.\.\/fixtures['"]/.test(codigo)) {
    erros.push({ tipo: 'estrutura', mensagem: "O arquivo precisa importar test e expect de '../../fixtures'." });
  }
  if (/from\s+['"]@playwright\/test['"]/.test(codigo)) {
    erros.push({ tipo: 'estrutura', mensagem: "Importe de '../../fixtures', não de '@playwright/test': as fixtures trazem conta, api e page objects." });
  }
  if (!DECLARA_TESTE.test(codigo)) erros.push({ tipo: 'estrutura', mensagem: 'Nenhum test() encontrado.' });
  linhas.forEach((l, i) => {
    if (/waitForTimeout\(/.test(l)) erros.push({ tipo: 'estrutura', linha: i + 1, mensagem: 'Sem waitForTimeout: espere por um estado com expect.' });
    if (/locator\(\s*['"`][^'"`]*data-test/.test(l)) erros.push({ tipo: 'estrutura', linha: i + 1, mensagem: 'Use getByTestId em vez de locator com [data-test].' });
    if (/\btest\.only\(/.test(l)) erros.push({ tipo: 'estrutura', linha: i + 1, mensagem: 'Remova test.only.' });
    for (const m of l.matchAll(/(?<![\w.])@([a-z][\w-]*)/g)) {
      if (DECLARA_TESTE.test(l) && !TAGS.includes(m[1])) {
        erros.push({ tipo: 'estrutura', linha: i + 1, mensagem: `Tag @${m[1]} não existe. Use: ${TAGS.map(t => '@' + t).join(', ')}.` });
      }
    }
  });
  return erros;
}

export function checarSeletores(codigo, mapa) {
  return seletoresDoTexto(codigo).filter(u => !existe(u, mapa)).map(u => ({
    tipo: 'seletor',
    linha: u.linha,
    mensagem: `data-test "${u.id}" não existe no Toolshop (${mapa.sprint}). Escolha um da lista <seletores>.`,
  }));
}

export function checarSegredos(codigo) {
  return sanitizar(codigo).avisos.map(a => ({
    tipo: 'segredo',
    linha: a.linha,
    mensagem: `Valor sensível (${a.regra}): ${a.dica}.`,
  }));
}

/** Typecheck do arquivo junto com fixtures e page objects. Escreve numa pasta de verificação descartável. */
export function checarTipos(codigo, slug) {
  const pasta = join(RAIZ, 'rascunhos-ia', '.verificacao');
  mkdirSync(pasta, { recursive: true });
  const arquivo = join(pasta, `${slug}.spec.ts`);
  writeFileSync(arquivo, codigo);
  writeFileSync(join(pasta, 'tsconfig.json'), JSON.stringify({
    extends: '../../tsconfig.json',
    include: ['../../ambiente.ts', '../../fixtures.ts', '../../paginas/**/*.ts', `${slug}.spec.ts`],
  }));
  const tsc = join(RAIZ, 'node_modules', 'typescript', 'bin', 'tsc');
  const r = spawnSync(process.execPath, [tsc, '-p', join(pasta, 'tsconfig.json')], { cwd: RAIZ, encoding: 'utf8' });
  rmSync(pasta, { recursive: true, force: true });
  if (r.status === 0) return [];
  const alvo = relative(RAIZ, arquivo).split('\\').join('/');
  const erros = [];
  for (const m of (r.stdout + r.stderr).matchAll(/^(.+?)\((\d+),\d+\): error (TS\d+): (.+)$/gm)) {
    const doArquivo = m[1].split('\\').join('/').endsWith(alvo);
    erros.push({ tipo: 'tipos', linha: doArquivo ? Number(m[2]) : undefined, mensagem: `${m[3]}: ${m[4]}${doArquivo ? '' : ` (em ${m[1]})`}` });
  }
  return erros.length ? erros : [{ tipo: 'tipos', mensagem: (r.stdout || r.stderr).trim().slice(0, 300) || 'tsc falhou' }];
}

export function checarTudo(resposta, { mapa, tipos = true }) {
  const codigo = resposta.codigo;
  const erros = [...checarEstrutura(codigo), ...checarSeletores(codigo, mapa), ...checarSegredos(codigo)];
  // Typecheck por último: é o mais lento e o que menos ajuda se a estrutura já está errada.
  if (tipos && !erros.some(e => e.tipo === 'estrutura')) erros.push(...checarTipos(codigo, resposta.slug));
  return erros;
}

export function descreverErros(erros) {
  return erros.map(e => `- ${e.linha ? `linha ${e.linha} · ` : ''}${e.tipo}: ${e.mensagem}`).join('\n');
}
