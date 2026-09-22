/**
 * EQUIPE — QUEM EXECUTA NA COZINHA DO CLIENTE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE MÓDULO É, E O QUE ELE NÃO É                               │
 * │                                                                      │
 * │ Ele registra NOMES DE EXECUÇÃO. Não é RH, e a diferença é a mesma     │
 * │ que separa uma escala de produção de uma folha de pagamento:          │
 * │                                                                      │
 * │   · O que existe aqui: nome, função na cozinha, turno, pratos que a   │
 * │     pessoa executa, e o que ela já foi treinada a fazer.              │
 * │                                                                      │
 * │   · O que NÃO existe, e não pode passar a existir sem uma decisão     │
 * │     dela: salário, folha, férias, benefício, ponto eletrônico,        │
 * │     adiantamento, desconto, horário com batida. Nada disso é         │
 * │     campo, e não por estar faltando — por ser outro sistema.          │
 * │                                                                      │
 * │ A razão não é burocracia: se este módulo guardasse salário, ele        │
 * │ passaria a ser leitura obrigatória para tratar de gente, e um nome     │
 * │ errado na lista viraria um problema trabalhista. Nome de execução      │
 * │ errado é um prato que sai diferente — recuperável no dia seguinte.     │
 * │                                                                      │
 * │ ── E O QUE O MÓDULO RESOLVE ────────────────────────────────────────  │
 * │                                                                      │
 * │ Hoje o responsável por um preparo é TEXTO LIVRE no processo:          │
 * │ `responsavel: "Juliana (auxiliar de cozinha)"`, `"Cozinha"`,          │
 * │ `"A definir com o Marcelo"`. Os três convivem no mesmo campo, e isso  │
 * │ produz duas perguntas que ninguém consegue responder:                 │
 * │                                                                      │
 * │   · "Quantos preparos a Juliana executa?" — impossível, porque o      │
 * │     mesmo nome está escrito de três jeitos diferentes e às vezes está │
 * │     escrito como uma praça ("Cozinha") em vez de uma pessoa.          │
 * │                                                                      │
 * │   · "Quem não foi treinado no que executa?" — impossível, porque não  │
 * │     há o que comparar: de um lado um texto, do outro nada.            │
 * │                                                                      │
 * │ Este módulo responde as duas SEM tocar no texto que já está gravado.   │
 * │ `casarPessoas` compara nomes por igualdade normalizada e diz, item a   │
 * │ item, o que casou e o que não casou — e o não-casado fica visível,     │
 * │ porque um nome que não corresponde a pessoa nenhuma é justamente a     │
 * │ informação que se quer ver.                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Puro: sem React, sem I/O, sem `Date.now()` escondido. Tudo que este arquivo
 * sabe entra por argumento — é o que permite a bancada exercitá-lo sob Node.
 */

import type { PassoProcesso, Processo } from "./tipos-operacao";

// ---------------------------------------------------------------------------
// A pessoa
// ---------------------------------------------------------------------------

/**
 * A função na cozinha.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM TIPO FECHADO, E NÃO TEXTO LIVRE                     │
 * │                                                                      │
 * │ É a mesma pergunta do cargo e a mesma armadilha: em texto livre,      │
 * │ "Auxiliar de cozinha", "aux cozinha" e "Ajudante" viram três funções  │
 * │ que ninguém consegue agrupar depois. E agrupar por função é            │
 * │ exatamente o que a tela precisa fazer — é o que responde "quantas      │
 * │ pessoas no passe".                                                     │
 * │                                                                      │
 * │ Fechado, o filtro por função é confiável. O que ele NÃO é: hierarquia  │
 * │ nem salário. `ORDEM_FUNCAO` abaixo é ordem de APRESENTAÇÃO — a ordem   │
 * │ em que as funções aparecem numa lista, da cozinha para o salão. Não é  │
 * │ organograma: o sistema não sabe quem manda em quem, e não deve saber.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type FuncaoNaCozinha =
  | "CHEFE"
  | "COZINHEIRO"
  | "AUXILIAR"
  | "CONFEITEIRO"
  | "PASSE"
  | "SALAO"
  | "BAR"
  | "ENTREGADOR"
  | "LIMPEZA";

export const ROTULO_FUNCAO: Record<FuncaoNaCozinha, string> = {
  CHEFE: "Chefia de cozinha",
  COZINHEIRO: "Cozinheiro",
  AUXILIAR: "Auxiliar de cozinha",
  CONFEITEIRO: "Confeiteiro",
  PASSE: "Passe / expedição",
  SALAO: "Salão",
  BAR: "Bar",
  ENTREGADOR: "Entregador",
  LIMPEZA: "Limpeza",
};

/**
 * A ordem em que as funções são mostradas — da cozinha para fora.
 *
 * Serve para a lista, o filtro e o resumo saírem sempre na mesma ordem, sem
 * que a tela precise decidir isso. É ordem de APRESENTAÇÃO e nada mais.
 */
