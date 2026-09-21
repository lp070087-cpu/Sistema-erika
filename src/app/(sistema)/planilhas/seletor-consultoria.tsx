"use client";

/**
 * O SELETOR DE CONSULTORIA DA CENTRAL.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE DEIXOU DE SER TEXTO PARADO                               │
 * │                                                                      │
 * │ Ele era um `<p>` com o título da consultoria ativa, e a justificativa   │
 * │ escrita no código era razoável: um cliente costuma ter uma consultoria  │
 * │ só, e um seletor de uma opção é cromo.                                 │
 * │                                                                      │
 * │ O que a justificativa não viu é que o nome NÃO era só informativo. Ele  │
 * │ entra no subtítulo do arquivo gerado — "Ficha técnica · Empório Verde · │
 * │ Diagnóstico inicial" — e a partir do momento em que ele entra no        │
 * │ documento, ele é uma ESCOLHA. Um cliente que já teve duas consultorias  │
 * │ exportava o arquivo da que o sistema achou por conta própria, sem ter   │
 * │ como pedir a outra. Ver `montarContexto`, que sem `consultoriaId` cai    │
 * │ na mais recente não concluída: um bom palpite, e ainda assim um         │
 * │ palpite.                                                              │
 * │                                                                      │
 * │ O `<select>` nativo é a mesma escolha dos outros dois seletores, e      │
 * │ pela mesma razão de sempre: busca por digitação, teclado e leitura por  │
 * │ leitor de tela vêm de graça.                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE EXISTE A OPÇÃO "A ATIVA DO CLIENTE"                          │
 * │                                                                      │
 * │ O valor vazio não é um item decorativo: ele é o estado em que a Central  │
 * │ abre, e continuar existindo é o que faz o comportamento padrão de hoje  │
 * │ seguir sendo o padrão. Trocar de cliente volta para ele — e voltar para  │
 * │ ele significa "resolva como você sempre resolveu", não "nenhuma".       │
 * │                                                                      │
 * │ Sem essa opção, escolher um cliente exigiria escolher uma consultoria   │
 * │ logo em seguida para a planilha sair igual, e a tela teria criado um    │
 * │ passo que não existia.                                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function SeletorDeConsultoria({
  consultorias,
  selecionada,
  tituloAutomatico,
  aoTrocar,
  semCliente,
}: {
  consultorias: readonly { id: string; titulo: string }[];
  /** Vazio quer dizer "a ativa do cliente" — ver o bloco acima. */
  selecionada: string;
  /** Qual consultoria o sistema resolveu quando a escolha é automática. */
  tituloAutomatico: string | null;
  aoTrocar: (id: string) => void;
  /** Sem cliente não há consultoria a listar, e o campo diz isso. */
  semCliente: boolean;
}) {
  /*
    SEM CLIENTE O CAMPO NÃO FICA VAZIO EM SILÊNCIO.

    "escolha um cliente" é o que ele diz, e não é o mesmo que uma lista
    desabilitada sem explicação: a primeira frase diz o que fazer, a segunda
    deixa a pessoa procurando o defeito.
  */
  if (semCliente) {
    return (
      <p className="flex h-9 w-full max-w-[19rem] items-center px-0.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
        escolha um cliente
      </p>
    );
  }

  /*
    A ESCOLHA AUTOMÁTICA DIZ QUAL FOI.

    ┌──────────────────────────────────────────────────────────────────────┐
    │ POR QUE O `title` NÃO BASTA, E POR QUE ISTO NÃO É UM PARÁGRAFO        │
    │                                                                      │
    │ O `<select>` mostra "A ativa do cliente" — que descreve a REGRA, e não │
    │ o resultado dela. O resultado entra no subtítulo do arquivo gerado, e   │
    │ quem exporta precisa poder conferi-lo antes.                          │
    │                                                                      │
    │ A primeira tentativa foi uma linha de ajuda ABAIXO do campo. Ela       │
    │ aparecia e desaparecia conforme a escolha, e a barra inteira pulava de  │
    │ altura — com os botões da direita subindo junto. Um campo que muda de   │
    │ altura empurra tudo o que está ao lado.                               │
    │                                                                      │
    │ Aqui o nome fica DENTRO da altura do campo, alinhado à direita do      │
    │ `<select>`. Não desloca nada, e está no lugar onde o olho já está.     │
    └──────────────────────────────────────────────────────────────────────┘
  */
  const automatica = selecionada === "" && tituloAutomatico !== null;

  return (
    <div className="flex h-9 items-center gap-2">
      <select
        id="consultoria-planilha"
        value={selecionada}
        onChange={(e) => aoTrocar(e.target.value)}
        className="h-9 w-full max-w-[19rem] cursor-pointer rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.875rem] text-tinta focus:border-oliva focus:bg-white focus:outline-none"
      >
        <option value="">A ativa do cliente</option>
        {consultorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.titulo}
          </option>
        ))}
      </select>

      {automatica ? (
        <span
          className="max-w-[13rem] truncate text-[0.75rem] text-[var(--tinta-fraca)]"
          title={tituloAutomatico ?? undefined}
        >
          {tituloAutomatico}
        </span>
      ) : null}
    </div>
  );
}
