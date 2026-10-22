// Limpa um .spec.ts antes de ele sair da pasta da autora.
// É uma rede de segurança: o certo é o teste usar `conta` e `arquivo()` das fixtures.
// Cada troca gera um aviso com a linha, para a autora corrigir na origem.

const ASPAS = `['"\`]`;

const REGRAS = [
  {
    nome: 'caminho pessoal',
    re: /(?:\/Users|\/home)\/[^/\s'"`]+|[A-Za-z]:(?:\\\\|\\)Users(?:\\\\|\\)[^\\\s'"`]+/g,
    troca: () => '~',
    dica: 'use arquivo("nome") e coloque o arquivo em /arquivos',
  },
  {
    nome: 'senha ou token no código',
    re: new RegExp(`\\b(password|senha|pass|pwd|token|api_?key|secret|segredo)(\\s*[:=]\\s*)(${ASPAS})(?!\\*\\*\\*\\3)([^'"\`\\n]+)\\3`, 'gi'),
    troca: (_m, chave, op, q, valor) => (valor.includes('${') ? null : `${chave}${op}${q}***${q}`),
    dica: 'use conta.senha (vem do .env de quem roda)',
  },
  {
    nome: 'senha digitada no campo',
    re: new RegExp(`(getBy\\w+\\([^)]*(?:senha|password)[^)]*\\)\\s*\\.(?:fill|type|pressSequentially)\\(\\s*)(${ASPAS})(?!\\*\\*\\*\\2)([^'"\`\\n]+)\\2`, 'gi'),
    // valor gerado na hora (`Qa!${Date.now()}`) não é segredo
    troca: (_m, antes, q, valor) => (valor.includes('${') ? null : `${antes}${q}***${q}`),
    dica: 'use conta.senha',
  },
  {
    nome: 'e-mail real',
    re: new RegExp(`(${ASPAS})([\\w.+-]+@(?!example\\.(?:com|org)\\b)[\\w-]+(?:\\.[\\w-]+)+)\\1`, 'g'),
    troca: (_m, q) => `${q}***@example.com${q}`,
    dica: 'use conta.email',
  },
  {
    nome: 'token JWT',
    re: /eyJ[\w-]{8,}\.[\w-]{8,}\.[\w-]{8,}/g,
    troca: () => '***',
    dica: 'tokens vêm do login, nunca do código',
  },
  {
    nome: 'token Bearer',
    re: /Bearer\s+(?!\*\*\*)[\w.~+/-]{12,}=*/g,
    troca: () => 'Bearer ***',
    dica: 'tokens vêm do login, nunca do código',
  },
  {
    nome: 'telefone',
    re: /(?:\+?55\s?)?\(?\b\d{2}\)?\s?9\d{4}-?\d{4}\b/g,
    troca: () => '***',
    dica: 'use conta.telefone',
  },
  {
    nome: 'CPF',
    re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
    troca: () => '***.***.***-**',
    dica: 'gere um CPF de teste dentro do próprio teste',
  },
  {
    nome: 'ambiente ou avatar fixo',
    re: /^[ \t]*process\.env\.(?:AMBIENTE|AVATAR)\s*=.*\r?\n?/gm,
    troca: () => '',
    dica: 'quem roda escolhe ambiente e avatar no site',
  },
];

function linhaDe(texto, offset) {
  return texto.slice(0, offset).split('\n').length;
}

export function sanitizar(codigo) {
  let saida = codigo;
  const avisos = [];
  for (const regra of REGRAS) {
    saida = saida.replace(regra.re, (...m) => {
      const novo = regra.troca(...m);
      if (novo === null) return m[0];
      avisos.push({ regra: regra.nome, linha: linhaDe(saida, m.at(-2)), dica: regra.dica });
      return novo;
    });
  }
  avisos.sort((a, b) => a.linha - b.linha);
  return { codigo: saida, avisos };
}

export function cabecalhoDeAvisos(avisos) {
  if (!avisos.length) return '';
  const itens = avisos.map(a => `//   linha ~${a.linha}: ${a.regra}`).join('\n');
  return `// dispara: ${avisos.length} valor(es) sensível(is) removido(s) na publicação.\n${itens}\n\n`;
}