export const ORDEM_FUNCAO: readonly FuncaoNaCozinha[] = [
  "CHEFE",
  "COZINHEIRO",
  "AUXILIAR",
  "CONFEITEIRO",
  "PASSE",
  "SALAO",
  "BAR",
  "ENTREGADOR",
  "LIMPEZA",
];

export type Turno = "MANHA" | "TARDE" | "NOITE" | "INTEGRAL";

export const ROTULO_TURNO: Record<Turno, string> = {
  MANHA: "Manhã",
  TARDE: "Tarde",
  NOITE: "Noite",
  INTEGRAL: "Integral",
};

/**
 * A pessoa.
 *
 * `situacao` separa duas coisas que texto livre mistura: quem TRABALHA hoje e
 * quem já trabalhou. `DESLIGADA` no lugar de apagar o registro — a pessoa
 * executou preparos, e o registro do que ela executou não deixa de ser
 * verdade quando ela sai.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE NÃO ESTÁ AQUI, E POR QUE                                        │
 * │                                                                      │
 * │ Não há `desligadaEm: Date`. Data de saída é dado de RH: ela existe    │
 * │ para calcular aviso, férias e rescisão. Chamá-la de `situacao =        │
 * │ DESLIGADA` mantém a informação que a operação precisa ("não contar     │
 * │ com ela na escala de hoje") sem guardar a que só serve para outra      │
 * │ coisa. Se a data for necessária para a operação, ela entra como texto  │
 * │ na observação — e aí é claro que é anotação, não cálculo.              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type SituacaoPessoa = "ATIVA" | "DESLIGADA";

export const ROTULO_SITUACAO_PESSOA: Record<SituacaoPessoa, string> = {
  ATIVA: "Na ativa",
  DESLIGADA: "Saiu da equipe",
};

export type Pessoa = {
  id: string;
  /** O cliente cuja cozinha ela executa. Não se mistura: ver `pessoasDoCliente`. */
  clienteId: string;
  nome: string;
  funcao: FuncaoNaCozinha;
  turno: Turno;
  /** O que ela executa hoje, escrito por quem a escala. Texto, não id. */
  pratos: string[];
  observacao: string;
  situacao: SituacaoPessoa;
  registradaEm: Date;
};

// ---------------------------------------------------------------------------
// Treinamento — a única lista que responde "quem sabe fazer o quê"
// ---------------------------------------------------------------------------

/**
 * Um treinamento CONCLUÍDO por uma pessoa num preparo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE TREINAMENTO TEM REGISTRO PRÓPRIO, E NÃO É UM CAMPO            │
 * │                                                                      │
 * │ "Treinada: sim" não responde a pergunta que ela faz. O que ela        │
 * │ pergunta é "treinada em quê?" — e a resposta muda por preparo: uma    │
 * │ pessoa pode estar treinada na finalização da costela e não estar no    │
 * │ empratamento do escondidinho.                                          │
 * │                                                                      │
 * │ Então o treinamento é um PAR (pessoa, preparo) com data, e a ausência  │
 * │ do par é a informação — é ela que produz a lista de quem executa o     │
 * │ que não foi treinado, que é a pendência que este módulo existe para    │
 * │ mostrar.                                                              │
 * │                                                                      │
 * │ `preparo` é o nome do preparo como a operação o chama — o mesmo texto  │
 * │ que aparece em `Pessoa.pratos` e em `PassoProcesso`. Não é o id da     │
 * │ ficha, e é deliberado: a escala da cozinha não conhece fichas            │
 * │ técnicas, e exigir um id aqui faria o cadastro depender de a ficha      │
 * │ existir — o que nem sempre é verdade quando o preparo já é executado.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type Treinamento = {
  id: string;
  pessoaId: string;
  preparo: string;
  /** Quem aplicou. Texto: pode ser a consultora ou alguém da casa. */
  aplicadoPor: string;
  concluidoEm: Date;
};

