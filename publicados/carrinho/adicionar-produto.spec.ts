import { test, expect, abrirProduto, preco } from '../../fixtures';

test('adiciona 2 unidades ao carrinho com o total certo @smoke', async ({ page }) => {
  await abrirProduto(page, 'Combination Pliers');
  const unitario = preco(await page.getByTestId('unit-price').textContent());

  await page.getByTestId('increase-quantity').click();
  await expect(page.getByTestId('quantity')).toHaveValue('2');
  await page.getByTestId('add-to-cart').click();

  await expect(page.getByText('Product added to shopping cart.')).toBeVisible();
  await expect(page.getByTestId('cart-quantity')).toHaveText('2');

  await page.getByTestId('nav-cart').click();
  await expect(page.getByTestId('product-title')).toContainText('Combination Pliers');
  await expect(page.getByTestId('product-quantity')).toHaveValue('2');
  expect(preco(await page.getByTestId('line-price').textContent())).toBeCloseTo(unitario * 2, 2);
});
