import { test, expect, pessoaNova } from '../../fixtures';
import { PaginaLogin } from '../../paginas';

test.describe('Login', () => {
  test('entra com credenciais válidas @smoke', async ({ login, menu, conta }) => {
    await login.entrarCom(conta);
    await expect(menu.entrar).toBeHidden();
    await expect(login.titulo).toHaveText(PaginaLogin.tituloAposEntrar(conta.avatar.id));
  });

  test('recusa e-mail que não existe', async ({ page, login }) => {
    // E-mail inexistente de propósito: errar a senha de uma conta pública
    // conta como tentativa falha e pode bloquear a conta para todo mundo.
    const pessoa = pessoaNova();
    await login.abrir();
    await login.email.fill(pessoa.email);
    await login.senha.fill(pessoa.senha);
    await login.enviar.click();
    await expect(login.erro).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('exige e-mail e senha antes de enviar', async ({ login }) => {
    await login.abrir();
    await login.enviar.click();
    await expect(login.erroEmail).toBeVisible();
    await expect(login.erroSenha).toBeVisible();
  });
});
