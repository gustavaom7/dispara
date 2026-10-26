# Design system do Dispara: "bancada de ensaio"

A ideia é a mesa de quem testa: papel milimetrado, régua de medição, etiquetas de amostra e marca-texto de revisor. O tom continua de ferramenta de trabalho, mas sem a cara de painel genérico.

Tudo fica em `site/template.html` (tokens no `:root`) e as fontes vão embutidas no HTML pelo `scripts/gerar-site.mjs`, sem depender de CDN.

## Cores

| Token | Claro | Escuro | Uso |
| --- | --- | --- | --- |
| `--papel` | `#f2f3ef` | `#16181c` | Fundo da página e do menu |
| `--folha` | `#ffffff` | `#1e2026` | Superfícies com conteúdo |
| `--folha-2` | `#f7f8f4` | `#24272e` | Áreas internas, linhas em foco |
| `--tinta` | `#1b1d22` | `#ecede8` | Texto e botão principal |
| `--tinta-2` | `#585d67` | `#a4a9b2` | Texto de apoio |
| `--tinta-3` | `#676c75` | `#8a8f99` | Rótulos pequenos (passa AA nos dois temas) |
| `--marca` | `#ffd84d` | `#ffd84d` | A assinatura: marca-texto |
| `--ok` / `--falha` / `--violeta` | verde, vermelho, violeta | versões claras | Status: passou, falhou, instável ou corrigido |

O amarelo aparece em poucos lugares e sempre com o mesmo sentido, "isto é o que importa agora": item atual do menu, linha selecionada, aba ativa, régua da página inicial, sublinhado dos links.

Status nunca dependem só da cor. Cada pílula tem um glifo com forma própria:

- passou: círculo com check;
- falhou: octógono com X;
- instável ou corrigido: onda;
- sem dados: traço.

## Tipografia

- **Familjen Grotesk** (600 e 700) nos títulos e números grandes.
- **Public Sans** (400 a 600) no texto.
- **Martian Mono** (400 e 500) em código, seletores, nomes de arquivo e tags.

Rótulos sempre em caixa normal, sem letras espaçadas.

## Formas

- **Raios:** 18px nas superfícies, 12px nos blocos internos e pílula em botões, campos, filtros e tags.
- **Etiqueta de amostra:** os rascunhos de IA têm canto chanfrado e um furo, como etiqueta de amostra.
- **Tags:** levam o furo à esquerda.
- **Trace:** passos do primeiro acesso, histórico de publicações e tentativas da IA são nós ligados por linha tracejada, como um trace do Playwright.
- **Calibração:** barras de progresso têm marcas a cada 10%.
- **Separadores:** em listas de metadados são um fio vertical (`<i class="sep"></i>`), não ponto médio.

## Página inicial

O destaque é uma régua de medição: a taxa de sucesso da semana em número grande, com a faixa amarela e o ponteiro na escala de 0 a 100. As outras leituras ficam numa faixa só, abaixo dela, em vez de quatro cartões iguais. É a única animação automática da interface: a faixa "mede" ao carregar.

## Regras

1. Um destaque por tela. Se tudo é amarelo, nada é.
2. Cartão só onde há conteúdo para ler. Números soltos vão numa faixa de leituras.
3. Textos dizem o que acontece ("Copiar comando", "Aprovar"), sem seta no fim e sem rótulo em maiúsculas acima de títulos.
4. Toda cor de status tem um par de forma ou texto.
5. Movimento só responde a uma ação (abrir painel, copiar), exceto a régua.
