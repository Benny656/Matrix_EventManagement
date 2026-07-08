"use client";

import { useState } from "react";
import { toast } from "sonner";
import { manualRegisterStudent } from "@/actions/registration.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlus } from "lucide-react";

interface ManualRegistrationFormProps {
  events: { id: string; title: string }[];
}

export function ManualRegistrationForm({ events }: ManualRegistrationFormProps) {
  const [eventId, setEventId] = useState("");
  const [registerNumber, setRegisterNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) { toast.error("Please select an event"); return; }
    if (!registerNumber.trim()) { toast.error("Please enter a register number"); return; }

    setIsLoading(true);
    const result = await manualRegisterStudent(registerNumber.trim(), eventId);
    if (result.success) {
      toast.success("Student registered successfully");
      setRegisterNumber("");
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Register Student</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Event</Label>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger><SelectValue placeholder="Select event" /></SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="manualRegNo">Student Register Number</Label>
            <Input
              id="manualRegNo"
              placeholder="e.g. 21CS001"
              value={registerNumber}
              onChange={(e) => setRegisterNumber(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Register Student
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
