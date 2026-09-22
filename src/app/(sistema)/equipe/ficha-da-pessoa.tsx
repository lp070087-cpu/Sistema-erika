"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao, CampoTexto } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { Aviso, Secao } from "@/components/ui/superficie";
import { Etiqueta } from "@/components/ui/indicador";
import { dataCurta } from "@/lib/dados";
import { ROTULO_FUNCAO, ORDEM_FUNCAO, ROTULO_SITUACAO_PESSOA, ROTULO_TURNO, coberturaDeTreinamento, normalizarNome } from "@/lib/dados/equipe";
import {
  idDaSessao,
  marcarRetornoDaPessoa,
  marcarSaidaDaPessoa,
  registrarTreinamento,
  removerTreinamento,
  salvarPessoa,
} from "@/lib/dados/demonstracao";
import type { FuncaoNaCozinha, Pessoa, Treinamento, Turno } from "@/lib/dados";

/**
 * A FICHA DE UMA PESSOA — onde o módulo deixa de ser uma lista de nomes.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS DUAS LISTAS QUE JUSTIFICAM ESTA TELA                              │
 * │                                                                      │
 * │ Em cima, o que a pessoa EXECUTA — declarado aqui, e é isso que faz a  │
 * │ contagem de preparos por pessoa existir. Embaixo, o que ela executa e │
 * │ NÃO TEM REGISTRO de treinamento.                                      │
 * │                                                                      │
 * │ A segunda lista é a razão de o módulo existir, e o rótulo dela é      │
 * │ exato de propósito: diz "sem registro de treinamento", e não "não     │
 * │ sabe fazer". Uma consultora pode ter treinado alguém pessoalmente e   │
 * │ nunca ter anotado — e nesse caso o que falta é o registro. Acusar a   │
 * │ pessoa com base numa ausência de dado seria o tipo de afirmação que   │
 * │ este projeto não faz. Ver `coberturaDeTreinamento` em `equipe.ts`.     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA GAVETA NÃO OFERECE UM CAMPO DE TEXTO PARA O PREPARO      │
 * │                                                                      │
 * │ Seria mais simples e pior. Os preparos que a pessoa executa saem de   │
 * │ uma LISTA do que já existe — os nomes das fichas do cliente e os      │
 * │ preparos que os processos já citam. Em texto livre, "Molho da casa",  │
 * │ "molho da casa" e "Molho" virariam três preparos, e a lista de sem    │
 * │ treinamento encheria de linhas que são o mesmo prato escrito de três  │
 * │ jeitos.                                                               │
 * │                                                                      │
 * │ O campo continua aceitando texto (a lista é sugestão, via `<datalist>`)
 * │ porque nem todo preparo executado tem ficha técnica — e exigir ficha   │
 * │ para declarar o que se executa inventaria uma ordem que a cozinha não  │
 * │ tem.                                                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A DATA É DO SISTEMA, NÃO DO FORMULÁRIO                                │
 * │                                                                      │
 * │ `registrarTreinamento` recebe a data por argumento — e a tela passa    │
 * │ `new Date()`. Não há campo de data, e é deliberado: o sistema registra │
 * │ QUANDO o treinamento foi anotado, que é um fato que ele presenciou.    │
 * │ Um campo de data deixaria alguém escrever "treinada em março" para um  │
 * │ treinamento que não houve, e o registro passaria a valer como prova    │
 * │ de algo que ninguém viu.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function FichaDaPessoa({
  pessoa,
  pessoas,
  treinamentos,
  cliente,
  preparos,
  aoFechar,
}: {
  pessoa: Pessoa | null;
  /** A equipe inteira do cliente — a base do aviso de nome repetido. */
  pessoas: readonly Pessoa[];
  treinamentos: readonly Treinamento[];
  cliente: string;
  /** Os preparos que a operação já conhece: fichas do cliente e passos dos processos. */
  preparos: readonly string[];
  aoFechar: () => void;
}) {
  /*
    Os rascunhos ficam em estado local e são gravados no botão. Gravar a cada
    tecla faria cada letra digitada virar uma alteração no store — e a faixa de
    "há alterações nesta sessão" não distingue uma edição de vinte.
  */
  const [nome, setNome] = useState(pessoa?.nome ?? "");
  const [funcao, setFuncao] = useState<FuncaoNaCozinha>(pessoa?.funcao ?? "AUXILIAR");
  const [turno, setTurno] = useState<Turno>(pessoa?.turno ?? "INTEGRAL");
  const [observacao, setObservacao] = useState(pessoa?.observacao ?? "");
  const [novoPreparo, setNovoPreparo] = useState("");
  const [treinando, setTreinando] = useState("");

  if (pessoa === null) return null;

  const nomeLimpo = nome.trim();
  const mudou =
    nomeLimpo !== pessoa.nome ||
    funcao !== pessoa.funcao ||
    turno !== pessoa.turno ||
    observacao.trim() !== pessoa.observacao;

  /*
    O mesmo nome em outra pessoa do MESMO cliente. A comparação usa
    `normalizarNome` — a função do módulo, não uma segunda escrita dela aqui:
    se a tolerância do casamento mudar, o aviso acompanha.
  */
  const colide =
    nomeLimpo !== "" &&
    pessoas.some((p) => p.id !== pessoa.id && normalizarNome(p.nome) === normalizarNome(nomeLimpo));

  const cobertura = coberturaDeTreinamento([pessoa], treinamentos)[0];
  const treinados = cobertura?.treinados ?? [];
  const semTreinamento = cobertura?.semTreinamento ?? [];

  const executados = [...new Set(pessoa.pratos)];

  /** O que ainda não está na lista de execução — o que pode ser acrescentado. */
  const disponiveis = preparos.filter(
    (p) => !executados.some((e) => normalizarNome(e) === normalizarNome(p))
  );

  const treinaveis = executados.filter(
    (p) => !treinados.some((t) => normalizarNome(t) === normalizarNome(p))
  );

  return (
    <Gaveta
      aberta
      aoFechar={aoFechar}
      titulo={pessoa.nome}
      descricao={`${cliente} · ${ROTULO_FUNCAO[pessoa.funcao]} · ${ROTULO_TURNO[pessoa.turno]}`}
      acoes={
        <>
          <Botao
            variante="fantasma"
            tamanho="sm"
            type="button"
            onClick={() => {
              setNome(pessoa.nome);
              setFuncao(pessoa.funcao);
              setTurno(pessoa.turno);
              setObservacao(pessoa.observacao);
              aoFechar();
            }}
          >
            Fechar
          </Botao>
          <Botao
            variante="primario"
            tamanho="sm"
            type="button"
            disabled={!mudou || nomeLimpo === ""}
            onClick={() => {
              salvarPessoa(pessoa.id, {
                nome: nomeLimpo,
                funcao,
                turno,
                observacao: observacao.trim(),
              });
            }}
          >
            Salvar
          </Botao>
        </>
      }
    >
      <div className="space-y-6">
        {pessoa.situacao === "DESLIGADA" ? (
          <Aviso tom="info" titulo="Saiu da equipe — e o registro ficou">
            Ela não entra na escala de hoje, e continua aqui porque executou preparos: o que ela
            fazia não deixa de ser verdade por ela ter saído. Se voltar, o botão de retorno a
            recoloca na ativa.
          </Aviso>
        ) : null}

        <Secao
          rotulo="Cadastro"
          titulo="Quem é, na língua da operação"
          descricao="Nome de execução. Não há salário, admissão, jornada nem benefício — este módulo não é RH."
        >
          <div className="space-y-4">
            <Campo
              label="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              name="nome-na-ficha"
            />

            {colide ? (
              <p className="rounded-[var(--raio-sm)] border border-dashed border-dourado/60 bg-[rgba(201,165,78,0.09)] px-3 py-2 text-[0.8125rem] leading-relaxed text-[#7a6119]">
                Há outra pessoa deste cliente com este nome. O nome escrito nos processos é
                comparado por igualdade: os dois vão casar com o mesmo registro, e os preparos vão
                aparecer contados para ambos. Um sobrenome separa os dois.
              </p>
            ) : null}

            <CampoSelecao
              label="Função na cozinha"
              value={funcao}
              onChange={(e) => setFuncao(e.target.value as FuncaoNaCozinha)}
              name="funcao-na-ficha"
              ajuda="A praça. Ordem de apresentação, não de hierarquia."
              opcoes={ORDEM_FUNCAO.map((f) => ({ valor: f, texto: ROTULO_FUNCAO[f] }))}
            />

            <CampoSelecao
              label="Turno"
              value={turno}
              onChange={(e) => setTurno(e.target.value as Turno)}
              name="turno-na-ficha"
              opcoes={(Object.keys(ROTULO_TURNO) as Turno[]).map((t) => ({
                valor: t,
                texto: ROTULO_TURNO[t],
              }))}
            />

            <CampoTexto
              label="Observação"
              rows={3}
              ajuda="Opcional. Texto livre — o que não é campo aqui é anotação, e não cálculo."
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              name="observacao-na-ficha"
            />
          </div>
        </Secao>

        <Secao
          rotulo={`${executados.length} ${executados.length === 1 ? "preparo" : "preparos"}`}
          titulo="O que ela executa"
          descricao="É o que responde quantos preparos cada pessoa toca — a conta que o texto livre do processo não permite fazer."
        >
          {executados.length === 0 ? (
            <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              Nada declarado ainda. Enquanto a lista estiver vazia, ela não aparece em nenhuma conta
              de cobertura — declarar é o que a coloca no mapa da cozinha.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--linha)]">
              {executados.map((preparo) => (
                <li key={preparo} className="flex items-center justify-between gap-4 py-2.5">
                  <span className="min-w-0 text-[0.875rem] text-tinta">{preparo}</span>
                  <button
                    type="button"
                    onClick={() =>
                      salvarPessoa(pessoa.id, {
                        pratos: pessoa.pratos.filter((p) => p !== preparo),
                      })
                    }
                    className="shrink-0 text-[0.8125rem] text-[var(--tinta-suave)] underline-offset-4 hover:text-red-800 hover:underline"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/*
            `datalist` e não `select`: a lista SUGERE sem obrigar. Um preparo
            que existe na cozinha e ainda não virou ficha precisa poder ser
            declarado — e um `<select>` fechado o tornaria impossível.
          */}
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1">
              <Campo
                label="Acrescentar preparo"
                value={novoPreparo}
                onChange={(e) => setNovoPreparo(e.target.value)}
                name="novo-preparo"
                list="preparos-conhecidos"
                placeholder={disponiveis[0] ?? "Nome do preparo"}
              />
              <datalist id="preparos-conhecidos">
                {disponiveis.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <Botao
              variante="secundario"
              tamanho="sm"
              type="button"
              disabled={novoPreparo.trim() === ""}
              onClick={() => {
                const valor = novoPreparo.trim();
                if (valor === "") return;
                salvarPessoa(pessoa.id, { pratos: [...pessoa.pratos, valor] });
                setNovoPreparo("");
              }}
            >
              Acrescentar
            </Botao>
          </div>
        </Secao>

        <Secao
          rotulo={`${semTreinamento.length} sem registro`}
          titulo="O que ela executa sem registro de treinamento"
          descricao="A pendência que este módulo existe para mostrar. O rótulo diz o que foi medido: a ausência de registro, não a ausência de capacidade."
        >
          {executados.length === 0 ? (
            <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              Nada a conferir: ela ainda não declarou nenhum preparo. Sem execução declarada não há
              o que cruzar — e o sistema não presume nada sobre quem ela é na cozinha.
            </p>
          ) : semTreinamento.length === 0 ? (
            <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              Todo preparo que ela executa tem registro de treinamento.
            </p>
          ) : (
            <ul className="space-y-2">
              {semTreinamento.map((preparo) => (
                <li
                  key={preparo}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[var(--raio-sm)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.4)] px-3.5 py-2.5"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.875rem] text-tinta">{preparo}</span>
                    <Etiqueta tom="dourado">sem registro</Etiqueta>
                  </span>
                  <Botao
                    variante="linha"
                    tamanho="sm"
                    type="button"
                    onClick={() =>
                      registrarTreinamento(
                        {
                          id: idDaSessao("tr", `${pessoa.nome}-${preparo}`),
                          pessoaId: pessoa.id,
                          preparo,
                          aplicadoPor: "sessão de trabalho",
                          concluidoEm: new Date(),
                        },
                        new Date()
                      )
                    }
                  >
                    Registrar treinamento
                  </Botao>
                </li>
              ))}
            </ul>
          )}

          {treinados.length > 0 ? (
            <div className="mt-5 border-t border-[var(--linha)] pt-4">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Com registro
              </p>
              <ul className="mt-2 space-y-1.5">
                {treinados.map((preparo) => {
                  const registro = treinamentos.find(
                    (t) =>
                      t.pessoaId === pessoa.id &&
                      normalizarNome(t.preparo) === normalizarNome(preparo)
                  );
                  return (
                    <li key={preparo} className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[0.875rem] text-[var(--tinta-suave)]">
                        {preparo}
                        {registro ? (
                          <span className="text-[var(--tinta-fraca)]">
                            {" "}
                            · {dataCurta(registro.concluidoEm)}
                          </span>
                        ) : null}
                      </span>
                      <button
                        type="button"
                        onClick={() => removerTreinamento(pessoa.id, preparo)}
                        className="text-[0.8125rem] text-[var(--tinta-suave)] underline-offset-4 hover:underline"
                      >
                        Desfazer registro
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {/*
            O treinamento é um PAR (pessoa, preparo) com data e quem aplicou.
            O formulário abaixo pede só o preparo porque a pessoa e a data já
            são conhecidas — e "quem aplicou" fica com a assinatura da sessão,
            que registra o que o sistema presenciou sem atribuir a ninguém.
          */}
          {treinaveis.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-end gap-2 border-t border-[var(--linha)] pt-4">
              <div className="min-w-[220px] flex-1">
                <CampoSelecao
                  label="Registrar treinamento de"
                  value={treinando}
                  onChange={(e) => setTreinando(e.target.value)}
                  name="treinamento-de"
                  opcoes={[
                    { valor: "", texto: "Escolha o preparo…" },
                    ...treinaveis.map((p) => ({ valor: p, texto: p })),
                  ]}
                />
              </div>
              <Botao
                variante="secundario"
                tamanho="sm"
                type="button"
                disabled={treinando === ""}
                onClick={() => {
                  const ok = registrarTreinamento(
                    {
                      id: idDaSessao("tr", `${pessoa.nome}-${treinando}`),
                      pessoaId: pessoa.id,
                      preparo: treinando,
                      aplicadoPor: "sessão de trabalho",
                      concluidoEm: new Date(),
                    },
                    new Date()
                  );
                  /*
                    `false` quando o par já existia. O campo é limpo dos dois
                    jeitos: manter o valor selecionado depois de um clique que
                    não mudou nada faria parecer que o registro não funcionou.
                  */
                  if (ok) setTreinando("");
                }}
              >
                Registrar
              </Botao>
            </div>
          ) : null}
        </Secao>

        <Secao
          rotulo="Situação"
          titulo={ROTULO_SITUACAO_PESSOA[pessoa.situacao]}
          descricao="Sair da equipe não apaga o registro: o que ela executou continua sendo verdade depois que ela sai."
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-[52ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              {pessoa.situacao === "ATIVA"
                ? "Ela entra na escala de hoje e conta nas pendências de treinamento."
                : "Ela está fora da escala de hoje, e as pendências de treinamento dela não entram no resumo."}
            </p>
            {pessoa.situacao === "ATIVA" ? (
              <Botao
                variante="secundario"
                tamanho="sm"
                type="button"
                onClick={() => marcarSaidaDaPessoa(pessoa.id)}
              >
                Marcar saída
              </Botao>
            ) : (
              <Botao
                variante="secundario"
                tamanho="sm"
                type="button"
                onClick={() => marcarRetornoDaPessoa(pessoa.id)}
              >
                Trazer de volta
              </Botao>
            )}
          </div>
          <p className="mt-3 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
            Cadastrada nesta sessão em {dataCurta(pessoa.registradaEm)}. Não há data de saída, e não
            é omissão: data de desligamento serve para aviso e rescisão, que são outro sistema. Se a
            data importa para a operação, ela vai na observação — e aí está claro que é anotação.
          </p>
        </Secao>
      </div>
    </Gaveta>
  );
}
