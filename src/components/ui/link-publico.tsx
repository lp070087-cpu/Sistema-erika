"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Botao } from "./botao";

/**
 * ABRIR E COPIAR UM ENDEREÇO DE FORA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM COMPONENTE, E NÃO DOIS BOTÕES EM CADA TELA         │
 * │                                                                      │
 * │ "Copiar link" parece uma linha de código e não é. A Clipboard API    │
 * │ devolve uma promessa que falha em três situações reais: navegador    │
 * │ antigo, contexto não seguro (http) e permissão negada. Se cada tela   │
 * │ tratasse isso por si, uma diria "Link copiado" depois de uma cópia    │
 * │ que não aconteceu — e a consultora colaria o conteúdo antigo da       │
 * │ área de transferência na bio do Instagram sem perceber.               │
 * │                                                                      │
 * │ Aqui a mentira é impossível: o sucesso só é anunciado quando a        │
 * │ promessa resolve, e a falha tem mensagem própria.                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** Quanto tempo o retorno visual fica na tela. */
const DURACAO_AVISO_MS = 2400;

type EstadoCopia = "parado" | "copiado" | "falhou";

/**
 * Copia um texto e devolve o estado da tentativa.
 *
 * `navigator.clipboard` só existe em contexto seguro (https ou localhost).
 * Fora disso, o caminho é o antigo `execCommand`, que é feio e funciona —
 * desde que haja um campo selecionável de verdade no documento.
 */
async function copiar(texto: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
  } catch {
    // Cai para o caminho antigo abaixo. Não é erro fatal.
  }

  try {
    const campo = document.createElement("textarea");
    campo.value = texto;
    campo.setAttribute("readonly", "");
    campo.style.position = "fixed";
    campo.style.opacity = "0";
    document.body.appendChild(campo);
    campo.select();
    const deuCerto = document.execCommand("copy");
    document.body.removeChild(campo);
    return deuCerto;
  } catch {
    return false;
  }
}

/**
 * O botão de copiar, com o retorno visual que não mente.
 *
 * `aoCopiar` permite que a tela reaja — o `/meu-site` usa isso para trocar
 * a legenda de "sugestão de bio" para "copiada". É um aviso a mais, não
 * um substituto do aviso do botão.
 */
export function CopiarLink({
  texto,
  rotulo = "Copiar link",
  variante = "primario",
  tamanho = "md",
  className,
  aoCopiar,
}: {
  texto: string;
  rotulo?: string;
  variante?: "primario" | "secundario" | "linha" | "fantasma";
  tamanho?: "sm" | "md";
  className?: string;
  aoCopiar?: () => void;
}) {
  const [estado, setEstado] = useState<EstadoCopia>("parado");
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);

  // O aviso some sozinho. Sem a limpeza, uma tela desmontada durante os
  // 2,4s deixaria um `setState` pendente.
  useEffect(() => {
    return () => {
      if (relogio.current) clearTimeout(relogio.current);
    };
  }, []);

  async function aoClicar() {
    const deuCerto = await copiar(texto);
    setEstado(deuCerto ? "copiado" : "falhou");
    if (deuCerto) aoCopiar?.();

    if (relogio.current) clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setEstado("parado"), DURACAO_AVISO_MS);
  }

  const rotuloAtual =
    estado === "copiado" ? "Link copiado" : estado === "falhou" ? "Não foi possível copiar" : rotulo;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Botao
        type="button"
        variante={estado === "falhou" ? "secundario" : variante}
        tamanho={tamanho}
        onClick={aoClicar}
        aria-live="polite"
      >
        {rotuloAtual}
      </Botao>

      {/*
        A confirmação existe em TEXTO, ao lado do botão, e não só na troca
        do rótulo. Quem olha para o botão enquanto clica vê o rótulo mudar;
        quem usa leitor de tela ouve o `aria-live`. Os dois caminhos cobrem
        a mesma necessidade sem depender de um só.
      */}
      {estado === "copiado" ? (
        <span className="entrar-suave text-[0.8125rem] text-medio" role="status">
          Copiado.
        </span>
      ) : estado === "falhou" ? (
        <span className="entrar-suave text-[0.8125rem] text-red-800" role="status">
          Selecione o endereço e copie manualmente.
        </span>
      ) : null}
    </span>
  );
}

