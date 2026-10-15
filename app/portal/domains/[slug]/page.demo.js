import { DomainScreen } from '@/components/portal/DomainScreens';
import { DOMAIN_CONFIG } from '@/lib/portal/config.mjs';
import { notFound } from 'next/navigation';
export function generateStaticParams() { return DOMAIN_CONFIG.map(d => ({slug:d.id})); }
export default async function Page({params}) { const {slug} = await params; if (!DOMAIN_CONFIG.some(d => d.id === slug)) notFound(); return <DomainScreen slug={slug} />; }
