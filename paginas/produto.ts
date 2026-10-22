import { type Page } from '@playwright/test';
import { preco } from './catalogo';

export class PaginaProduto {
  constructor(private readonly page: Page) {}

  get nome() { return this.page.getByTestId('product-name'); }
  get descricao() { return this.page.getByTestId('product-description'); }
  get quantidade() { return this.page.getByTestId('quantity'); }
  get botaoAdicionar() { return this.page.getByTestId('add-to-cart'); }
  get botaoFavoritar() { return this.page.getByTestId('add-to-favorites'); }

  async precoUnitario() {
    return preco(await this.page.getByTestId('unit-price').textContent());
  }

  async aumentarQuantidade(vezes = 1) {
    for (let i = 0; i < vezes; i++) await this.page.getByTestId('increase-quantity').click();
  }

  async adicionarAoCarrinho() {
    await this.botaoAdicionar.click();
  }

  async favoritar() {
    await this.botaoFavoritar.click();
  }

  /** Mensagem flutuante (toast) com o texto informado. */
  aviso(texto: string) {
    return this.page.getByText(texto);
  }
}
