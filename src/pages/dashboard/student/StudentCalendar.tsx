import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StudentSidebar } from "@/components/StudentSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Plus, ChevronLeft, ChevronRight, Trash2, CalendarDays, ListTodo, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePresenceHeartbeat } from "@/lib/realtime";

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  starts_at: string;
  ends_at: string | null;
  color: string | null;
};

const TYPE_COLOR: Record<string, string> = {
  deadline: "bg-red-500/15 text-red-500 border-red-500/30",
  interview: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  study: "bg-violet-500/15 text-violet-500 border-violet-500/30",
  reminder: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  custom: "bg-primary/15 text-primary border-primary/30",
};

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function StudentCalendar() {
  usePresenceHeartbeat();
  const { user } = useAuth();
  const [cursor, setCursor] = useState(new Date());
  const [view, setView] = useState<"month" | "agenda">("month");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [planning, setPlanning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", type: "custom", date: "", time: "09:00" });

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const from = new Date(monthStart);
    from.setDate(from.getDate() - 7);
    const to = new Date(monthEnd);
    to.setDate(to.getDate() + 7);
    const { data } = await supabase
      .from("calendar_events")
      .select("id,title,description,type,starts_at,ends_at,color")
      .eq("user_id", user.id)
      .gte("starts_at", from.toISOString())
      .lte("starts_at", to.toISOString())
      .order("starts_at", { ascending: true });
    setEvents(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, cursor.getMonth(), cursor.getFullYear()]);

  const grid = useMemo(() => {
    const firstWeekday = monthStart.getDay();
    const daysInMonth = monthEnd.getDate();
    const cells: (Date | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor, monthStart, monthEnd]);

  const eventsForDay = (d: Date) => events.filter(e => sameDay(new Date(e.starts_at), d));

  const upcoming = events
    .filter(e => new Date(e.starts_at) >= new Date())
    .slice(0, 5);

  const planMyWeek = async () => {
    setPlanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-week-planner", { body: {} });
      if (error) throw error;
      const evs = (data?.events ?? []) as any[];
      if (!evs.length) { toast.info("No suggestions returned"); return; }
      const rows = evs.map((e: any) => ({
        user_id: user!.id,
        title: e.title,
        description: e.description ?? null,
        type: e.type ?? "study",
        starts_at: e.starts_at,
        ends_at: e.ends_at,
        color: "#8b5cf6",
      }));
      const { error: insErr } = await supabase.from("calendar_events").insert(rows);
      if (insErr) throw insErr;
      toast.success(`Added ${rows.length} planned events`);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to plan week");
    } finally { setPlanning(false); }
  };

  const createEvent = async () => {
    if (!user || !draft.title || !draft.date) { toast.error("Title and date required"); return; }
    const dt = new Date(`${draft.date}T${draft.time || "09:00"}:00`);
    const end = new Date(dt.getTime() + 60 * 60 * 1000);
    const { error } = await supabase.from("calendar_events").insert({
      user_id: user.id,
      title: draft.title,
      description: draft.description,
      type: draft.type,
      starts_at: dt.toISOString(),
      ends_at: end.toISOString(),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Event added");
    setDialogOpen(false);
    setDraft({ title: "", description: "", type: "custom", date: "", time: "09:00" });
    load();
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("calendar_events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  const monthLabel = cursor.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <DashboardLayout sidebar={<StudentSidebar />} requiredRole="student">
      <div className="space-y-6 pb-20 animate-slide-up">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <CalendarDays className="h-7 w-7 text-primary" /> Calendar
            </h1>
            <p className="text-muted-foreground text-sm">Deadlines, interviews, and your study plan in one place.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setView(v => v === "month" ? "agenda" : "month")}>
              {view === "month" ? <ListTodo className="h-4 w-4 mr-1" /> : <CalendarDays className="h-4 w-4 mr-1" />}
              {view === "month" ? "Agenda" : "Month"}
            </Button>
            <Button variant="outline" onClick={planMyWeek} disabled={planning}>
              {planning ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Plan my week
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add event
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold">{monthLabel}</h2>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
                <Button variant="ghost" size="icon" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {view === "month" ? (
              <>
                <div className="grid grid-cols-7 text-xs font-semibold text-muted-foreground mb-2">
                  {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} className="text-center">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {grid.map((d, i) => {
                    if (!d) return <div key={i} className="aspect-square" />;
                    const dayEvents = eventsForDay(d);
                    const isToday = sameDay(d, new Date());
                    return (
                      <div key={i} className={cn(
                        "aspect-square border border-border rounded-md p-1 text-xs flex flex-col gap-0.5 overflow-hidden bg-background",
                        isToday && "border-primary ring-1 ring-primary/30"
                      )}>
                        <div className={cn("font-semibold", isToday && "text-primary")}>{d.getDate()}</div>
                        <div className="flex-1 space-y-0.5 overflow-hidden">
                          {dayEvents.slice(0, 3).map(e => (
                            <div key={e.id} className={cn("truncate rounded px-1 py-0.5 border text-[10px]", TYPE_COLOR[e.type] || TYPE_COLOR.custom)}>
                              {e.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : events.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events this month.</p>
                ) : events.map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-3 border border-border rounded-md">
                    <Badge variant="outline" className={cn("capitalize", TYPE_COLOR[e.type] || TYPE_COLOR.custom)}>{e.type}</Badge>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{new Date(e.starts_at).toLocaleString()}</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteEvent(e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="font-heading font-semibold mb-3">Up next</h3>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing scheduled — plan your week with AI.</p>
              ) : (
                <div className="space-y-3">
                  {upcoming.map(e => {
                    const date = new Date(e.starts_at);
                    const days = Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                    return (
                      <div key={e.id} className="flex items-start gap-3">
                        <div className={cn("flex flex-col items-center justify-center w-12 h-12 rounded-md border", TYPE_COLOR[e.type] || TYPE_COLOR.custom)}>
                          <span className="text-[10px] uppercase">{date.toLocaleString(undefined, { month: "short" })}</span>
                          <span className="text-sm font-bold">{date.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{e.title}</div>
                          <div className="text-xs text-muted-foreground">
                            in {days <= 0 ? "today" : `${days}d`} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-heading font-semibold">AI Week Planner</h3>
                  <p className="text-xs text-muted-foreground mt-1">Generates a balanced 7-day plan from your applications, deadlines, and learning roadmap.</p>
                  <Button size="sm" className="mt-3" onClick={planMyWeek} disabled={planning}>
                    {planning ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />} Plan now
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New event</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label>Title</label>
              <Input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Review React fundamentals" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label>Date</label>
                <Input type="date" value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })} />
              </div>
              <div>
                <label>Time</label>
                <Input type="time" value={draft.time} onChange={e => setDraft({ ...draft, time: e.target.value })} />
              </div>
            </div>
            <div>
              <label>Type</label>
              <select value={draft.type} onChange={e => setDraft({ ...draft, type: e.target.value })} className="w-full p-2 rounded-md">
                <option value="custom">Custom</option>
                <option value="study">Study</option>
                <option value="reminder">Reminder</option>
                <option value="interview">Interview</option>
              </select>
            </div>
            <div>
              <label>Notes</label>
              <Textarea value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={createEvent}>Add event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
