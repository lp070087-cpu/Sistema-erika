/**
 * A PROCEDÊNCIA DE UMA PLANILHA GERADA — a decisão 3, em tipo e função pura.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O PROBLEMA, EM UMA FRASE                                             │
 * │                                                                      │
 * │ "Uma planilha já gerada deve representar o estado daquele momento."   │
 * │                                                                      │
 * │ A planilha de custos do Empório foi gerada em março, com a batata a    │
 * │ R$ 10/kg. Em setembro a batata está a R$ 13. O arquivo de março não    │
 * │ mudou — ele nunca muda, ele é um arquivo. O que muda é que ele passou  │
 * │ a MENTIR por omissão: quem o abre hoje lê um custo que não é mais o   │
 * │ custo, sem nada no arquivo dizendo de quando ele é.                   │
 * │                                                                      │
 * │ As três coisas que o sistema NÃO pode fazer, ditas pelo briefing:     │
 * │                                                                      │
 * │   · não recalcular a planilha histórica em silêncio;                  │
 * │   · não esconder a planilha;                                         │
 * │   · não apagar a planilha.                                           │
 * │                                                                      │
 * │ O que sobra é AVISAR. Este arquivo é o aviso, e ele é puro de         │
 * │ propósito: compara dois retratos de preço e diz o que mudou entre      │
 * │ eles. Não escreve, não corrige, não decide.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É ARQUITETURA, E NÃO PERSISTÊNCIA                       │
 * │                                                                      │
 * │ O Neon não está conectado, e o briefing é explícito: "não invente      │
 * │ persistência agora. Prepare a arquitetura."                          │
 * │                                                                      │
 * │ Então não há tabela, não há `Set` de módulo, não há nada guardado. O   │
 * │ que existe é a REPRESENTAÇÃO — `RetratoDePrecos` — e a COMPARAÇÃO,    │
 * │ que é função pura e por isso já funciona hoje, com o retrato que o     │
 * │ chamador tiver em mãos.                                              │
 * │                                                                      │
 * │ Quando o banco entrar, `RegistroPlanilha` ganha uma coluna com este    │
 * │ formato, e nenhuma tela muda de forma: elas já perguntam              │
 * │ `conferirPrecos(...)` em vez de olhar o banco. É a mesma separação de  │
 * │ `demonstracao.ts`, e pela mesma razão.                               │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A QUEM ESTE AVISO SERVE HOJE — E ISSO FOI VERIFICADO, NÃO SUPOSTO    │
 * │                                                                      │
 * │ O aviso tem dois destinatários possíveis, e só um deles é alcançável   │
 * │ nesta rodada:                                                        │
 * │                                                                      │
 * │   · O HISTÓRICO da Central — inalcançável. `listarPlanilhasGeradas()` │
 * │     devolve `[]` literal, e a rota de geração não grava nada. Não há  │
 * │     registro guardado, então não há onde pendurar a procedência.      │
 * │                                                                      │
 * │   · A SESSÃO ABERTA — alcançável, e é aqui que ele trabalha agora.    │
 * │     A planilha em cima da mesa foi montada a partir dos dados de       │
 * │     AGORA; se ela mexer no preço de um insumo noutra aba do sistema e  │
 * │     voltar, a grade na tela passou a mostrar um custo que não é mais o │
 * │     custo do cadastro. É exatamente a mesma mentira do arquivo de      │
 * │     março, em escala de minutos em vez de meses.                      │
 * │                                                                      │
 * │ Por isso o consumidor é `ambiente.tsx`, e não `historico.tsx`. O       │
 * │ histórico continua intocado — mexer nele seria código que não roda.   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O LIMITE DESTE RETRATO, DITO ANTES QUE ALGUÉM O DESCUBRA SOZINHO     │
 * │                                                                      │
 * │ Ele compara os preços que ENTRARAM NA PLANILHA — pelo id do insumo. O  │
 * │ que ele NÃO sabe é a composição de cada ficha: o retrato guarda o      │
 * │ preço do insumo, não a lista de insumos de cada prato.                │
 * │                                                                      │
 * │ A consequência é assimétrica, e é a escolha mais conservadora:        │
 * │                                                                      │
 * │   · O preço de um insumo que a ficha usa mudou → DETECTADO. É o caso  │
 * │     que o briefing descreve, e é o que faz o custo do prato sair       │
 * │     diferente do que está na grade.                                   │
 * │                                                                      │
 * │   · Um insumo NOVO foi cadastrado → NÃO é reportado. Ele não está no   │
 * │     retrato, então não há como saber se alguma ficha do cliente o usa. │
 * │     A planilha continua correta sobre o que ela contém, e quem manda   │
 * │     é ela: regerar é um clique.                                       │
 * │                                                                      │
 * │   · Um insumo foi ARQUIVADO → NÃO é reportado, e isto é uma regra de  │
 * │     negócio, não um esquecimento. Arquivar existe justamente para      │
 * │     tirar um insumo de circulação sem mexer no passado. Quem chama     │
 * │     esta função precisa passar a biblioteca COMPLETA — ver a nota em   │
 * │     `conferirPrecos`.                                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A REMOÇÃO DE UM INSUMO CONTA COMO DIVERGÊNCIA                │
 * │                                                                      │
 * │ Porque ela muda o SIGNIFICADO do número que está no arquivo. Uma      │
 * │ planilha de custos trazia "Batata — R$ 10,00" e uma linha de total.   │
 * │ Se o cadastro da batata não existe mais, aquele R$ 10,00 perdeu a      │
 * │ procedência: ninguém consegue dizer a que se referia. O arquivo não    │
 * │ ficou mais barato nem mais caro — ele ficou sem explicação.           │
 * │                                                                      │
 * │ É a mesma preocupação que a decisão 1 protege do outro lado: "não      │
 * │ deixar uma ficha silenciosamente sem custo". Aqui é uma planilha       │
 * │ silenciosamente sem procedência.                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** Um insumo, no dia em que a planilha foi gerada. */
