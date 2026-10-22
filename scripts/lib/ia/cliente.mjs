// Dois clientes com a mesma interface: o real (API do Claude) e o simulado (respostas gravadas).
// chamar() devolve { entrada, id, uso }: o input da ferramenta, o id do bloco tool_use e o uso de tokens.

export const MODELO_PADRAO = 'claude-sonnet-5-5';

export async function clienteReal({ modelo = MODELO_PADRAO, apiKey = process.env.ANTHROPIC_API_KEY } = {}) {
  if (!apiKey) {
    throw new Error('Defina ANTHROPIC_API_KEY no seu .env (crie a chave em console.anthropic.com) ou use --simular.');
  }
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic({ apiKey });
  return {
    modo: 'real',
    modelo,
    async chamar({ sistema, mensagens, ferramenta }) {
      const resposta = await anthropic.messages.create({
        model: modelo,
        max_tokens: 8000,
        system: sistema,
        messages: mensagens,
        tools: [ferramenta],
        tool_choice: { type: 'tool', name: ferramenta.name },
      });
      const bloco = resposta.content.find(b => b.type === 'tool_use' && b.name === ferramenta.name);
      if (!bloco) throw new Error(`A resposta não chamou ${ferramenta.name} (stop_reason: ${resposta.stop_reason}).`);
      return { entrada: bloco.input, id: bloco.id, uso: resposta.usage };
    },
  };
}

/** Devolve as respostas gravadas em ordem: a 1ª para a geração, a 2ª para a correção, e assim por diante. */
export function clienteSimulado(gravacao) {
  if (!Array.isArray(gravacao?.respostas) || !gravacao.respostas.length) {
    throw new Error('Gravação inválida: precisa de { "respostas": [ ... ] }.');
  }
  let chamada = 0;
  return {
    modo: 'simulado',
    modelo: gravacao.modelo ?? 'simulado',
    async chamar() {
      const resposta = gravacao.respostas.at(Math.min(chamada, gravacao.respostas.length - 1));
      chamada++;
      return { entrada: structuredClone(resposta), id: `toolu_simulado_${chamada}`, uso: { input_tokens: 0, output_tokens: 0 } };
    },
  };
}
