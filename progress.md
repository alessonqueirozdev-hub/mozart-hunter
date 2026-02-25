Original prompt: Bom dia. Precisamos de algumas correções importantes! O mozart atualmente esta flutuando e o tiro do mozart esta descendo diagonalmente ao inves de ser reto! o tiro do monstro é reto, mas o tiro do mozart não. Isso faz com que o tiro do mozart só consiga interceptar o tiro do monstro se o tiro do monstro estiver até certo angulo! isso atrabalha a jogabilidade. Tem partes do rosto do mozart que estão cortadas e ele esta flutuando ao inves de estar com os pés no chão! numa ultima alteração, adicionei uma cauda na roupa do mozart, mas parece que ela pode estar atrapalhando o mozart de repousar os pés no chão. Corrija isto! Gostaria de melhorias no background também, tem muita coisa que foje do mundo fisico, o jogo precisa obedecer o mínimo do mundo fisico pelo menos!

## 2026-02-25
- Investigação inicial concluída.
- Causa encontrada: `PlayerProjectile` usa mira em direção ao monstro (dx/dy), resultando em trajetória diagonal.
- Próximos passos: deixar tiro do Mozart reto na horizontal, ajustar ancoragem/desenho do Mozart (evitar flutuação e corte), e reduzir elementos fisicamente incoerentes no background.
## 2026-02-25 (continuação)
- Implementado `MOZART_X` e `MOZART_Y` em `constants.ts` para centralizar posição do personagem.
- `PlayerProjectile` alterado para trajetória horizontal reta (`vx=18`, `vy=0`).
- `MonsterProjectile` ajustado para mirar em `MOZART_X/MOZART_Y`.
- `main.ts` atualizado para usar `MOZART_X/MOZART_Y` em desenho e efeitos.
- `mozart.ts`: removido bob vertical (fim da flutuação), reduzida rotação, sombra aproximada dos pés, caudas encurtadas para não ultrapassar os pés, ajuste da fita para evitar corte visual no rosto.
- `backgrounds.ts`: reduzidos elementos muito surreais (menos notas e claves no céu, lua menor e menos exagerada).
## 2026-02-25 (validação)
- Build validado com sucesso: `npm.cmd run build`.
- Teste Playwright executado em servidor local com screenshots em `output/web-game/shot-*.png`.
- Confirmações visuais:
  - Mozart sem flutuação perceptível e com pés apoiados na linha do piso.
  - Rosto sem corte visível após ajuste da fita/peruca.
  - Projétil do Mozart agora segue horizontalmente (reto), com interceptação consistente.
  - Background ficou menos "fora do mundo físico" (menos claves/notas flutuantes e lua menos exagerada).
- Observação: `errors-0.json` atual no diretório é de um teste antigo em `file://` (CORS), não do teste HTTP local.

### TODO / sugestões próximas
- Se quiser realismo ainda maior, próximo passo é reduzir mais o brilho neon do piso e remover as últimas notas decorativas do céu.
## 2026-02-25 (SMuFL/Bravura)
- Fonte `Bravura.otf` copiada para `public/fonts/Bravura.otf`.
- Adicionado `@font-face` para Bravura em `src/style.css`.
- Criado `src/graphics/smuflGlyphs.ts` com glifos SMuFL essenciais (clave e noteheads).
- `src/graphics/staff.ts` reescrito para renderização baseada em glifos SMuFL + Bravura em canvas.
- Incluído fallback quando Bravura ainda não carregou (glyph Unicode/manual).
- Validação visual adicional feita com screenshot full-page (`output/web-game/fullpage-staff.png`).
- Resultado: pauta renderizando com glifos SMuFL (clave e cabeça da nota) via fonte Bravura, sem distorção de baseline.
- Próximo refinamento opcional: acrescentar acidentes (sustenido/bemol) e flags SMuFL para notas com colcheias/semi-colcheias, se o jogo passar a usar ritmos.
- Ajuste adicional solicitado: fundo da pauta transparente/branco já aplicado, mas nota/haste ainda estavam fora do esperado.
- Iniciada correção de stack de fontes para seguir MusiMind (incluindo Bravura Text).
- Correção final aplicada com referência no `unified-staff-renderer`: alinhamento de clave/cabeça/haste pelo `staffSpace` e largura real do glyph.
- Inclusão de `Bravura Text` no stack para evitar fallback quadrado no notehead.
- Validação visual: `output/web-game/fullpage-staff-v3.png`.
## 2026-02-25 (refino de engraving + novas claves)
- `staff.ts` refinado com geometria no padrão do renderer de referência (notehead width real, stem anchoring e ledger centradas).
- Suporte estrutural para claves: `treble`, `bass` (fá), `alto` (dó) e `tenor`.
- Conversão interna de `sp` (base treble) para cada clave via offsets diatônicos.
- Seleção de clave por URL para expansão do jogo: `?clef=treble|bass|alto|tenor` (aliases: `fa`, `do`).
## 2026-02-25 (mozart svg)
- Copiado C:\Users\Alesson Queiroz\Downloads\mozart.svg para public/mozart.svg.
- src/graphics/mozart.ts refeito para renderizar o Mozart via SVG mantendo animacoes existentes de pose da batuta, flash de tiro, aura de raiva e hit flash.
- getMozartBatonTip() continua calculando a ponta da batuta com a mesma logica de ciclo de regencia/disparo para nao quebrar a origem dos projetis.

