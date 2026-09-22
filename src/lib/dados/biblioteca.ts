/**
 * BIBLIOTECA — O MATERIAL DE APOIO, ENDEREÇADO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE MÓDULO É, E O QUE ELE RECUSA SER                          │
 * │                                                                      │
 * │ Ela já tem este material. Ele está publicado nas redes: guia de      │
 * │ limpeza, checklist de abertura, boas práticas de estoque. O que não   │
 * │ existe é onde GUARDAR cada um de modo que ele possa ser endereçado a  │
 * │ um cliente — e é só isso que a Biblioteca resolve.                    │
 * │                                                                      │
 * │   · O que existe aqui: o REGISTRO de um material que já existe —      │
 * │     título, tipo, o que ele serve para responder, onde ele está, e    │
 * │     para quem ele vale.                                               │
 * │                                                                      │
 * │   · O que NÃO existe, e não vai existir por conveniência: o arquivo.  │
 * │     Nem upload, nem storage, nem anexo, nem base64. Ver o parágrafo   │
 * │     abaixo, que é o mais importante deste arquivo.                    │
 * │                                                                      │
 * │ ── POR QUE NÃO HÁ ARQUIVO AQUI ─────────────────────────────────────  │
 * │                                                                      │
 * │ É a tentação mais óbvia deste módulo, e a que faria mais estrago. Um  │
 * │ campo `arquivo` que aceitasse um anexo, guardado em memória, faria a  │
 * │ tela mostrar o nome do arquivo que ela subiu — e o arquivo sumiria    │
 * │ ao recarregar. Ela acharia que subiu uma coisa que não subiu.         │
 * │                                                                      │
 * │ O sistema já tem a resposta certa para isso, e ela está no            │
 * │ `Documento` (ver `tipos-operacao.ts`): `arquivo: null`, comentado com  │
 * │ "Vazio nesta fase: não existe storage de arquivo". Não é um campo     │
 * │ faltando — é o campo dizendo a verdade.                               │
 * │                                                                      │
 * │ Então o material tem um ENDEREÇO (`onde`), que é texto escrito por    │
 * │ ela. Se o material está no Drive, `onde` é o link. Se está no         │
 * │ caderno, `onde` diz onde no caderno. Se está só na cabeça dela,        │
 * │ `onde` fica vazio — e o registro daquela linha é honesto: existe o     │
 * │ material, não existe o endereço dele.                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/*
  A normalização vem de `./equipe`, importada e não reescrita.

  "Como dois textos são o mesmo texto" é uma regra só no sistema. Este módulo
  precisa dela para a busca, e a biblioteca de equipe precisa dela para casar
  nomes — e as duas têm de concordar. Ver `project_erika_equipe_defeitos`: três
  cópias dessa regra divergiram e produziram dois defeitos silenciosos, um
  deles exatamente nesta forma (`trim().toLowerCase()` em vez da regra
  completa).

  A reexportação no fim do arquivo é para a tela não precisar saber onde a
  regra mora — ela importa de `@/lib/dados` como todo o resto.
*/
import { normalizarNome } from "./equipe";

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O TIPO FECHADO, E POR QUE ELE NÃO É "CATEGORIA LIVRE"                 │
 * │                                                                      │
 * │ A mesma razão de `FuncaoNaCozinha` e de `TipoDocumento`: em texto     │
 * │ livre, "guia", "Guia de limpeza" e "material de limpeza" viram três   │
 * │ coisas que ninguém agrupa depois. E agrupar é o que a tela precisa    │
 * │ fazer — é o que responde "o que eu já tenho sobre limpeza?".          │
 * │                                                                      │
 * │ Os seis tipos são os que o material dela realmente tem. Não são       │
 * │ inventados: limpeza e boas práticas saíram de "lista de produtos de   │
 * │ limpeza" e dos guias publicados, e os outros quatro são as formas     │
 * │ que a operação de uma cozinha pede.                                   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type TipoDeMaterial =
  | "LIMPEZA"
  | "BOAS_PRATICAS"
  | "PROCEDIMENTO"
  | "CHECKLIST"
  | "TREINAMENTO"
  | "REFERENCIA";

