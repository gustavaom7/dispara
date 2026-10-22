import { test, expect } from '../../fixtures';

test.describe('Busca', () => {
  test('encontra produtos pelo nome @smoke', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('search-query').fill('Pliers');
    await page.getByTestId('search-submit').click();

    await expect(page.getByTestId('search_completed')).toBeVisible();
    await expect(page.getByTestId('search-term')).toHaveText('Pliers');
    const nomes = await page.getByTestId('product-name').allTextContents();
    expect(nomes.length).toBeGreaterThan(0);
    for (const nome of nomes) expect(nome).toMatch(/pliers/i);
  });

  test('avisa quando nada é encontrado', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('search-query').fill('produtoquenaoexiste');
    await page.getByTestId('search-submit').click();

    await expect(page.getByTestId('no-results')).toBeVisible();
    await expect(page.getByTestId('product-name')).toHaveCount(0);
  });
});