## 2026-02-25 (correcao pos-feedback)
- Corrigido src/graphics/mozart.ts para eliminar a batuta extra desenhada em overlay.
- Ajustada ancoragem vertical do SVG (SPRITE_Y_OFFSET) para os pes encostarem no piso.
- Implementada animacao de braco com recorte + rotacao do proprio SVG para manter a sensacao de regencia/disparo sem elementos duplicados.

## 2026-02-25 (ajuste matematico pos offset=100)
- Coordenadas do braco/batuta agora acompanham SPRITE_Y_OFFSET via Y_DELTA em src/graphics/mozart.ts.
- Pivo do braco, area de recorte animada e centro da aura foram reancorados matematicamente para evitar dessintonia visual.
- Intensidade da animacao do braco aumentada para ficar visivel no SVG.
- Altura base do monstro alterada para referencia de Mozart (MOZART_Y + 8) em src/entities/Monster.ts.
- Build validado com sucesso apos ajustes.

## 2026-02-25 (correcao definitiva braco/batuta)
- src/graphics/mozart.ts agora usa composicao (destination-out) para remover o braco estatico do SVG e redesenhar apenas o braco/batuta rotacionado do proprio SVG.
- Removido efeito de batuta duplicada: o corpo continua unico e so o recorte do braco e animado.
- getMozartBatonTip() foi recalculado com a mesma transformacao do braco animado (pivot + rotacao), garantindo spawn do tiro na ponta visual da batuta.
- Adicionado glow discreto na ponta durante disparo para facilitar percepcao de origem.
- Build validado com sucesso.

## 2026-02-25 (fix braco sem movimento + piscando)
- Removido glow da ponta da batuta em mozart.ts (era o elemento piscando relatado).
- Aumentada amplitude de rotacao do braco para movimento visivel em runtime.
- Mascara do braco ampliada/reposicionada para cobrir corretamente a regiao do braco/batuta no SVG unico.
- Build validado com sucesso.

## 2026-02-25 (animacao minima no SVG)
- src/graphics/mozart.ts: adicionado movimento minimo no Mozart sem recortes internos.
- Implementado idle sutil (respiracao + micro oscilacao) e recoil leve no disparo.
- getMozartBatonTip() atualizado para considerar escala X/Y + rotacao, mantendo origem do tiro consistente com o sprite animado.
- Build validado com sucesso.

## 2026-02-25 (animacao no proprio SVG)
- Criados public/mozart-idle.svg e public/mozart-shoot.svg a partir do SVG atual.
- mozart-idle.svg: loop de passos no proprio SVG via CSS keyframes (mozartStep).
- mozart-shoot.svg: mantem loop base + camada de braco/mao/batuta com clip/mask e rotacao de disparo (mozartShoot).
- src/graphics/mozart.ts atualizado para alternar sprites (idle/shoot) automaticamente com _shootFlash.
- Ponta logica da batuta diferenciada entre idle e shoot para spawn do tiro acompanhar melhor o gesto.
- Build validado com sucesso.

