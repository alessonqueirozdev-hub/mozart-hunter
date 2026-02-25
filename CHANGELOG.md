# Changelog

Todas as mudancas relevantes deste projeto serao documentadas aqui.

## [0.2.0] - 2026-02-25

### Adicionado

- Sistema completo de progressao por estagios e niveis.
- Curva didatica de notas com liberacao progressiva ate C6.
- Estrutura de persistencia local desacoplada para futura integracao com banco.
- Status de campeao ao finalizar todos os estagios.
- HUD com estagio, nivel e total de notas liberadas.
- Notificacao de tempo desde o ultimo progresso salvo.
- Variacao de atmosfera visual por estagio.
- Overlay de orientacao obrigatoria em paisagem para celulares.
- Layout responsivo para desktop e dispositivos moveis.
- Documentacao inicial do projeto (README, LICENCE).

### Alterado

- Monstros passam a nascer dentro da area visivel.
- Leve aumento de velocidade base dos monstros.
- Cadencia e velocidade de tiros ajustadas por dificuldade e por tempo no nivel.
- Teclado de notas adaptado para quantidade dinamica de notas ativas.

### Corrigido

- Situacao em que tiros podiam aparecer antes do jogador enxergar claramente o monstro.
- Ajustes de tipagem e compilacao TypeScript apos refatoracoes.

## [0.1.0] - 2026-02-24

### Adicionado

- Base jogavel inicial de Mozart Hunter.
- Sistema de combate por acerto de notas.
- HUD de pontuacao, vidas e efeitos visuais.
