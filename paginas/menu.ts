import { expect, type Page } from '@playwright/test';

/** Cabeçalho do Toolshop. No celular, os links ficam dentro do menu recolhido. */
export class Menu {
  constructor(private readonly page: Page) {}

  get quantidadeNoCarrinho() { return this.page.getByTestId('cart-quantity'); }
  get entrar() { return this.page.getByTestId('nav-sign-in'); }
  get menuDoUsuario() { return this.page.getByTestId('nav-menu'); }

  /** Abre o menu recolhido quando o botão dele está visível (telas pequenas). */
  async expandir() {
    const botao = this.page.getByRole('button', { name: 'Toggle navigation' });
    // Espera o cabeçalho existir antes de decidir: isVisible() não espera e respondia "não" cedo demais no celular
    await expect(botao.or(this.page.getByTestId('nav-home')).filter({ visible: true }).first()).toBeVisible();
    if (await botao.isVisible() && (await botao.getAttribute('aria-expanded')) !== 'true') await botao.click();
  }

  async abrirCarrinho() {
    await this.expandir();
    await this.page.getByTestId('nav-cart').click();
  }

  /** Abre o menu do usuário e clica num item pelo data-test (ex.: "nav-my-favorites"). */
  async irPara(item: string) {
    await this.expandir();
    await this.menuDoUsuario.click();
    await this.page.getByTestId(item).click();
  }

  async esperarLogado() {
    await expect(this.menuDoUsuario).toBeAttached();
  }
}
