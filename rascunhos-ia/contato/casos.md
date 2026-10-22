# Formulário de contato

> Rascunho gerado por IA (simulado, claude-sonnet-5-5 (gravado)) em 2026-10-22. Status das checagens: **pronto**.

Cobre o envio válido, os campos obrigatórios e o limite de 50 caracteres da mensagem, testando o lado que falha (49).

| ID | Tipo | Prioridade | Caso | Resultado esperado | Automatizado |
| --- | --- | --- | --- | --- | --- |
| CT-01 | Positivo | alta | Enviar mensagem com todos os campos válidos | Confirmação "Thanks for your message! We will contact you shortly." | sim |
| CT-02 | Negativo | alta | Enviar o formulário vazio | Erro em nome, sobrenome, assunto e mensagem | sim |
| CT-03 | Borda | media | Mensagem com 49 caracteres | Erro "Message must be minimal 50 characters" | sim |
| CT-04 | Borda | baixa | Mensagem com exatamente 50 caracteres | Mensagem aceita | não |

## Passos

### CT-01 · Enviar mensagem com todos os campos válidos

Pré-condições: Visitante sem login

1. Abrir Contact
2. Preencher nome, sobrenome e e-mail
3. Escolher o assunto Warranty
4. Escrever mensagem com mais de 50 caracteres
5. Enviar

**Esperado:** Confirmação "Thanks for your message! We will contact you shortly."

### CT-02 · Enviar o formulário vazio

1. Abrir Contact
2. Enviar sem preencher nada

**Esperado:** Erro em nome, sobrenome, assunto e mensagem

### CT-03 · Mensagem com 49 caracteres

1. Preencher todos os campos
2. Escrever mensagem com exatamente 49 caracteres
3. Enviar

**Esperado:** Erro "Message must be minimal 50 characters"

### CT-04 · Mensagem com exatamente 50 caracteres

1. Preencher todos os campos
2. Escrever mensagem com 50 caracteres
3. Enviar

**Esperado:** Mensagem aceita

## Suposições

- O e-mail é exigido mesmo sem login, como diz a história; o formulário só valida o formato dele.
- O limite exato (50 caracteres aceitos) ficou como caso manual para não enviar duas mensagens reais por execução.
