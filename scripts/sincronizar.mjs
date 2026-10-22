#!/usr/bin/env node
// Leva os testes de /publicados para a pasta de quem roda. Caminho só de ida:
// - arquivo novo → copia
// - arquivo que a pessoa não mexeu → atualiza
// - arquivo que a pessoa alterou → mantém o dela e deixa a versão nova em .novidades/
// Nada é escrito de volta em /publicados.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { RAIZ, argumentos, executadoDireto, hash, lerJson } from './lib/util.mjs';

export function sincronizar({ de, para }) {
  const manifesto = lerJson(join(de, 'manifest.json'), null);
  if (!manifesto) throw new Error(`Sem manifest.json em ${de}. Rode "npm run publicar" ou "git pull".`);

  const caminhoEstado = join(para, '.dispara-sync.json');
  const estado = lerJson(caminhoEstado, { arquivos: {} });
  const resumo = { novos: [], atualizados: [], preservados: [], removidosNaOrigem: [], iguais: 0 };

  for (const t of manifesto.testes) {
    const origem = join(de, t.arquivo);
    const destino = join(para, t.arquivo);
    const hOrigem = hash(readFileSync(origem, 'utf8'));
    const registrado = estado.arquivos[t.arquivo];

    if (!existsSync(destino)) {
      copiar(origem, destino);
      resumo.novos.push(t.id);
    } else {
      const hLocal = hash(readFileSync(destino, 'utf8'));
      if (hLocal === hOrigem) {
        resumo.iguais++;
      } else if (hLocal === registrado) {
        copiar(origem, destino);
        resumo.atualizados.push(t.id);
      } else {
        if (hOrigem !== registrado) {
          copiar(origem, join(para, '.novidades', t.arquivo));
          resumo.preservados.push(t.id);
        }
        continue; // não marca como sincronizado: a cópia local é da pessoa
      }
    }
    estado.arquivos[t.arquivo] = hOrigem;
  }

  const publicados = new Set(manifesto.testes.map(t => t.arquivo));
  for (const arq of Object.keys(estado.arquivos)) {
    if (!publicados.has(arq)) {
      resumo.removidosNaOrigem.push(arq);
      delete estado.arquivos[arq];
    }
  }

  mkdirSync(para, { recursive: true });
  writeFileSync(caminhoEstado, JSON.stringify(estado, null, 2) + '\n');
  writeFileSync(join(para, '.dispara-manifest.json'), JSON.stringify(manifesto, null, 2) + '\n');
  return resumo;
}

export function imprimirResumo(r) {
  const partes = [];
  if (r.novos.length) partes.push(`${r.novos.length} novo(s)`);
  if (r.atualizados.length) partes.push(`${r.atualizados.length} atualizado(s)`);
  if (r.iguais) partes.push(`${r.iguais} sem mudança`);
  console.log(`↻ Sync: ${partes.join(' · ') || 'nada a fazer'}`);
  for (const id of r.preservados) {
    console.log(`  • ${id}: você alterou este teste, então ele foi mantido. A versão nova está em meus-testes/.novidades/`);
  }
  for (const arq of r.removidosNaOrigem) {
    console.log(`  • ${arq} saiu do catálogo. Sua cópia continua na pasta, apague se não precisar.`);
  }
}

function copiar(origem, destino) {
  mkdirSync(dirname(destino), { recursive: true });
  copyFileSync(origem, destino);
}

if (executadoDireto(import.meta.url)) {
  const a = argumentos();
  try {
    imprimirResumo(sincronizar({
      de: resolve(a.de ?? join(RAIZ, 'publicados')),
      para: resolve(a.para ?? process.env.DISPARA_PASTA ?? join(RAIZ, 'meus-testes')),
    }));
  } catch (e) {
    console.error(`✖ ${e.message}`);
    process.exit(1);
  }
}
