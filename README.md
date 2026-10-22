# Dispara

**Catálogo self-service de testes Playwright.** Quem escreve os testes publica; o resto do time escolhe **ambiente** e **conta de teste** num site, copia um comando e roda na própria máquina. O CI roda tudo todo dia e o site mostra os resultados.

Os testes rodam de verdade contra o [Toolshop](https://practicesoftwaretesting.com), uma loja pública feita para prática de automação, em duas versões: a **estável** e uma **com bugs plantados de propósito**.

## O que este projeto mostra

| Habilidade | Onde ver |
| --- | --- |
| Testes E2E de UI com Playwright (19 casos em 10 arquivos) | `exemplo-autor/` |
| Testes de API com o `request` do Playwright | `exemplo-autor/api/` |
| Fixtures, dados únicos por execução e testes independentes de ordem | `fixtures.ts` |
| Mesmo teste em vários ambientes e contas, sem mudar código | `config/`, `ambiente.ts` |
| Seletores estáveis (`data-test`) conferidos contra o código-fonte da aplicação | `npm run checar` |
| Segredos fora do código e limpeza automática na publicação | `scripts/lib/sanitizar.mjs` |
| CI com matriz de ambientes, nova tentativa, relatório publicado e execução diária | `.github/workflows/testes.yml` |
| Testes dos próprios scripts (19 testes com `node:test`) | `scripts/lib/*.test.mjs` |
| Ferramenta interna com UI (catálogo, execuções, revisão de segurança) | `site/template.html` |

## Como funciona

```
pasta da autora ──publicar──▶ publicados/ (Git) ──sync──▶ meus-testes/ de cada pessoa ──▶ Playwright ──▶ Toolshop
   (rascunhos)     limpa         manifest.json      só ida     (pode editar à vontade)       .env local
                   segredos      historico.json
                                       │
                                       └──▶ GitHub Actions (estável + com bugs) ──▶ relatório + histórico ──▶ site no GitHub Pages
```

| Peça | Arquivo | O que faz |
| --- | --- | --- |
| Publicar | `scripts/publicar.mjs` | Copia os `.spec.ts` da pasta da autora, remove senhas, tokens, e-mails, telefones, CPFs e caminhos pessoais, avisa a linha de cada troca e gera o manifesto e o histórico de publicações |
| Sincronizar | `scripts/sincronizar.mjs` | Leva os testes para `meus-testes/`. Arquivo novo é copiado, arquivo intocado é atualizado, arquivo que a pessoa alterou é mantido e a versão nova vai para `.novidades/`. Nunca escreve de volta |
| Rodar | `scripts/rodar.mjs` | `git pull` → sync → valida ambiente e conta → trava testes `@destrutivo` em ambiente protegido → Playwright → guarda o resultado |
| Checar seletores | `scripts/checar-seletores.mjs` | Confere cada `getByTestId` dos testes contra os `data-test` do código do Toolshop (mapa em `ref/`) |
| Coletar | `scripts/coletar-resultados.mjs` | Transforma o relatório JSON do Playwright em execuções (passou, falhou, pulado, instável) para o site |
| Site | `scripts/gerar-site.mjs` | Página estática com catálogo, execuções, contas, primeiro acesso, publicações e revisão de segurança |

## Rodando na sua máquina

```bash
git clone https://github.com/gustavaom7/dispara.git && cd dispara
npm install && npx playwright install chromium
cp .env.example .env          # já vem com as contas públicas do Toolshop

npm run t -- busca                                   # um teste, ambiente e conta padrão
npm run t -- login --ambiente=com-bugs --avatar=admin
npm run t -- --todos --exceto=pedidos --headed       # tudo, vendo o navegador
npx playwright show-report                           # relatório da última execução
```

| Ambiente | `--ambiente=` | Site |
| --- | --- | --- |
| Estável (padrão) | `estavel` | practicesoftwaretesting.com |
| Com bugs | `com-bugs` | with-bugs.practicesoftwaretesting.com |
| Sprint 4 | `sprint4` | v4.practicesoftwaretesting.com |

Contas (`--avatar=`): `cliente` (padrão), `cliente-2`, `cliente-3` e `admin`.

> **Sobre as credenciais:** as contas do `.env.example` são públicas, publicadas pelo próprio Toolshop. Mesmo assim, nenhum teste tem e-mail ou senha no código: tudo vem do `.env`. Num sistema de verdade, o `.env` fica só na máquina de cada pessoa e o CI usa secrets.

## Para quem escreve testes

1. Escreva na sua pasta, importando de `fixtures.ts`. Use `conta.email`, `conta.senha`, `pessoaNova()` e `getByTestId`.
2. Marque com `@smoke`, `@regressao` ou `@destrutivo` (cria ou altera dados).
3. `npm run checar -- --pasta <sua-pasta>` para conferir os seletores.
4. `npm run publicar -- --de <sua-pasta> --autor "Seu nome"`, confira os avisos e faça commit de `publicados/`.

O arquivo `exemplo-autor/admin/pedidos.spec.ts` tem um caminho pessoal e um e-mail **de propósito**, para mostrar a limpeza na publicação e a tela de Revisão de segurança.

## Decisões de teste

- **Login com erro usa e-mail inexistente.** Errar a senha de uma conta pública conta como tentativa falha e pode bloquear a conta para todo mundo.
- **Compra como convidado e cadastro com usuário novo.** O Toolshop é compartilhado: os testes que criam dados não dependem do carrinho nem do histórico de ninguém.
- **Asserções relativas, não valores fixos.** O detalhe do produto compara com o preço da listagem, e a ordenação confere a ordem, em vez de esperar preços escritos no teste.
- **Uma nova tentativa só no CI.** Separa instabilidade do site público (marcada como "instável" no site) de falha de verdade.
- **"Com bugs" não derruba o pipeline.** Falhar lá é o resultado esperado e mostra os testes pegando defeitos.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run t -- <testes>` | Roda testes (veja acima) |
| `npm run publicar` | Publica a pasta da autora em `publicados/` |
| `npm run sync` | Atualiza `meus-testes/` a partir de `publicados/` |
| `npm run checar` | Confere os seletores contra o mapa do Toolshop (`--atualizar` clona o código atual) |
| `npm run mapear` | Refaz `ref/toolshop-seletores.json` a partir do código do Toolshop |
| `npm run coletar` | Registra o resultado da última execução no histórico |
| `npm run site -- --demo` | Gera o site (com execuções de exemplo quando ainda não há reais) |
| `npm run tipos` | Typecheck dos testes |
| `npm run test:scripts` | Testes dos scripts do Dispara |

## Publicando no GitHub

1. Crie o repositório e envie o código.
2. Em **Settings → Pages**, escolha **GitHub Actions** como fonte.
3. Na aba **Actions**, rode o workflow **Testes** uma vez. Depois ele roda a cada push e todo dia às 06:17 (Brasília).

O site fica em `https://<usuario>.github.io/dispara/`, com os relatórios do Playwright em `/relatorios/<ambiente>/` e o histórico em `/dados/execucoes.json`.

## Próximos passos

- **Gerar testes com IA:** história de usuário → Claude API → casos de teste + esqueleto Playwright que entra no catálogo como rascunho para revisão.
- **Login e papéis no site** com Supabase ou login do GitHub.
- **App de apostas próprio** como segundo alvo, para cobrir o domínio de iGaming.
