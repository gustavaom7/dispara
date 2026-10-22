import { test as base, expect, request as playwrightRequest, type APIRequestContext, type Page } from '@playwright/test';
import { join } from 'node:path';
import { ambienteAtual, avatarAtual, type Ambiente, type Avatar } from './ambiente';

export type Conta = { avatar: Avatar; email: string; senha: string };

type Fixtures = {
  /** Conta do avatar escolhido, com credenciais do .env de quem roda. */
  conta: Conta;
  /** Ambiente escolhido (URL do site e da API). */
  ambiente: Ambiente;
  /** Cliente HTTP apontado para a API do ambiente. */
  api: APIRequestContext;
};

/**
 * Nenhum teste deve ter e-mail, senha ou caminho pessoal escrito no código:
 * `conta` traz as credenciais e `arquivo()` os arquivos de apoio.
 */
export const test = base.extend<Fixtures>({
  ambiente: async ({}, use) => { await use(ambienteAtual()); },

  conta: async ({}, use) => {
    const avatar = avatarAtual();
    const email = process.env[`${avatar.prefixo}_EMAIL`];
    const senha = process.env[`${avatar.prefixo}_SENHA`];
    if (!email || !senha) {
      throw new Error(`Preencha ${avatar.prefixo}_EMAIL e ${avatar.prefixo}_SENHA no seu .env para usar a conta "${avatar.nome}" (veja .env.example).`);
    }
    await use({ avatar, email, senha });
  },

  api: async ({ ambiente }, use) => {
    const contexto = await playwrightRequest.newContext({
      baseURL: ambiente.apiURL,
      extraHTTPHeaders: { Accept: 'application/json' },
    });
    await use(contexto);
    await contexto.dispose();
  },
});

export async function entrar(page: Page, conta: Pick<Conta, 'email' | 'senha'>) {
  await page.goto('/auth/login');
  await page.getByTestId('email').fill(conta.email);
  await page.getByTestId('password').fill(conta.senha);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('nav-menu')).toBeVisible();
}

/** Busca pelo nome no catálogo e abre o primeiro produto encontrado. */
export async function abrirProduto(page: Page, nome: string) {
  await page.goto('/');
  await page.getByTestId('search-query').fill(nome);
  await page.getByTestId('search-submit').click();
  await expect(page.getByTestId('search_completed')).toBeVisible();
  await cartaoDoProduto(page, nome).click();
  await expect(page.getByTestId('product-name')).toHaveText(nome);
}

/** Cartão do produto na listagem, pelo nome exato (há "Pliers" e "Combination Pliers"). */
export function cartaoDoProduto(page: Page, nome: string) {
  return page.getByTestId(/^product-/).filter({ has: page.getByTestId('product-name').getByText(nome, { exact: true }) }).first();
}

/** Dados únicos por execução: o Toolshop é público e compartilhado. */
export function pessoaNova() {
  const id = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return {
    nome: 'Teste',
    sobrenome: `Dispara ${id.slice(-6)}`,
    email: `dispara+${id}@example.com`,
    senha: `Qa!${id}Aa`,
    // 10 dígitos: não parece celular, então não cai na limpeza de telefone da publicação
    telefone: `113${id.slice(-7)}`,
  };
}

/** Converte "$14.15" em 14.15. */
export const preco = (texto: string | null) => Number((texto ?? '').replace(/[^\d.]/g, ''));

/** Arquivos de apoio versionados no repo. */
export const arquivo = (nome: string) => join(__dirname, 'arquivos', nome);

export { expect };