export type PrecoNoRetrato = {
  ingredienteId: string;
  /** O nome NAQUELE dia — renomear depois não reescreve este retrato. */
  nome: string;
  /** `null` é ausência de preço, nunca zero. */
  preco: number | null;
};

/**
 * OS PREÇOS COMO ELES ESTAVAM — o retrato.
 *
 * Um array e não um `Record`, para que a ORDEM em que a lista aparece no aviso
 * seja a ordem do cadastro, que é a ordem que ela reconhece. Um objeto não
 * promete ordem nenhuma, e o aviso sairia embaralhado a cada leitura.
 */
export type RetratoDePrecos = readonly PrecoNoRetrato[];

/** Uma diferença entre o retrato e a biblioteca de hoje. */
export type DadoAlterado = {
  ingredienteId: string;
  nome: string;
  tipo: "preco" | "removido";
  precoNaGeracao: number | null;
  precoAgora: number | null;
};

export type DivergenciaDaPlanilha = {
  /** `true` quando há ao menos um dado alterado. É o que acende o aviso. */
  haDivergencia: boolean;
  /** Os insumos que mudaram, na ordem do retrato. */
  alterados: readonly DadoAlterado[];
  /**
   * A frase pronta para a tela, ou `null` quando não há o que avisar.
   *
   * Ela mora aqui, e não no componente, porque é a mesma frase para o aviso
   * do histórico e para o do rodapé da grade — e duas cópias da mesma frase
   * divergem no dia em que uma for corrigida.
   */
  resumo: string | null;
};

