import { test, expect, pessoaNova } from '../../fixtures';

test.describe('Formulário de contato', () => {
  test('envia mensagem com todos os campos válidos @destrutivo', async ({ page }) => {
    const pessoa = pessoaNova();
    await page.goto('/contact');
    await page.getByTestId('first-name').fill(pessoa.nome);
    await page.getByTestId('last-name').fill(pessoa.sobrenome);
    await page.getByTestId('email').fill(pessoa.email);
    await page.getByTestId('subject').selectOption('warranty');
    await page.getByTestId('message').fill('A garantia cobre o cabo do martelo que trincou com menos de seis meses de uso normal?');
    await page.getByTestId('contact-submit').click();

    await expect(page.getByRole('alert')).toContainText('Thanks for your message! We will contact you shortly.');
  });

  test('exige os campos obrigatórios', async ({ page }) => {
    await page.goto('/contact');
    await page.getByTestId('contact-submit').click();

    await expect(page.getByTestId('first-name-error')).toBeVisible();
    await expect(page.getByTestId('last-name-error')).toBeVisible();
    await expect(page.getByTestId('subject-error')).toBeVisible();
    await expect(page.getByTestId('message-error')).toBeVisible();
  });

  test('recusa mensagem com 49 caracteres', async ({ page }) => {
    const pessoa = pessoaNova();
    await page.goto('/contact');
    await page.getByTestId('first-name').fill(pessoa.nome);
    await page.getByTestId('last-name').fill(pessoa.sobrenome);
    await page.getByTestId('email').fill(pessoa.email);
    await page.getByTestId('subject').selectOption('return');
    await page.getByTestId('message').fill('x'.repeat(49));
    await page.getByTestId('contact-submit').click();

    await expect(page.getByTestId('message-error')).toContainText('Message must be minimal 50 characters');
  });
});
