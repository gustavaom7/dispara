import { test as base, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { join } from 'node:path';
import { ambienteAtual, avatarAtual, type Ambiente, type Avatar } from './ambiente';
import { Carrinho, Catalogo, Checkout, Menu, PaginaLogin, PaginaProduto } from './paginas';

export type Conta = { avatar: Avatar; email: string; senha: string };

type Fixtures = {
  /** Conta do avatar escolhido, com credenciais do .env de quem roda. */
  conta: Conta;
  /** Ambiente escolhido (URL do site e da API). */
  ambiente: Ambiente;
  /** Cliente HTTP apontado para a API do ambiente. */
  api: APIRequestContext;
  // Page objects (pasta paginas/)
  menu: Menu;
  login: PaginaLogin;
  catalogo: Catalogo;
  produto: PaginaProduto;
  carrinho: Carrinho;
  checkout: Checkout;
};

/**
 * Nenhum teste deve ter e-mail, senha ou caminho pessoal escrito no código:
 * `conta` traz as credenciais, `pessoaNova()` gera dados únicos e `arquivo()` aponta arquivos de apoio.
 */
export const test = base.extend<Fixtures>({
  ambiente: async ({}, use) => { await use(ambienteAtual()); },

  conta: async ({ ambiente }, use, info) => {
    const avatar = avatarAtual();
    const email = process.env[`${avatar.prefixo}_EMAIL`];
    const senha = process.env[`${avatar.prefixo}_SENHA`];
    if (!email || !senha) {
      throw new Error(`Preencha ${avatar.prefixo}_EMAIL e ${avatar.prefixo}_SENHA no seu .env para usar a conta "${avatar.nome}" (veja .env.example).`);
    }
    // As contas do Toolshop são públicas: qualquer pessoa pode bloqueá-las errando a senha várias vezes.
    // Conta bloqueada não é falha do teste nem do produto, então o teste é pulado com o motivo à vista.
    const verificacao = await playwrightRequest.newContext({ baseURL: ambiente.apiURL });
    const status = (await verificacao.post('/users/login', { data: { email, password: senha } })).status();
    await verificacao.dispose();
    info.skip(status === 423, `Conta "${avatar.nome}" bloqueada no Toolshop público (423, Account locked). Use outro --avatar ou espere o reset do Toolshop.`);
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

  menu: async ({ page }, use) => { await use(new Menu(page)); },
  login: async ({ page }, use) => { await use(new PaginaLogin(page)); },
  catalogo: async ({ page }, use) => { await use(new Catalogo(page)); },
  produto: async ({ page }, use) => { await use(new PaginaProduto(page)); },
  carrinho: async ({ page }, use) => { await use(new Carrinho(page)); },
  checkout: async ({ page }, use) => { await use(new Checkout(page)); },
});

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

/** Cria um cliente novo pela API e devolve as credenciais. Mais rápido que cadastrar pela tela. */
export async function cadastrarPorApi(api: APIRequestContext) {
  const pessoa = pessoaNova();
  const resposta = await api.post('/users/register', {
    data: {
      first_name: pessoa.nome,
      last_name: pessoa.sobrenome,
      dob: '1990-05-17',
      phone: pessoa.telefone,
      email: pessoa.email,
      password: pessoa.senha,
      address: { street: 'Rua das Ferramentas', house_number: '100', city: 'Três Pontas', state: 'MG', country: 'BR', postal_code: '37190-000' },
    },
  });
  expect(resposta.ok(), `cadastro pela API: ${resposta.status()} ${await resposta.text()}`).toBeTruthy();
  return { ...pessoa, email: pessoa.email, senha: pessoa.senha };
}

/** Nomes de todos os produtos de uma marca, segundo a API (percorre todas as páginas). */
export async function produtosDaMarca(api: APIRequestContext, marca: string) {
  const corpo = await (await api.get('/brands')).json();
  const marcas: { id: string; name: string }[] = Array.isArray(corpo) ? corpo : corpo.data;
  const encontrada = marcas.find(m => m.name === marca);
  if (!encontrada) throw new Error(`Marca "${marca}" não existe na API`);
  const nomes: string[] = [];
  for (let pagina = 1, ultima = 1; pagina <= ultima; pagina++) {
    const resposta: { data: { name: string }[]; last_page: number } = await (await api.get(`/products?by_brand=${encontrada.id}&page=${pagina}`)).json();
    nomes.push(...resposta.data.map(p => p.name));
    ultima = resposta.last_page;
  }
  return nomes;
}

export { preco } from './paginas';

/** Arquivos de apoio versionados no repo. */
export const arquivo = (nome: string) => join(__dirname, 'arquivos', nome);

export { expect };
