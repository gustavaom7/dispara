# Favoritos

> Rascunho gerado por IA (simulado, claude-sonnet-5-5 (gravado)) em 2026-10-22. Status das checagens: **corrigido**.

Cobre adicionar aos favoritos, o bloqueio para visitantes e a duplicidade. Cada teste cria um cliente novo pela API, porque os favoritos das contas públicas mudam o tempo todo.

| ID | Tipo | Prioridade | Caso | Resultado esperado | Automatizado |
| --- | --- | --- | --- | --- | --- |
| CT-01 | Positivo | alta | Cliente logado adiciona produto aos favoritos | Confirmação de produto adicionado e o produto aparece uma vez na lista de favoritos | sim |
| CT-02 | Negativo | media | Visitante sem login tenta favoritar | Aviso de que não é possível favoritar sem login | sim |
| CT-03 | Borda | media | Favoritar o mesmo produto duas vezes | Aviso de que o produto já está nos favoritos, sem duplicar | sim |
| CT-04 | Positivo | baixa | Remover produto da lista de favoritos | Produto sai da lista | não |

## Passos

### CT-01 · Cliente logado adiciona produto aos favoritos

Pré-condições: Cliente novo, logado

1. Abrir o produto Combination Pliers
2. Clicar em Add to favourites
3. Abrir My favorites pelo menu da conta

**Esperado:** Confirmação de produto adicionado e o produto aparece uma vez na lista de favoritos

### CT-02 · Visitante sem login tenta favoritar

Pré-condições: Sem login

1. Abrir o produto
2. Clicar em Add to favourites

**Esperado:** Aviso de que não é possível favoritar sem login

### CT-03 · Favoritar o mesmo produto duas vezes

Pré-condições: Cliente novo, logado

1. Favoritar o produto
2. Favoritar o mesmo produto de novo

**Esperado:** Aviso de que o produto já está nos favoritos, sem duplicar

### CT-04 · Remover produto da lista de favoritos

Pré-condições: Cliente com um favorito

1. Abrir My favorites
2. Clicar no botão de remover do produto

**Esperado:** Produto sai da lista

## Suposições

- O botão de remover favorito fica para um teste manual nesta versão: a história não fala de remoção, mas é o caminho de volta natural.
- "Combination Pliers" segue em estoque no ambiente estável.
