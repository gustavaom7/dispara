import { idDe } from './util.mjs';

const TITULOS = /\btest(?:\.describe)?(?:\.(?:only|skip|fixme))?\(\s*(['"`])(.+?)\1/g;
const CASOS = /\btest(?:\.(?:only|skip|fixme))?\(\s*(['"`])(.+?)\1/g;
const OPCAO_TAG = /\btag:\s*(\[[^\]]*\]|(['"`])[^'"`]*\2)/g;
const TAG = /(?<![\w.])@([a-z][\w-]*)/gi;
const EXIGE_AVATAR = /avatar\.id\s*!==\s*(['"`])([\w-]+)\1/;

const tagsDe = (texto) => [...texto.matchAll(TAG)].map(m => m[1].toLowerCase());
const limpar = (texto) => {
  const t = texto.replace(TAG, '').replace(/\s+/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Lê o código do teste e extrai o que o site precisa mostrar. */
export function metadados(arquivo, codigo) {
  const titulos = [...codigo.matchAll(TITULOS)].map(m => m[2]);
  const fontesDeTag = [...titulos, ...[...codigo.matchAll(OPCAO_TAG)].map(m => m[1])];
  const tags = [...new Set(fontesDeTag.flatMap(tagsDe))];
  const casos = [...codigo.matchAll(CASOS)].map(m => ({ titulo: limpar(m[2]), tags: tagsDe(m[2]) }));

  const describe = codigo.match(/test\.describe\(\s*(['"`])(.+?)\1/);
  const titulo = limpar(describe?.[2] ?? titulos[0] ?? idDe(arquivo));

  return {
    id: idDe(arquivo),
    titulo,
    arquivo,
    area: arquivo.includes('/') ? arquivo.split('/')[0] : 'geral',
    tags,
    casos,
    qtdTestes: casos.length,
    // teste que só faz sentido com uma conta específica (test.skip(conta.avatar.id !== 'x'))
    exigeAvatar: codigo.match(EXIGE_AVATAR)?.[2] ?? null,
  };
}
