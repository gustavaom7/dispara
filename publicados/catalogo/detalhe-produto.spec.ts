import { test, expect, cartaoDoProduto, preco } from '../../fixtures';

test('mostra o mesmo nome e preço da listagem no detalhe', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('search-query').fill('Combination Pliers');
  await page.getByTestId('search-submit').click();
  await expect(page.getByTestId('search_completed')).toBeVisible();

  const cartao = cartaoDoProduto(page, 'Combination Pliers');
  const precoNaLista = preco(await cartao.getByTestId('product-price').textContent());
  await cartao.click();

  await expect(page.getByTestId('product-name')).toHaveText('Combination Pliers');
  expect(preco(await page.getByTestId('unit-price').textContent())).toBe(precoNaLista);
  await expect(page.getByTestId('product-description')).not.toBeEmpty();
  await expect(page.getByTestId('add-to-cart')).toBeEnabled();
});
