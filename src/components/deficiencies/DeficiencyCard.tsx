import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Users } from 'lucide-react';
import type { Deficiency, ActionPlan } from '@shared/types';
import { cn } from '@/lib/utils';
import { getDeficiencyDistribution } from '@/lib/compliance-utils';

interface DeficiencyCardProps {
  deficiency: Deficiency;
  actionPlan?: ActionPlan;
}

export function DeficiencyCard({ deficiency, actionPlan }: DeficiencyCardProps) {
  const distribution = getDeficiencyDistribution(deficiency.severity);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: actionPlan?.id || deficiency.id });
  // ... rest of the setup
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
  };

  const severityVariant = {
    'Material Weakness': 'destructive',
    'Significant Deficiency': 'secondary',
    'Control Deficiency': 'outline',
  } as const;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      animate={{ scale: isDragging ? 1.05 : 1 }}
      whileHover={{ y: -2, scale: 1.02 }}
      className="mb-4"
    >
      <Card className={cn("bg-background hover:shadow-md transition-shadow", isDragging && "shadow-xl ring-2 ring-primary")}>
        <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
          <CardTitle className="text-base font-medium leading-tight">{deficiency.description}</CardTitle>
          <div {...attributes} {...listeners} className="cursor-grab p-2 -m-2 text-muted-foreground hover:text-foreground">
            <GripVertical className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <Badge variant={severityVariant[deficiency.severity]}>{deficiency.severity}</Badge>
            {actionPlan && (
              <span className="text-xs">
                Due: {new Date(actionPlan.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-muted">
             <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase mb-1.5">
                <Users className="h-3 w-3" /> Report Distribution (Tabel 24)
             </div>
             <div className="flex flex-wrap gap-1">
                {distribution.map((stakeholder, i) => (
                  <Badge key={i} variant="secondary" className="text-[9px] bg-muted/50 border-none font-normal">
                    {stakeholder}
                  </Badge>
                ))}
             </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}