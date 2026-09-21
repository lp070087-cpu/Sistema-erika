import { Etiqueta } from "@/components/ui/indicador";
import { dataEHora, valorEmReais } from "@/lib/dados";
import type { DadoAlterado, DivergenciaDaPlanilha } from "@/lib/planilhas/procedencia";

/**
 * O AVISO DE QUE A PLANILHA ENVELHECEU — a parte visível da decisão 3.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS TRÊS COISAS QUE O BRIEFING PROÍBE, E COMO CADA UMA É RESPEITADA    │
 * │                                                                      │
 * │ NÃO RECALCULAR EM SILÊNCIO. Este componente não escreve nada: ele      │
 * │ recebe duas listas de preço já comparadas e desenha a diferença. Não    │
 * │ há um caminho daqui para o `edicoes` nem para o servidor — a grade na  │
 * │ tela continua exatamente como foi montada.                            │
 * │                                                                      │
 * │ NÃO ESCONDER. Ele fica ACIMA da grade, não no lugar dela. A planilha   │
 * │ continua visível, inteira e utilizável por baixo do aviso. Quem quiser │
 * │ conferir o número antes de decidir o que fazer, confere.               │
 * │                                                                      │
 * │ NÃO APAGAR. A ação que ele oferece leva à planilha, não à exclusão de  │
 * │ nada. Ver a nota sobre o botão, abaixo.                               │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A LISTA NÃO É "OS INSUMOS QUE MUDARAM" E PRONTO              │
 * │                                                                      │
 * │ Porque o preço de antes importa. "A batata mudou" não é acionável —   │
 * │ quem lê precisa saber se ela subiu de R$ 10 para R$ 13 (o custo do     │
 * │ prato está R$ 3 baixo no arquivo) ou se caiu (está alto), e conferir   │
 * │ isso abrindo a planilha e o cadastro, um a um, é exatamente o trabalho │
 * │ que este aviso existe para poupar.                                    │
 * │                                                                      │
 * │ Por isso a linha mostra o par. E mostra os dois valores NO MESMO       │
 * │ FORMATO — a comparação entre "R$ 10,00" e "10" seria feita de cabeça,  │
 * │ com a vírgula como pista.                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O TOM É DE AVISO, NÃO DE ERRO — E ELE É "atencao", NÃO "critico"     │
 * │                                                                      │
 * │ Nada está quebrado. A planilha está correta sobre o momento em que foi │
 * │ gerada, e é isso que uma planilha gerada deve ser. O que aconteceu é    │
 * │ que o mundo mudou depois — o que é normal numa consultoria, onde preço  │
 * │ de insumo se mexe toda semana.                                         │
 * │                                                                      │
 * │ O `critico` (vermelho) é para o que exige conserto. Usá-lo aqui faria   │
 * │ a consultora tratar como falha a coisa mais comum do trabalho dela —    │
 * │ e, pior, ensinaria que vermelho nesta tela não significa nada urgente.  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO NÃO TEM "use client"                            │
 * │                                                                      │
 * │ Ele não guarda estado, não tem `onClick`, não lê nada que só exista no │
 * │ navegador. É uma função de `DadoAlterado[]` para JSX, e por isso pode   │
 * │ ser desenhado nas duas metades: o ambiente de cliente importa daqui    │
 * │ hoje, e no dia em que o histórico (servidor) quiser mostrar o mesmo     │
 * │ aviso num registro antigo, ele importa o MESMO componente.             │
 * │                                                                      │
 * │ Marcar `"use client"` aqui não quebraria nada hoje e fecharia a porta  │
 * │ depois: um componente de cliente não pode ser renderizado de dentro de │
 * │ um de servidor sem levar a árvore toda para o navegador.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function AvisoDeProcedencia({
  divergencia,
  geradoEm,
  className,
}: {
  divergencia: DivergenciaDaPlanilha;
  /**
   * Quando a planilha foi montada. Entra na frase porque é ele que dá escala
   * ao aviso: "mudou desde a geração" numa planilha de dois minutos atrás é
   * uma coisa; numa de dois meses, outra.
   */
  geradoEm?: Date | null;
  className?: string;
}) {
  /*
    SEM DIVERGÊNCIA NÃO HÁ AVISO — e devolver `null` (em vez de um bloco
    vazio) é o que mantém a promessa de "aviso discreto": um espaço reservado
    para nada empurraria a grade para baixo em toda planilha atualizada.
  */
  if (!divergencia.haDivergencia) return null;

  const precos = divergencia.alterados.filter((a) => a.tipo === "preco");
  const removidos = divergencia.alterados.filter((a) => a.tipo === "removido");

  return (
    <section
      /*
        `aria-live="polite"` porque o aviso PODE APARECER sem que a tela seja
        trocada: ela edita um preço noutra tela, volta, e o bloco já está ali.
        Um leitor de tela anunciaria a mudança sem interromper o que estiver
        sendo lido — que é o comportamento certo para uma informação que não
        é urgente.
      */
      aria-live="polite"
      className={
        "rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-dourado " +
        "bg-[rgba(201,165,78,0.07)] px-4 py-3 " +
        (className ?? "")
      }
    >
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <Etiqueta tom="dourado">dados antigos</Etiqueta>
        <p className="text-[0.875rem] font-medium text-tinta">
          Esta planilha é um retrato — os dados de origem mudaram depois dela.
        </p>
      </div>

      {/*
        A FRASE VEM DO MÓDULO PURO, e não é escrita aqui.

        Ela é a mesma para o aviso do histórico, quando ele existir, e para
        este. Duas cópias da mesma frase divergem na primeira correção de
        texto — e a que ficar para trás passa a dizer uma coisa na Central e
        outra em qualquer outro lugar que mostre o mesmo fato.
      */}
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
        {divergencia.resumo}
        {geradoEm ? (
          <>
            {" "}
            A planilha na tela continua mostrando os valores de{" "}
            <span className="tabular">{dataEHora(geradoEm)}</span> — ela não foi recalculada.
          </>
        ) : null}
      </p>

      <ul className="mt-2.5 space-y-1">
        {precos.map((d) => (
          <LinhaAlterada key={`preco-${d.ingredienteId}`} dado={d} />
        ))}
        {removidos.map((d) => (
          <LinhaAlterada key={`removido-${d.ingredienteId}`} dado={d} />
        ))}
      </ul>

      {/*
        ── O QUE ELE NÃO FAZ, DITO PARA QUEM LÊ O CÓDIGO ──────────────────

        Não há botão "atualizar custos" aqui, e a ausência é deliberada.

        Recalcular é uma ação do documento, e o documento é a FICHA — é lá que
        a regra de histórico do §21 mora, com o botão `Atualizar custos desta
        ficha` que já existe em `fichas/[id]/detalhe.tsx`. Um segundo botão
        aqui, mexendo nos mesmos dados por outro caminho, seria uma segunda
        porta para a mesma escrita: no dia em que as duas divergissem, a ficha
        e a planilha mostrariam custos diferentes e ninguém saberia qual foi a
        que a consultora clicou por último.

        A saída daqui é trocar de modelo e voltar — trocar de planilha remonta
        a grade com os dados de agora, que é o "regerar" honesto. A frase
        abaixo diz isso, e é o único caminho.
      */}
      <p className="mt-2.5 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
        Para trabalhar com os valores de agora, mude a planilha na barra acima e volte — a grade é
        montada de novo com o que está no cadastro neste momento. Exportar o arquivo como está
        salva este retrato, com os valores do dia em que ele foi gerado.
      </p>
    </section>
  );
}

