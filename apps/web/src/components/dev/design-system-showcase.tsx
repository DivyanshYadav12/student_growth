'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Info, MoreHorizontal, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

export function DesignSystemShowcase() {
  const [progress, setProgress] = useState(68);
  const [notifications, setNotifications] = useState(true);
  const [remember, setRemember] = useState(true);
  const [level, setLevel] = useState('beginner');

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><Badge tone="info" className="mb-3">Developer preview</Badge><h1 className="text-3xl font-bold tracking-tight">Design system</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">The shared shadcn/ui component foundation used across Dashboard, Academics, Skill Quest and future platform modules.</p></div>
        <div className="flex items-center gap-2"><Avatar><AvatarFallback>SG</AvatarFallback></Avatar><span className="text-sm font-medium">Student Growth UI</span></div>
      </div>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Buttons & badges</CardTitle><CardDescription>Consistent actions and semantic statuses.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2"><Button>Primary action</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="destructive">Destructive</Button><Button size="icon" variant="outline" aria-label="More actions"><MoreHorizontal/></Button></div>
            <Separator/>
            <div className="flex flex-wrap gap-2"><Badge>Default</Badge><Badge variant="secondary">Secondary</Badge><Badge tone="success">Mastered</Badge><Badge tone="warning">In progress</Badge><Badge tone="info">Recommended</Badge><Badge tone="muted">Not started</Badge><Badge variant="outline">Draft</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Form controls</CardTitle><CardDescription>Accessible inputs and labels for onboarding and settings.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label htmlFor="showcase-name">Display name</Label><Input id="showcase-name" placeholder="Enter your name" defaultValue="Student Account"/></div>
            <div className="grid gap-2"><Label htmlFor="showcase-notes">Learning goal</Label><Textarea id="showcase-notes" placeholder="What would you like to achieve?" rows={2}/></div>
            <div className="grid gap-2"><Label>Current experience</Label><Select value={level} onValueChange={setLevel}><SelectTrigger><SelectValue placeholder="Select experience"/></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select></div>
            <div className="flex items-center justify-between"><div><Label htmlFor="showcase-notifications">Study reminders</Label><p className="text-xs text-muted-foreground">Receive daily learning nudges</p></div><Switch id="showcase-notifications" checked={notifications} onCheckedChange={setNotifications}/></div>
            <div className="flex items-center gap-2"><Checkbox id="showcase-remember" checked={remember} onCheckedChange={(checked) => setRemember(checked === true)}/><Label htmlFor="showcase-remember">Remember this preference</Label></div>
            <RadioGroup defaultValue="daily" className="flex flex-wrap gap-4"><div className="flex items-center gap-2"><RadioGroupItem id="goal-daily" value="daily"/><Label htmlFor="goal-daily">Daily</Label></div><div className="flex items-center gap-2"><RadioGroupItem id="goal-weekly" value="weekly"/><Label htmlFor="goal-weekly">Weekly</Label></div></RadioGroup>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Tabs & accordion</CardTitle><CardDescription>Organize subject details, resources and expandable learning modules.</CardDescription></CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="w-full justify-start"><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="resources">Resources</TabsTrigger><TabsTrigger value="progress">Progress</TabsTrigger></TabsList>
              <TabsContent value="overview" className="rounded-lg border border-border p-3 text-sm text-muted-foreground">A clear summary panel for the selected subject or learning path.</TabsContent>
              <TabsContent value="resources" className="rounded-lg border border-border p-3 text-sm text-muted-foreground">Notes, video lessons, quizzes and practical references.</TabsContent>
              <TabsContent value="progress" className="rounded-lg border border-border p-3 text-sm text-muted-foreground">Track lesson completion and evidence of mastery.</TabsContent>
            </Tabs>
            <div className="mt-4"><Accordion type="single" collapsible><AccordionItem value="unit-1"><AccordionTrigger>Unit 1 · Foundations</AccordionTrigger><AccordionContent className="text-muted-foreground">Expandable topic content with a keyboard-accessible trigger and clear open state.</AccordionContent></AccordionItem><AccordionItem value="unit-2"><AccordionTrigger>Unit 2 · Applied concepts</AccordionTrigger><AccordionContent className="text-muted-foreground">A second unit can expand independently when the first is closed.</AccordionContent></AccordionItem></Accordion></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dialogs & menus</CardTitle><CardDescription>Accessible overlays for confirmations and contextual actions.</CardDescription><CardAction><Badge tone="success">Radix primitives</Badge></CardAction></CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Dialog><DialogTrigger asChild><Button><Sparkles/>Open dialog</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Update your learning goal</DialogTitle><DialogDescription>Choose a weekly target that fits your schedule. You can change it later.</DialogDescription></DialogHeader><div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">A dialog is rendered in a portal, traps focus, and supports Escape to close.</div><DialogFooter><Button variant="outline">Cancel</Button><Button>Save goal</Button></DialogFooter></DialogContent></Dialog>
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline">More actions <MoreHorizontal/></Button></DropdownMenuTrigger><DropdownMenuContent align="start"><DropdownMenuItem>View details</DropdownMenuItem><DropdownMenuItem>Duplicate item</DropdownMenuItem><DropdownMenuItem disabled>Archive (disabled)</DropdownMenuItem></DropdownMenuContent></DropdownMenu><Button variant="secondary" onClick={() => toast.success('Your component feedback was saved.')}>Test toast</Button>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">Dialog and dropdown menu support keyboard navigation and focus management.</CardFooter>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Progress & feedback</CardTitle><CardDescription>Shared visual language for mastery and async states.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm"><Label htmlFor="showcase-progress">Learning path progress</Label><span className="font-semibold tabular-nums">{progress}%</span></div>
            <Progress id="showcase-progress" value={progress}/>
            <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => setProgress(Math.max(0, progress - 10))}>− 10%</Button><Button size="sm" variant="outline" onClick={() => setProgress(Math.min(100, progress + 10))}>+ 10%</Button></div>
            <Alert><Info className="size-4"/><AlertTitle>Learning guidance</AlertTitle><AlertDescription>Recommendations guide the learner without hard-locking lessons.</AlertDescription></Alert>
            <Alert variant="success"><CheckCircle2 className="size-4"/><AlertTitle>Milestone reached</AlertTitle><AlertDescription>Your sample progress state has been updated.</AlertDescription></Alert>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Data display</CardTitle><CardDescription>Reusable tables, skeletons and status labels.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <Table><TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Progress</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader><TableBody><TableRow><TableCell className="font-medium">DBMS</TableCell><TableCell>68%</TableCell><TableCell className="text-right"><Badge tone="success">On track</Badge></TableCell></TableRow><TableRow><TableCell className="font-medium">Operating Systems</TableCell><TableCell>32%</TableCell><TableCell className="text-right"><Badge tone="warning">In progress</Badge></TableCell></TableRow></TableBody></Table>
            <div className="space-y-2"><Skeleton className="h-4 w-1/3"/><Skeleton className="h-9 w-full"/><Skeleton className="h-9 w-4/5"/></div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
