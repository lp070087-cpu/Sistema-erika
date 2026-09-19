"use client";

import Link from "next/link";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso } from "@/components/ui/superficie";
import { Abas } from "@/components/ui/abas";
import { Dado, ListaDados } from "@/components/ui/dados";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import {
  ROTULO_MODALIDADE,
  ROTULO_ORIGEM,
  ROTULO_SITUACAO_CLIENTE,
  ROTULO_TIPO_NEGOCIO,
  TOM_SITUACAO_CLIENTE,
  dataCurta,
} from "@/lib/dados";
import type {
  AcaoPlano,
  Acompanhamento,
  ClienteOperacao,
  Consultoria,
  Contrato,
  Diagnostico,
  Documento,
  EventoHistorico,
  Ficha,
  Ingrediente,
  IngredienteDoCliente,
  Lead,
  Processo,
  Tarefa,
} from "@/lib/dados";
import {
  clienteDaSessao,
  historicoDoClienteDaSessao,
} from "@/lib/dados/demonstracao";
import type { AbaChave } from "./tipos";
import { ABAS } from "./tipos";
import { AbaVisaoGeral } from "./abas/visao-geral";
import { AbaDiagnostico } from "./abas/diagnostico";
import { AbaConsultoria } from "./abas/consultoria";
import { AbaFichas } from "./abas/fichas";
import { AbaProcessos } from "./abas/processos";
import { AbaAcompanhamentos } from "./abas/acompanhamentos";
import { AbaDocumentos } from "./abas/documentos";
import { AbaHistorico } from "./abas/historico";
import { AcoesDoCliente } from "./acoes-do-cliente";

/**
 * A TELA DO CLIENTE — o corpo inteiro, no navegador.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM COMPONENTE DE CLIENTE, E O QUE ISSO CONSERTA        │
 * │                                                                      │
 * │ Antes a tela era inteira de servidor: ela lia o repositório uma vez e  │
 * │ pintava. Enquanto o cadastro do cliente não podia ser corrigido, isso  │
 * │ era correto — o dado não mudava, então não havia o que reaplicar.      │
 * │                                                                      │
 * │ Com a edição, passou a existir um dado que muda no navegador e um      │
 * │ cabeçalho que o mostra. E aí a versão de servidor só tinha duas        │
 * │ saídas, as duas ruins:                                                     │
 * │                                                                      │
 * │   · ficar com o nome do cenário depois de ela salvar — a tela          │
 * │     mostraria o nome antigo sobre um cadastro que ela acabou de        │
 * │     corrigir, sem nada explicando;                                     │
 * │                                                                      │
 * │   · atualizar só o cabeçalho, e deixar as abas com o nome velho —      │
 * │     duas partes da mesma tela discordando sobre o mesmo cliente,       │
 * │     que é o defeito que o store existe para impedir.                   │
 * │                                                                      │
 * │ Aqui o cliente passa por `clienteDaSessao` UMA vez, e tudo o que a      │
 * │ tela mostra — cabeçalho, painel de identificação, descrição de cada    │
 * │ aba — sai do mesmo objeto. Não há como discordarem.                    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO NÃO É                                                │
 * │                                                                      │
 * │ Não é uma reconstrução. Todo o conteúdo abaixo é o que já existia na    │
 * │ página de servidor, movido — as mesmas oito abas, o mesmo cabeçalho,   │
 * │ os mesmos nove campos. O que mudou foi onde ele roda e de onde o       │
 * │ cliente vem: do cenário, passando pela sobreposição desta sessão.      │
 * │                                                                      │
 * │ A página continua sendo o lugar que LÊ os dados. Aqui só se decide     │
 * │ como eles aparecem — e essa divisão é a mesma da ficha técnica, que    │
 * │ já separa a leitura de servidor do trabalho de cliente.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = {
  /** O cliente do cenário. A sobreposição desta sessão é aplicada aqui. */
  clienteDoCenario: ClienteOperacao;
  /** O `?aba=` já validado pela página. */
  abaAtual: AbaChave;
  consultoria: Consultoria | null;
  acoes: readonly AcaoPlano[];
  fichas: readonly Ficha[];
  processos: readonly Processo[];
  acompanhamentos: readonly Acompanhamento[];
  documentos: readonly Documento[];
  contratos: readonly Contrato[];
  eventos: readonly EventoHistorico[];
  tarefas: readonly Tarefa[];
  ingredientes: readonly Ingrediente[];
  precosDoCliente: Map<string, IngredienteDoCliente>;
  leadOrigem: Lead | null;
  diagnostico: Diagnostico | null;
};