/**
 * Abre um endereço em nova aba, com as duas proteções que uma aba nova
 * precisa: `noopener` impede a página aberta de mexer nesta, e
 * `noreferrer` evita entregar a URL do sistema para o destino.
 *
 * Usa `window.open` em vez de `<a target="_blank">` porque na gaveta e em
 * cartão o elemento clicável é um botão — e um link estilizado como botão
 * dentro de outro link aninharia âncoras.
 */
export function AbrirLink({
  url,
  children,
  variante = "secundario",
  tamanho = "md",
  className,
}: {
  url: string;
  children: React.ReactNode;
  variante?: "primario" | "secundario" | "linha" | "fantasma";
  tamanho?: "sm" | "md";
  className?: string;
}) {
  return (
    <Botao
      type="button"
      variante={variante}
      tamanho={tamanho}
      className={className}
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
    >
      {children}
    </Botao>
  );
}

/**
 * COMPARTILHAR — a folha de compartilhamento do aparelho.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO NÃO MONTA UM LINK DE WHATSAPP                          │
 * │                                                                      │
 * │ O caminho óbvio seria `https://wa.me/<numero>?text=...`. Só que esse  │
 * │ endereço exige o NÚMERO DE TELEFONE de quem envia — e o sistema não   │
 * │ tem, nem deve ter, o telefone pessoal da consultora guardado para     │
 * │ montar link de divulgação. Colocar um número fixo aqui funcionaria    │
 * │ até ela trocar de número, e aí todo compartilhamento sairia errado    │
 * │ sem ninguém saber por quê.                                           │
 * │                                                                      │
 * │ A Web Share API resolve melhor e sem guardar nada: o aparelho abre a  │
 * │ folha nativa, com WhatsApp, Instagram, e-mail e o que mais ela tiver  │
 * │ instalado — e ela escolhe. O sistema não intermedia, não conhece o    │
 * │ número e não precisa de permissão nenhuma.                            │
 * │                                                                      │
 * │ Onde a API não existe (a maioria dos navegadores de desktop), o       │
 * │ botão cai para COPIAR, que é o que a pessoa faria em seguida de       │
 * │ qualquer forma. Nunca fica um botão que não faz nada.                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function CompartilharPublico({
  url,
  titulo,
  rotulo = "Compartilhar",
  variante = "secundario",
  tamanho = "md",
}: {
  url: string;
  titulo: string;
  rotulo?: string;
  variante?: "primario" | "secundario" | "linha" | "fantasma";
  tamanho?: "sm" | "md";
}) {
  const [aviso, setAviso] = useState<string | null>(null);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (relogio.current) clearTimeout(relogio.current);
    };
  }, []);

  function mostrarAviso(texto: string) {
    setAviso(texto);
    if (relogio.current) clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setAviso(null), DURACAO_AVISO_MS);
  }

  async function aoClicar() {
    // `navigator.share` pode existir e mesmo assim recusar (usuário cancela).
    // Cancelar não é erro, então o aviso de falha só aparece na cópia.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: titulo, url });
        return;
      } catch {
        // Cancelou ou o aparelho recusou — cai para a cópia.
      }
    }

    const deuCerto = await copiar(url);
    mostrarAviso(deuCerto ? "Link copiado." : "Selecione o endereço e copie manualmente.");
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Botao type="button" variante={variante} tamanho={tamanho} onClick={aoClicar}>
        {rotulo}
      </Botao>
      {aviso ? (
        <span className="entrar-suave text-[0.8125rem] text-[var(--tinta-suave)]" role="status">
          {aviso}
        </span>
      ) : null}
    </span>
  );
}

/**
 * O endereço em si, mostrado como texto selecionável.
 *
 * Existe separado dos botões porque copiar na mão precisa continuar
 * possível: se a Clipboard API falhar, o endereço tem de estar legível e
 * selecionável na tela, não só atrás de um botão.
 */
export function EnderecoPublico({ url, className }: { url: string; className?: string }) {
  return (
    <p
      className={cn(
        "tabular break-all text-[0.9375rem] leading-relaxed text-tinta select-all",
        className
      )}
    >
      {url}
    </p>
  );
}
