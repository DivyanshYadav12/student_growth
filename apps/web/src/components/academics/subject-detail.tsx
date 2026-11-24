'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Bookmark, BookOpen, Check, ChevronDown, Circle, Clock3,
  ExternalLink, FileQuestion, FileText, FlaskConical, GraduationCap, ListChecks,
  PlayCircle, Search, Sparkles, Target, Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { ResourceType, Subject, SubjectResource, SubjectUnit } from '@/features/academics/data';

type Tab = 'overview' | 'syllabus' | 'resources' | 'practicals';
type ResourceFilter = 'All' | ResourceType;

const resourceIcon: Record<ResourceType, typeof FileText> = {
  Notes: FileText,
  Video,
  Quiz: FileQuestion,
  Reference: BookOpen,
  Practical: FlaskConical,
  Viva: GraduationCap,
};

const resourceTone: Record<ResourceType, string> = {
  Notes: 'bg-indigo-500/10 text-indigo-400',
  Video: 'bg-sky-500/10 text-sky-400',
  Quiz: 'bg-amber-500/10 text-amber-400',
  Reference: 'bg-violet-500/10 text-violet-400',
  Practical: 'bg-emerald-500/10 text-emerald-400',
  Viva: 'bg-rose-500/10 text-rose-400',
};

const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: 'overview', label: 'Overview', icon: Target },
  { id: 'syllabus', label: 'Syllabus', icon: ListChecks },
  { id: 'resources', label: 'Study resources', icon: BookOpen },
  { id: 'practicals', label: 'Practicals & viva', icon: FlaskConical },
];

function getAllResources(units: SubjectUnit[]) {
  return units.flatMap((unit) => unit.resources.map((resource) => ({ ...resource, unitTitle: unit.title, unitNumber: unit.number })));
}

function UnitStatus({ unit }: { unit: SubjectUnit }) {
  if (unit.status === 'completed') return <Badge tone="success"><Check size={12} className="mr-1"/>Completed</Badge>;
  if (unit.status === 'in-progress') return <Badge tone="info">In progress</Badge>;
  return <Badge tone="muted">Not started</Badge>;
}

