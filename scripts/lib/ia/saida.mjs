// Grava o rascunho em rascunhos-ia/<slug>/: historia.md, casos.md, <slug>.spec.ts e status.json.
import { mkdirSync, readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ } from '../util.mjs';

export const PASTA_RASCUNHOS = join(RAIZ, 'rascunhos-ia');

const ROTULO = { positivo: 'Positivo', negativo: 'Negativo', borda: 'Borda' };
const celula = t => String(t ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function casosEmMarkdown(r, status) {
  const linhas = [
    `# ${r.titulo}`,
    '',
    `> Rascunho gerado por IA (${status.modo}, ${status.modelo}) em ${status.geradoEm.slice(0, 10)}. Status das checagens: **${status.status}**.`,
    '',
    r.resumo,
    '',
    '| ID | Tipo | Prioridade | Caso | Resultado esperado | Automatizado |',
    '| --- | --- | --- | --- | --- | --- |',
    ...r.casos.map(c => `| ${c.id} | ${ROTULO[c.tipo]} | ${c.prioridade} | ${celula(c.titulo)} | ${celula(c.resultadoEsperado)} | ${c.automatizado ? 'sim' : 'não'} |`),
    '',
    '## Passos',
    '',
  ];
  for (const c of r.casos) {
    linhas.push(`### ${c.id} · ${c.titulo}`, '');
    if (c.preCondicoes?.length) linhas.push(`Pré-condições: ${c.preCondicoes.join('; ')}`, '');
    c.passos.forEach((p, i) => linhas.push(`${i + 1}. ${p}`));
    linhas.push('', `**Esperado:** ${c.resultadoEsperado}`, '');
  }
  if (r.suposicoes.length) linhas.push('## Suposições', '', ...r.suposicoes.map(s => `- ${s}`), '');
  return linhas.join('\n');
}

export function gravarRascunho({ resultado, historia, arquivoHistoria, cliente }) {
  const r = resultado.resposta;
  const pasta = join(PASTA_RASCUNHOS, r.slug);
  mkdirSync(pasta, { recursive: true });
  const uso = resultado.tentativas.reduce((t, x) => ({
    entrada: t.entrada + (x.uso?.input_tokens ?? 0) + (x.uso?.cache_read_input_tokens ?? 0) + (x.uso?.cache_creation_input_tokens ?? 0),
    saida: t.saida + (x.uso?.output_tokens ?? 0),
  }), { entrada: 0, saida: 0 });
  const status = {
    id: r.slug,
    titulo: r.titulo,
    area: r.area,
    resumo: r.resumo,
    historia: arquivoHistoria,
    modo: cliente.modo,
    modelo: cliente.modelo,
    geradoEm: new Date().toISOString(),
    status: resultado.status,
    tentativas: resultado.tentativas.map(t => ({ numero: t.numero, erros: t.erros })),
    tokens: uso,
    casos: r.casos,
    suposicoes: r.suposicoes,
    aprovado: null,
  };
  writeFileSync(join(pasta, 'historia.md'), historia.trim() + '\n');
  writeFileSync(join(pasta, `${r.slug}.spec.ts`), r.codigo.trimEnd() + '\n');
  writeFileSync(join(pasta, 'casos.md'), casosEmMarkdown(r, status));
  writeFileSync(join(pasta, 'status.json'), JSON.stringify(status, null, 2) + '\n');
  return { pasta, status };
}

/** Lê todos os rascunhos (para o site e para aprovar). */
export function listarRascunhos() {
  if (!existsSync(PASTA_RASCUNHOS)) return [];
  return readdirSync(PASTA_RASCUNHOS, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.') && existsSync(join(PASTA_RASCUNHOS, d.name, 'status.json')))
    .map(d => {
      const pasta = join(PASTA_RASCUNHOS, d.name);
      const status = JSON.parse(readFileSync(join(pasta, 'status.json'), 'utf8'));
      return { ...status, pasta, codigo: readFileSync(join(pasta, `${status.id}.spec.ts`), 'utf8'), textoHistoria: readFileSync(join(pasta, 'historia.md'), 'utf8') };
    })
    .sort((a, b) => b.geradoEm.localeCompare(a.geradoEm));
}
