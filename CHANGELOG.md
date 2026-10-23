# Changelog

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
