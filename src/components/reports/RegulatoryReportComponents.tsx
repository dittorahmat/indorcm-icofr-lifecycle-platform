import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export const ELCReport = () => <Card><CardContent className="p-4">ELC Report Content</CardContent></Card>;
export const TLCReport = () => <Card><CardContent className="p-4">TLC Report Content</CardContent></Card>;
export const ITGCReport = () => <Card><CardContent className="p-4">ITGC Report Content</CardContent></Card>;
export const FindingsReport = ({ deficiencies, controls }: any) => <Card><CardContent className="p-4">Findings Report Content</CardContent></Card>;
export const DoDReport = () => <Card><CardContent className="p-4">DoD Report Content</CardContent></Card>;
export const ChangeLogReport = () => <Card><CardContent className="p-4">Change Log Report Content</CardContent></Card>;
export const CSADocReport = () => <Card><CardContent className="p-4">CSA Doc Report Content</CardContent></Card>;
export const Lampiran11Report = ({ deficiencies, controls }: any) => <Card><CardContent className="p-4">Lampiran 11 Report Content</CardContent></Card>;