/**
 * ESTE MODELO TEM PREÇO DENTRO?
 *
 * Os dois modelos que leem custo de ficha — e por isso os dois únicos em que
 * uma mudança de preço faz o arquivo envelhecer. O relatório de consultoria e
 * a planilha em branco não têm número de dinheiro nenhum; avisá-los sobre
 * preço seria falar de algo que o arquivo deles nunca mostrou.
 *
 * A lista é explícita, e não `exige.includes("ingredientes")`: `exige` diz de
 * que FONTE o modelo precisa, e um modelo futuro pode listar ingredientes sem
 * que nenhum preço entre no arquivo. O que esta função responde é a pergunta
 * mais estreita — "há preço dentro?".
 */
export function dependeDePrecos(modeloId: string): boolean {
  return modeloId === "ficha-tecnica" || modeloId === "custos-precificacao";
}

/**
 * O RETRATO, TIRADO DOS INSUMOS QUE ENTRARAM NA PLANILHA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A FONTE É `ingredientesDoCliente`, E NÃO `ingredientes`              │
 * │                                                                      │
 * │ São duas listas que parecem a mesma coisa, e a diferença decide se o   │
 * │ aviso está certo ou errado:                                          │
 * │                                                                      │
 * │   · `ingredientes` é a BIBLIOTECA — preço de referência, igual para    │
 * │     todo mundo;                                                       │
 * │   · `ingredientesDoCliente` é a mesma biblioteca com o preço DESTE     │
 * │     cliente já resolvido — o dele quando existe, o de referência       │
 * │     quando não. É `LinhaIngredienteDoCliente`.                        │
 * │                                                                      │
 * │ E é a SEGUNDA que o gerador lê para escrever a coluna de custo.        │
 * │ Retratar a primeira compararia um número que nunca esteve na grade —  │
 * │ e o aviso diria "o preço mudou" no dia em que ela mexesse no preço     │
 * │ do cliente, mesmo sem a planilha ter mudado um centavo.               │
 * │                                                                      │
 * │ A REGRA QUE FICA: o retrato tem de sair DA MESMA LISTA que o gerador   │
 * │ leu. Qualquer outra coisa é comparar o preço de uma planilha com o     │
 * │ preço de outra.                                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Ele COPIA, não referencia: o que volta aqui é o valor de hoje, imune ao que
 * acontecer depois com o cadastro. Guardar o objeto da linha faria o retrato
 * mudar junto — que é exatamente o defeito que ele existe para detectar.
 */
export function capturarPrecos(
  ingredientes: readonly { id: string; nome: string; precoAtual: number | null }[]
): RetratoDePrecos {
  return ingredientes.map((i) => ({
    ingredienteId: i.id,
    nome: i.nome,
    preco: i.precoAtual,
  }));
}

/**
 * A PROJEÇÃO ÚNICA — da linha do cliente para o par (id, nome, preço).
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O `id` DA LINHA NÃO É O ID DO INSUMO — E ISSO QUASE PASSOU           │
 * │                                                                      │
 * │ `LinhaIngredienteDoCliente.id` é COMPOSTO: `"${clienteId}_${in.id}"`.  │
 * │ Conferido em `mock/repositorio-operacao-mock.ts:391`, onde a linha é   │
 * │ montada. O id do insumo de verdade mora em `.ingrediente.id`.          │
 * │                                                                      │
 * │ Usar `linha.id` como chave do retrato funcionaria por acidente hoje —  │
 * │ porque os dois lados da comparação leriam o mesmo id composto, do      │
 * │ mesmo cliente. E quebraria em silêncio no dia em que alguém comparasse │
 * │ um retrato com outra origem: nenhum id casaria, e o aviso listaria     │
 * │ TODOS os insumos como "saiu do cadastro". Um alarme falso em cada      │
 * │ insumo é pior do que não ter alarme: ensina a ignorá-lo.              │
 * │                                                                      │
 * │ Então o id guardado é o do INSUMO — que é o único que significa a      │
 * │ mesma coisa em qualquer contexto. O prefixo do cliente já está dito    │
 * │ fora do retrato, no contexto de que ele veio.                         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * As duas pontas da comparação passam por AQUI. É o que garante que o retrato
 * e a lista de hoje não possam discordar sobre qual campo é qual — se um dos
 * lados lesse `.id` e o outro `.ingrediente.id`, a comparação compararia duas
 * coisas diferentes e o resultado seria ruído.
 */
