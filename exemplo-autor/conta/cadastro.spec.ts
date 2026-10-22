import { test, expect, entrar, pessoaNova } from '../../fixtures';

test('cadastra cliente novo e entra com ele @destrutivo', async ({ page }) => {
  const pessoa = pessoaNova();
  await page.goto('/auth/register');

  await page.getByTestId('first-name').fill(pessoa.nome);
  await page.getByTestId('last-name').fill(pessoa.sobrenome);
  await page.getByTestId('dob').fill('1990-05-17');
  await page.getByTestId('country').selectOption('BR');
  await page.getByTestId('postal_code').fill('37190-000');
  await page.getByTestId('house_number').fill('100');
  await page.getByTestId('street').fill('Rua das Ferramentas');
  await page.getByTestId('city').fill('Três Pontas');
  await page.getByTestId('state').fill('MG');
  await page.getByTestId('phone').fill(pessoa.telefone);
  await page.getByTestId('email').fill(pessoa.email);
  await page.getByTestId('password').fill(pessoa.senha);
  await page.getByTestId('register-submit').click();

  await expect(page).toHaveURL(/\/auth\/login/);
  await entrar(page, { email: pessoa.email, senha: pessoa.senha });
  await expect(page.getByTestId('page-title')).toHaveText('My account');
});
