// Monta o que o Claude recebe: regras, seletores reais do Toolshop, fixtures, page objects e um teste de exemplo.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { RAIZ, lerJson } from '../util.mjs';
import { TAGS } from './esquema.mjs';

const ler = (...partes) => readFileSync(join(RAIZ, ...partes), 'utf8');

export function areasDisponiveis() {
  return Object.keys(lerJson(join(RAIZ, 'config', 'areas.json'), {})).filter(a => a !== 'api');
}

export function montarContexto({ historia }) {
  const mapa = lerJson(join(RAIZ, 'ref', 'toolshop-seletores.json'), null);
  if (!mapa) throw new Error('Sem ref/toolshop-seletores.json. Rode "npm run mapear".');
  const areas = areasDisponiveis();
  const paginas = readdirSync(join(RAIZ, 'paginas')).filter(f => f.endsWith('.ts') && f !== 'index.ts')
    .map(f => `// paginas/${f}\n${ler('paginas', f)}`).join('\n\n');

  // Parte fixa (igual em toda chamada): vai no system com cache, para gerar várias histórias mais barato.
  const fixo = `Você é um engenheiro de QA sênior escrevendo testes para o Toolshop (practicesoftwaretesting.com), uma loja de ferramentas em Angular usada para prática de automação. A interface do Toolshop é em inglês; os títulos de teste e os comentários são em português do Brasil.

Sua tarefa: a partir de uma história de usuário, derivar casos de teste (positivos, negativos e de borda) e escrever UM arquivo Playwright que automatize os casos automatizáveis. Responda sempre chamando a ferramenta registrar_casos_de_teste.

Regras do código (o arquivo passa por typecheck, checagem de seletores e checagem de segredos antes de chegar a uma pessoa):
1. A primeira linha importa de '../../fixtures': import { test, expect, ... } from '../../fixtures';
2. Use os page objects das fixtures (login, menu, catalogo, produto, carrinho, checkout) sempre que cobrirem a ação. Para o resto, use page.getByTestId com ids que existam na lista <seletores>. Nunca invente data-test, nunca use page.locator('[data-test=...]') nem seletores CSS de classe.
3. getByRole e getByText só para textos que a interface mostra em inglês (ex.: toasts).
4. Credenciais vêm de "conta" (conta.email, conta.senha). Dados novos vêm de pessoaNova() ou cadastrarPorApi(api). Nunca escreva e-mail, senha, telefone, CPF ou caminho de arquivo no código.
5. Testes que criam ou alteram dados levam a tag @destrutivo no título. Use também, quando fizer sentido, ${TAGS.filter(t => t !== 'destrutivo').map(t => '@' + t).join(', ')}.
6. Sem page.waitForTimeout: espere por estado (expect, toBeVisible, os estados search_completed, filter_completed e sorting_completed).
7. Cada teste é independente e pode rodar em paralelo. O Toolshop é público e compartilhado: não dependa do estado de contas públicas (favoritos, carrinho, pedidos).
8. Asserções relativas quando possível (compare com o que a própria tela mostrou) em vez de valores fixos.

Áreas válidas: ${areas.join(', ')}.

<seletores sprint="${mapa.sprint}" commit="${mapa.commit.slice(0, 7)}">
Fixos: ${Object.keys(mapa.fixos).join(', ')}
Prefixos dinâmicos (use com regex, ex.: getByTestId(/^product-/)): ${mapa.dinamicos.join(', ')}
Estados do catálogo: ${mapa.estados.join(', ')}
</seletores>

<fixtures>
${ler('fixtures.ts')}
</fixtures>

<page_objects>
${paginas}
</page_objects>

<exemplo arquivo="exemplo-autor/carrinho/adicionar-produto.spec.ts">
${ler('exemplo-autor', 'carrinho', 'adicionar-produto.spec.ts')}
</exemplo>`;

  return {
    areas,
    sistema: [{ type: 'text', text: fixo, cache_control: { type: 'ephemeral' } }],
    usuario: `<historia>\n${historia.trim()}\n</historia>\n\nDerive os casos de teste e escreva o arquivo Playwright.`,
  };
}
