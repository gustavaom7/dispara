import { test, expect } from '../../fixtures';

test.describe('Filtro e ordenação', () => {
  test('filtra pela categoria Hammer', async ({ catalogo }) => {
    await catalogo.abrir();
    await catalogo.filtrarPorCategoria('Hammer');

    const nomes = await catalogo.listaDeNomes();
    expect(nomes.length).toBeGreaterThan(0);
    for (const nome of nomes) expect(nome).toMatch(/hammer/i);
  });

  test('ordena por preço do menor para o maior', async ({ catalogo }) => {
    await catalogo.abrir();
    await catalogo.ordenar('price,asc');

    const precos = await catalogo.listaDePrecos();
    expect(precos.length).toBeGreaterThan(1);
    expect(precos).toEqual([...precos].sort((a, b) => a - b));
  });
});
