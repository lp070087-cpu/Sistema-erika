"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * O RETORNO DE UMA AÇÃO — UMA LINHA QUE DIZ O QUE ACABOU DE ACONTECER.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O PEDIDO                                                             │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "adicionar feedback visual das ações. Quero feedback claro para:  │ │
 * │ │  Salvar, Importar, Desfazer, Refazer, Gerar, Erros de validação." │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ Três desses já tinham retorno, e cada um no formato que o conteúdo    │
 * │ pedia: `salvar.tsx` escreve a hora e o que o salvamento NÃO protege;  │
 * │ `gerar.tsx` escreve o nome do arquivo baixado ou o motivo da falha;   │
 * │ a conferência da importação escreve o que não pôde ser lido.          │
 * │                                                                      │
 * │ DESFAZER E REFAZER NÃO TINHAM NENHUM. Os dois botões mudavam de       │
 * │ estado — acendiam e apagavam — e nada na tela dizia QUAL operação     │
 * │ tinha acabado de ser desfeita. Numa planilha com trinta edições, o    │
 * │ Ctrl+Z repetido vira adivinhação: ela olha a célula e tenta lembrar   │
 * │ o que havia ali antes.                                                │
 * │                                                                      │
 * │ Este arquivo existe para os dois, e para qualquer ação futura que     │
 * │ precise do mesmo retorno sem inventar um terceiro formato.            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO UM "TOAST" FLUTUANTE                                     │
 * │                                                                      │
 * │ Um balão que aparece no canto e some sozinho é o padrão de mercado —  │
 * │ e é o formato errado aqui, por dois motivos concretos:                │
 * │                                                                      │
 * │ 1. ELE TAPA A GRADE. A Central é uma planilha ocupando a tela         │
 * │    inteira; qualquer coisa flutuando por cima cobre justamente a      │
 * │    célula que ela está olhando — e é ali que ela vai conferir se o    │
 * │    desfazer acertou.                                                  │
 * │                                                                      │
 * │ 2. ELE NÃO TEM LUGAR. Um balão no canto inferior direito não está     │
 * │    "junto" de nada: ele exige que o olho atravesse a tela para        │
 * │    ligá-lo ao botão que ela clicou. Preso na faixa de comando, logo    │
 * │    abaixo dos botões, ele é a continuação da frase que o botão        │
 * │    começou — "Desfazer" → "Desfeito: Célula C4".                      │
 * │                                                                      │
 * │ Esta é a mesma escolha que o resto do sistema já faz: o retorno mora  │
 * │ ao lado da ação, dentro do fluxo, e não numa camada por cima.         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE SOME SOZINHO E O QUE NÃO SOME                                 │
 * │                                                                      │
 * │ O RECADO DE SUCESSO SOME — cinco segundos, e ele sai. Ele descreve    │
 * │ algo que já acabou e que não muda nada no que vem depois; deixá-lo    │
 * │ na tela para sempre seria transformar a faixa de comando num mural    │
 * │ de coisas antigas.                                                    │
 * │                                                                      │
 * │ O ERRO NÃO SOME. Um recado que diz "não deu" e desaparece antes de    │
 * │ ser lido é pior que não ter recado nenhum: ela perde o motivo e fica  │
 * │ com a impressão de que a ação não fez nada. O erro fica até a próxima │
 * │ ação — e tem como ser fechado à mão, para quem já leu.                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O TEXTO CARREGA O RECADO; A COR SÓ O REFORÇA                         │
 * │                                                                      │
 * │ "Deu certo" em verde e "falhou" em vermelho não dizem nada a quem não │
 * │ distingue as duas cores — e nesta tela a diferença de conteúdo é      │
 * │ real: um recado diz o que foi desfeito, o outro diz por que não deu   │
 * │ para desfazer. Por isso não há ícone nem cor sem frase, e o mesmo     │
 * │ aviso existe para leitor de tela (`role="status"` / `role="alert"`).  │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export type TomDaAcao = "ok" | "erro";

export type AvisoDeAcao = {
  /**
   * Sobe a cada recado novo, e é a `key` do elemento.
   *
   * Sem ele, dois "Desfeito: Célula C4" seguidos seriam o MESMO nó para o
   * React: nada seria reinserido, a animação de entrada não rodaria de novo,
   * e o segundo Ctrl+Z pareceria não ter feito nada — o que é exatamente a
   * dúvida que este componente existe para eliminar.
   */
  readonly id: number;
  readonly texto: string;
  readonly tom: TomDaAcao;
};

/**
 * Quanto tempo o recado de sucesso fica.
 *
 * Cinco segundos é a conta entre duas coisas: tempo de ler uma linha curta
 * sem pressa, e tempo curto o bastante para não haver dois recados na tela
 * ao mesmo tempo durante um Ctrl+Z repetido.
 */
const DURACAO_DO_RECADO = 5000;

/**
 * O ESTADO DE UM RECADO DE AÇÃO — para quem precisa anunciar.
 *
 * Ele mora no componente que SABE o que aconteceu, e não dentro da faixa: a
 * faixa é burra e só desenha o que recebe. É a mesma divisão dos botões de
 * histórico, que posicionam sem conhecer a pilha.
 */
