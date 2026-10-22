import { test, expect } from '../../fixtures';

test.describe('Busca', () => {
  test('encontra produtos pelo nome @smoke', async ({ catalogo }) => {
    await catalogo.abrir();
    await catalogo.buscar('Pliers');

    await expect(catalogo.termoBuscado).toHaveText('Pliers');
    const nomes = await catalogo.listaDeNomes();
    expect(nomes.length).toBeGreaterThan(0);
    for (const nome of nomes) expect(nome).toMatch(/pliers/i);
  });

  test('avisa quando nada é encontrado', async ({ catalogo }) => {
    await catalogo.abrir();
    await catalogo.buscar('produtoquenaoexiste');

    await expect(catalogo.semResultados).toBeVisible();
    await expect(catalogo.nomes).toHaveCount(0);
  });
});
