"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao, CampoTexto } from "@/components/ui/campo";
import { Gaveta, useGaveta } from "@/components/ui/gaveta";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import { criarPessoa, idDaSessao } from "@/lib/dados/demonstracao";
import { ROTULO_FUNCAO, ORDEM_FUNCAO, ROTULO_TURNO, normalizarNome } from "@/lib/dados/equipe";
import type { FuncaoNaCozinha, Pessoa, Turno } from "@/lib/dados";
import type { ClienteOperacao } from "@/lib/dados";

/**
 * CADASTRAR UMA PESSOA DA EQUIPE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE FORMULÁRIO PEDE, E O QUE ELE NÃO PEDE                     │
 * │                                                                      │
 * │ Pede cinco coisas: nome, cliente, função, turno e uma observação      │
 * │ livre. Não pede salário, admissão, CPF, jornada nem carga horária —   │
 * │ não por estar faltando, porque é outro sistema. Ver `equipe.ts`, que  │
 * │ documenta por que a ausência desses campos é o que impede este módulo │
 * │ de virar RH.                                                         │
 * │                                                                      │
 * │ NÃO PEDE OS PRATOS, e isso é deliberado: quem cadastra a equipe      │
 * │ começou agora, e exigir a lista de preparos no primeiro formulário    │
 * │ faria ela abandonar o cadastro ou escrever qualquer coisa para        │
 * │ avançar. Os pratos entram depois, na ficha da pessoa, quando ela já   │
 * │ tem a equipe montada — e é lá que a pendência de treinamento          │
 * │ aparece.                                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O NOME QUE JÁ EXISTE NO CLIENTE É AVISADO, E NÃO IMPEDIDO             │
 * │                                                                      │
 * │ Duas "Juliana" na mesma cozinha é plausível, e bloquear o cadastro     │
 * │ por causa disso obrigaria a inventar um sobrenome que ninguém usa.     │
 * │                                                                      │
 * │ Mas o aviso precisa existir, porque o custo de duas pessoas com o      │
 * │ mesmo nome é silencioso: `casarPessoas` casa as duas com o MESMO       │
 * │ registro escrito ("Juliana" no processo), e o número de preparos por   │
 * │ pessoa sai dividido sem que nada na tela pareça errado. O aviso diz    │
 * │ o que vai acontecer, e a decisão continua sendo dela.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function NovaPessoa({
  clientes,
  nomesDoCliente,
  variante = "primario",
  tamanho = "sm",
  rotulo = "Nova pessoa",
}: {
  clientes: readonly ClienteOperacao[];
  /**
   * Os nomes já cadastrados, POR CLIENTE. Vem pronto em vez de ser calculado
   * aqui porque quem já tem a equipe inteira na memória é o painel — e uma
   * segunda conta de "quem já está cadastrado" dentro do formulário seria a
   * segunda resposta para a mesma pergunta.
   */
  nomesDoCliente: ReadonlyMap<string, readonly string[]>;
  variante?: "primario" | "secundario" | "linha" | "fantasma";
  tamanho?: "sm" | "md";
  rotulo?: string;
}) {
  const gaveta = useGaveta();
  useDemonstracao();

  const [nome, setNome] = useState("");
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [funcao, setFuncao] = useState<FuncaoNaCozinha>("AUXILIAR");
  const [turno, setTurno] = useState<Turno>("INTEGRAL");
  const [observacao, setObservacao] = useState("");
  const [criada, setCriada] = useState<string | null>(null);

  const nomeLimpo = nome.trim();
  const nomeValido = nomeLimpo !== "";
  const clienteValido = clienteId !== "";

  /*
    A normalização é a do módulo, IMPORTADA e não reescrita aqui.

    Aqui havia uma cópia que fazia caixa, acento e espaço — parecia a mesma
    coisa e não era: `normalizarNome` também descarta o parêntese que
    qualifica sem nomear. A diferença aparecia num caso concreto: cadastrar
    "Ana (auxiliar de cozinha)" com uma "Ana" já cadastrada não disparava
    aviso nenhum, embora `casarPessoas` considere as duas a MESMA pessoa —
    e o cadastro ficaria com duas "Ana" que o resto do sistema lê como uma
    só, sem que ninguém tivesse sido avisado.

    O aviso de repetição só serve se concordar com quem faz o casamento.
  */
  const repetido =
    clienteValido &&
    nomeLimpo !== "" &&
    (nomesDoCliente.get(clienteId) ?? []).some(
      (n) => normalizarNome(n) === normalizarNome(nomeLimpo)
    );

  function limpar() {
    setNome("");
    setClienteId(clientes[0]?.id ?? "");
    setFuncao("AUXILIAR");
    setTurno("INTEGRAL");
    setObservacao("");
    setCriada(null);
  }

  function fechar() {
    gaveta.fechar();
    limpar();
  }

  return (
    <>
      <Botao variante={variante} tamanho={tamanho} type="button" onClick={gaveta.abrir}>
        {rotulo}
      </Botao>

      <Gaveta
        aberta={gaveta.aberta}
        aoFechar={fechar}
        titulo="Nova pessoa"
        descricao="Nome de execução: quem trabalha na cozinha, em que função e em que turno. Sem salário, sem folha, sem ponto."
        acoes={
          criada ? (
            <Botao variante="secundario" tamanho="sm" type="button" onClick={fechar}>
              Fechar
            </Botao>
          ) : (
            <>
              <Botao variante="fantasma" tamanho="sm" type="button" onClick={fechar}>
                Cancelar
              </Botao>
              <Botao
                variante="primario"
                tamanho="sm"
                type="button"
                disabled={!nomeValido || !clienteValido}
                onClick={() => {
                  const agora = new Date();
                  const pessoa: Pessoa = {
                    id: idDaSessao("pe", nomeLimpo),
                    clienteId,
                    nome: nomeLimpo,
                    funcao,
                    turno,
                    // Vazio de propósito: os preparos entram na ficha da
                    // pessoa, depois. Ver o comentário do topo deste arquivo.
                    pratos: [],
                    observacao: observacao.trim(),
                    situacao: "ATIVA",
                    registradaEm: agora,
                  };
                  criarPessoa(pessoa);
                  setCriada(pessoa.nome);
                }}
              >
                Cadastrar
              </Botao>
            </>
          )
        }
      >
        {criada ? (
          /*
            A gaveta NÃO fecha sozinha, e a frase diz por quê: nada foi gravado
            em lugar nenhum além desta sessão. Fechar sozinha faria parecer
            que houve um salvamento que não houve.
          */
          <div className="space-y-3">
            <p className="text-[0.9375rem] text-tinta">
              <strong>{criada}</strong> entrou na equipe e já aparece na lista.
            </p>
            <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              O próximo passo é declarar o que ela executa, na ficha dela — é de lá que sai a lista
              de quem executa um preparo sem registro de treinamento. Ela está no estado desta
              sessão, não no banco: fechar o navegador descarta o cadastro.
            </p>
          </div>
        ) : clientes.length === 0 ? (
          <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
            Não há cliente cadastrado para receber uma equipe. Quem executa pertence à cozinha de um
            cliente — sem cliente, o cadastro não teria a quem se referir.
          </p>
        ) : (
          <div className="space-y-4">
            <Campo
              label="Nome"
              obrigatorio
              ajuda="Como a cozinha a chama. Sobrenome é opcional."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              name="nome-da-pessoa"
            />

            {repetido ? (
              <p className="rounded-[var(--raio-sm)] border border-dashed border-dourado/60 bg-[rgba(201,165,78,0.09)] px-3 py-2 text-[0.8125rem] leading-relaxed text-[#7a6119]">
                Já existe alguém com este nome neste cliente. Dá para seguir — duas pessoas podem ter
                o mesmo nome —, mas vale saber o efeito: o nome escrito nos processos é comparado
                por igualdade, então os dois vão casar com o mesmo registro e os preparos vão
                aparecer contados para ambos. Um sobrenome separa os dois.
              </p>
            ) : null}

            <CampoSelecao
              label="Cliente"
              obrigatorio
              ajuda="A cozinha onde ela executa. A equipe de um cliente nunca se mistura com a de outro."
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              name="cliente-da-pessoa"
              opcoes={[
                { valor: "", texto: "Escolha o cliente…" },
                ...clientes.map((c) => ({ valor: c.id, texto: c.nomeFantasia })),
              ]}
            />

            <CampoSelecao
              label="Função na cozinha"
              obrigatorio
              ajuda="A praça em que ela trabalha. Não é cargo nem hierarquia: o sistema não sabe quem manda em quem."
              value={funcao}
              onChange={(e) => setFuncao(e.target.value as FuncaoNaCozinha)}
              name="funcao-da-pessoa"
              opcoes={ORDEM_FUNCAO.map((f) => ({ valor: f, texto: ROTULO_FUNCAO[f] }))}
            />

            <CampoSelecao
              label="Turno"
              obrigatorio
              ajuda="O turno em que ela costuma estar. Serve para a escala do dia, não para jornada."
              value={turno}
              onChange={(e) => setTurno(e.target.value as Turno)}
              name="turno-da-pessoa"
              opcoes={(Object.keys(ROTULO_TURNO) as Turno[]).map((t) => ({
                valor: t,
                texto: ROTULO_TURNO[t],
              }))}
            />

            <CampoTexto
              label="Observação"
              rows={3}
              ajuda="Opcional. O que não cabe em função e turno."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              name="observacao-da-pessoa"
            />
          </div>
        )}
      </Gaveta>
    </>
  );
}
