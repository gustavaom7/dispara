#!/usr/bin/env node
// Escreve um resumo em Markdown das execuções de um ambiente, para a página do GitHub Actions.
// Uso no CI: npm run -s resumo -- parcial/estavel.json --relatorio https://.../relatorios/estavel/ >> "$GITHUB_STEP_SUMMARY"
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { RAIZ, argumentos, executadoDireto } from './lib/util.mjs';

const ICONE = { passou: '✅', falhou: '❌', pulado: '⏭️' };
const dur = ms => (ms < 60000 ? `${Math.round(ms / 1000)} s` : `${Math.floor(ms / 60000)} min ${Math.round((ms % 60000) / 1000)} s`);
const celula = t => String(t ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function resumoMarkdown(execucoes, { relatorio } = {}) {
  if (!execucoes.length) return '### Nenhuma execução registrada\n';
  const ambiente = execucoes[0].ambiente;
  const conta = s => execucoes.filter(e => e.status === s).length;
  const casos = execucoes.reduce((t, e) => ({ passou: t.passou + (e.casos?.passou ?? 0), falhou: t.falhou + (e.casos?.falhou ?? 0), instavel: t.instavel + (e.casos?.instavel ?? 0) }), { passou: 0, falhou: 0, instavel: 0 });
  const linhas = [
    `### ${conta('falhou') ? '❌' : '✅'} Toolshop · ${ambiente}`,
    '',
    `**${conta('passou')}** arquivo(s) passaram, **${conta('falhou')}** falharam e **${conta('pulado')}** foram pulados · ${casos.passou} caso(s) ok, ${casos.falhou} com falha${casos.instavel ? `, ${casos.instavel} instável(is)` : ''}${relatorio ? ` · [relatório do Playwright](${relatorio})` : ''}`,
    '',
    '| | Teste | Dispositivo | Conta | Casos | Duração | Erro |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...[...execucoes]
      .sort((a, b) => (a.status === 'falhou' ? -1 : 0) - (b.status === 'falhou' ? -1 : 0) || a.teste.localeCompare(b.teste))
      .map(e => `| ${ICONE[e.status] ?? ''} | ${celula(e.arquivo ?? e.teste)} | ${e.dispositivo ?? 'desktop'} | ${e.avatar} | ${e.casos ? `${e.casos.passou}/${e.casos.passou + e.casos.falhou + e.casos.pulado}` : ''}${e.instavel ? ' (instável)' : ''} | ${dur(e.duracaoMs)} | ${celula(e.erro ?? '')} |`),
    '',
  ];
  return linhas.join('\n');
}

if (executadoDireto(import.meta.url)) {
  const a = argumentos();
  const arquivo = a._[0] && resolve(RAIZ, a._[0]);
  if (!arquivo || !existsSync(arquivo)) {
    console.log('### Nenhuma execução registrada\n');
    process.exit(0);
  }
  let execucoes = [];
  try { execucoes = JSON.parse(readFileSync(arquivo, 'utf8')); } catch { /* arquivo vazio ou corrompido: resumo vazio */ }
  process.stdout.write(resumoMarkdown(Array.isArray(execucoes) ? execucoes : [], { relatorio: a.relatorio }));
}
