// Resolve o ambiente e o avatar escolhidos (AMBIENTE / AVATAR) a partir de /config.
// Usado pelo playwright.config.ts e pelas fixtures, para os dois lerem a mesma coisa.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type Ambiente = { id: string; nome: string; descricao?: string; baseURL: string; apiURL: string; padrao?: boolean; protegido?: boolean };
export type Avatar = { id: string; nome: string; descricao: string; prefixo: string; padrao?: boolean };

const ler = <T>(arquivo: string): T => JSON.parse(readFileSync(join(__dirname, 'config', arquivo), 'utf8'));

export const ambientes = ler<Ambiente[]>('ambientes.json');
export const avatares = ler<Avatar[]>('avatares.json');

export function ambienteAtual(): Ambiente {
  const id = process.env.AMBIENTE ?? ambientes.find(a => a.padrao)?.id ?? ambientes[0].id;
  const ambiente = ambientes.find(a => a.id === id);
  if (!ambiente) throw new Error(`Ambiente "${id}" não existe em config/ambientes.json. Opções: ${ambientes.map(a => a.id).join(', ')}`);
  return ambiente;
}

export function avatarAtual(): Avatar {
  const id = process.env.AVATAR ?? avatares.find(a => a.padrao)?.id ?? avatares[0].id;
  const avatar = avatares.find(a => a.id === id);
  if (!avatar) throw new Error(`Avatar "${id}" não existe em config/avatares.json. Opções: ${avatares.map(a => a.id).join(', ')}`);
  return avatar;
}