// ---------------------------------------------------------------------------
// Escopo por cliente
// ---------------------------------------------------------------------------

/**
 * A equipe de UM cliente.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UMA FUNÇÃO E NÃO UM `filter` NA TELA                   │
 * │                                                                      │
 * │ Parece uma linha, e é onde o erro mais caro do projeto acontece: uma   │
 * │ pessoa de um cliente aparecendo na cozinha de outro. O filtro escrito  │
 * │ na tela é o que some quando alguém monta um relatório, uma planilha ou │
 * │ uma busca — e aí o nome de uma pessoa real aparece no documento de     │
 * │ outro cliente.                                                         │
 * │                                                                      │
 * │ Aqui é uma função só, usada por todos os caminhos, e a bancada a       │
 * │ exercita com duas equipes que compartilham nomes. Ver [[project_erika_]]│
 * │ — o projeto já teve um defeito desta família.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function pessoasDoCliente(
  pessoas: readonly Pessoa[],
  clienteId: string
): readonly Pessoa[] {
  return pessoas.filter((p) => p.clienteId === clienteId);
}

/** As que trabalham hoje. Quem saiu fica no registro, mas não na escala. */
export function pessoasAtivas(pessoas: readonly Pessoa[]): readonly Pessoa[] {
  return pessoas.filter((p) => p.situacao === "ATIVA");
}

/**
 * A equipe de um cliente, na ordem em que a tela mostra.
 *
 * Ordem: função (por `ORDEM_FUNCAO`), e dentro dela o nome no alfabeto pt-BR.
 * Quem saiu vai para o FIM, em bloco, seja qual for a função — ela não está
 * mais na escala, e intercalá-la entre os ativos faria a lista de quem
 * trabalha hoje parecer maior do que é.
 */
