"use client";

import { useEffect, useState } from "react";
import { Botao } from "@/components/ui/botao";

/**
 * O BOTÃO DE IMPRIMIR / SALVAR EM PDF.
 *
 * É um componente de cliente porque `window.print()` só existe no navegador.
 * Não usa biblioteca de PDF: o próprio diálogo de impressão do sistema
 * operacional já oferece "Salvar como PDF", com a mesma tipografia da tela.
 * Trazer uma biblioteca de PDF para cá seria carregar centenas de kB para
 * reproduzir mal o que o navegador faz bem — e o §34 pediu para não trazer
 * biblioteca grande sem necessidade.
 *
 * A barra que contém este botão leva `.nao-imprimir`, então ele não sai na
 * folha. Um botão de imprimir impresso é o detalhe que denuncia o descuido.
 */
export function BotaoImprimir({ rotulo = "Imprimir ou salvar em PDF" }: { rotulo?: string }) {
  // Só habilita depois de montar: sem JavaScript, um botão de imprimir que
  // não imprime é pior do que nenhum.
  const [pronto, setPronto] = useState(false);
  useEffect(() => setPronto(true), []);

  return (
    <Botao
      type="button"
      variante="primario"
      tamanho="sm"
      disabled={!pronto}
      onClick={() => window.print()}
    >
      {rotulo}
    </Botao>
  );
}
