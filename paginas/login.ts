import { expect, type Page } from '@playwright/test';
import { pularSeVerificacaoAntiBot, telaDeVerificacao } from './verificacao-anti-bot';

export class PaginaLogin {
  constructor(private readonly page: Page) {}

  get email() { return this.page.getByTestId('email'); }
  get senha() { return this.page.getByTestId('password'); }
  get enviar() { return this.page.getByTestId('login-submit'); }
  get erro() { return this.page.getByTestId('login-error'); }
  get erroEmail() { return this.page.getByTestId('email-error'); }
  get erroSenha() { return this.page.getByTestId('password-error'); }
  get titulo() { return this.page.getByTestId('page-title'); }

  /** Título que a pessoa vê logo depois de entrar: admin cai no painel, cliente na conta. */
  static tituloAposEntrar(avatar: string) {
    return ({ admin: 'Sales over the years' } as Record<string, string>)[avatar] ?? 'My account';
  }

  /** Entra pelo link do menu, como uma pessoa faria (o ambiente com bugs não abre /auth/login direto). */
  async abrir() {
    await this.page.goto('/');
    await this.page.getByTestId('nav-sign-in').click();
    await expect(this.email.or(telaDeVerificacao(this.page))).toBeVisible();
    await pularSeVerificacaoAntiBot(this.page);
  }

  async entrarCom(credenciais: { email: string; senha: string }) {
    await this.abrir();
    await this.email.fill(credenciais.email);
    await this.senha.fill(credenciais.senha);
    await this.enviar.click();
    await expect(this.page.getByTestId('nav-menu').or(telaDeVerificacao(this.page))).toBeAttached();
    await pularSeVerificacaoAntiBot(this.page);
    await expect(this.page.getByTestId('nav-menu')).toBeAttached();
  }
}