export const ROTULO_MATERIAL: Record<TipoDeMaterial, string> = {
  LIMPEZA: "Limpeza",
  BOAS_PRATICAS: "Boas práticas",
  PROCEDIMENTO: "Procedimento",
  CHECKLIST: "Checklist",
  TREINAMENTO: "Treinamento",
  REFERENCIA: "Referência",
};

/**
 * A ordem de apresentação — do que se aplica todo dia para o que é consulta.
 *
 * Ordem de APRESENTAÇÃO e nada mais, como em `ORDEM_FUNCAO`: não é
 * importância nem hierarquia. Limpeza e boas práticas vêm primeiro porque são
 * o que ela mais usa numa consultoria presencial, e é o que ela pediu para
 * achar rápido.
 */
export const ORDEM_MATERIAL: readonly TipoDeMaterial[] = [
  "LIMPEZA",
  "BOAS_PRATICAS",
  "PROCEDIMENTO",
  "CHECKLIST",
  "TREINAMENTO",
  "REFERENCIA",
];

/**
 * UM MATERIAL DA BIBLIOTECA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ `servePara` É O CAMPO MAIS IMPORTANTE, E NÃO O TÍTULO                 │
 * │                                                                      │
 * │ O título diz o que o material É ("Guia de limpeza da cozinha"). Ele   │
 * │ não diz QUANDO usar. Numa consultoria com o cliente do lado, ela      │
 * │ precisa achar "o que eu mostro para ele resolver isso?" — e a         │
 * │ pergunta que ela tem na cabeça é um problemA, não um nome de arquivo. │
 * │                                                                      │
 * │ Então `servePara` é escrito como uma FRASE DE SITUAÇÃO: "quando a     │
 * │ equipe não sabe a ordem da limpeza pesada". É por ele que a busca     │
 * │ encontra, e é ele que a tela mostra antes do título.                  │
 * │                                                                      │
 * │ `onde` é o endereço do material — e pode ser vazio. Vazio não é       │
 * │ falha: é o material que existe e ainda não foi endereçado. Ver o      │
 * │ cabeçalho deste arquivo sobre por que isto não é um upload.           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type Material = {
  id: string;
  titulo: string;
  tipo: TipoDeMaterial;
  /** A situação que este material responde. É por aqui que a busca acha. */
  servePara: string;
  /** O endereço do material: link, caminho, ou o que ela escrever. Pode ser vazio. */
  onde: string;
  /**
   * Os clientes para quem este material vale.
   *
   * Vazio significa GERAL — serve a qualquer cliente, e é o caso comum: um
   * guia de limpeza não é de um restaurante só. Com ids, o material é
   * daquele cliente.
   */
  clientes: string[];
  /** Como o material se relaciona com o que já está no sistema. */
  origens: OrigemDoMaterial[];
  atualizadoEm: Date;
};

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A LIGAÇÃO COM O QUE JÁ EXISTE — E POR QUE ELA É UM TIPO, NÃO UM TEXTO │
 * │                                                                      │
 * │ Um material nunca é só um material. O "guia de limpeza" encosta numa   │
 * │ ficha (o produto de limpeza tem preço), num processo (a praça onde se  │
 * │ limpa) ou num insumo da biblioteca.                                   │
 * │                                                                      │
 * │ Guardar isso como texto ("ligado a: ficha da costela") faria a ligação │
 * │ ser decorativa: nada poderia ser perguntado a ela. Como par           │
 * │ (tipo, id), a tela consegue oferecer o CAMINHO — e é isso que          │
 * │ transforma uma lista de arquivos num mapa do que já está no sistema.   │
 * │                                                                      │
 * │ O `id` é opcional porque a ligação pode ser declarada antes de a coisa │
 * │ ter id — e uma ligação declarada com o nome e sem o id ainda é útil:   │
 * │ ela diz que os dois assuntos se tocam, que é a informação que ela usa  │
 * │ ao montar um material.                                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type TipoDeOrigem = "INSUMO" | "FICHA" | "PROCESSO" | "PRATO";

export type OrigemDoMaterial = {
  tipo: TipoDeOrigem;
  /** O id da coisa, quando ela existe no sistema. Sem ele, a ligação é só declarada. */
  id?: string;
  /** O nome como ela o chama — é o que a tela mostra, com id ou sem. */
  nome: string;
};