export function useAvisoDeAcao(): {
  aviso: AvisoDeAcao | null;
  anunciar: (texto: string, tom?: TomDaAcao) => void;
  dispensar: () => void;
} {
  const [aviso, definirAviso] = useState<AvisoDeAcao | null>(null);

  /*
    O RELÓGIO MORA NUMA REF, e não é detalhe de implementação.

    Se o identificador do `setTimeout` fosse estado, cada recado agendado
    provocaria um render — e o render não muda nada do que está na tela, só
    guarda o número. Pior: `dispensar` precisaria do valor atualizado, e
    haveria uma janela entre anunciar e o estado chegar em que um segundo
    anúncio não acharia o relógio do primeiro para cancelá-lo. Aí o recado
    novo seria apagado pelo relógio do antigo, e o Ctrl+Z pareceria falhar
    de vez em quando.
  */
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contador = useRef(0);

  const pararRelogio = useCallback(() => {
    if (relogio.current !== null) {
      clearTimeout(relogio.current);
      relogio.current = null;
    }
  }, []);

  const dispensar = useCallback(() => {
    pararRelogio();
    definirAviso(null);
  }, [pararRelogio]);

  const anunciar = useCallback(
    (texto: string, tom: TomDaAcao = "ok") => {
      /*
        TODO RECADO NOVO CANCELA O RELÓGIO DO ANTERIOR.

        Sem esta primeira linha, desfazer quatro vezes seguidas agendaria
        quatro relógios, e o primeiro deles apagaria o quarto recado no meio
        da leitura — a tela ficaria vazia com a ação mais recente ainda
        valendo.
      */
      pararRelogio();
      contador.current += 1;
      definirAviso({ id: contador.current, texto, tom });

      if (tom === "ok") {
        relogio.current = setTimeout(() => {
          relogio.current = null;
          definirAviso(null);
        }, DURACAO_DO_RECADO);
      }
    },
    [pararRelogio]
  );

  /*
    SAIR DA TELA NÃO DEIXA RELÓGIO PENDENTE.

    O temporizador chamaria `setDefinirAviso` num componente que já não
    existe. O React moderno não reclama disso em voz alta, e é por isso que o
    vazamento passa: ele só aparece como um recado piscando numa tela que
    acabou de ser trocada.
  */
  useEffect(() => {
    return pararRelogio;
  }, [pararRelogio]);

  return { aviso, anunciar, dispensar };
}

/**
 * A LINHA NA TELA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ELA NÃO OCUPA ESPAÇO QUANDO NÃO HÁ RECADO                            │
 * │                                                                      │
 * │ Sem recado ela devolve `null` em vez de uma faixa vazia reservando    │
 * │ altura. Uma linha em branco permanente debaixo da faixa de comando     │
 * │ seria altura gasta o tempo inteiro — e a altura que interessa nesta    │
 * │ tela é a da grade.                                                    │
 * │                                                                      │
 * │ A troca custa o aparecimento da linha, que empurra a grade alguns      │
 * │ pixels para baixo. É aceitável porque é uma vez por ação, e porque o   │
 * │ alternativo — flutuar por cima — cobriria a célula. Ver o bloco acima. │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function FaixaDeAcao({
  aviso,
  aoFechar,
  className,
}: {
  aviso: AvisoDeAcao | null;
  /** Só é usado no recado de erro, que não some sozinho. */
  aoFechar?: () => void;
  className?: string;
}) {
  if (aviso === null) return null;

  const erro = aviso.tom === "erro";

  return (
    <p
      key={aviso.id}
      /*
        `alert` interrompe a leitura; `status` espera a vez. A diferença é a
        mesma do conteúdo: um erro precisa ser ouvido agora, um "desfeito"
        pode esperar o fim da frase que está sendo lida.
      */
      role={erro ? "alert" : "status"}
      className={cn(
        "entrar-suave flex flex-wrap items-baseline gap-x-2 gap-y-1",
        "rounded-[var(--raio-sm)] border border-[var(--linha)] border-l-2 px-3 py-1.5",
        erro
          ? "border-l-red-800 bg-[rgba(153,27,27,0.06)]"
          : "border-l-[var(--color-medio)] bg-[rgba(29,82,54,0.06)]",
        className
      )}
    >
      <span className="text-[0.8125rem] leading-snug text-[var(--tinta)]">{aviso.texto}</span>

      {/*
        O BOTÃO DE FECHAR SÓ EXISTE NO ERRO.

        O recado de sucesso sai sozinho e não precisa de comando; dar um "×" a
        ele ofereceria uma decisão que ninguém quer tomar ("fecho ou espero?")
        numa mensagem que já vai embora. No erro, que fica, ele é a única
        saída — e o `aria-label` diz de que recado ele está falando, porque
        dois "×" sem contexto são indistinguíveis para quem lê por áudio.
      */}
      {erro && aoFechar ? (
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar o aviso"
          className="ml-auto shrink-0 rounded-[var(--raio-sm)] px-1 text-[0.875rem] leading-none text-[var(--tinta-fraca)] transition-colors hover:bg-[rgba(14,26,20,0.06)] hover:text-tinta"
        >
          ×
        </button>
      ) : null}
    </p>
  );
}
