import { type Page } from '@playwright/test';
import { preco } from './catalogo';

export class Carrinho {
  constructor(private readonly page: Page) {}

  get tituloDoProduto() { return this.page.getByTestId('product-title'); }
  get quantidade() { return this.page.getByTestId('product-quantity'); }

  async precoDaLinha() {
    return preco(await this.page.getByTestId('line-price').textContent());
  }

  async total() {
    return preco(await this.page.getByTestId('cart-total').textContent());
  }

  async avancar() {
    await this.page.getByTestId('proceed-1').click();
  }
}
