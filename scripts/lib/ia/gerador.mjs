// Orquestra: chamada → validação do formato → checagens → (se falhar) uma rodada de correção.
import { validarResposta } from './esquema.mjs';
import { descreverErros } from './checagens.mjs';

/**
 * @param cliente   clienteReal() ou clienteSimulado()
 * @param contexto  montarContexto()
 * @param checar    (resposta) => erros[]  (injetado para os testes)
 * @returns { status: 'pronto' | 'corrigido' | 'reprovado', resposta, tentativas }
 */
export async function gerarRascunho({ cliente, contexto, ferramenta, checar, correcoes = 1 }) {
  const mensagens = [{ role: 'user', content: contexto.usuario }];
  const tentativas = [];

  for (let n = 0; n <= correcoes; n++) {
    const r = await cliente.chamar({ sistema: contexto.sistema, mensagens, ferramenta });
    const formato = validarResposta(r.entrada, contexto.areas).map(mensagem => ({ tipo: 'formato', mensagem }));
    const erros = formato.length ? formato : await checar(r.entrada);
    tentativas.push({ numero: n + 1, erros, uso: r.uso ?? null });

    if (!erros.length) return { status: n === 0 ? 'pronto' : 'corrigido', resposta: r.entrada, tentativas };
    if (n === correcoes) return { status: 'reprovado', resposta: r.entrada, tentativas };

    // Devolve os erros exatos como resultado da ferramenta: a IA corrige olhando o que falhou.
    mensagens.push({ role: 'assistant', content: [{ type: 'tool_use', id: r.id, name: ferramenta.name, input: r.entrada }] });
    mensagens.push({
      role: 'user',
      content: [{
        type: 'tool_result',
        tool_use_id: r.id,
        is_error: true,
        content: `O rascunho foi reprovado nas checagens automáticas:\n${descreverErros(erros)}\n\nCorrija e chame registrar_casos_de_teste de novo com a resposta completa (todos os casos e o arquivo inteiro).`,
      }],
    });
  }
  throw new Error('inalcançável');
}