export function precosDoContexto(contexto: ContextoParaRetrato): {
  id: string;
  nome: string;
  precoAtual: number | null;
}[] {
  return (contexto.ingredientesDoCliente ?? []).map((linha) => ({
    id: linha.ingrediente.id,
    nome: linha.ingrediente.nome,
    precoAtual: linha.precoAtual,
  }));
}

/**
 * OS INSUMOS QUE ESTA PLANILHA MOSTRA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO É A BIBLIOTECA INTEIRA                                   │
 * │                                                                      │
 * │ A tentação é retratar tudo: é mais simples, e é o mesmo conjunto nos   │
 * │ dois lados da comparação. O problema aparece no dia a dia:            │
 * │                                                                      │
 * │ A biblioteca do cliente tem quarenta insumos. As fichas dele usam      │
 * │ nove. Ela corrige o preço de uma farinha que nenhuma ficha usa — e    │
 * │ recebe o aviso de que a planilha envelheceu. Não envelheceu: a         │
 * │ planilha nunca mostrou aquela farinha.                                │
 * │                                                                      │
 * │ Um aviso que aparece quando nada aconteceu é pior do que não ter       │
 * │ aviso, porque ensina a ignorá-lo — e aí o dia em que ele estiver       │
 * │ certo, ele passa batido junto. É o mesmo raciocínio que already        │
 * │ recusou reportar insumo recém-cadastrado.                             │
 * │                                                                      │
 * │ Então o retrato é o conjunto EXATO: os insumos que as fichas DESTE      │
 * │ cliente referenciam. É por eles que a planilha de ficha e a de custos   │
 * │ são escritas, e é sobre eles que um aviso tem o direito de falar.      │
 * │                                                                      │
 * │ ── E O QUE ACONTECE SE A FICHA MUDAR DEPOIS ──────────────────────── │
 * │                                                                      │
 * │ Nada aqui. Um insumo NOVO numa ficha é uma ficha diferente, não um      │
 * │ dado de origem alterado — e é o caso que o topo deste arquivo já        │
 * │ declara fora de escopo. O aviso é sobre PREÇO, e continua sendo.        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function insumosDaPlanilha(contexto: ContextoParaRetrato): {
  id: string;
  nome: string;
  precoAtual: number | null;
}[] {
  const porId = new Map(precosDoContexto(contexto).map((i) => [i.id, i]));

  /*
    O RECORTE É POR CLIENTE, e o filtro está escrito aqui porque `fichas`
    chega completa — de todos os clientes —, como todo o resto do contexto.
    Sem ele, a planilha do Empório passaria a ser conferida também contra os
    insumos usados pelas fichas de outro cliente.

    O `Set` de ids resolve o insumo repetido: a mesma batata em três fichas é
    um insumo a conferir e não três, e sem o conjunto o aviso contaria três
    ocorrências do mesmo nome.
  */
  const ids = new Set<string>();
  for (const ficha of contexto.fichas ?? []) {
    if (ficha.clienteId !== contexto.cliente?.id) continue;
    for (const item of ficha.itens) ids.add(item.ingredienteId);
  }

  /*
    OS DOIS CONJUNTOS SE CRUZAM, e é o cruzamento que evita uma linha órfã:
    uma ficha pode referenciar um insumo que não está mais na biblioteca do
    cliente. Sem o `filter`, o mapa devolveria `undefined` e o retrato
    quebraria ao ler `.nome`.
  */
  return [...ids].map((id) => porId.get(id)).filter((i) => i !== undefined);
}

/**
 * O RETRATO DO CONTEXTO — o atalho, para quem já tem o contexto em mãos.
 *
 * `montarContexto` é quem o ambiente já chamou para montar a grade. Passar o
 * contexto inteiro evita que cada chamador escolha a lista errada: a escolha
 * está escrita aqui, uma vez, e a tradução da linha é a mesma dos dois lados.
 */
