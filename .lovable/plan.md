## Ajuste do tamanho da logo na sidebar

A logo SIAC SELC está exibida atualmente com altura `h-12` (48px) na sidebar expandida e `h-8` (32px) na versão recolhida, ficando visualmente pequena em relação ao restante do sistema.

### Alteração proposta

Em `src/components/AppSidebar.tsx`, no bloco do cabeçalho da sidebar:

- **Sidebar expandida**: aumentar a altura da logo de `h-12` para `h-20` (80px), com padding vertical maior (`py-6`) para respiro adequado.
- **Sidebar recolhida (modo ícone)**: aumentar de `h-8` para `h-10` (40px), mantendo proporção dentro da largura estreita.
- Manter `object-contain` e centralização para preservar a proporção original da imagem.

### Resultado esperado

A logo passa a ocupar um espaço proporcional ao header e aos itens do menu, ficando visualmente equilibrada com o restante da interface, tanto no estado expandido quanto recolhido.