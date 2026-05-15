## Ajuste da logo no sidebar

A logo atual no `AppSidebar.tsx` usa `h-20` (80px) quando expandido e `h-10` (40px) quando colapsado, com pouco padding ao redor. Visualmente fica pequena em relação à largura do sidebar.

### Alterações

**Arquivo:** `src/components/AppSidebar.tsx` (linhas 65-71)

1. Aumentar a altura da logo expandida de `h-20` para `h-32` (128px) e usar `w-full` para ocupar a largura disponível mantendo proporção via `object-contain`.
2. Aumentar a logo colapsada de `h-10 w-10` para `h-12 w-12` para melhor visibilidade.
3. Reduzir o padding vertical do container de `py-6` para `py-4` para dar mais espaço à logo sem inflar o cabeçalho.

### Resultado esperado

Logo proporcionalmente maior e centralizada, ocupando o cabeçalho do sidebar de forma equilibrada — sem distorção, mantendo a proporção original via `object-contain`.