export function retratoDoContexto(contexto: ContextoParaRetrato): RetratoDePrecos {
  return capturarPrecos(insumosDaPlanilha(contexto));
}

/**
 * O QUE A SESSÃO MUDOU NUM INSUMO — três casos, e só três.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UMA UNIÃO, E NÃO `preco: number | null`                     │
 * │                                                                      │
 * │ `null` já significa "não há preço" neste domínio inteiro — é o valor   │
 * │ de um insumo sem preço cadastrado, e é assim que ele entra na grade    │
 * │ (célula vazia). Usá-lo também para dizer "o cadastro foi excluído"      │
 * │ faria as duas coisas virarem a mesma, e a exclusão de um insumo         │
 * │ apareceria como "o preço ficou vazio".                                  │
 * │                                                                      │
 * │ Com a união, o compilador obriga quem lê a tratar os três casos — e     │
 * │ "esqueci de tratar o removido" deixa de ser possível.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type AlteracaoDaSessao =
  /** O preço foi corrigido nesta sessão, na biblioteca ou no preço do cliente. */
  | { tipo: "preco"; nome: string; precoAtual: number | null }
  /** O cadastro foi excluído nesta sessão. */
  | { tipo: "excluido" };

/**
 * OS PREÇOS DE HOJE, COM O QUE ACONTECEU NESTA SESSÃO POR CIMA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A SOBREPOSIÇÃO VEM DE FORA, E NÃO DAQUI                     │
 * │                                                                      │
 * │ Este arquivo é PURO — e ler o store de demonstração seria I/O: ele     │
 * │ mudaria entre duas chamadas com as mesmas entradas, e nenhuma bancada  │
 * │ conseguiria provar coisa nenhuma sobre ele.                           │
 * │                                                                      │
 * │ Então quem lê o store monta o mapa e o entrega pronto. A separação é   │
 * │ a mesma de `contexto.ts`: quem sabe onde o dado mora é quem busca;     │
 * │ quem decide o que ele significa é a função pura.                      │
 * │                                                                      │
 * │ ── O QUE NÃO ESTÁ NO MAPA FICA COMO ESTÁ ─────────────────────────── │
 * │                                                                      │
 * │ É o caso comum, e é o que faz este caminho custar uma passada só: quem │
 * │ não foi tocado nesta sessão não é copiado, é atravessado.              │
 * │                                                                      │
 * │ ── ARQUIVADO NÃO ENTRA COMO EXCLUÍDO ─────────────────────────────── │
 * │                                                                      │
 * │ E isso é decisão de negócio, não esquecimento: arquivar existe para    │
 * │ tirar um insumo das listas SEM mexer no passado. Quem monta o mapa     │
 * │ pergunta por `insumoFoiExcluido`, não por `insumoForaDaBiblioteca` —   │
 * │ as duas perguntas parecidas têm respostas diferentes aqui, ver a nota  │
 * │ de `conferirPrecos`.                                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function precosVigentes(
  contexto: ContextoParaRetrato,
  digitado: ReadonlyMap<string, AlteracaoDaSessao>
): { id: string; nome: string; precoAtual: number | null }[] {
  const vigentes = precosDoContexto(contexto);
  if (digitado.size === 0) return vigentes;

  const hoje: { id: string; nome: string; precoAtual: number | null }[] = [];

  for (const insumo of vigentes) {
    const mudou = digitado.get(insumo.id);

    if (mudou === undefined) {
      hoje.push(insumo);
      continue;
    }

    /*
      O EXCLUÍDO SIMPLESMENTE NÃO ENTRA NA LISTA — e é a AUSÊNCIA dele que
      significa "saiu do cadastro" para `conferirPrecos`.

      A alternativa seria marcar com um valor e ensinar `conferirPrecos` a ler
      esse valor. Aí a regra "não está na lista = removido" deixaria de ser
      verdade, e passaria a existir duas formas de dizer a mesma coisa no
      mesmo tipo. Deixando a lista ser a lista, a comparação continua com uma
      regra só.
    */
    if (mudou.tipo === "excluido") continue;

    hoje.push({ id: insumo.id, nome: mudou.nome, precoAtual: mudou.precoAtual });
  }

  return hoje;
}

