// Triagem de falhas: para cada teste que falhou, diz o que provavelmente aconteceu e o próximo passo.
// Dois modos com a mesma saída: "ia" (Claude, com tool use) e "regras" (heurística local, sem chave).
import { existe } from '../seletores.mjs';

export const CATEGORIAS = {
  'bug-no-produto': 'Bug no produto',
  'teste-desatualizado': 'Teste desatualizado',
  instabilidade: 'Instabilidade',
  ambiente: 'Problema de ambiente',
};
export const CONFIANCAS = ['alta', 'media', 'baixa'];

export const ferramentaTriagem = {
  name: 'classificar_falha',
  description: 'Registra o diagnóstico de uma falha de teste automatizado.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['categoria', 'confianca', 'resumo', 'evidencias', 'proximoPasso'],
    properties: {
      categoria: { type: 'string', enum: Object.keys(CATEGORIAS) },
      confianca: { type: 'string', enum: CONFIANCAS },
      resumo: { type: 'string', description: 'Uma frase, em português, dizendo o que provavelmente aconteceu.' },
      evidencias: { type: 'array', minItems: 1, items: { type: 'string' }, description: 'Fatos do erro, do código ou do histórico que sustentam o diagnóstico.' },
      proximoPasso: { type: 'string', description: 'O que a pessoa deve fazer agora, em uma frase.' },
    },
  },
};

export function validarDiagnostico(d) {
  const erros = [];
  if (!d || typeof d !== 'object') return ['Diagnóstico não é um objeto.'];
  if (!CATEGORIAS[d.categoria]) erros.push(`categoria deve ser uma de: ${Object.keys(CATEGORIAS).join(', ')}`);
  if (!CONFIANCAS.includes(d.confianca)) erros.push(`confianca deve ser ${CONFIANCAS.join(', ')}`);
  for (const c of ['resumo', 'proximoPasso']) if (typeof d[c] !== 'string' || !d[c].trim()) erros.push(`${c} vazio`);
  if (!Array.isArray(d.evidencias) || !d.evidencias.length) erros.push('evidencias vazio');
  return erros;
}

