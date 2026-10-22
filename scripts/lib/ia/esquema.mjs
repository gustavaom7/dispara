// Ferramenta que o Claude é obrigado a chamar (tool_choice) e a validação da resposta.
// A mesma validação vale para a chamada real e para a resposta gravada do modo simulado.

export const TIPOS = ['positivo', 'negativo', 'borda'];
export const PRIORIDADES = ['alta', 'media', 'baixa'];
export const TAGS = ['smoke', 'regressao', 'destrutivo', 'a11y'];

export function ferramenta(areas) {
  return {
    name: 'registrar_casos_de_teste',
    description: 'Registra os casos de teste derivados da história de usuário e o arquivo Playwright que automatiza os casos automatizáveis.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['titulo', 'slug', 'area', 'resumo', 'casos', 'codigo', 'suposicoes'],
      properties: {
        titulo: { type: 'string', description: 'Nome curto da funcionalidade testada, em português.' },
        slug: { type: 'string', pattern: '^[a-z0-9]+(-[a-z0-9]+)*$', description: 'Nome do arquivo, em kebab-case, sem extensão.' },
        area: { type: 'string', enum: areas },
        resumo: { type: 'string', description: 'Uma ou duas frases sobre o que a história pede e o que os testes cobrem.' },
        casos: {
          type: 'array',
          minItems: 3,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'titulo', 'tipo', 'prioridade', 'passos', 'resultadoEsperado', 'automatizado'],
            properties: {
              id: { type: 'string', pattern: '^CT-\\d{2}$' },
              titulo: { type: 'string' },
              tipo: { type: 'string', enum: TIPOS },
              prioridade: { type: 'string', enum: PRIORIDADES },
              preCondicoes: { type: 'array', items: { type: 'string' } },
              passos: { type: 'array', minItems: 1, items: { type: 'string' } },
              resultadoEsperado: { type: 'string' },
              automatizado: { type: 'boolean', description: 'true quando o caso está coberto pelo código gerado.' },
            },
          },
        },
        codigo: { type: 'string', description: 'Arquivo .spec.ts completo, pronto para salvar.' },
        suposicoes: { type: 'array', items: { type: 'string' }, description: 'O que foi assumido por falta de informação na história.' },
      },
    },
  };
}

/** Validação manual do que importa (sem dependência de um validador de JSON Schema). */
export function validarResposta(r, areas) {
  const erros = [];
  if (!r || typeof r !== 'object') return ['A resposta não é um objeto.'];
  for (const campo of ['titulo', 'slug', 'area', 'resumo', 'codigo']) {
    if (typeof r[campo] !== 'string' || !r[campo].trim()) erros.push(`Campo "${campo}" ausente ou vazio.`);
  }
  if (typeof r.slug === 'string' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug)) erros.push(`"slug" precisa ser kebab-case: "${r.slug}".`);
  if (areas && typeof r.area === 'string' && !areas.includes(r.area)) erros.push(`"area" deve ser uma de: ${areas.join(', ')}.`);
  if (!Array.isArray(r.suposicoes)) erros.push('"suposicoes" deve ser uma lista.');
  if (!Array.isArray(r.casos) || r.casos.length < 3) {
    erros.push('"casos" precisa ter pelo menos 3 casos.');
    return erros;
  }
  const ids = new Set();
  r.casos.forEach((c, i) => {
    const onde = `casos[${i}]`;
    if (!/^CT-\d{2}$/.test(c.id ?? '')) erros.push(`${onde}.id deve seguir CT-01, CT-02...`);
    if (ids.has(c.id)) erros.push(`${onde}.id repetido: ${c.id}`);
    ids.add(c.id);
    if (!TIPOS.includes(c.tipo)) erros.push(`${onde}.tipo deve ser ${TIPOS.join(', ')}.`);
    if (!PRIORIDADES.includes(c.prioridade)) erros.push(`${onde}.prioridade deve ser ${PRIORIDADES.join(', ')}.`);
    if (!Array.isArray(c.passos) || !c.passos.length) erros.push(`${onde}.passos vazio.`);
    if (typeof c.resultadoEsperado !== 'string' || !c.resultadoEsperado) erros.push(`${onde}.resultadoEsperado vazio.`);
    if (typeof c.automatizado !== 'boolean') erros.push(`${onde}.automatizado deve ser true ou false.`);
  });
  for (const tipo of TIPOS) {
    if (!r.casos.some(c => c.tipo === tipo)) erros.push(`Falta pelo menos um caso do tipo "${tipo}".`);
  }
  return erros;
}