/**
 * O MÍNIMO QUE ESTE MÓDULO PRECISA SABER DO CONTEXTO.
 *
 * Um tipo estrutural, e não `ContextoPlanilha` importado: este arquivo compara
 * dois retratos, e a única coisa de que precisa é da lista de insumos com
 * preço resolvido e das fichas — para saber quais deles a planilha mostra.
 * Amarrá-lo ao contexto inteiro faria estas funções puras dependerem do
 * formato do contexto de planilha, e no dia em que ele mudasse de forma este
 * arquivo quebraria por um motivo que não é dele.
 */
export type ContextoParaRetrato = {
  cliente?: { id: string };
  ingredientesDoCliente?: readonly {
    ingrediente: { id: string; nome: string };
    precoAtual: number | null;
  }[];
  fichas?: readonly {
    clienteId: string;
    itens: readonly { ingredienteId: string }[];
  }[];
};

/**
 * O QUE MUDOU DESDE A GERAÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A LISTA DE HOJE PRECISA SER A BIBLIOTECA COMPLETA                    │
 * │                                                                      │
 * │ Incluindo os ARQUIVADOS. Este é o ponto onde a decisão 3 encosta na    │
 * │ decisão 2, e errá-lo produziria o pior tipo de aviso: o que aparece    │
 * │ quando nada de errado aconteceu.                                      │
 * │                                                                      │
 * │ Arquivar existe para tirar um insumo das listas SEM mexer no passado.  │
 * │ Se quem chama passar a lista visível, todo insumo arquivado entra como  │
 * │ "removido" — e a consultora que arquivou ontem uma batata que não      │
 * │ compra mais receberia hoje o aviso de que a planilha de março dela     │
 * │ envelheceu. Não envelheceu: ela é que decidiu não comprar mais batata. │
 * │                                                                      │
 * │ Por isso a assinatura fala em `hoje`, e não em `visiveis`.            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ PREÇO AUSENTE NÃO É "NUNCA JULGADO" — E O AVISO NÃO PODE CONFUNDIR   │
 * │                                                                      │
 * │ Veio de `null` para R$ 12? Isso CONTA como divergência, e é o certo:   │
 * │ a grade trazia uma célula vazia onde hoje há um número. Quem olhasse   │
 * │ a planilha antiga concluiria que o insumo não tem custo, e o cadastro  │
 * │ agora diz que tem. O arquivo envelheceu — só que ao contrário do       │
 * │ usual, ficou mais vazio em vez de mais barato.                        │
 * │                                                                      │
 * │ Isso é DIFERENTE do "não julgado" da importação, onde o `null` quer    │
 * │ dizer "esta linha não foi comparada". Aqui os dois retratos são o      │
 * │ mesmo campo da mesma lista, e `null` significa uma coisa só: não há    │
 * │ preço. Os dois usos do `null` não se encontram, porque um vive na      │
 * │ importação e o outro na procedência.                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function conferirPrecos(
  retrato: RetratoDePrecos,
  hoje: readonly { id: string; nome: string; precoAtual: number | null }[]
): DivergenciaDaPlanilha {
  const vazio: DivergenciaDaPlanilha = {
    haDivergencia: false,
    alterados: [],
    resumo: null,
  };

  /*
    SEM RETRATO NÃO HÁ O QUE COMPARAR — e comparar assim mesmo seria pior.

    Um retrato vazio pode significar duas coisas opostas: "não havia insumo
    nenhum naquele dia" ou "este modelo não guarda retrato". No segundo caso,
    tratar todo insumo atual como novidade encheria o aviso de linhas sobre
    insumos que a planilha nunca teve. O silêncio aqui é a resposta honesta:
    não há procedência tomada, então não há o que afirmar sobre ela.
  */
  if (retrato.length === 0) return vazio;

  const porId = new Map(hoje.map((i) => [i.id, i]));
  const alterados: DadoAlterado[] = [];

  for (const antes of retrato) {
    const agora = porId.get(antes.ingredienteId);

    if (agora === undefined) {
      alterados.push({
        ingredienteId: antes.ingredienteId,
        nome: antes.nome,
        tipo: "removido",
        precoNaGeracao: antes.preco,
        precoAgora: null,
      });
      continue;
    }

    /*
      A COMPARAÇÃO É `!==`, E NÃO `>`. Uma QUEDA de preço também envelhece a
      planilha: o arquivo de março passa a mostrar um custo MAIOR do que o de
      hoje, e o aviso é tão necessário quanto no caso da alta. Comparar com
      `>` transformaria o aviso em "ficou mais caro", que é uma informação
      diferente — e a tela diria que está tudo igual num arquivo que não está.
    */
    if (agora.precoAtual !== antes.preco) {
      alterados.push({
        ingredienteId: antes.ingredienteId,
        nome: antes.nome,
        tipo: "preco",
        precoNaGeracao: antes.preco,
        precoAgora: agora.precoAtual,
      });
    }
  }

  if (alterados.length === 0) return vazio;

  return {
    haDivergencia: true,
    alterados,
    resumo: fraseDoAviso(alterados),
  };
}