const REDE = /ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|net::ERR_|socket hang up|\b50[234]\b|Service Unavailable|Bad Gateway/i;
const TIMEOUT = /Timeout \d+ms|timed out|exceeded/i;
const CONFIGURACAO = /Preencha \w+_EMAIL|\.env\b|Ambiente "[^"]+" não existe|Avatar "[^"]+" não existe/;

/** Fatos objetivos sobre a falha. Vão para o Claude e alimentam as regras. */
export function sinais({ falha, historico = [], mapa }) {
  const erro = falha.erro ?? '';
  const seletores = [...erro.matchAll(/getByTestId\(\s*['"`]([^'"`]+)['"`]/g)].map(m => m[1]);
  const inexistentes = mapa ? seletores.filter(id => !existe({ id }, mapa)) : [];
  const doTeste = historico.filter(e => e.teste === falha.teste && e.id !== falha.id && (e.dispositivo ?? '') === (falha.dispositivo ?? ''));
  const outrosAmbientes = doTeste.filter(e => e.ambiente !== falha.ambiente);
  const mesmoAmbiente = doTeste.filter(e => e.ambiente === falha.ambiente).slice(0, 10);
  const falhasNoAmbiente = historico.filter(e => e.ambiente === falha.ambiente && e.status === 'falhou' && e.quando === falha.quando).length;
  return {
    ambienteComBugs: falha.ambiente === 'com-bugs',
    passouEmOutroAmbiente: outrosAmbientes.find(e => e.status === 'passou')?.ambiente ?? null,
    intermitente: mesmoAmbiente.some(e => e.status === 'passou') && mesmoAmbiente.some(e => e.status === 'falhou'),
    passouAntesNoAmbiente: mesmoAmbiente.find(e => e.status !== 'pulado')?.status === 'passou',
    seletoresInexistentes: inexistentes,
    erroDeRede: REDE.test(erro),
    configuracaoFaltando: CONFIGURACAO.test(erro),
    timeout: TIMEOUT.test(erro),
    falhasNaMesmaExecucao: falhasNoAmbiente,
  };
}

/** Diagnóstico por regras: o mesmo formato da IA, com confiança honesta. */
export function classificarPorRegras(s) {
  const d = (categoria, confianca, resumo, evidencias, proximoPasso) => ({ categoria, confianca, resumo, evidencias, proximoPasso });
  if (s.configuracaoFaltando) {
    return d('ambiente', 'alta', 'O teste nem começou: falta configuração na máquina que rodou (credenciais no .env, ambiente ou conta).',
      ['Mensagem de configuração ausente vinda das fixtures'], 'Copie o .env.example para .env (ou configure os secrets no CI) e rode de novo.');
  }
  if (s.erroDeRede) {
    return d('ambiente', 'alta', 'O teste não chegou a falhar por regra de negócio: a rede ou o servidor não respondeu.',
      ['Erro de conexão ou resposta 5xx na mensagem'], 'Confira se o ambiente está no ar e rode de novo antes de abrir bug.');
  }
  if (s.falhasNaMesmaExecucao >= 5 && s.timeout) {
    return d('ambiente', 'media', 'Muitos testes falharam por tempo na mesma execução: o ambiente provavelmente estava lento ou fora do ar.',
      [`${s.falhasNaMesmaExecucao} falhas na mesma execução`, 'Erro de timeout'], 'Rode de novo; se repetir, verifique a saúde do ambiente.');
  }
  if (s.seletoresInexistentes.length) {
    return d('teste-desatualizado', 'alta', 'O teste usa um seletor que não existe mais no código do Toolshop.',
      s.seletoresInexistentes.map(id => `data-test "${id}" não está no mapa de seletores`), 'Rode npm run checar -- --atualizar e troque o seletor no teste.');
  }
  if (s.ambienteComBugs && s.passouEmOutroAmbiente) {
    return d('bug-no-produto', 'alta', 'Falha só na versão com bugs: o teste pegou um defeito plantado.',
      ['Ambiente "com-bugs" tem defeitos de propósito', `O mesmo teste passou em "${s.passouEmOutroAmbiente}"`], 'Registre o defeito encontrado; o teste está fazendo o trabalho dele.');
  }
  if (s.intermitente) {
    return d('instabilidade', 'media', 'O teste alterna entre passar e falhar no mesmo ambiente.',
      ['Histórico recente tem passagens e falhas no mesmo ambiente'], 'Abra o trace e procure espera frágil ou dependência de dados compartilhados.');
  }
  if (s.ambienteComBugs) {
    return d('bug-no-produto', 'media', 'Falha na versão com bugs, sem histórico para comparar em outro ambiente.',
      ['Ambiente "com-bugs" tem defeitos de propósito'], 'Rode no ambiente estável para confirmar que é defeito do produto.');
  }
  if (s.passouAntesNoAmbiente && s.timeout) {
    return d('instabilidade', 'baixa', 'Passava neste ambiente e agora estourou o tempo.',
      ['Última execução no mesmo ambiente passou', 'Erro de timeout'], 'Rode de novo e compare o trace com a última execução verde.');
  }
  return d('bug-no-produto', 'baixa', 'Nada indica problema no teste ou no ambiente; pode ser regressão no produto.',
    ['Erro de asserção sem sinal de rede, seletor ou instabilidade'], 'Abra o trace, reproduza à mão e abra bug se confirmar.');
}

export function contextoTriagem({ falha, sinais: s, codigo }) {
  const sistema = [{
    type: 'text',
    cache_control: { type: 'ephemeral' },
    text: `Você faz triagem de falhas de testes Playwright que rodam contra o Toolshop (practicesoftwaretesting.com), uma loja pública de prática.
Classifique cada falha em uma categoria:
- bug-no-produto: o sistema se comportou errado; o teste está certo.
- teste-desatualizado: o produto mudou de propósito (seletor, texto, fluxo) e o teste precisa acompanhar.
- instabilidade: o teste às vezes passa e às vezes falha sem mudança (espera frágil, dados compartilhados, corrida).
- ambiente: rede, servidor fora do ar, lentidão geral; não é o teste nem a regra de negócio.
O ambiente "com-bugs" tem defeitos plantados de propósito: falha lá e sucesso no "estavel" é forte sinal de bug-no-produto.
Use os sinais calculados, o erro e o código. Seja específico nas evidências e honesto na confiança. Responda chamando classificar_falha.`,
  }];
  const usuario = `<falha teste="${falha.teste}" arquivo="${falha.arquivo ?? ''}" ambiente="${falha.ambiente}" dispositivo="${falha.dispositivo ?? 'desktop'}" caso="${falha.caso ?? ''}">
<erro>
${(falha.erroCompleto ?? falha.erro ?? '').slice(0, 4000)}
</erro>
<sinais>
${JSON.stringify(s, null, 2)}
</sinais>
<codigo>
${(codigo ?? '(código indisponível)').slice(0, 6000)}
</codigo>
</falha>`;
  return { sistema, usuario };
}

/** Diagnostica uma falha. Com cliente, usa o Claude; sem cliente ou com resposta inválida, usa as regras. */
export async function diagnosticar({ falha, historico, mapa, codigo, cliente }) {
  const s = sinais({ falha, historico, mapa });
  const base = { modo: 'regras', modelo: null, sinais: s, quando: new Date().toISOString() };
  if (!cliente) return { ...classificarPorRegras(s), ...base };
  try {
    const { sistema, usuario } = contextoTriagem({ falha, sinais: s, codigo });
    const r = await cliente.chamar({ sistema, mensagens: [{ role: 'user', content: usuario }], ferramenta: ferramentaTriagem });
    const erros = validarDiagnostico(r.entrada);
    if (erros.length) return { ...classificarPorRegras(s), ...base, aviso: `Resposta da IA inválida (${erros.join('; ')}); usei as regras.` };
    return { ...r.entrada, ...base, modo: cliente.modo === 'real' ? 'ia' : cliente.modo, modelo: cliente.modelo };
  } catch (e) {
    return { ...classificarPorRegras(s), ...base, aviso: `Falha ao chamar a IA (${e.message}); usei as regras.` };
  }
}
