import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { RiskLibrary, BUMNCluster, ControlAssertion } from '@shared/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, BookOpen, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface RiskLibraryLookupProps {
  onSelect: (riskDescription: string, assertions: ControlAssertion[]) => void;
}

export function RiskLibraryLookup({ onSelect }: RiskLibraryLookupProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedCluster, setSelectedCluster] = React.useState<BUMNCluster | "All">("All");
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: riskLibrary } = useQuery({
    queryKey: ['risklibrary'],
    queryFn: () => api<{ items: RiskLibrary[] }>('/api/risklibrary'),
  });

  const filteredRisks = React.useMemo(() => {
    if (!riskLibrary?.items) return [];
    return riskLibrary.items.filter(item => {
      const matchCluster = selectedCluster === "All" || item.cluster === selectedCluster;
      const matchSearch = item.riskDescription.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCluster && matchSearch;
    });
  }, [riskLibrary, selectedCluster, searchQuery]);

  const clusters: BUMNCluster[] = [
    "Umum", "Industri Energi", "Jasa Keuangan", "Industri Pangan dan Pupuk",
    "Industri Mineral dan Batubara", "Jasa Telekomunikasi dan Media",
    "Jasa Infrastruktur", "Jasa Asuransi dan Dana Pensiun",
    "Jasa Pariwisata dan Pendukung", "Industri Perkebunan dan Kehutanan",
    "Jasa Logistik"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Lookup Risk Library (Lampiran 2)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Risk Library - BUMN Clusters</DialogTitle>
          <DialogDescription>
            Pilih risiko standar berdasarkan klaster industri Anda (Referensi Lampiran 2).
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 py-4">
          <div className="w-1/3">
            <Select value={selectedCluster} onValueChange={(val) => setSelectedCluster(val as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Cluster" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Clusters</SelectItem>
                {clusters.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search risk description..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 border rounded-md p-4">
          <div className="space-y-4">
            {filteredRisks.length > 0 ? (
              filteredRisks.map((risk) => (
                <div key={risk.id} className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-primary/5">{risk.cluster}</Badge>
                    </div>
                    <p className="text-sm font-medium leading-relaxed">{risk.riskDescription}</p>
                    <div className="flex gap-1 flex-wrap">
                      {risk.suggestedAssertions.map(a => (
                        <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => {
                    onSelect(risk.riskDescription, risk.suggestedAssertions);
                    setIsOpen(false);
                  }}>
                    <Check className="h-4 w-4 mr-1" /> Select
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No risks found matching your criteria.
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
