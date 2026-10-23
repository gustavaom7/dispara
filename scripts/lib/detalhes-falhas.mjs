// Detalhes de cada caso que falhou: mensagem completa e o "error-context" (snapshot ARIA da página no momento da falha).
// Usado no comentário do PR, para quem revisa entender a falha sem baixar o trace.
import { existsSync, readFileSync } from 'node:fs';
import { specsDe } from './coletar.mjs';

const ANSI = /\u001b\[[0-9;]*m/g;
const limitar = (texto, linhas) => {
  const l = texto.replace(ANSI, '').trimEnd().split('\n');
  return l.length > linhas ? [...l.slice(0, linhas), `... (${l.length - linhas} linha(s) omitida(s))`].join('\n') : l.join('\n');
};

/** Uma entrada por caso que falhou em todas as tentativas, com a última tentativa como referência. */
export function falhasDoRelatorio(relatorio, { lerArquivo = caminho => (existsSync(caminho) ? readFileSync(caminho, 'utf8') : null) } = {}) {
  const falhas = [];
  for (const suite of relatorio.suites ?? []) {
    for (const { arquivo, spec } of specsDe(suite)) {
      for (const t of spec.tests ?? []) {
        const ultima = t.results?.at(-1);
        if (!ultima || !['failed', 'timedOut'].includes(ultima.status)) continue;
        const contexto = (ultima.attachments ?? []).find(a => a.name === 'error-context');
        const textoContexto = contexto?.body ? Buffer.from(contexto.body, 'base64').toString('utf8') : contexto?.path ? lerArquivo(contexto.path) : null;
        falhas.push({
          arquivo: arquivo.split('\\').join('/'),
          titulo: spec.title,
          projeto: t.projectName ?? '',
          mensagem: limitar(ultima.errors?.map(e => e.message ?? '').join('\n\n') || ultima.error?.message || '', 30),
          contexto: textoContexto ? limitar(textoContexto, 60) : null,
        });
      }
    }
  }
  return falhas;
}

export function detalhesMarkdown(falhas) {
  if (!falhas.length) return '';
  const cerca = t => '```\n' + t.replace(/```/g, "'''") + '\n```';
  return [
    `<details><summary>Detalhes das ${falhas.length} falha(s)</summary>`,
    '',
    ...falhas.flatMap(f => [
      `**${f.titulo}** (${f.projeto}) em \`${f.arquivo}\``,
      '',
      cerca(f.mensagem),
      ...(f.contexto ? ['', '<details><summary>Página no momento da falha</summary>', '', cerca(f.contexto), '', '</details>'] : []),
      '',
    ]),
    '</details>',
    '',
  ].join('\n');
}