export function TelaDoCliente({
  clienteDoCenario,
  abaAtual,
  consultoria,
  acoes,
  fichas,
  processos,
  acompanhamentos,
  documentos,
  contratos,
  eventos,
  tarefas,
  ingredientes,
  precosDoCliente,
  leadOrigem,
  diagnostico,
}: Props) {
  /*
    Assina o estado da sessão. Sem isto, o cabeçalho não repintaria ao salvar
    a gaveta — ele ficaria com o nome antigo até um recarregamento, que é
    exatamente o "salvou e não mudou nada" que a fase proíbe.
  */
  useDemonstracao();

  const cliente = clienteDaSessao(clienteDoCenario);

  /*
    O histórico ganha as linhas desta sessão NO TOPO. A alteração que ela
    acabou de fazer é o acontecimento mais recente do relacionamento — e
    sem isto a aba diria que nada aconteceu, logo depois de acontecer.
  */
  const historico = historicoDoClienteDaSessao(cliente.id, eventos);

  const base = `/clientes/${cliente.id}`;

  const conteudo = {
    "visao-geral": (
      <AbaVisaoGeral
        cliente={cliente}
        consultoria={consultoria}
        acoes={acoes}
        fichas={fichas}
        processos={processos}
        acompanhamentos={acompanhamentos}
        contratos={contratos}
        tarefas={tarefas.filter((t) => t.clienteId === cliente.id)}
      />
    ),
    diagnostico: (
      <AbaDiagnostico cliente={cliente} lead={leadOrigem} diagnostico={diagnostico} />
    ),
    consultoria: <AbaConsultoria cliente={cliente} consultoria={consultoria} acoes={acoes} />,
    fichas: (
      <AbaFichas
        cliente={cliente}
        fichas={fichas}
        ingredientes={ingredientes}
        precosDoCliente={precosDoCliente}
      />
    ),
    processos: <AbaProcessos cliente={cliente} processos={processos} />,
    acompanhamentos: (
      <AbaAcompanhamentos cliente={cliente} acompanhamentos={acompanhamentos} />
    ),
    documentos: (
      <AbaDocumentos
        cliente={cliente}
        documentos={documentos}
        contratos={contratos}
        consultoriaId={consultoria?.id ?? null}
      />
    ),
    historico: <AbaHistorico cliente={cliente} eventos={historico} />,
  }[abaAtual];

  /**
   * A contagem de cada aba é o tamanho da sua lista — número que se confere
   * abrindo a aba. As três primeiras ficam sem contagem de propósito: não há
   * o que contar em "visão geral", e mostrar "1" ao lado de "diagnóstico" ou
   * "consultoria" sugeriria uma medida onde só existe um registro.
   *
   * A aba Documentos conta contratos E documentos porque ela mostra os dois:
   * contar só os documentos faria o número discordar do que se vê ao abrir a
   * aba — o cartão de contratos está logo no topo, e um "2" ali em cima de
   * dois contratos seria lido como erro. As planilhas não entram na conta:
   * não são uma lista deste cliente, são uma ação que pode ser feita.
   */
  const abasComContagem = ABAS.map((a) => ({
    ...a,
    contagem:
      a.chave === "fichas"
        ? fichas.length
        : a.chave === "processos"
          ? processos.length
          : a.chave === "acompanhamentos"
            ? acompanhamentos.length
            : a.chave === "documentos"
              ? documentos.length + contratos.length
              : undefined,
  }));

  return (
    <div className="space-y-5">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para a carteira
      </Link>

      <CabecalhoPagina
        rotulo={ROTULO_ORIGEM[cliente.origem]}
        titulo={cliente.nomeFantasia}
        descricao={cliente.problemaDeclarado}
        acoes={
          <>
            <Etiqueta tom={TOM_SITUACAO_CLIENTE[cliente.situacao]}>
              {ROTULO_SITUACAO_CLIENTE[cliente.situacao]}
            </Etiqueta>
            <AcoesDoCliente cliente={cliente} />
          </>
        }
      />

      {/* Os seis campos exigidos pela Seção 3 — todos fato, nenhum cálculo. */}
      <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
        <ListaDados colunas={3}>
          <Dado rotulo="Empresa">{cliente.nomeFantasia}</Dado>
          <Dado rotulo="Responsável">{cliente.nomeContato}</Dado>
          <Dado rotulo="Tipo de negócio">{ROTULO_TIPO_NEGOCIO[cliente.tipoNegocio]}</Dado>
          <Dado rotulo="Modalidade">{ROTULO_MODALIDADE[cliente.modalidade]}</Dado>
          <Dado rotulo="Situação">
            {ROTULO_SITUACAO_CLIENTE[cliente.situacao]}
          </Dado>
          <Dado rotulo="Início do atendimento">{dataCurta(cliente.iniciadoEm)}</Dado>
          <Dado rotulo="Cidade">{cliente.cidade}</Dado>
          <Dado rotulo="Porte declarado">
            {cliente.porte === "PEQUENO"
              ? "Pequeno"
              : cliente.porte === "MEDIO"
                ? "Médio"
                : "Grande"}
          </Dado>
          <Dado rotulo="Equipe declarada">{cliente.funcionariosDeclarados}</Dado>
        </ListaDados>
      </div>

      <Abas abas={abasComContagem} atual={abaAtual} base={base} />

      <div>{conteudo}</div>

      {/*
        ESTE AVISO JÁ DISSE OUTRA COISA, E A OUTRA COISA DEIXOU DE SER
        VERDADE.

        Ele afirmava que a tela não mostrava "custo por prato, CMV, margem
        nem qualquer indicador financeiro" porque dependiam de metodologia
        não decidida. Isso era verdade quando foi escrito e não é mais: a
        ficha técnica calcula custo, CMV e markup a partir de valores que a
        consultora informa, e a margem de segurança é um parâmetro que ela
        preenche — o sistema não escolhe nenhum dos três.

        O que continua verdadeiro é a parte de baixo: nenhum número aqui é
        inventado, e onde a decisão é dela o sistema não decide.
      */}
      <Aviso tom="info" titulo="O que esta tela ainda não mostra">
        <p>
          O custo por prato, o CMV e o markup não aparecem nesta página. Não é
          por falta de cálculo: eles moram na ficha técnica, porque dependem
          dos pesos e dos preços daquele prato — e a mesma casa pode vender
          dois pratos com custos que não têm nada a ver um com o outro. Aqui
          fica o retrato do relacionamento; a conta fica onde os ingredientes
          estão.
        </p>
        <p className="mt-3">
          O que o sistema não faz em lugar nenhum é escolher por você: não
          existe margem padrão, CMV alvo padrão nem preço de venda sugerido.
          Onde o número dependeria de uma decisão sua, ele fica em branco até
          você informá-lo.
        </p>
      </Aviso>
    </div>
  );
}
