import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewReport } from '@/components/reports/OverviewReport';
import { ConsolidatedReport } from '@/components/reports/ConsolidatedReport';
import { SecretariaReport } from '@/components/reports/SecretariaReport';

const VALID_TABS = ['overview', 'consolidated', 'secretaria'] as const;
type TabValue = (typeof VALID_TABS)[number];

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const tab: TabValue = VALID_TABS.includes(raw as TabValue)
    ? (raw as TabValue)
    : 'overview';

  const handleTabChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground mt-1">
          Análise consolidada e insights sobre suas conformidades
        </p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="consolidated">Por Processo</TabsTrigger>
          <TabsTrigger value="secretaria">Por Secretaria</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewReport />
        </TabsContent>
        <TabsContent value="consolidated">
          <ConsolidatedReport />
        </TabsContent>
        <TabsContent value="secretaria">
          <SecretariaReport />
        </TabsContent>
      </Tabs>
    </>
  );
}
