import { test, expect, cadastrarPorApi } from '../../fixtures';

// Cada teste cria o próprio cliente: a lista de favoritos das contas públicas muda a toda hora.
test.describe('Favoritos', () => {
  test('cliente logado adiciona produto aos favoritos @destrutivo', async ({ page, api, login, catalogo, produto, menu }) => {
    const cliente = await cadastrarPorApi(api);
    await login.entrarCom(cliente);
    await catalogo.abrirProduto('Combination Pliers');

    await produto.favoritar();
    await expect(produto.aviso('Product added to your favorites list.')).toBeVisible();

    await menu.irPara('nav-my-favorites');
    await expect(page.getByTestId('page-title')).toHaveText('Favorites');
    await expect(page.getByTestId(/^favorite-/)).toHaveCount(1);
    await expect(page.getByTestId('product-name')).toHaveText('Combination Pliers');
  });

  test('visitante sem login não consegue favoritar', async ({ catalogo, produto }) => {
    await catalogo.abrirProduto('Combination Pliers');
    await produto.favoritar();
    await expect(produto.aviso('Unauthorized, can not add product to your favorite list.')).toBeVisible();
  });

  test('não duplica produto que já está nos favoritos @destrutivo', async ({ api, login, catalogo, produto }) => {
    const cliente = await cadastrarPorApi(api);
    await login.entrarCom(cliente);
    await catalogo.abrirProduto('Combination Pliers');

    await produto.favoritar();
    await expect(produto.aviso('Product added to your favorites list.')).toBeVisible();
    await produto.favoritar();
    await expect(produto.aviso('Product already in your favorites list.')).toBeVisible();
  });
});