function ResourceRow({
  resource,
  unitLabel,
  saved,
  onToggleSaved,
}: {
  resource: SubjectResource;
  unitLabel: string;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const Icon = resourceIcon[resource.type];
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 transition hover:border-indigo-500/30 sm:p-4">
      <div className="flex items-start gap-3">
        <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${resourceTone[resource.type]}`}><Icon size={18}/></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><Link href={`/academics/resources/${resource.id}`} className="text-sm font-semibold text-foreground hover:text-indigo-400">{resource.title}</Link><Badge tone="muted" className="px-2 py-0.5 text-[10px]">{resource.type}</Badge></div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{resource.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground"><span>{unitLabel}</span>{resource.duration && <><span>·</span><span>{resource.duration}</span></>}</div>
        </div>
        <button type="button" onClick={onToggleSaved} aria-label={saved ? 'Remove bookmark' : 'Bookmark resource'} aria-pressed={saved} className={`rounded-lg p-2 transition ${saved ? 'bg-indigo-500/10 text-indigo-400' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'}/></button>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <button type="button" onClick={() => setPreviewOpen((value) => !value)} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">{previewOpen ? 'Hide details' : 'Preview resource'} <ChevronDown size={13} className={`ml-1 inline transition ${previewOpen ? 'rotate-180' : ''}`}/></button>
        <Link href={`/academics/resources/${resource.id}`}><Button type="button" variant="outline" className="px-3 py-1.5 text-xs">Open <ExternalLink size={13}/></Button></Link>
      </div>
      {previewOpen && <div className="mt-3 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground"><p className="font-semibold text-foreground">Resource preview</p><p className="mt-1">This prototype shows the resource summary. The full file, video player, quiz runner, or practical workspace will be connected when the content backend is implemented.</p></div>}
    </div>
  );
}

function UnitAccordion({ unit, expanded, onToggle }: { unit: SubjectUnit; expanded: boolean; onToggle: () => void }) {
  const completed = unit.status === 'completed';
  return (
    <Card id={`unit-${unit.id}`} className="overflow-hidden">
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex w-full items-center gap-3 p-4 text-left sm:p-5">
        <div className={`grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${completed ? 'bg-emerald-500/10 text-emerald-300' : unit.status === 'in-progress' ? 'bg-indigo-500/10 text-indigo-300' : 'bg-muted text-muted-foreground'}`}>{completed ? <Check size={18}/> : String(unit.number).padStart(2, '0')}</div>
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold text-foreground">Unit {unit.number}: {unit.title}</h3><UnitStatus unit={unit}/></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{unit.description}</p><div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground"><span><Clock3 size={12} className="mr-1 inline"/>{unit.estimatedTime}</span><span>{unit.topics.length} topics</span><span>{unit.resources.length} resources</span></div></div>
        <ChevronDown size={18} className={`shrink-0 text-muted-foreground transition ${expanded ? 'rotate-180' : ''}`}/>
      </button>
      {expanded && <div className="border-t border-border bg-muted/60 px-4 pb-4 pt-4 sm:px-5"><div className="mb-4 flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">Unit progress</span><span className="text-xs font-semibold text-foreground">{unit.progress}%</span></div><div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${completed ? 'bg-emerald-500/100' : 'bg-indigo-500/100'}`} style={{ width: `${unit.progress}%` }}/></div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Topics covered</h4><div className="grid gap-2 sm:grid-cols-2">{unit.topics.map((topic) => <div key={topic} className="flex items-start gap-2 rounded-lg bg-card px-3 py-2.5 text-xs text-muted-foreground"><Circle size={7} className="mt-1 shrink-0 fill-slate-300 text-muted-foreground"/>{topic}</div>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-muted-foreground">{unit.resources.length} learning resources available</span><Button type="button" className="px-3 py-2 text-xs" onClick={() => document.getElementById(`unit-resources-${unit.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>View unit resources <ArrowRight size={13}/></Button></div><div id={`unit-resources-${unit.id}`} className="mt-3 space-y-2">{unit.resources.map((resource) => <div key={resource.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"><span className={`grid size-7 place-items-center rounded-md ${resourceTone[resource.type]}`}><span className="text-[10px] font-bold">{resource.type.slice(0, 1)}</span></span><span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground"><Link href={`/academics/resources/${resource.id}`} className="hover:text-indigo-400">{resource.title}</Link></span><span className="text-[10px] text-muted-foreground">{resource.type}</span></div>)}</div></div>}
    </Card>
  );
}

export function SubjectDetail({ subject }: { subject: Subject }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [expandedUnit, setExpandedUnit] = useState<string | null>(subject.units.find((unit) => unit.status === 'in-progress')?.id ?? subject.units[0]?.id ?? null);
  const [resourceQuery, setResourceQuery] = useState('');
  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>('All');
  const [savedResources, setSavedResources] = useState<string[]>([]);

  const allResources = useMemo(() => getAllResources(subject.units), [subject.units]);
  const filteredResources = allResources.filter((resource) => {
    const matchesQuery = `${resource.title} ${resource.description} ${resource.unitTitle}`.toLowerCase().includes(resourceQuery.toLowerCase());
    const matchesType = resourceFilter === 'All' || resource.type === resourceFilter;
    return matchesQuery && matchesType;
  });
  const practicalResources = allResources.filter((resource) => resource.type === 'Practical' || resource.type === 'Viva');
  const currentUnit = subject.units.find((unit) => unit.status === 'in-progress') ?? subject.units[0];

  function toggleSaved(resourceId: string) {
    setSavedResources((current) => current.includes(resourceId) ? current.filter((id) => id !== resourceId) : [...current, resourceId]);
  }

  return (
    <div className="space-y-6">
      <Link href="/academics" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-indigo-400"><ArrowLeft size={16}/> Back to subjects</Link>

      <Card className="overflow-hidden border-indigo-500/30">
        <div className="bg-gradient-to-br from-indigo-500/10 via-card to-sky-500/10 p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div className="max-w-3xl"><div className="mb-3 flex flex-wrap items-center gap-2"><Badge tone="info">{subject.code}</Badge><Badge tone="muted">Semester {subject.semester}</Badge><Badge tone="muted">{subject.credits} credits</Badge></div><h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-[32px]">{subject.name}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{subject.description}</p><div className="mt-5 flex flex-wrap items-center gap-3"><Button type="button" onClick={() => { setActiveTab('syllabus'); if (currentUnit) setExpandedUnit(currentUnit.id); }}> <PlayCircle size={16}/> Continue learning</Button><Button type="button" variant="outline" onClick={() => setActiveTab('resources')}><BookOpen size={16}/> Browse resources</Button></div></div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[250px]"><div className="rounded-2xl border border-white bg-card/80 p-4"><p className="text-xs text-muted-foreground">Subject progress</p><p className="mt-1 text-2xl font-bold text-foreground">{subject.progress}%</p><div className="mt-3 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-indigo-500/100" style={{ width: `${subject.progress}%` }}/></div></div><div className="rounded-2xl border border-white bg-card/80 p-4"><p className="text-xs text-muted-foreground">Units completed</p><p className="mt-1 text-2xl font-bold text-foreground">{subject.completedUnits}<span className="text-base font-medium text-muted-foreground">/{subject.totalUnits}</span></p><p className="mt-2 text-[11px] text-muted-foreground">{subject.totalUnits - subject.completedUnits} remaining</p></div></div>
          </div>
        </div>
        <div className="grid gap-3 border-t border-border bg-card px-5 py-4 sm:grid-cols-3 sm:px-7"><div className="flex items-center gap-2 text-xs text-muted-foreground"><GraduationCap size={15} className="text-indigo-500"/> {subject.category}</div><div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 size={15} className="text-indigo-500"/> {allResources.length} learning resources</div><div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles size={15} className="text-indigo-500"/> {subject.units.length} units · Semester {subject.semester}</div></div>
      </Card>

      <div className="-mx-1 overflow-x-auto px-1"><div role="tablist" aria-label="Subject sections" className="flex min-w-max gap-1 rounded-xl border border-border bg-card p-1">{tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition sm:px-4 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><Icon size={15}/>{tab.label}</button>; })}</div></div>

      {activeTab === 'overview' && <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-4"><div><h2 className="font-semibold text-foreground">Syllabus at a glance</h2><p className="mt-1 text-sm text-muted-foreground">A structured view of the topics in this subject.</p></div><div className="space-y-3">{subject.units.map((unit) => <UnitAccordion key={unit.id} unit={unit} expanded={expandedUnit === unit.id} onToggle={() => setExpandedUnit((current) => current === unit.id ? null : unit.id)}/>)}</div><Button type="button" variant="outline" className="w-full" onClick={() => setActiveTab('syllabus')}>View complete syllabus <ArrowRight size={15}/></Button></section>
        <aside className="space-y-4"><Card><CardHeader><div><h2 className="font-semibold text-foreground">Your next step</h2><p className="mt-1 text-xs text-muted-foreground">Recommended based on your progress</p></div><Badge tone="info">Recommended</Badge></CardHeader><CardContent><div className="mt-4 rounded-xl bg-indigo-500/10 p-4"><div className="flex items-center gap-2 text-indigo-300"><Target size={16}/><span className="text-xs font-semibold">Unit {currentUnit?.number ?? 1}</span></div><h3 className="mt-2 font-semibold text-foreground">{currentUnit?.title ?? 'Start your first unit'}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{currentUnit?.description ?? 'Begin with the introductory concepts.'}</p><div className="mt-3 flex items-center justify-between text-xs"><span className="text-muted-foreground">Unit progress</span><span className="font-semibold text-foreground">{currentUnit?.progress ?? 0}%</span></div><div className="mt-1.5 h-1.5 rounded-full bg-card"><div className="h-full rounded-full bg-indigo-500/100" style={{ width: `${currentUnit?.progress ?? 0}%` }}/></div><Button type="button" className="mt-4 w-full" onClick={() => { setActiveTab('syllabus'); if (currentUnit) setExpandedUnit(currentUnit.id); }}>Resume this unit <ArrowRight size={14}/></Button></div></CardContent></Card>
          <Card><CardHeader><div><h2 className="font-semibold text-foreground">Learning checklist</h2><p className="mt-1 text-xs text-muted-foreground">A balanced way to prepare</p></div></CardHeader><CardContent><div className="space-y-3">{[{label:'Review the unit notes',done:allResources.some(r=>r.type==='Notes')},{label:'Watch concept explanations',done:allResources.length>0},{label:'Attempt practice questions',done:allResources.some(r=>r.type==='Practical'||r.type==='Quiz')},{label:'Revise practical and viva topics',done:practicalResources.length>0}].map((item) => <div key={item.label} className="flex items-center gap-2 text-xs"><span className={`grid size-5 place-items-center rounded-full ${item.done ? 'bg-emerald-500/15 text-emerald-400' : 'border border-border text-muted-foreground'}`}>{item.done && <Check size={12}/>}</span><span className={item.done ? 'text-muted-foreground line-through' : 'text-muted-foreground'}>{item.label}</span></div>)}</div></CardContent></Card>
          <Card className="border-amber-500/30 bg-amber-500/10/60"><CardContent className="pt-5"><div className="flex items-center gap-2 text-amber-300"><Sparkles size={16}/><span className="text-xs font-semibold">Study tip</span></div><p className="mt-2 text-xs leading-5 text-muted-foreground">After reading a unit&apos;s notes, close them and write the key operations from memory. Retrieval practice exposes what you truly understand versus what merely felt familiar.</p></CardContent></Card></aside>
      </div>}

      {activeTab === 'syllabus' && <section className="space-y-4"><div><h2 className="font-semibold text-foreground">Subject syllabus</h2><p className="mt-1 text-sm text-muted-foreground">Expand a unit to see its topics, resources, and progress.</p></div><div className="space-y-3">{subject.units.map((unit) => <UnitAccordion key={unit.id} unit={unit} expanded={expandedUnit === unit.id} onToggle={() => setExpandedUnit((current) => current === unit.id ? null : unit.id)}/>)}</div></section>}

      {activeTab === 'resources' && <section className="space-y-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="font-semibold text-foreground">Study resources</h2><p className="mt-1 text-sm text-muted-foreground">Find notes, video lessons, references, quizzes, and more.</p></div><Badge tone="muted">{allResources.length} resources</Badge></div><div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row"><label className="relative min-w-0 flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={resourceQuery} onChange={(event) => setResourceQuery(event.target.value)} placeholder="Search resources" className="h-10 w-full rounded-xl border border-border pl-9 pr-3 text-sm outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-500/30"/></label><select aria-label="Filter resources by type" value={resourceFilter} onChange={(event) => setResourceFilter(event.target.value as ResourceFilter)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground outline-none focus:border-indigo-400">{['All', 'Notes', 'Video', 'Quiz', 'Reference', 'Practical', 'Viva'].map((type) => <option key={type} value={type}>{type === 'All' ? 'All resource types' : type}</option>)}</select></div>{filteredResources.length ? <div className="grid gap-3 lg:grid-cols-2">{filteredResources.map((resource) => <ResourceRow key={resource.id} resource={resource} unitLabel={`Unit ${resource.unitNumber}: ${resource.unitTitle}`} saved={savedResources.includes(resource.id)} onToggleSaved={() => toggleSaved(resource.id)}/>)}</div> : <Card className="p-8 text-center"><p className="font-semibold text-foreground">No matching resources</p><p className="mt-1 text-sm text-muted-foreground">Try a different keyword or resource type.</p><Button type="button" variant="outline" className="mt-3" onClick={() => { setResourceQuery(''); setResourceFilter('All'); }}>Clear filters</Button></Card>}</section>}

      {activeTab === 'practicals' && <section className="space-y-4"><div><h2 className="font-semibold text-foreground">Practicals and viva preparation</h2><p className="mt-1 text-sm text-muted-foreground">Apply concepts through practical tasks and explain your reasoning in viva practice.</p></div><div className="grid gap-4 sm:grid-cols-2"><Card className="border-emerald-500/30 bg-emerald-500/10/40 p-5"><div className="grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-300"><FlaskConical size={19}/></div><h3 className="mt-3 font-semibold text-foreground">Practical exercises</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Implement stacks, queues, linked lists, trees, and graphs; trace traversals and analyse complexities.</p><p className="mt-3 text-xs font-medium text-emerald-300">{practicalResources.filter((resource) => resource.type === 'Practical').length} practical resources</p></Card><Card className="border-rose-500/30 bg-rose-500/10/40 p-5"><div className="grid size-10 place-items-center rounded-xl bg-rose-500/15 text-rose-300"><GraduationCap size={19}/></div><h3 className="mt-3 font-semibold text-foreground">Viva preparation</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Be ready to explain ADTs, recursion, traversal orders, complexity classes, and graph algorithms aloud.</p><p className="mt-3 text-xs font-medium text-rose-300">{practicalResources.filter((resource) => resource.type === 'Viva').length} viva resources</p></Card></div>{practicalResources.length ? <div className="grid gap-3 lg:grid-cols-2">{practicalResources.map((resource) => <ResourceRow key={resource.id} resource={resource} unitLabel={resource.unitTitle} saved={savedResources.includes(resource.id)} onToggleSaved={() => toggleSaved(resource.id)}/>)}</div> : <Card className="p-6 text-sm text-muted-foreground">Practical and viva resources will appear here when they are added to this subject.</Card>}<Card className="border-dashed bg-muted/60"><CardContent className="pt-5"><p className="text-sm font-semibold text-foreground">Coming in a later integration</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Practical submission, SQL execution, AI viva simulation, and performance feedback will connect to their respective backend modules.</p></CardContent></Card></section>}

      <div className="flex flex-col justify-between gap-3 border-t border-border pt-5 sm:flex-row sm:items-center"><p className="text-xs text-muted-foreground">{subject.code} · Semester {subject.semester} curriculum</p><Link href="/academics" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300">All subjects <ArrowRight size={13}/></Link></div>
    </div>
  );
}