## 2026-02-25 (fix mozart-shoot sem quebrar rosto)
- public/mozart-shoot.svg reconstruido sem mask, clipPath ou defs globais.
- IDs adicionados nos grupos exatos informados pelo usuario: shoot-hand, shoot-baton-front, shoot-baton-back, shoot-baton-head.
- Animacao de disparo ajustada para movimento pequeno:
  - mao: rotacao -7deg + translate(3,-4)
  - batuta (frente/tras/cabeca): rotacao -10deg + translate(8,-8)
- Rosto/cabeca preservados (sem recorte global).
- Build validado com sucesso.

## 2026-02-25 (VivusJS integrado)
- Instalado ivus via npm.
- Criado public/mozart-line.svg (versao em traço) para animacao de desenho no Vivus.
- index.html: adicionado container #mozart-vivus no overlay inicial.
- src/style.css: estilos do container SVG de intro.
- Novo modulo src/ui/mozartVivus.ts: carrega Vivus dinamicamente e toca animacao no start overlay.
- src/ui/hud.ts: showStartOverlay() agora dispara playMozartVivusIntro().
- Adicionada tipagem local src/types/vivus.d.ts para TS.
- Build validado com sucesso.

## 2026-02-25 (calibracao fina Vivus)
- src/ui/mozartVivus.ts: duration ajustado de 180 para 130 (entrada mais rapida e limpa).
- public/mozart-line.svg: traço refinado para stroke #f6dc9e, stroke-width 2.25, stroke-opacity .95, ector-effect non-scaling-stroke.
- src/style.css: container #mozart-vivus calibrado para 236x236, sombra mais suave e margem menor.
- Build validado com sucesso.

## 2026-02-25 (fonte React como base oficial do Mozart)
- Importado src/graphics/mozart-hunter.js e extraido o <svg> para public/mozart.svg.
- Regenerados public/mozart-idle.svg e public/mozart-shoot.svg a partir dessa nova base (proveniente do React).
- Mantidas animacoes pontuais no shoot apenas para shoot-hand, shoot-baton-front, shoot-baton-back, shoot-baton-head (sem mascara global).
- Build validado com sucesso.

## 2026-02-25 (fix real para shoot no canvas)
- Causa raiz identificada: animacao CSS interna do SVG nao era confiavel no fluxo Image + canvas.
- public/mozart-shoot.svg convertido para pose estatica de disparo (sem keyframes), alterando apenas:
  - shoot-hand
  - shoot-baton-front
  - shoot-baton-back
  - shoot-baton-head
- Rosto/cabeca preservados (sem mascara/recorte global).
- Transformacoes ampliadas em coordenadas do SVG (viewBox grande) para movimento ficar visivel no jogo.
- src/graphics/mozart.ts: ponta da batuta em shoot recalibrada (SHOOT_TIP_LOCAL_X/Y) para o tiro sair mais perto da nova pose.
- Build validado com sucesso.

## 2026-02-25 (fix overlay inicial quebrado)
- Causa: `#mozart-vivus` reservava uma área grande no topo; quando o Vivus não renderizava imediatamente, aparecia um "buraco" visual na tela inicial.
- `src/ui/mozartVivus.ts`: adicionado fallback estático com `mozart-idle.svg` dentro de `#mozart-vivus`.
- `src/ui/mozartVivus.ts`: classe `has-vivus` aplicada somente após inicialização bem-sucedida do Vivus.
- `src/style.css`: card inicial compactado (`.ocard` com padding menor) e bloco do Mozart reduzido (`170x170`) para eliminar espaço vazio excessivo.
- `src/style.css`: criados estilos para `#mozart-vivus-target` + `.mozart-vivus-fallback`, com transição quando Vivus carrega.
- Build validado com sucesso: `npm.cmd run build`.
- Tentativa de validação Playwright não concluída neste ambiente devido `spawn EPERM` ao lançar `chrome-headless-shell`.