/**
 * A CONFERÊNCIA INTEIRA, NUMA CHAMADA — É ELA QUE O AMBIENTE USA.
 *
 * Junta as três decisões que não podem ser tomadas em pontos diferentes:
 * de onde sai o preço de hoje (`precosVigentes`), qual é a lista completa
 * (incluindo o que foi excluído, para poder dizer "saiu do cadastro") e como
 * se compara (`conferirPrecos`).
 *
 * O ambiente passa o retrato que guardou e o contexto de agora; o mapa é o que
 * ele leu do store. Se esta montagem morasse no componente, cada tela que
 * quisesse avisar sobre preço teria de lembrar das três — e a segunda a
 * esquecer a terceira mostraria um aviso diferente para o mesmo fato.
 */
export function conferirPlanilha(
  retrato: RetratoDePrecos,
  contextoDeHoje: ContextoParaRetrato,
  digitado: ReadonlyMap<string, AlteracaoDaSessao>
): DivergenciaDaPlanilha {
  return conferirPrecos(retrato, precosVigentes(contextoDeHoje, digitado));
}

/**
 * A FRASE — montada das partes, e nunca escrita à mão para cada caso.
 *
 * São duas categorias que podem ocorrer juntas, e uma frase fixa daria
 * "1 dado mudou" para casos que ela precisa distinguir: um preço que subiu é
 * uma coisa que ela confere; um insumo que deixou de existir é outra, e pede
 * uma ação diferente.
 */
function fraseDoAviso(alterados: readonly DadoAlterado[]): string {
  const precos = alterados.filter((a) => a.tipo === "preco").length;
  const removidos = alterados.filter((a) => a.tipo === "removido").length;

  const partes: string[] = [];
  if (precos > 0) partes.push(contar(precos, "ingrediente mudou de preço", "ingredientes mudaram de preço"));
  if (removidos > 0) {
    partes.push(
      contar(removidos, "ingrediente saiu do cadastro", "ingredientes saíram do cadastro")
    );
  }

  return `Desde a geração desta planilha, ${juntar(partes)}.`;
}

function contar(quantidade: number, singular: string, plural: string): string {
  return `${quantidade} ${quantidade === 1 ? singular : plural}`;
}

/** "a", "a e b", "a, b e c" — sem vírgula antes do último quando são dois. */
function juntar(partes: readonly string[]): string {
  if (partes.length <= 1) return partes[0] ?? "";
  return `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;
}
