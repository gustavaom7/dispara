import { expect, test, type Page } from '@playwright/test';

export type Endereco = { pais: string; cep: string; numero: string; rua: string; cidade: string; estado: string };

export const ENDERECO_PADRAO: Endereco = {
  pais: 'BR', cep: '37190-000', numero: '100', rua: 'Rua das Ferramentas', cidade: 'Três Pontas', estado: 'MG',
};

/** Etapas 2 a 4 do checkout: identificação, endereço e pagamento. */
export class Checkout {
  constructor(private readonly page: Page) {}

  get confirmacao() { return this.page.locator('#order-confirmation'); }

  async continuarComoConvidado(pessoa: { email: string; nome: string; sobrenome: string }) {
    await this.page.getByRole('tab', { name: 'Continue as Guest' }).click();
    await this.page.getByTestId('guest-email').fill(pessoa.email);
    await this.page.getByTestId('guest-first-name').fill(pessoa.nome);
    await this.page.getByTestId('guest-last-name').fill(pessoa.sobrenome);
    await this.page.getByTestId('guest-submit').click();
    await this.page.getByTestId('proceed-2-guest').click();
  }

  async preencherEndereco(e: Endereco = ENDERECO_PADRAO) {
    await this.page.getByTestId('country').selectOption(e.pais);
    await this.page.getByTestId('postal_code').fill(e.cep);
    await this.page.getByTestId('house_number').fill(e.numero);
    await this.page.getByTestId('street').fill(e.rua);
    await this.page.getByTestId('city').fill(e.cidade);
    await this.page.getByTestId('state').fill(e.estado);
    await this.page.getByTestId('proceed-3').click();
  }

  /** 1º clique valida o pagamento, 2º confirma o pedido (comportamento do Toolshop). */
  async pagarNaEntrega() {
    await this.page.getByTestId('payment-method').selectOption('cash-on-delivery');
    await this.page.getByTestId('finish').click();
    await expect(this.page.getByTestId('payment-success-message')).not.toBeEmpty();

    // O Toolshop engole erro na criação da fatura e a tela fica parada no pagamento.
    // Olhar a resposta da API deixa a falha dizer o que aconteceu (convidado usa /invoices/guest).
    const fatura = this.page.waitForResponse(r => r.request().method() === 'POST' && /\/invoices(\/guest)?$/.test(new URL(r.url()).pathname));
    await this.page.getByTestId('finish').click();
    const resposta = await fatura;
    test.skip(resposta.headers()['cf-mitigated'] === 'challenge',
      'O Toolshop pediu verificação anti-bot (Cloudflare) na criação da fatura. Rode de novo mais tarde ou na sua máquina.');
    expect(resposta.ok(), `Criação da fatura respondeu ${resposta.status()}: ${(await resposta.text()).slice(0, 300)}`).toBeTruthy();
  }
}
