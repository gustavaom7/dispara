import { test, expect } from '../../fixtures';

type Item = { product_id: string; quantity: number };
type CarrinhoApi = { id: string; cart_items: Item[] };

test.describe('API do carrinho', () => {
  test('cria carrinho, adiciona item e lê o conteúdo @smoke', async ({ api }) => {
    const criado = await api.post('/carts');
    expect(criado.status()).toBe(201);
    const { id } = await criado.json();
    expect(id).toBeTruthy();

    const produto = (await (await api.get('/products?page=1')).json()).data[0];
    const adicionado = await api.post(`/carts/${id}`, { data: { product_id: produto.id, quantity: 2 } });
    expect(adicionado.status()).toBe(200);

    const carrinho: CarrinhoApi = await (await api.get(`/carts/${id}`)).json();
    expect(carrinho.cart_items).toHaveLength(1);
    expect(carrinho.cart_items[0]).toMatchObject({ product_id: produto.id, quantity: 2 });
  });

  test('recusa quantidade acima de 99', async ({ api }) => {
    const { id } = await (await api.post('/carts')).json();
    const produto = (await (await api.get('/products?page=1')).json()).data[0];
    const resposta = await api.post(`/carts/${id}`, { data: { product_id: produto.id, quantity: 100 } });
    expect(resposta.status()).toBe(422);
  });

  test('recusa produto que não existe', async ({ api }) => {
    const { id } = await (await api.post('/carts')).json();
    const resposta = await api.post(`/carts/${id}`, { data: { product_id: '01JZZZZZZZZZZZZZZZZZZZZZZZ', quantity: 1 } });
    expect(resposta.status()).toBe(422);
  });

  test('retorna 404 para carrinho que não existe', async ({ api }) => {
    const produto = (await (await api.get('/products?page=1')).json()).data[0];
    const resposta = await api.post('/carts/01JZZZZZZZZZZZZZZZZZZZZZZZ', { data: { product_id: produto.id, quantity: 1 } });
    expect(resposta.status()).toBe(404);
  });
});
