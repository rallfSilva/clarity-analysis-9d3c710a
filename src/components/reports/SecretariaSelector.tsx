import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface SecretariaListItem {
  sigla: string;
  nome?: string;
  total: number;
  lastAt: string;
}

interface SecretariaSelectorProps {
  items: SecretariaListItem[];
  value: string | null;
  onChange: (sigla: string) => void;
  loading?: boolean;
}

export function SecretariaSelector({ items, value, onChange, loading }: SecretariaSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.sigla === value);

  const label = selected
    ? `${selected.sigla} (${selected.total} análise${selected.total === 1 ? '' : 's'})`
    : loading
      ? 'Carregando secretarias…'
      : 'Selecione uma secretaria…';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecionar secretaria"
          className="w-full md:w-[420px] justify-between"
          disabled={loading}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar secretaria…" />
          <CommandList>
            <CommandEmpty>Nenhuma secretaria encontrada.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.sigla}
                  value={`${item.sigla} ${item.nome ?? ''}`}
                  onSelect={() => {
                    onChange(item.sigla);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.sigla ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="truncate font-medium">
                      {item.sigla} ({item.total})
                    </span>
                    {item.nome && (
                      <span className="truncate text-xs text-muted-foreground">
                        {item.nome}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