/**
 * O rótulo e a rota de cada origem.
 *
 * O nome é `..._DO_MATERIAL` e não só `ROTULO_ORIGEM` porque esse já existe no
 * projeto, em `formato.ts`, e quer dizer outra coisa: a origem de um LEAD
 * ("Instagram", "Indicação"). As duas no mesmo barril dariam `TS2300` — dois
 * `ROTULO_ORIGEM` exportados de `@/lib/dados`. Vale mais o nome comprido do que
 * uma sigla que obrigue a lembrar de qual "origem" se está falando.
 */
export const ROTULO_ORIGEM_DO_MATERIAL: Record<TipoDeOrigem, string> = {
  INSUMO: "Ingrediente",
  FICHA: "Ficha técnica",
  PROCESSO: "Processo",
  PRATO: "Prato",
};

/** A rota de cada origem, para a tela oferecer o caminho de volta. */
export const ROTA_ORIGEM_DO_MATERIAL: Record<TipoDeOrigem, string> = {
  INSUMO: "/ingredientes",
  FICHA: "/fichas",
  PROCESSO: "/processos",
  PRATO: "/cardapios",
};

// ---------------------------------------------------------------------------
// A leitura da lista
// ---------------------------------------------------------------------------

/**
 * O material vale para este cliente?
 *
 * `clientes` vazio é GERAL. A diferença entre "geral" e "de ninguém" importa:
 * uma lista vazia de clientes é o material que serve a todos, e não um material
 * órfão. É a mesma escolha de `clientes: string[]` na ficha.
 */
export function serveAoCliente(material: Material, clienteId: string): boolean {
  return material.clientes.length === 0 || material.clientes.includes(clienteId);
}

/**
 * Os materiais de um cliente — os gerais e os dele.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UMA FUNÇÃO, E NÃO UM `filter` NA TELA                 │
 * │                                                                      │
 * │ Pela mesma razão de `pessoasDoCliente`: é onde o erro mais caro        │
 * │ acontece. Um material do restaurante A na tela do restaurante B é      │
 * │ conteúdo de um cliente entregue a outro — e quem olha não tem como     │
 * │ saber que aquilo não era para estar ali.                              │
 * │                                                                      │
 * │ E é uma função porque "geral" precisa entrar: um `filter` de igualdade │
 * │ na tela (`m.clientes.includes(id)`) ESQUECERIA os materiais gerais,    │
 * │ que são a maioria. A tela mostraria uma biblioteca quase vazia e       │
 * │ ninguém desconfiaria da causa.                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function materiaisDoCliente(
  materiais: readonly Material[],
  clienteId: string
): readonly Material[] {
  return materiais.filter((m) => serveAoCliente(m, clienteId));
}

export function materiaisGerais(materiais: readonly Material[]): readonly Material[] {
  return materiais.filter((m) => m.clientes.length === 0);
}

/**
 * Ordena a biblioteca: tipo (por `ORDEM_MATERIAL`), e dentro dele o título no
 * alfabeto pt-BR. O tipo primeiro porque é assim que ela folheia — ela procura
 * "o que tem de limpeza", não "o material de nome A".
 */
export function ordenarBiblioteca(materiais: readonly Material[]): readonly Material[] {
  const peso = new Map(ORDEM_MATERIAL.map((t, i) => [t, i]));

  return [...materiais].sort((a, b) => {
    const ta = peso.get(a.tipo) ?? ORDEM_MATERIAL.length;
    const tb = peso.get(b.tipo) ?? ORDEM_MATERIAL.length;
    if (ta !== tb) return ta - tb;

    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });
}

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A BUSCA PROCURA NA SITUAÇÃO, E NÃO SÓ NO TÍTULO                       │
 * │                                                                      │
 * │ A busca da tela é a única do módulo, e ela procura em três campos:     │
 * │ título, `servePara` e o nome das origens ligadas.                     │
 * │                                                                      │
 * │ Procurar só no título produziria o pior resultado possível: a         │
 * │ biblioteca diria "não tenho nada sobre isto" exatamente quando ela     │
 * │ está com o cliente do lado procurando o que mostrar. O material       │
 * │ existe, serve para aquilo, e o nome dele não tem a palavra que ela     │
 * │ usou.                                                                 │
 * │                                                                      │
 * │ Usa `normalizarNome` do módulo de equipe e não uma cópia própria: a    │
 * │ regra de "como dois textos são o mesmo texto" é uma só no sistema.     │
 * │ (Ver `project_erika_equipe_defeitos` — três cópias dessa regra          │
 * │ divergiram e produziram dois defeitos silenciosos.)                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function buscarMateriais(
  materiais: readonly Material[],
  termo: string
): readonly Material[] {
  const alvo = normalizarNome(termo);
  if (alvo === "") return materiais;

  return materiais.filter((m) => {
    const campos = [m.titulo, m.servePara, ...m.origens.map((o) => o.nome)];
    return campos.some((c) => normalizarNome(c).includes(alvo));
  });
}

