import { test, expect, abrirProduto, pessoaNova } from '../../fixtures';

test('compra como convidado até o número da fatura @destrutivo', async ({ page }) => {
  // Convidado, e não uma conta pública: não depende do carrinho de mais ninguém.
  const pessoa = pessoaNova();
  await abrirProduto(page, 'Combination Pliers');
  await page.getByTestId('add-to-cart').click();
  await expect(page.getByTestId('cart-quantity')).toHaveText('1');

  await test.step('carrinho', async () => {
    await page.getByTestId('nav-cart').click();
    await page.getByTestId('proceed-1').click();
  });

  await test.step('identificação como convidado', async () => {
    await page.getByRole('tab', { name: 'Continue as Guest' }).click();
    await page.getByTestId('guest-email').fill(pessoa.email);
    await page.getByTestId('guest-first-name').fill(pessoa.nome);
    await page.getByTestId('guest-last-name').fill(pessoa.sobrenome);
    await page.getByTestId('guest-submit').click();
    await page.getByTestId('proceed-2-guest').click();
  });

  await test.step('endereço', async () => {
    await page.getByTestId('country').selectOption('BR');
    await page.getByTestId('postal_code').fill('37190-000');
    await page.getByTestId('house_number').fill('100');
    await page.getByTestId('street').fill('Rua das Ferramentas');
    await page.getByTestId('city').fill('Três Pontas');
    await page.getByTestId('state').fill('MG');
    await page.getByTestId('proceed-3').click();
  });

  await test.step('pagamento', async () => {
    await page.getByTestId('payment-method').selectOption('cash-on-delivery');
    // 1º clique valida o pagamento, 2º confirma o pedido (comportamento do Toolshop)
    await page.getByTestId('finish').click();
    await expect(page.getByTestId('payment-success-message')).not.toBeEmpty();
    await page.getByTestId('finish').click();
  });

  await expect(page.locator('#order-confirmation')).toContainText('Thanks for your order');
  await expect(page.locator('#invoice-number')).toHaveText(/^INV-\d+/);
});