export function ordenarEquipe(pessoas: readonly Pessoa[]): readonly Pessoa[] {
  const pesoDaFuncao = new Map(ORDEM_FUNCAO.map((f, i) => [f, i]));

  return [...pessoas].sort((a, b) => {
    if (a.situacao !== b.situacao) return a.situacao === "ATIVA" ? -1 : 1;

    const fa = pesoDaFuncao.get(a.funcao) ?? ORDEM_FUNCAO.length;
    const fb = pesoDaFuncao.get(b.funcao) ?? ORDEM_FUNCAO.length;
    if (fa !== fb) return fa - fb;

    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

// ---------------------------------------------------------------------------
// Casar nome escrito com pessoa cadastrada
// ---------------------------------------------------------------------------

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A TOLERÂNCIA DO CASAMENTO, E POR QUE ELA É PEQUENA                    │
 * │                                                                      │
 * │ O responsável gravado nos processos e nas ações é TEXTO. Aqui ele é    │
 * │ comparado com os nomes cadastrados, e a comparação tem de ser          │
 * │ conservadora: dizer que "Juliana" é "Juliana (auxiliar de cozinha)" é   │
 * │ certo; dizer que "Cozinha" é "Juliana" seria inventar.                 │
 * │                                                                      │
 * │ Então o que se normaliza é só o que não muda o nome: caixa, acento,    │
 * │ espaço a mais, e o parêntese que qualifica sem nomear.                │
 * │                                                                      │
 * │   "  JULIANA (auxiliar de cozinha) " → "juliana"                       │
 * │                                                                      │
 * │ A partir daí a comparação é de igualdade — nada de "parecido com".     │
 * │ Um casamento aproximado acertaria sete vezes e erraria uma, e a que    │
 * │ erra é a que aparece no relatório do cliente errado.                   │
 * │                                                                      │
 * │ O que se PERDE com essa escolha, dito com clareza: "Juliana" não       │
 * │ casa com "Juliana Souza", e "Cozinha" não casa com ninguém. Os dois    │
 * │ aparecem na lista de NÃO CASADOS — que é o comportamento desejado. Um   │
 * │ não-casado é uma pergunta ("quem é esta pessoa?"), e a resposta dela    │
 * │ melhora o cadastro. Um casamento errado é uma afirmação falsa.          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function normalizarNome(nome: string): string {
  const semQualificador = nome.replace(/\([^)]*\)/g, " ");

  return semQualificador
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export type Casamento = {
  /** O nome como está escrito no registro de origem. */
  escrito: string;
  /** A pessoa cadastrada, ou `null` quando o nome não corresponde a ninguém. */
  pessoa: Pessoa | null;
};

/**
 * Casa uma lista de nomes escritos com as pessoas de um cliente.
 *
 * Devolve TODOS os nomes, casados ou não, na ordem em que chegaram. Um nome
 * não casado não é descartado: é a informação. A tela mostra a lista inteira
 * e marca os que não correspondem, para que ela veja de uma vez o que está
 * fora do cadastro em vez de descobrir aos poucos.
 *
 * `pessoas` deve vir já do cliente certo — é `pessoasDoCliente` que garante
 * isso. Passar a lista inteira faria um nome casar com a pessoa de outro
 * cliente que por acaso tem o mesmo nome.
 */
export function casarPessoas(
  nomesEscritos: readonly string[],
  pessoas: readonly Pessoa[]
): readonly Casamento[] {
  const porNome = new Map<string, Pessoa>();
  for (const pessoa of pessoas) {
    const chave = normalizarNome(pessoa.nome);
    // O primeiro vence: duas pessoas do mesmo cliente com o mesmo nome é
    // ambiguidade, e escolher a última faria o resultado depender da ordem
    // do array. A duplicidade aparece na conferência de nomes repetidos.
    if (!porNome.has(chave)) porNome.set(chave, pessoa);
  }

  return nomesEscritos.map((escrito) => ({
    escrito,
    pessoa: porNome.get(normalizarNome(escrito)) ?? null,
  }));
}

/** Os nomes que não correspondem a pessoa nenhuma. A pendência, em lista. */
export function nomesSemCadastro(casamentos: readonly Casamento[]): readonly string[] {
  return casamentos.filter((c) => c.pessoa === null).map((c) => c.escrito);
}

/** Duas pessoas do mesmo cliente com o mesmo nome — o que confunde o casamento. */
export function nomesRepetidos(pessoas: readonly Pessoa[]): readonly string[] {
  const contagem = new Map<string, number>();
  for (const pessoa of pessoas) {
    const chave = normalizarNome(pessoa.nome);
    contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
  }

  return [...contagem.entries()]
    .filter(([, n]) => n > 1)
    .map(([nome]) => nome)
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

// ---------------------------------------------------------------------------
// Treinamento conferido
// ---------------------------------------------------------------------------

/**
 * A chave do par (pessoa, preparo). Normalizada, para o par valer de verdade.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA FUNÇÃO É EXPORTADA, E NÃO REPETIDA ONDE É PRECISO        │
 * │                                                                      │
 * │ Ela responde "este par é o mesmo par?" em dois lugares, e os dois     │
 * │ precisam responder IGUAL:                                             │
 * │                                                                      │
 * │   · aqui, na CONFERÊNCIA — "a costela tem registro de treinamento?"   │
 * │   · no store, no CADASTRO — "já existe este par? não registre duas    │
 * │     vezes".                                                           │
 * │                                                                      │
 * │ Duas implementações que deveriam concordar não concordam. A do store  │
 * │ normalizava com `trim().toLowerCase()`, e a daqui com               │
 * │ `normalizarNome` — que também tira acento e colapsa espaço no meio.   │
 * │                                                                      │
 * │ O defeito que a diferença produzia, e que era SILENCIOSO:             │
 * │                                                                      │
 * │   A pessoa registra "Costela ao molho". Depois alguém cola           │
 * │   "costela  ao molho", com dois espaços — vindo de uma ficha, que é   │
 * │   onde o texto costuma vir sujo. O store compara as strings cruas, os │
 * │   dois NÃO batem, e ele aceita como um segundo treinamento. Já a      │
 * │   conferência usa `normalizarNome`, vê os dois como o MESMO par, e    │
 * │   passa a exibir DOIS registros do mesmo fato — dos quais um nunca     │
 * │   casa com nada e fica invisível na tela.                             │
 * │                                                                      │
 * │ O mesmo vale para acento: "Escondidinho à moda" e "Escondidinho a     │
 * │ moda" são o mesmo preparo aqui e eram dois no store.                  │
 * │                                                                      │
 * │ Então a função é uma só, e o store importa ELA. Uma regra de          │
 * │ identidade que existe em dois lugares é uma regra que vai divergir —  │
 * │ a questão é só quando.                                                │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function chaveDoTreinamento(pessoaId: string, preparo: string): string {
  return `${pessoaId}::${normalizarNome(preparo)}`;
}

/**
 * Quem executa o quê, e quem foi treinado para isso.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A PERGUNTA QUE NINGUÉM CONSEGUE RESPONDER HOJE                        │
 * │                                                                      │
 * │ "Quem executa o que não sabe fazer?"                                   │
 * │                                                                      │
 * │ É a pergunta que a consultoria existe para responder, e ela é         │
 * │ respondível agora porque os dois lados estão no mesmo formato: a       │
 * │ pessoa declara o que executa (`Pessoa.pratos`) e o treinamento é um    │
 * │ par (pessoa, preparo). O que falta é o par.                            │
 * │                                                                      │
 * │ `semTreinamento` é o que sobra dessa subtração, e é a lista que a tela │
 * │ mostra primeiro — o resto é consulta, isto é pendência.                │
 * │                                                                      │
 * │ ── UMA DECISÃO EXPLÍCITA, E A ALTERNATIVA QUE ELA RECUSA ──────────  │
 * │                                                                      │
 * │ Isto NÃO afirma que a pessoa não sabe fazer o prato: afirma que não    │
 * │ há registro de treinamento. A diferença importa e está no rótulo,      │
 * │ porque uma consultora pode ter treinado alguém pessoalmente e nunca    │
 * │ ter anotado — e nesse caso o que falta é o REGISTRO, não o             │
 * │ treinamento. Chamar isso de "não sabe" faria o sistema acusar uma      │
 * │ pessoa com base numa ausência de dado, que é o tipo de afirmação que   │
 * │ este projeto não faz.                                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type CoberturaDeTreinamento = {
  pessoa: Pessoa;
  /** O que ela executa e TEM registro de treinamento, em ordem alfabética. */
  treinados: readonly string[];
  /** O que ela executa e NÃO tem registro. Vazio é o caso bom. */
  semTreinamento: readonly string[];
};

export function coberturaDeTreinamento(
  pessoas: readonly Pessoa[],
  treinamentos: readonly Treinamento[]
): readonly CoberturaDeTreinamento[] {
  const registrados = new Set(treinamentos.map((t) => chaveDoTreinamento(t.pessoaId, t.preparo)));

  return pessoas.map((pessoa) => {
    /*
      ── DEDUPLICAR PELA CHAVE, E NÃO PELA STRING ──────────────────────────
      Aqui era `[...new Set(pessoa.pratos)]` — a string crua — enquanto todo o
      resto do cálculo usa `chaveDoTreinamento`. As duas discordavam, e a
      discordância era visível na tela:

        `pratos: ["Costela ao molho", "costela ao molho"]`

      São o MESMO par para a chave de treinamento e eram DUAS linhas para o
      `Set`. Com um registro de treinamento, as duas linhas casavam — e a
      costela aparecia duas vezes na coluna dos treinados. A pessoa parecia
      executar dois preparos onde executa um, e `pratosSemTreinamento` contava
      dois.

      O preparo escrito duas vezes acontece de verdade: a lista é digitada à
      mão, e ninguém redigita igual. A chave é a identidade que o módulo já
      escolheu para "o mesmo preparo"; usá-la aqui é usar a mesma regra, e não
      uma segunda.

      A primeira grafia escrita vence, como em `foraDoCadastro` — assim o
      texto exibido não depende da ordem do array.
    */
    const unicos = [
      ...pessoa.pratos
        .reduce((porChave, preparo) => {
          const chave = chaveDoTreinamento(pessoa.id, preparo);
          if (!porChave.has(chave)) porChave.set(chave, preparo);
          return porChave;
        }, new Map<string, string>())
        .values(),
    ];

    return {
      pessoa,
      treinados: unicos
        .filter((p) => registrados.has(chaveDoTreinamento(pessoa.id, p)))
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
      semTreinamento: unicos
        .filter((p) => !registrados.has(chaveDoTreinamento(pessoa.id, p)))
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    };
  });
}

// ---------------------------------------------------------------------------
// Onde o módulo encosta no resto do sistema
// ---------------------------------------------------------------------------

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O RESPONSÁVEL DO PROCESSO, LIDO COMO ELE ESTÁ                         │
 * │                                                                      │
 * │ O texto gravado nos processos é o que é: `"Cozinha"`, `"A definir com  │
 * │ o Marcelo"`, `"Juliana (auxiliar de cozinha)"`. Este módulo NÃO         │
 * │ reescreve isso. Ele lê.                                                │
 * │                                                                      │
 * │ A tentação seria converter na leitura — gravar o nome da pessoa no     │
 * │ lugar do texto. Seria apagar o que ela escreveu: "A definir com o      │
 * │ Marcelo" não é o nome de ninguém, e é uma informação sobre o estágio   │
 * │ do trabalho. Convertido, viraria "sem responsável" — que diz outra     │
 * │ coisa, e esconde que existe uma pessoa cuidando disso.                 │
 * │                                                                      │
 * │ Então a leitura devolve os dois: o TEXTO original, para não perder     │
 * │ nada, e a PESSOA, quando o texto corresponde a alguém do cadastro.     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type ResponsavelLido = {
  /** Onde o nome foi lido: "processo: Recebimento" ou "passo 2 de 3". */
  onde: string;
  escrito: string;
  pessoa: Pessoa | null;
};

/**
 * Lê os responsáveis de um processo — o cabeçalho e cada passo — e casa com a
 * equipe do cliente do processo.
 *
 * Um passo com `responsavel` vazio é pulado: passo sem responsável é o que a
 * pendência do processo já acusa, e devolver um casamento de string vazia
 * criaria uma linha "sem cadastro" para um campo que está simplesmente em
 * branco. Vazio e desconhecido são coisas diferentes.
 */
export function responsaveisDoProcesso(
  processo: Processo,
  equipeDoCliente: readonly Pessoa[]
): readonly ResponsavelLido[] {
  const lidos: ResponsavelLido[] = [];
  const cabecalho = processo.responsavel.trim();

  if (cabecalho !== "") {
    lidos.push({
      onde: `Processo · ${processo.praca}`,
      escrito: cabecalho,
      pessoa: casarPessoas([cabecalho], equipeDoCliente)[0]?.pessoa ?? null,
    });
  }

  processo.passos.forEach((passo: PassoProcesso, indice) => {
    const escrito = passo.responsavel.trim();
    if (escrito === "") return;

    lidos.push({
      onde: `Passo ${indice + 1} de ${processo.passos.length} · ${passo.descricao}`,
      escrito,
      pessoa: casarPessoas([escrito], equipeDoCliente)[0]?.pessoa ?? null,
    });
  });

  return lidos;
}

/**
 * Os responsáveis de VÁRIOS processos, juntos — a leitura que a tela de
 * equipe faz para mostrar quantos preparos cada pessoa aparece executando.
 */
export function responsaveisDosProcessos(
  processos: readonly Processo[],
  pessoaPorId: ReadonlyMap<string, Pessoa>
): readonly ResponsavelLido[] {
  /*
    ── O ÍNDICE É POR CLIENTE, E NÃO UM FILTRO A CADA PROCESSO ────────────
    A versão anterior montava `[...pessoaPorId.values()].filter(...)` DENTRO
    do `flatMap` — ou seja, uma varredura da carteira inteira de pessoas por
    processo. Com quatro processos não se nota; com duzentos processos e
    oitenta pessoas são dezesseis mil passos para responder uma pergunta que
    o índice responde em uma leitura por processo.

    O agrupamento acontece UMA vez, aqui dentro, e não na tela: assim
    qualquer chamador ganha o mesmo custo, e não existe a versão rápida e a
    versão lenta desta função dependendo de quem chama.
  */
  const porCliente = new Map<string, Pessoa[]>();
  for (const pessoa of pessoaPorId.values()) {
    const atual = porCliente.get(pessoa.clienteId);
    if (atual) atual.push(pessoa);
    else porCliente.set(pessoa.clienteId, [pessoa]);
  }

  return processos.flatMap((processo) =>
    responsaveisDoProcesso(processo, porCliente.get(processo.clienteId) ?? [])
  );
}

// ---------------------------------------------------------------------------
// Resumo
// ---------------------------------------------------------------------------

export type ResumoDaEquipe = {
  total: number;
  ativas: number;
  /** Pessoas por função — só as funções que têm gente. */
  porFuncao: ReadonlyArray<{ funcao: FuncaoNaCozinha; rotulo: string; quantas: number }>;
  /** Pares (pessoa, preparo) executados sem registro de treinamento. */
  pratosSemTreinamento: number;
  /** Pessoas que executam ao menos um preparo sem registro. */
  pessoasComPendencia: number;
  /** Quantas executam algum preparo — o denominador da cobertura. */
  pessoasQueExecutam: number;
  executandoSemTreinamento: readonly CoberturaDeTreinamento[];
  /** Nomes escritos nos processos que não são ninguém do cadastro. */
  foraDoCadastro: readonly string[];
  nomesRepetidos: readonly string[];
};

/**
 * O resumo da equipe — contagens conferíveis, e nada além.
 *
 * Não há indicador aqui, e a ausência é decisão: "cobertura de treinamento em
 * %" seria fácil de calcular e fácil de ler errado. Cem por cento de cobertura
 * numa cozinha onde ninguém executa nada é um número perfeito e vazio. O que a
 * tela mostra são contagens — quantas pessoas, quantos preparos sem registro —
 * e cada uma responde uma pergunta que ela fez.
 */
export function resumirEquipe(
  pessoas: readonly Pessoa[],
  treinamentos: readonly Treinamento[],
  lidos: readonly ResponsavelLido[]
): ResumoDaEquipe {
  const ordenadas = ordenarEquipe(pessoas);
  const cobertura = coberturaDeTreinamento(ordenadas, treinamentos);

  const porFuncao = ORDEM_FUNCAO.map((funcao) => ({
    funcao,
    rotulo: ROTULO_FUNCAO[funcao],
    quantas: ordenadas.filter((p) => p.funcao === funcao).length,
  })).filter((f) => f.quantas > 0);

  const executandoSemTreinamento = cobertura.filter(
    (c) => c.pessoa.situacao === "ATIVA" && c.semTreinamento.length > 0
  );

  return {
    total: ordenadas.length,
    ativas: ordenadas.filter((p) => p.situacao === "ATIVA").length,
    porFuncao,
    pratosSemTreinamento: executandoSemTreinamento.reduce(
      (soma, c) => soma + c.semTreinamento.length,
      0
    ),
    pessoasComPendencia: executandoSemTreinamento.length,
    pessoasQueExecutam: cobertura.filter((c) => c.pessoa.pratos.length > 0).length,
    executandoSemTreinamento,
    /*
      ── OS NOMES FORA DO CADASTRO: DEDUPLICADOS PELA CHAVE DO CASAMENTO ────
      A deduplicação é pelo TEXTO NORMALIZADO, e não pela string crua. A
      diferença é o defeito que ela evita: `"Cozinha"` e `"cozinha "` são o
      mesmo nome para `normalizarNome` — é por isso que os dois casam com a
      mesma pessoa — mas `new Set` sobre a string crua os manteria como duas
      linhas. A lista de pendências apareceria com duas entradas para a mesma
      pergunta, e a contagem de "quantos nomes fora do cadastro" ficaria
      maior do que a pendência real.

      O PRIMEIRO ESCRITO VENCE, e é o que a tela mostra. Escolher o último
      faria a grafia exibida depender da ordem em que os processos vêm do
      repositório — e duas execuções da mesma leitura mostrariam textos
      diferentes para a mesma pendência.

      `lidos` já é escopado por processo, e o processo é de um cliente.
    */
    foraDoCadastro: [
      ...lidos
        .filter((l) => l.pessoa === null)
        .reduce((porChave, l) => {
          const chave = normalizarNome(l.escrito);
          if (!porChave.has(chave)) porChave.set(chave, l.escrito);
          return porChave;
        }, new Map<string, string>())
        .values(),
    ].sort((a, b) => a.localeCompare(b, "pt-BR")),
    nomesRepetidos: nomesRepetidos(ordenadas),
  };
}
