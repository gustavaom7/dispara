import { test, expect, preco } from '../../fixtures';

test.describe('Filtro e ordenação', () => {
  test('filtra pela categoria Hammer', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('checkbox', { name: 'Hammer', exact: true }).check();

    await expect(page.getByTestId('filter_completed')).toBeVisible();
    const nomes = await page.getByTestId('product-name').allTextContents();
    expect(nomes.length).toBeGreaterThan(0);
    for (const nome of nomes) expect(nome).toMatch(/hammer/i);
  });

  test('ordena por preço do menor para o maior', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('sort').selectOption('price,asc');

    await expect(page.getByTestId('sorting_completed')).toBeVisible();
    const precos = (await page.getByTestId('product-price').allTextContents()).map(preco);
    expect(precos.length).toBeGreaterThan(1);
    expect(precos).toEqual([...precos].sort((a, b) => a - b));
  });
});
