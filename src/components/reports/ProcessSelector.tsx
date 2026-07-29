import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ProcessListItem } from '@/lib/reports/groupAnalysesByProcess';

interface ProcessSelectorProps {
  items: ProcessListItem[];
  value: string | null;
  onChange: (processo: string) => void;
  loading?: boolean;
}

export function ProcessSelector({ items, value, onChange, loading }: ProcessSelectorProps) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.processo === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Selecionar processo"
          className="w-full justify-between"
          disabled={loading}
        >
          <span className="truncate">
            {selected
              ? `${selected.processo} (${selected.total} análise${selected.total === 1 ? '' : 's'})`
              : loading
                ? 'Carregando processos…'
                : 'Selecione um processo…'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Buscar processo…" />
          <CommandList>
            <CommandEmpty>Nenhum processo encontrado.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.processo}
                  value={item.processo}
                  onSelect={() => {
                    onChange(item.processo);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === item.processo ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">
                    {item.processo} ({item.total})
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
