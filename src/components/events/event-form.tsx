"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { eventSchema, type EventFormData } from "@/lib/validations";
import { createEvent, updateEvent } from "@/actions/event.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { EventWithRelations, User } from "@/types";
import { EventCategory, EventStatus } from "@prisma/client";

interface EventFormProps {
  event?: EventWithRelations;
  coordinators: Pick<User, "id" | "name">[];
}

const categoryOptions = Object.values(EventCategory);
const statusOptions = Object.values(EventStatus);

export function EventForm({ event, coordinators }: EventFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!event;

  const formatDateForInput = (date: Date | string | undefined) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const formatTimeForInput = (date: Date | string | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: event
      ? {
          title: event.title,
          description: event.description,
          posterUrl: event.posterUrl ?? "",
          venue: event.venue,
          date: formatDateForInput(event.date),
          startTime: formatTimeForInput(event.startTime),
          endTime: formatTimeForInput(event.endTime),
          registrationDeadline: formatDateForInput(event.registrationDeadline),
          maxParticipants: event.maxParticipants,
          category: event.category,
          status: event.status,
          coordinatorId: event.coordinatorId,
        }
      : {
          status: "DRAFT",
          category: "OTHER",
        },
  });

  const onSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      const result = isEditing
        ? await updateEvent(event.id, data as Record<string, unknown>)
        : await createEvent(data as Record<string, unknown>);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(isEditing ? "Event updated" : "Event created");
      if (!isEditing && result.data) {
        router.push(`/admin/events/${result.data.id}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input id="title" placeholder="e.g. Annual Tech Summit 2025" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the event..."
              rows={4}
              {...register("description")}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                defaultValue={watch("category")}
                onValueChange={(v) => setValue("category", v as EventCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                defaultValue={watch("status")}
                onValueChange={(v) => setValue("status", v as EventStatus)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coordinatorId">Coordinator *</Label>
            <Select
              defaultValue={watch("coordinatorId")}
              onValueChange={(v) => setValue("coordinatorId", v)}
            >
              <SelectTrigger id="coordinatorId">
                <SelectValue placeholder="Select coordinator" />
              </SelectTrigger>
              <SelectContent>
                {coordinators.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.coordinatorId && <p className="text-sm text-destructive">{errors.coordinatorId.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Venue & Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venue">Venue *</Label>
            <Input id="venue" placeholder="e.g. Main Auditorium, Block A" {...register("venue")} />
            {errors.venue && <p className="text-sm text-destructive">{errors.venue.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input id="startTime" type="time" {...register("startTime")} />
              {errors.startTime && <p className="text-sm text-destructive">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input id="endTime" type="time" {...register("endTime")} />
              {errors.endTime && <p className="text-sm text-destructive">{errors.endTime.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="registrationDeadline">Registration Deadline *</Label>
              <Input id="registrationDeadline" type="date" {...register("registrationDeadline")} />
              {errors.registrationDeadline && <p className="text-sm text-destructive">{errors.registrationDeadline.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">Max Participants *</Label>
              <Input
                id="maxParticipants"
                type="number"
                min={1}
                placeholder="100"
                {...register("maxParticipants")}
              />
              {errors.maxParticipants && <p className="text-sm text-destructive">{errors.maxParticipants.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="posterUrl">Poster URL (Optional)</Label>
            <Input
              id="posterUrl"
              type="url"
              placeholder="https://example.com/poster.jpg"
              {...register("posterUrl")}
            />
            {errors.posterUrl && <p className="text-sm text-destructive">{errors.posterUrl.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Event" : "Create Event"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
