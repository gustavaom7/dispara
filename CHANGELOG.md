# Changelog

## Design system · 23/10/2026 (branch `design-system`)

- Novo visual "bancada de ensaio": papel claro, marca-texto amarelo como assinatura, glifos de status com forma própria, etiquetas de amostra nos rascunhos de IA e linhas de trace nos passos e no histórico. Guia em `docs/design-system.md`.
- Página inicial com uma régua de medição da taxa de sucesso no lugar dos quatro cartões.
- Fontes (Familjen Grotesk, Public Sans, Martian Mono) embutidas no HTML gerado, sem depender de CDN.
- Tema escuro revisado, contraste AA nos textos de apoio.

## Primeiro CI real · 23/10/2026 (branch `rodada-3`)

- A conta pública `cliente` estava bloqueada no Toolshop (423). Agora o teste é pulado com o motivo, e a triagem chama de problema de ambiente.
- O teste de acessibilidade achou um defeito real no Toolshop estável: o botão de mostrar senha não tem nome acessível. Ficou registrado como defeito conhecido.
- Filtro por marca comparava nomes com espaços sobrando.
- O CI comenta no PR o resumo de cada ambiente, com a mensagem completa e a página no momento de cada falha.

## Rodada 3 · 22/10/2026 (branch `rodada-3`)

- **Triagem de falhas com IA** (`npm run triar`): classifica cada falha em bug no produto, teste desatualizado, instabilidade ou problema de ambiente, com evidências e próximo passo. Usa o Claude com tool use quando há `ANTHROPIC_API_KEY`; sem a chave, regras locais. Roda no CI depois de cada ambiente.
- Diagnóstico visível na tela de Execuções do site e numa coluna nova do resumo do GitHub Actions.
- Regra nova pega `.env` faltando como problema de ambiente (achada numa execução real: a triagem chamava de bug um teste que nem começou).
- **Lint** com `eslint-plugin-playwright` (sem `waitForTimeout`, sem `test.only`, asserções web-first, `await` obrigatório) no CI.
- **Guarda dos rascunhos de IA** no CI: `npm run checar:rascunhos` falha se um rascunho pronto deixar de passar nas checagens.
- Page object de login ganhou `tituloAposEntrar`; fixture nova `produtosDaMarca`; teste aprovado de filtro por marca revisado (o rascunho da IA fica como foi gerado).
- 47 testes dos scripts (14 novos).

## Rodada 2 · 22/10/2026

- Gerador de testes com IA (`npm run gerar`), com checagens, correção automática e aprovação (`npm run aprovar`).
- Tela Rascunhos de IA, page objects, acessibilidade com axe, smoke no Pixel 7, API do carrinho.
- Resumo da execução no GitHub Actions e gráfico de tendência por ambiente.

## Rodada 1 · 22/10/2026

- Testes reais contra o Toolshop (UI e API), checador de seletores, coletor de resultados.
- GitHub Actions com estável e com bugs, publicação no GitHub Pages.

## MVP · 20 e 21/10/2026

- Publicação com limpeza de segredos, sync de mão única, runner com trava de ambiente.
- Site com catálogo, execuções, contas, primeiro acesso e área admin.
