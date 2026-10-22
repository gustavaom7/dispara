# Filtro por marca

> Rascunho gerado por IA (simulado, claude-sonnet-5-5 (gravado)) em 2026-10-22. Status das checagens: **pronto**.

Confere o filtro pela UI contra a lista da própria API, em vez de nomes fixos, e cobre a combinação com categoria e o caso sem resultados.

| ID | Tipo | Prioridade | Caso | Resultado esperado | Automatizado |
| --- | --- | --- | --- | --- | --- |
| CT-01 | Positivo | alta | Filtrar por uma marca | Só aparecem produtos que a API lista para essa marca | sim |
| CT-02 | Positivo | media | Combinar marca e categoria | Só martelos da marca | sim |
| CT-03 | Negativo | media | Busca sem relação com a marca | Aviso de nenhum resultado | sim |
| CT-04 | Borda | baixa | Marcar e desmarcar a mesma marca | A lista volta a ter todas as marcas | não |

## Passos

### CT-01 · Filtrar por uma marca

1. Abrir o catálogo
2. Marcar ForgeFlex Tools

**Esperado:** Só aparecem produtos que a API lista para essa marca

### CT-02 · Combinar marca e categoria

1. Marcar ForgeFlex Tools
2. Marcar a categoria Hammer

**Esperado:** Só martelos da marca

### CT-03 · Busca sem relação com a marca

1. Buscar um termo que não existe
2. Marcar ForgeFlex Tools

**Esperado:** Aviso de nenhum resultado

### CT-04 · Marcar e desmarcar a mesma marca

1. Marcar ForgeFlex Tools
2. Desmarcar

**Esperado:** A lista volta a ter todas as marcas

## Suposições

- A API aceita by_brand com o id da marca, como diz a documentação Swagger do Toolshop.
- Se ForgeFlex Tools não tiver martelos, o segundo teste passa com a lista vazia; vale revisar se isso deve virar falha.
