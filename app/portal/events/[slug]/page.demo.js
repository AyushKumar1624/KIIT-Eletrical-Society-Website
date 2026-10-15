import { EventScreen } from '@/components/portal/CommunicationScreens';
import { createDemoState } from '@/lib/portal/data.mjs';
import { notFound } from 'next/navigation';
export function generateStaticParams() { return createDemoState().events.map(e => ({slug:e.id})); }
export default async function Page({params}) { const {slug} = await params; if (!createDemoState().events.some(e => e.id === slug)) notFound(); return <EventScreen slug={slug} />; }