/** Reexporta a normalização, para a tela não precisar saber onde ela mora. */
export { normalizarNome };

// ---------------------------------------------------------------------------
// O que a tela precisa saber, e o que ela NÃO pode afirmar
// ---------------------------------------------------------------------------

export type ResumoDaBiblioteca = {
  total: number;
  /** Quantos por tipo — só os tipos que têm material. */
  porTipo: ReadonlyArray<{ tipo: TipoDeMaterial; rotulo: string; quantos: number }>;
  /**
   * Os materiais sem endereço (`onde` vazio).
   *
   * É a pendência do módulo, e é a razão de ela existir na tela: são os
   * materiais que ela TEM e que ninguém consegue abrir a partir daqui.
   */
  semEndereco: readonly Material[];
  /** Materiais gerais e materiais presos a um cliente. */
  gerais: number;
  porCliente: number;
};

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O RESUMO NÃO TEM "COBERTURA" NEM PERCENTUAL                   │
 * │                                                                      │
 * │ Seria fácil calcular "quanto da biblioteca está endereçada" e mostrar  │
 * │ como um indicador. Seria também uma afirmação que ninguém fez: não     │
 * │ existe regra dizendo que todo material precisa de endereço, nem meta   │
 * │ de quantos materiais ela deve ter.                                    │
 * │                                                                      │
 * │ O que a tela mostra são CONTAGENS — quantos materiais, quantos sem     │
 * │ endereço — e a lista dos sem endereço, que é acionável. Um percentual  │
 * │ não seria: ela não tem o que fazer com "83% endereçado".               │
 * │                                                                      │
 * │ Mesma decisão de `ResumoDaEquipe`.                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function resumirBiblioteca(materiais: readonly Material[]): ResumoDaBiblioteca {
  const ordenados = ordenarBiblioteca(materiais);

  return {
    total: ordenados.length,
    porTipo: ORDEM_MATERIAL.map((tipo) => ({
      tipo,
      rotulo: ROTULO_MATERIAL[tipo],
      quantos: ordenados.filter((m) => m.tipo === tipo).length,
    })).filter((t) => t.quantos > 0),
    semEndereco: ordenados.filter((m) => m.onde.trim() === ""),
    gerais: ordenados.filter((m) => m.clientes.length === 0).length,
    porCliente: ordenados.filter((m) => m.clientes.length > 0).length,
  };
}

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE MÓDULO DELIBERADAMENTE NÃO FAZ                             │
 * │                                                                      │
 * │ `temConteudo(material)` — não existe. Não há campo de conteúdo, e não  │
 * │ haverá: o texto do material mora onde ela já escreve (redes, Drive,    │
 * │ caderno). O sistema endereça, não hospeda.                            │
 * │                                                                      │
 * │ `anexar(material, arquivo)` — não existe, pelo mesmo motivo. Um        │
 * │ material com `arquivo` preenchido em memória seria um upload que       │
 * │ desaparece, que é exatamente o que a regra do projeto proíbe           │
 * │ ("não finja upload persistente").                                     │
 * │                                                                      │
 * │ `versao` e `historico` do material — não existem. Versionar conteúdo   │
 * │ exige guardar o conteúdo, e o sistema não guarda conteúdo. A única     │
 * │ data aqui é `atualizadoEm`, que é quando o REGISTRO foi mexido, e o    │
 * │ rótulo na tela diz isso.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
