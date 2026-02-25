# Mozart Hunter

Jogo educacional musical em navegador para treino progressivo de leitura de notas na pauta, com combate em tempo real.

Desenvolvido por **Alesson Lucas Oliveira de Queiroz**.

## Principais recursos

- Progressao didatica por notas: inicia com Do/Re e libera gradualmente ate C6.
- Sistema de estagios e niveis com aumento progressivo de dificuldade.
- Aceleracao dinamica ao longo de cada nivel (monstros, tiros e tempo de resposta).
- Multiplos backgrounds tematicos por estagio.
- Persistencia local em `localStorage` para retomada de progresso.
- Estado de campeao ao concluir todos os estagios.
- Interface responsiva para desktop e celular.
- Uso em celular com orientacao obrigatoria em paisagem.

## Tecnologias

- Vite
- TypeScript
- Canvas 2D

## Requisitos

- Node.js 18+
- npm 9+

## Como executar

```bash
npm install
npm run dev
```

Abra a URL exibida pelo Vite (geralmente `http://localhost:5173`).

## Build de producao

```bash
npm run build
npm run preview
```

## Estrutura de progresso

A progressao esta desacoplada para futura integracao com banco:

- Configuracao de estagios/niveis: `src/progression.ts`
- Armazenamento local atual: `src/state/progressStore.ts`
- Loop principal e aplicacao da dificuldade: `src/main.ts`

## Controles

- Clique/toque nos botoes de notas.
- Teclado: teclas exibidas em cada botao (quando aplicavel).

## Responsividade e orientacao

- Em celular, no modo retrato, o jogo bloqueia a interacao e pede rotacao para paisagem.
- O teclado de notas permite rolagem horizontal em telas menores.

## Licenca

Este projeto usa licenca **Freeware**. Veja [LICENCE](./LICENCE).
