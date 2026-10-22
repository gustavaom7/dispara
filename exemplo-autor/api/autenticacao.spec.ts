import { test, expect, pessoaNova } from '../../fixtures';

test.describe('API de autenticação', () => {
  test('gera token e identifica a conta @smoke', async ({ api, conta }) => {
    const login = await api.post('/users/login', { data: { email: conta.email, password: conta.senha } });
    expect(login.status()).toBe(200);
    const corpo = await login.json();
    expect(corpo.token_type).toBe('bearer');
    expect(corpo.access_token).toBeTruthy();
    expect(corpo.expires_in).toBeGreaterThan(0);

    const eu = await api.get('/users/me', { headers: { Authorization: `Bearer ${corpo.access_token}` } });
    expect(eu.status()).toBe(200);
    expect((await eu.json()).email).toBe(conta.email);
  });

  test('recusa credenciais de quem não tem conta', async ({ api }) => {
    // Conta inexistente: não gasta tentativas das contas públicas
    const pessoa = pessoaNova();
    const login = await api.post('/users/login', { data: { email: pessoa.email, password: pessoa.senha } });
    expect(login.status()).toBe(401);
    expect((await login.json()).error).toBeTruthy();
  });

  test('bloqueia /users/me sem token', async ({ api }) => {
    const eu = await api.get('/users/me');
    expect(eu.status()).toBe(401);
  });
});
