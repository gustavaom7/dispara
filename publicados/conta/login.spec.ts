import { test, expect, entrar, pessoaNova } from '../../fixtures';

test.describe('Login', () => {
  test('entra com credenciais válidas @smoke', async ({ page, conta }) => {
    await entrar(page, conta);
    await expect(page.getByTestId('nav-sign-in')).toBeHidden();
    const titulo = conta.avatar.id === 'admin' ? 'Sales over the years' : 'My account';
    await expect(page.getByTestId('page-title')).toHaveText(titulo);
  });

  test('recusa e-mail que não existe', async ({ page }) => {
    // E-mail inexistente de propósito: errar a senha de uma conta pública
    // conta como tentativa falha e pode bloquear a conta para todo mundo.
    const pessoa = pessoaNova();
    await page.goto('/auth/login');
    await page.getByTestId('email').fill(pessoa.email);
    await page.getByTestId('password').fill(pessoa.senha);
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toContainText('Invalid email or password');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('exige e-mail e senha antes de enviar', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('email-error')).toBeVisible();
    await expect(page.getByTestId('password-error')).toBeVisible();
  });
});
