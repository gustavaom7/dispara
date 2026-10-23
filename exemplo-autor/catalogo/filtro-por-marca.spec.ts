import { test, expect, produtosDaMarca } from '../../fixtures';

// Gerado pela IA a partir de historias/filtro-por-marca.md e revisado na aprovação:
// a busca paginada na API foi para a fixture produtosDaMarca, para o teste ficar só com o comportamento.
test.describe('Filtro por marca', () => {
  test('mostra só produtos da ForgeFlex Tools', async ({ api, catalogo }) => {
    // A API é a fonte da verdade: lista todos os produtos da marca, página por página.
    const daMarca = await produtosDaMarca(api, 'ForgeFlex Tools');

    await catalogo.abrir();
    await catalogo.filtrarPorMarca('ForgeFlex Tools');

    const nomes = await catalogo.listaDeNomes();
    expect(nomes.length).toBeGreaterThan(0);
    expect(daMarca).toEqual(expect.arrayContaining(nomes));
  });

  test('combina marca e categoria @regressao', async ({ catalogo }) => {
    await catalogo.abrir();
    await catalogo.filtrarPorMarca('ForgeFlex Tools');
    await catalogo.filtrarPorCategoria('Hammer');

    for (const nome of await catalogo.listaDeNomes()) expect(nome).toMatch(/hammer/i);
  });

  test('avisa quando busca e marca não têm nada em comum', async ({ catalogo }) => {
    await catalogo.abrir();
    await catalogo.buscar('produtoquenaoexiste');
    await catalogo.filtrarPorMarca('ForgeFlex Tools');

    await expect(catalogo.semResultados).toBeVisible();
  });
});
