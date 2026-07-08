"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus, Users } from "lucide-react";
import { sessionSchema, type SessionFormData } from "@/lib/validations";
import {
  createSession,
  deleteSession,
  assignVolunteer,
  removeVolunteerAssignment,
} from "@/actions/session.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { SessionWithRelations } from "@/types";

interface SessionsManagerProps {
  eventId: string;
  eventDate: Date;
  sessions: SessionWithRelations[];
  volunteers: { id: string; name: string; email: string }[];
}

export function SessionsManager({ eventId, sessions: initialSessions, volunteers }: SessionsManagerProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [assigningSessionId, setAssigningSessionId] = useState<string | null>(null);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("");

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { eventId },
  });

  const onCreateSession = async (data: SessionFormData) => {
    const result = await createSession({ ...data, eventId } as Record<string, unknown>);
    if (result.success) {
      toast.success("Session created");
      setIsCreating(false);
      reset();
      // Refresh sessions
      window.location.reload();
    } else {
      toast.error(result.error);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteTarget) return;
    const result = await deleteSession(deleteTarget.id, eventId);
    if (result.success) {
      toast.success("Session deleted");
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } else {
      toast.error(result.error);
    }
  };

  const handleAssignVolunteer = async (sessionId: string) => {
    if (!selectedVolunteerId) {
      toast.error("Please select a volunteer");
      return;
    }
    const result = await assignVolunteer(selectedVolunteerId, sessionId, eventId);
    if (result.success) {
      toast.success("Volunteer assigned");
      setAssigningSessionId(null);
      setSelectedVolunteerId("");
      window.location.reload();
    } else {
      toast.error(result.error);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    const result = await removeVolunteerAssignment(assignmentId, eventId);
    if (result.success) {
      toast.success("Volunteer removed");
      window.location.reload();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsCreating(true)} disabled={isCreating}>
          <Plus className="mr-2 h-4 w-4" />
          Add Session
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Session</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreateSession)} className="space-y-4">
              <input type="hidden" {...register("eventId")} value={eventId} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Session Title *</Label>
                  <Input placeholder="e.g. Opening Keynote" {...register("title")} />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Venue *</Label>
                  <Input placeholder="e.g. Hall A" {...register("venue")} />
                  {errors.venue && <p className="text-sm text-destructive">{errors.venue.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Input type="time" {...register("startTime")} />
                  {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>End Time *</Label>
                  <Input type="time" {...register("endTime")} />
                  {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  Create Session
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setIsCreating(false); reset(); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {sessions.length === 0 && !isCreating ? (
        <EmptyState
          icon={Users}
          title="No sessions yet"
          description="Add sessions to this event to track attendance per session"
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{session.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {session.venue} · {formatTime(session.startTime)} – {formatTime(session.endTime)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session._count.attendance} attendance records
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAssigningSessionId(
                          assigningSessionId === session.id ? null : session.id
                        )
                      }
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setDeleteTarget({ id: session.id, title: session.title })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Volunteer Assignments */}
                {session.volunteerAssignments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {session.volunteerAssignments.map((va) => (
                      <div key={va.id} className="flex items-center gap-1">
                        <Badge variant="secondary">{va.volunteer.name}</Badge>
                        <button
                          onClick={() => handleRemoveAssignment(va.id)}
                          className="text-muted-foreground hover:text-destructive text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Assign Volunteer panel */}
                {assigningSessionId === session.id && (
                  <div className="mt-3 flex gap-2 items-center border-t pt-3">
                    <Select value={selectedVolunteerId} onValueChange={setSelectedVolunteerId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select volunteer" />
                      </SelectTrigger>
                      <SelectContent>
                        {volunteers
                          .filter(
                            (v) =>
                              !session.volunteerAssignments.some((va) => va.volunteerId === v.id)
                          )
                          .map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name} ({v.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => handleAssignVolunteer(session.id)}>
                      Assign
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Session"
        description={`Delete "${deleteTarget?.title}"? This will also remove all attendance records for this session.`}
        onConfirm={handleDeleteSession}
        confirmLabel="Delete Session"
      />
    </div>
  );
}
