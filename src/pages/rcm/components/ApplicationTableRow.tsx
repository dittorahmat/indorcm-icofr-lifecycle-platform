import { Edit, FileSearch, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Application } from '@shared/types';
import { criticalityBadge, itgcStatusBadge, significanceBadge } from '../soc-monitoring-badges';
import { SocBadge } from './SocBadge';

interface ApplicationTableRowProps {
  application: Application;
  onView: (application: Application) => void;
  onEdit: (application: Application) => void;
  onDelete: (application: Application) => void;
}

/**
 * Desktop adapter (`hidden md:block` table) for one significant application.
 * Badge decisions come from the shared seam; only layout + the
 * table-exclusive `ITGC Areas` / architecture-document cells live here.
 */
export function ApplicationTableRow({
  application,
  onView,
  onEdit,
  onDelete,
}: ApplicationTableRowProps) {
  const { t } = useTranslation(['rcm', 'common']);
  const mappedAreas = application.itgcAreas ?? [];
  const businessOwners = application.businessOwners ?? [];
  const applicationOwners = application.applicationOwners ?? [];

  return (
    <TableRow
      data-testid={`application-row-${application.id}`}
      className="hover:bg-indigo-50/30 transition-colors cursor-pointer group"
      onClick={() => onView(application)}
    >
      <TableCell className="font-semibold text-slate-800 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className="group-hover:text-indigo-600 group-hover:underline transition-colors">
            {application.name}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-11 sm:h-6 min-h-[44px] sm:min-h-0 px-2 sm:px-1.5 text-xs text-indigo-600 hover:bg-indigo-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100 focus-visible:opacity-100 transition-opacity"
            onClick={(event) => {
              event.stopPropagation();
              onView(application);
            }}
          >
            {t('rcm:application_detail.title', { defaultValue: 'Details' })}
          </Button>
        </div>
      </TableCell>
      <TableCell>
        <SocBadge spec={significanceBadge(!!application.isSignificant)} />
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {businessOwners.length > 0 ? (
            businessOwners.map((owner) => (
              <Badge key={owner} variant="secondary" className="text-xs bg-slate-100 text-slate-700 font-normal">
                {owner}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {applicationOwners.length > 0 ? (
            applicationOwners.map((owner) => (
              <Badge key={owner} variant="secondary" className="text-xs bg-indigo-50 text-indigo-700 font-normal border border-indigo-100">
                {owner}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-slate-400">-</span>
          )}
        </div>
      </TableCell>
      <TableCell onClick={(event) => event.stopPropagation()}>
        {application.architectureDocUrl || application.architectureDocName ? (
          <a
            href={application.architectureDocUrl || '#'}
            target="_blank"
            rel="noreferrer"
            download={application.architectureDocName || 'Architecture.pdf'}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-medium border border-blue-200 max-w-[160px] truncate"
            title={application.architectureDocName || t('rcm:soc.table.architecture_doc', { defaultValue: 'Architecture Document' })}
          >
            <FileSearch className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
            <span className="truncate">{application.architectureDocName || 'Architecture.pdf'}</span>
          </a>
        ) : (
          <span className="text-xs text-slate-400">
            {t('rcm:soc.table.no_document', { defaultValue: 'No document' })}
          </span>
        )}
      </TableCell>
      <TableCell>
        <SocBadge spec={criticalityBadge(application.criticality)} />
      </TableCell>
      <TableCell>
        <SocBadge spec={itgcStatusBadge(application.statusITGC)} />
      </TableCell>
      <TableCell>
        <span className={`font-bold ${application.linkedControlCount === 0 ? 'text-destructive' : 'text-slate-600'}`}>
          {application.linkedControlCount || 0}
        </span>
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <div className="flex gap-1 flex-wrap">
            {mappedAreas.map((area) => (
              <Tooltip key={area}>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 uppercase font-black cursor-help">
                    {area
                      .split(' ')
                      .map((word) => word[0])
                      .join('')}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{area}</p>
                </TooltipContent>
              </Tooltip>
            ))}
            {mappedAreas.length === 0 && (
              <span className="text-xs text-slate-400">
                {t('rcm:soc.table.no_mapping', { defaultValue: 'No mapping' })}
              </span>
            )}
          </div>
        </TooltipProvider>
      </TableCell>
      <TableCell className="text-right" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-wrap justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('common:actions.edit', { defaultValue: 'Edit application' })}
            className="h-11 w-11 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-slate-400 hover:text-indigo-600"
            onClick={() => onEdit(application)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('common:actions.delete', { defaultValue: 'Remove application' })}
            className="h-11 w-11 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 text-slate-400 hover:text-destructive"
            onClick={() => onDelete(application)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