/**
 * UMA LINHA DA LISTA — e a diferença entre os dois tipos é o que ela mostra.
 *
 * Um preço que mudou tem DOIS números para comparar; um insumo que saiu do
 * cadastro tem UM número e uma ausência. Escrever a mesma frase para os dois
 * obrigaria a inventar um valor de "agora" para o removido, e o único
 * candidato seria o traço — que na coluna de preço já quer dizer "não
 * cadastrado", e passaria a significar duas coisas.
 */
function LinhaAlterada({ dado }: { dado: DadoAlterado }) {
  if (dado.tipo === "removido") {
    return (
      <li className="flex flex-wrap items-baseline gap-x-2 text-[0.8125rem]">
        <span className="font-medium text-tinta">{dado.nome}</span>
        <span className="text-[var(--tinta-fraca)]">
          saiu do cadastro — a planilha mostra <Moeda valor={dado.precoNaGeracao} /> por ele, e o
          cadastro que explicava esse valor não existe mais
        </span>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-baseline gap-x-2 text-[0.8125rem]">
      <span className="font-medium text-tinta">{dado.nome}</span>
      <span className="tabular text-[var(--tinta-suave)]">
        <Moeda valor={dado.precoNaGeracao} /> → <Moeda valor={dado.precoAgora} />
      </span>
      <SetaDoMovimento de={dado.precoNaGeracao} para={dado.precoAgora} />
    </li>
  );
}

/**
 * A SETA — pequena, e não decorativa.
 *
 * Ela responde a pergunta que a linha provoca: "o número da planilha está
 * alto ou baixo?". Sem ela, quem lê vê dois valores e precisa fazer a conta
 * — e a conta é o que ele estava tentando evitar ao abrir este aviso.
 *
 * Sem cor: quem for vermelho/verde vai ler isto como erro e acerto, e não é
 * nem um nem outro. É para cima, para baixo, ou igual.
 */
function SetaDoMovimento({ de, para }: { de: number | null; para: number | null }) {
  if (de === null || para === null || de === para) return null;

  const subiu = para > de;

  return (
    <span className="text-[var(--tinta-fraca)]">
      {subiu ? "o cadastro está maior" : "o cadastro está menor"}
    </span>
  );
}

/**
 * O VALOR EM REAIS, COM O TRAÇO PARA A AUSÊNCIA.
 *
 * `null` é ausência de preço, nunca zero — a mesma regra que o resto do
 * sistema segue. Desenhar "R$ 0,00" para um insumo sem preço faria a linha
 * dizer que o custo caiu para zero, que é uma informação diferente e falsa.
 */
function Moeda({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-[var(--tinta-fraca)]">sem preço</span>;
  return <span>{valorEmReais(valor)}</span>;
}
