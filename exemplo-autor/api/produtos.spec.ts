import { test, expect } from '../../fixtures';

type Produto = { id: string; name: string; price: number };
type Pagina = { current_page: number; last_page: number; total: number; data: Produto[] };

test.describe('API de produtos', () => {
  test('lista produtos com paginação @smoke', async ({ api }) => {
    const resposta = await api.get('/products?page=1');
    expect(resposta.status()).toBe(200);

    const pagina: Pagina = await resposta.json();
    expect(pagina.current_page).toBe(1);
    expect(pagina.data.length).toBeGreaterThan(0);
    expect(pagina.total).toBeGreaterThanOrEqual(pagina.data.length);
    for (const produto of pagina.data) {
      expect(typeof produto.id).toBe('string');
      expect(produto.name).toBeTruthy();
      expect(typeof produto.price).toBe('number');
      expect(produto.price).toBeGreaterThan(0);
    }
  });

  test('busca um produto pelo id', async ({ api }) => {
    const pagina: Pagina = await (await api.get('/products?page=1')).json();
    const primeiro = pagina.data[0];

    const resposta = await api.get(`/products/${primeiro.id}`);
    expect(resposta.status()).toBe(200);
    const produto: Produto = await resposta.json();
    expect(produto.id).toBe(primeiro.id);
    expect(produto.name).toBe(primeiro.name);
    expect(produto.price).toBe(primeiro.price);
  });

  test('retorna 404 para produto que não existe', async ({ api }) => {
    const resposta = await api.get('/products/01JZZZZZZZZZZZZZZZZZZZZZZZ');
    expect(resposta.status()).toBe(404);
  });

  test('pesquisa produtos pelo nome', async ({ api }) => {
    const resposta = await api.get('/products/search?q=pliers');
    expect(resposta.status()).toBe(200);
    const pagina: Pagina = await resposta.json();
    expect(pagina.data.length).toBeGreaterThan(0);
    for (const produto of pagina.data) expect(produto.name).toMatch(/pliers/i);
  });
});
