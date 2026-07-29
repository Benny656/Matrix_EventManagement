"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createEventAction } from "@/actions/event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, MapPin, Trash2 } from "lucide-react";

const basicInfoSchema = z.object({
  title: z.string().min(2, "Event title is required"),
  description: z.string().min(5, "Event description must be at least 5 characters"),
  eventDate: z.string().min(1, "Event date is required"),
  category: z.string().min(1, "Please select a category"),
  venue: z.string().min(2, "Venue is required"),
  maxParticipants: z.coerce.number().min(1, "Capacity must be at least 1"),
  registrationOpen: z.boolean().default(true),
});

type BasicInfoValues = z.infer<typeof basicInfoSchema>;

interface SessionItem {
  title: string;
  venue: string;
  startTime: string;
  endTime: string;
}

export default function CreateEventWizard({ role }: { role: "ADMIN" | "VOLUNTEER" }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfoValues | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  
  // Single Session Form States
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionVenue, setSessionVenue] = useState("");
  const [sessionStart, setSessionStart] = useState("");
  const [sessionEnd, setSessionEnd] = useState("");
  const [sessionError, setSessionError] = useState<string | null>(null);

  const [wizardError, setWizardError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const {
    register: registerBasic,
    handleSubmit: handleBasicSubmit,
    watch: watchBasic,
    formState: { errors: basicErrors },
  } = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema) as any,
    defaultValues: {
      registrationOpen: true,
      eventDate: "",
      ...basicInfo,
    } as any,
  });

  const nextStepBasic = (data: BasicInfoValues) => {
    setBasicInfo(data);
    setStep(2);
  };

  const addSession = () => {
    setSessionError(null);
    if (!sessionTitle || !sessionVenue || !sessionStart || !sessionEnd) {
      setSessionError("All session fields are required");
      return;
    }
    if (new Date(sessionStart) >= new Date(sessionEnd)) {
      setSessionError("End time must be after start time");
      return;
    }

    setSessions([
      ...sessions,
      {
        title: sessionTitle,
        venue: sessionVenue,
        startTime: sessionStart,
        endTime: sessionEnd,
      },
    ]);

    // Reset inputs
    setSessionTitle("");
    setSessionVenue("");
    setSessionStart("");
    setSessionEnd("");
  };

  const removeSession = (index: number) => {
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!basicInfo) return;
    setPublishing(true);
    setWizardError(null);

    // Calculate overall event date from basic info
    const earliestDate = new Date(basicInfo.eventDate);

    try {
      const result = await createEventAction({
        ...basicInfo,
        date: earliestDate,
        registrationOpen: basicInfo.registrationOpen,
        posterUrl: null, // Scoped out for now
        coordinatorName: role === "ADMIN" ? "Admin Team" : "Volunteer Coordinator",
        sessions: sessions.map((s) => ({
          title: s.title,
          venue: s.venue,
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime),
        })),
      });

      if (result.success) {
        router.push(role === "ADMIN" ? "/admin/events" : "/volunteer/events");
      }
    } catch (err: any) {
      setWizardError(err.message || "Failed to publish event");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full pb-12 selection:bg-primary-container/20 selection:text-primary">
      {/* Wizard Header Progress Indicator */}
      <header className="border-b border-border bg-card p-4 md:p-6 sticky top-14 md:top-16 z-10 -mx-4 md:mx-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="font-heading text-lg font-bold text-foreground uppercase tracking-tight">Create New Event</h2>
          <div className="flex flex-wrap items-center gap-2 md:gap-4 font-mono text-[10px] md:text-[11px] uppercase tracking-wider">
            <div className={`flex items-center gap-1.5 md:gap-2 ${step >= 1 ? "text-primary font-bold" : "text-muted-foreground"}`}>
              <span className={`w-5 h-5 md:w-6 md:h-6 border flex items-center justify-center text-[9px] md:text-xs ${step === 1 ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>1</span>
              <span>Basic Info</span>
            </div>
            <div className="hidden sm:block w-6 md:w-8 h-[1px] bg-border"></div>
            <div className={`flex items-center gap-1.5 md:gap-2 ${step >= 2 ? "text-primary font-bold" : "text-muted-foreground"}`}>
              <span className={`w-5 h-5 md:w-6 md:h-6 border flex items-center justify-center text-[9px] md:text-xs ${step === 2 ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>2</span>
              <span>Sessions</span>
            </div>
            <div className="hidden sm:block w-6 md:w-8 h-[1px] bg-border"></div>
            <div className={`flex items-center gap-1.5 md:gap-2 ${step >= 3 ? "text-primary font-bold" : "text-muted-foreground"}`}>
              <span className={`w-5 h-5 md:w-6 md:h-6 border flex items-center justify-center text-[9px] md:text-xs ${step === 3 ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>3</span>
              <span>Review</span>
            </div>
          </div>
        </div>
      </header>

      {wizardError && (
        <Alert variant="destructive" className="rounded-none border-destructive bg-destructive/5 text-destructive font-mono text-xs uppercase">
          <AlertCircle size={14} className="mr-2 shrink-0" />
          <AlertDescription>{wizardError}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card className="border border-border bg-card p-6 rounded-none shadow-none space-y-6">
          <div className="border-b border-border pb-3 -mx-6 px-6 bg-surface-container -mt-6">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Step 1: Foundational Parameters</span>
          </div>

          <form onSubmit={handleBasicSubmit(nextStepBasic)} className="space-y-6">
            {/* Title */}
            <div className="flex flex-col gap-1">
              <Label className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider" htmlFor="title">Event Title</Label>
              <Input
                {...registerBasic("title")}
                className="w-full bg-background border border-border text-foreground px-3 py-6 font-heading text-xl focus-visible:ring-1 focus-visible:ring-primary rounded-none shadow-none"
                id="title"
                placeholder="e.g. Q3 Synthetic Data Summit"
              />
              {basicErrors.title && (
                <span className="font-mono text-[10px] text-destructive uppercase mt-1">{basicErrors.title.message}</span>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <Label className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider" htmlFor="description">Operational Description</Label>
              <textarea
                {...registerBasic("description")}
                className="w-full bg-background border border-border text-foreground px-3 py-3 font-sans text-sm focus:border-primary focus:border-2 focus:outline-none transition-all resize-y rounded-none min-h-[100px]"
                id="description"
                placeholder="Detail the core objectives and expected outcomes..."
              />
              {basicErrors.description && (
                <span className="font-mono text-[10px] text-destructive uppercase mt-1">{basicErrors.description.message}</span>
              )}
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider" htmlFor="category">Primary Category</Label>
                <select
                  {...registerBasic("category")}
                  className="w-full bg-background border border-border text-foreground px-3 py-3 font-mono text-sm focus:border-primary focus:border-2 focus:outline-none transition-all rounded-none"
                  id="category"
                >
                  <option value="">Select classification...</option>
                  <option value="Technical Workshop">Technical Workshop</option>
                  <option value="Research Symposium">Research Symposium</option>
                  <option value="Field Operations">Field Operations</option>
                  <option value="System Audit">System Audit</option>
                </select>
                {basicErrors.category && (
                  <span className="font-mono text-[10px] text-destructive uppercase mt-1">{basicErrors.category.message}</span>
                )}
              </div>

              {/* Venue */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider" htmlFor="venue">Location / Facility</Label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...registerBasic("venue")}
                    className="w-full bg-background border border-border text-foreground pl-10 pr-3 py-6 font-mono text-sm focus-visible:ring-1 focus-visible:ring-primary rounded-none shadow-none"
                    id="venue"
                    placeholder="e.g. Sector 4, Hub B"
                  />
                </div>
                {basicErrors.venue && (
                  <span className="font-mono text-[10px] text-destructive uppercase mt-1">{basicErrors.venue.message}</span>
                )}
              </div>

              {/* Event Date */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider" htmlFor="eventDate">Event Date</Label>
                <Input
                  {...registerBasic("eventDate")}
                  className="w-full bg-background border border-border text-foreground px-3 py-6 font-mono text-sm focus-visible:ring-1 focus-visible:ring-primary rounded-none shadow-none"
                  id="eventDate"
                  type="date"
                />
                {basicErrors.eventDate && (
                  <span className="font-mono text-[10px] text-destructive uppercase mt-1">{basicErrors.eventDate.message}</span>
                )}
              </div>

              {/* Capacity */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider" htmlFor="maxParticipants">Capacity Limit</Label>
                <Input
                  {...registerBasic("maxParticipants")}
                  className="w-full bg-background border border-border text-foreground px-3 py-6 font-mono text-sm focus-visible:ring-1 focus-visible:ring-primary rounded-none shadow-none"
                  id="maxParticipants"
                  type="number"
                  min="1"
                  placeholder="0"
                />
                {basicErrors.maxParticipants && (
                  <span className="font-mono text-[10px] text-destructive uppercase mt-1">{basicErrors.maxParticipants.message}</span>
                )}
              </div>

              {/* Registration Toggle */}
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider" htmlFor="registrationOpen">Registration Status</Label>
                <div className="flex items-center gap-3 pt-4">
                  <input
                    type="checkbox"
                    id="registrationOpen"
                    {...registerBasic("registrationOpen")}
                    className="h-5 w-5 border-border rounded-sm text-primary bg-background focus:ring-primary cursor-pointer"
                  />
                  <Label className="font-mono text-[13px] text-foreground cursor-pointer" htmlFor="registrationOpen">
                    Open for Registration
                  </Label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-border">
              <button
                type="button"
                onClick={() => router.back()}
                className="font-mono text-xs uppercase text-primary hover:text-primary-container px-2 py-1"
              >
                Cancel Protocol
              </button>
              <button
                type="submit"
                className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest py-3 px-6 hover:bg-primary-container transition-all active:scale-95"
              >
                Configure Sessions
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Step 2: Sessions */}
      {step === 2 && (
        <Card className="border border-border bg-card p-6 rounded-none shadow-none space-y-6">
          <div className="border-b border-border pb-3 -mx-6 px-6 bg-surface-container -mt-6">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Step 2: Configure Sessions</span>
          </div>

          {/* Session Creation Sub-form */}
          <div className="border border-border bg-surface-container-low p-4 space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-widest text-foreground font-semibold border-b border-border pb-1">
              Add Time Block / Segment
            </h3>

            {sessionError && (
              <span className="font-mono text-[10px] text-destructive uppercase block">{sessionError}</span>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="sess-title">Session Title</Label>
                <Input
                  className="bg-background border border-border text-foreground px-2 py-4 font-mono text-xs rounded-none h-8"
                  id="sess-title"
                  placeholder="e.g. Session 1: Transformers Intro"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="sess-venue">Session Location</Label>
                <Input
                  className="bg-background border border-border text-foreground px-2 py-4 font-mono text-xs rounded-none h-8"
                  id="sess-venue"
                  placeholder="e.g. LAB 4B"
                  value={sessionVenue}
                  onChange={(e) => setSessionVenue(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="sess-start">Start Time</Label>
                <Input
                  className="bg-background border border-border text-foreground px-2 py-4 font-mono text-xs rounded-none h-8"
                  id="sess-start"
                  type="datetime-local"
                  value={sessionStart}
                  onChange={(e) => setSessionStart(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label className="font-mono text-[10px] text-muted-foreground uppercase" htmlFor="sess-end">End Time</Label>
                <Input
                  className="bg-background border border-border text-foreground px-2 py-4 font-mono text-xs rounded-none h-8"
                  id="sess-end"
                  type="datetime-local"
                  value={sessionEnd}
                  onChange={(e) => setSessionEnd(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addSession}
              className="bg-secondary text-secondary-foreground font-mono text-[11px] uppercase tracking-wider py-2 px-4 hover:opacity-90 active:scale-95 transition-all"
            >
              Add Segment Record
            </button>
          </div>

          {/* Current Sessions List */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold">Scheduled Segments</h3>
              <span className="font-mono text-[10px] bg-surface-container px-2 py-1 border border-border">{sessions.length} RECORDS</span>
            </div>

            {sessions.length === 0 ? (
              <div className="border border-border p-6 text-center text-muted-foreground font-mono text-xs uppercase bg-surface-container-low">
                No sessions defined. You can add time segments later.
              </div>
            ) : (
              <div className="border border-border bg-background divide-y divide-border">
                {/* Table Header */}
                <div className="hidden md:grid grid-cols-12 gap-2 px-4 py-2 bg-surface-container font-mono text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  <div className="col-span-4">Time Block</div>
                  <div className="col-span-5">Designation</div>
                  <div className="col-span-2">Location</div>
                  <div className="col-span-1 text-right">Delete</div>
                </div>

                {/* Table Body */}
                {sessions.map((sess, idx) => (
                  <div key={idx} className="flex flex-col md:grid md:grid-cols-12 gap-2 px-4 py-3 font-mono text-xs items-stretch md:items-center border-b border-border last:border-b-0 md:border-b-0">
                    <div className="md:col-span-5 font-semibold text-foreground text-sm md:text-xs">{sess.title}</div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/45 md:border-t-0 md:pt-0 md:col-span-6 md:grid md:grid-cols-6">
                      <div className="text-muted-foreground md:col-span-4">
                        {new Date(sess.startTime).toLocaleString("en-US", { hour12: false })}
                      </div>
                      <div className="text-muted-foreground md:col-span-2 md:text-right">
                        <span className="inline md:hidden text-muted-foreground/60 text-[9px] uppercase font-bold mr-1">Venue:</span>
                        {sess.venue}
                      </div>
                    </div>
                    
                    <div className="md:col-span-1 text-right flex justify-end pt-2 border-t border-border/45 md:border-t-0 md:pt-0">
                      <button onClick={() => removeSession(idx)} className="p-2 border border-destructive/20 md:border-none hover:bg-destructive/5 md:hover:bg-transparent text-primary hover:text-primary-container flex items-center justify-center gap-1.5 w-full md:w-auto font-mono text-[10px] md:text-xs uppercase cursor-pointer">
                        <Trash2 size={14} className="pointer-events-none" />
                        <span className="inline md:hidden text-destructive font-bold">Delete Block</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="font-mono text-xs uppercase text-primary hover:text-primary-container px-2 py-1"
            >
              Modify Basic Info
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest py-3 px-6 hover:bg-primary-container transition-all active:scale-95"
            >
              Review Protocol
            </button>
          </div>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card className="border border-border bg-card p-6 rounded-none shadow-none space-y-6">
          <div className="border-b border-border pb-3 -mx-6 px-6 bg-surface-container -mt-6">
            <span className="font-mono text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Step 3: Review Specifications</span>
          </div>

          <div className="space-y-6">
            <div className="border border-border p-4 space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold border-b border-border pb-1">
                Event Core Parameters
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div>
                  <span className="text-muted-foreground block uppercase">Title</span>
                  <span className="font-semibold text-foreground text-sm">{basicInfo?.title}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block uppercase">Category</span>
                  <span className="font-semibold text-foreground">{basicInfo?.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block uppercase">Date</span>
                  <span className="font-semibold text-foreground">{new Date(basicInfo?.eventDate || "").toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block uppercase">Location / Venue</span>
                  <span className="font-semibold text-foreground">{basicInfo?.venue}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block uppercase">Capacity Limit</span>
                  <span className="font-semibold text-foreground">{basicInfo?.maxParticipants} Attendees</span>
                </div>
                <div>
                  <span className="text-muted-foreground block uppercase">Registration Status</span>
                  <span className="font-semibold text-foreground">
                    {basicInfo?.registrationOpen ? "Open" : "Closed"}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-border p-4 space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-semibold border-b border-border pb-1">
                Time Blocks / Sessions
              </h3>
              <div className="divide-y divide-border font-mono text-xs">
                {sessions.map((sess, idx) => (
                  <div key={idx} className="py-2 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                    <div>
                      <span className="font-semibold text-foreground">{sess.title}</span>
                      <span className="text-muted-foreground block text-[11px] mt-0.5">Location: {sess.venue}</span>
                    </div>
                    <div className="text-left sm:text-right text-muted-foreground">
                      {new Date(sess.startTime).toLocaleString("en-US", { hour12: false })} - {new Date(sess.endTime).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="font-mono text-xs uppercase text-primary hover:text-primary-container px-2 py-1"
              disabled={publishing}
            >
              Modify Sessions
            </button>
            <button
              type="button"
              onClick={handlePublish}
              className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-widest py-3 px-6 hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50"
              disabled={publishing}
            >
              {publishing ? "COMMITTING PROTOCOL..." : "Publish Event"}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
