import { expect, type Page } from '@playwright/test';
import { pularSeVerificacaoAntiBot, telaDeVerificacao } from './verificacao-anti-bot';

export const preco = (texto: string | null) => Number((texto ?? '').replace(/[^\d.]/g, ''));

/** Listagem de produtos (página inicial do Toolshop). */
export class Catalogo {
  constructor(private readonly page: Page) {}

  get nomes() { return this.page.getByTestId('product-name'); }
  get precos() { return this.page.getByTestId('product-price'); }
  get semResultados() { return this.page.getByTestId('no-results'); }
  get termoBuscado() { return this.page.getByTestId('search-term'); }

  async abrir() {
    await this.page.goto('/');
    await expect(this.nomes.first().or(telaDeVerificacao(this.page))).toBeVisible();
    await pularSeVerificacaoAntiBot(this.page);
  }

  /** No celular, busca, filtros e ordenação ficam num painel recolhido atrás do botão "Filters". */
  async expandirFiltros() {
    // No celular o botão de filtros pode vir sem texto (tradução vazia no Toolshop): achamos pelo data-test
    const botao = this.page.getByTestId('filters').and(this.page.getByRole('button'));
    const busca = this.page.getByTestId('search-query');
    // Espera a tela montar: no desktop a busca já aparece, no celular aparece o botão
    await expect(busca.or(botao).filter({ visible: true }).first()).toBeVisible();
    if (await botao.isVisible() && (await botao.getAttribute('aria-expanded')) !== 'true') await botao.click();
  }

  async buscar(termo: string) {
    await this.expandirFiltros();
    await this.page.getByTestId('search-query').fill(termo);
    await this.page.getByTestId('search-submit').click();
    await expect(this.page.getByTestId('search_completed')).toBeAttached();
  }

  async filtrarPorCategoria(nome: string) {
    await this.expandirFiltros();
    await this.page.getByRole('checkbox', { name: nome, exact: true }).check();
    await expect(this.page.getByTestId('filter_completed')).toBeAttached();
  }

  async filtrarPorMarca(nome: string) {
    await this.expandirFiltros();
    await this.page.getByRole('checkbox', { name: nome, exact: true }).check();
    await expect(this.page.getByTestId('filter_completed')).toBeAttached();
  }

  async ordenar(valor: 'name,asc' | 'name,desc' | 'price,asc' | 'price,desc') {
    await this.expandirFiltros();
    await this.page.getByTestId('sort').selectOption(valor);
    await expect(this.page.getByTestId('sorting_completed')).toBeAttached();
  }

  async listaDeNomes() {
    return (await this.nomes.allTextContents()).map(n => n.trim());
  }

  async listaDePrecos() {
    return (await this.precos.allTextContents()).map(preco);
  }

  /** Cartão pelo nome exato (existem "Pliers" e "Combination Pliers"). */
  cartao(nome: string) {
    return this.page.getByTestId(/^product-/).filter({ has: this.page.getByTestId('product-name').getByText(nome, { exact: true }) }).first();
  }

  async abrirProduto(nome: string) {
    await this.abrir();
    await this.buscar(nome);
    await this.cartao(nome).click();
    await expect(this.page.getByTestId('product-name')).toHaveText(nome);
  }
}
