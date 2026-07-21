import React from 'react';
import { CustomizableDashboard } from './CustomizableDashboard';

interface ReportDashboardProps {
  summaryData: any;
  isEffective: boolean;
}

export function ReportDashboard({ summaryData, isEffective }: ReportDashboardProps) {
  return (
    <CustomizableDashboard 
      summaryData={summaryData} 
      isEffective={isEffective} 
    />
  );
}
