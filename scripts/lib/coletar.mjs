// Transforma o relatório JSON do Playwright em execuções do Dispara (uma por arquivo de teste).
import { idDe } from './util.mjs';

const ANSI = /\u001b\[[0-9;]*m/g;

function* specsDe(suite, arquivo = suite.file) {
  for (const spec of suite.specs ?? []) yield { arquivo: spec.file ?? arquivo, spec };
  for (const filha of suite.suites ?? []) yield* specsDe(filha, filha.file ?? arquivo);
}

/** Primeira linha útil da mensagem de erro, sem cores e sem caminhos. */
export function resumirErro(mensagem = '') {
  const linhas = mensagem.replace(ANSI, '').split('\n').map(l => l.trim()).filter(Boolean);
  const util = linhas.filter(l => !/^at\s|^Call log:|^-\s|^expect\(/.test(l));
  const texto = util.slice(0, 3).join(' · ').replace(/^Error:\s*/, '');
  return texto.length > 220 ? texto.slice(0, 217) + '...' : texto;
}

/**
 * @param relatorio  JSON do reporter "json" do Playwright
 * @param contexto   { ambiente, avatar, quem, origem, relatorio (URL), agora }
 */
export function coletar(relatorio, contexto = {}) {
  const porArquivo = new Map();
  for (const suite of relatorio.suites ?? []) {
    for (const { arquivo, spec } of specsDe(suite)) {
      for (const t of spec.tests ?? []) {
        // Um mesmo arquivo pode rodar em mais de um projeto (desktop e celular): uma execução para cada.
        const chave = `${arquivo.split('\\').join('/')}::${t.projectName ?? ''}`;
        if (!porArquivo.has(chave)) porArquivo.set(chave, []);
        porArquivo.get(chave).push({ titulo: spec.title, ...t });
      }
    }
  }

  const quando = contexto.agora ?? relatorio.stats?.startTime ?? new Date().toISOString();
  const ambiente = contexto.ambiente ?? relatorio.config?.metadata?.ambiente ?? 'desconhecido';
  const execucoes = [];
  for (const [chave, testes] of porArquivo) {
    const [arquivo, projeto] = chave.split('::');
    const celular = projeto === 'celular';
    const casos = { passou: 0, falhou: 0, pulado: 0, instavel: 0 };
    let erro = null;
    let duracaoMs = 0;
    for (const t of testes) {
      const ultimo = t.results?.at(-1);
      duracaoMs += (t.results ?? []).reduce((n, r) => n + (r.duration ?? 0), 0);
      if (t.status === 'skipped') casos.pulado++;
      else if (t.status === 'flaky') { casos.passou++; casos.instavel++; }
      else if (t.status === 'expected') casos.passou++;
      else {
        casos.falhou++;
        if (!erro) erro = `${t.titulo}: ${resumirErro(ultimo?.error?.message ?? ultimo?.errors?.[0]?.message ?? 'falhou')}`;
      }
    }
    const status = casos.falhou ? 'falhou' : casos.passou ? 'passou' : 'pulado';
    execucoes.push({
      id: `${ambiente}-${idDe(arquivo)}${celular ? '-celular' : ''}-${Date.parse(quando) || Date.now()}`,
      teste: idDe(arquivo),
      arquivo,
      ambiente,
      avatar: contexto.avatar ?? 'cliente',
      quem: contexto.quem ?? 'desconhecido',
      origem: contexto.origem ?? 'local',
      status,
      casos,
      duracaoMs: Math.round(duracaoMs),
      quando,
      ...(erro ? { erro } : {}),
      ...(casos.instavel ? { instavel: true } : {}),
      ...(celular ? { dispositivo: 'celular' } : {}),
      ...(contexto.relatorio ? { relatorio: contexto.relatorio } : {}),
    });
  }
  return execucoes.sort((a, b) => a.teste.localeCompare(b.teste) || (a.dispositivo ?? '').localeCompare(b.dispositivo ?? ''));
}

/** Junta execuções novas ao histórico, mais recentes primeiro, sem duplicar ids. */
export function juntar(historico, novas, limite = 300) {
  const ids = new Set(novas.map(e => e.id));
  return [...novas, ...historico.filter(e => !ids.has(e.id))]
    .sort((a, b) => Date.parse(b.quando) - Date.parse(a.quando))
    .slice(0, limite);
}
