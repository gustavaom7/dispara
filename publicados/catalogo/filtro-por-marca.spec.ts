import { test, expect } from '../../fixtures';

type Marca = { id: string; name: string };
type Pagina = { data: { name: string }[]; last_page: number };

test.describe('Filtro por marca', () => {
  test('mostra só produtos da ForgeFlex Tools', async ({ api, catalogo }) => {
    // A API é a fonte da verdade: lista todos os produtos da marca, página por página.
    const resposta = await (await api.get('/brands')).json();
    const marcas: Marca[] = Array.isArray(resposta) ? resposta : resposta.data;
    const forge = marcas.find(m => m.name === 'ForgeFlex Tools');
    expect(forge, 'marca ForgeFlex Tools na API').toBeTruthy();
    const daMarca: string[] = [];
    for (let pagina = 1; ; pagina++) {
      const corpo: Pagina = await (await api.get(`/products?by_brand=${forge!.id}&page=${pagina}`)).json();
      daMarca.push(...corpo.data.map(p => p.name));
      if (pagina >= corpo.last_page) break;
    }

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
