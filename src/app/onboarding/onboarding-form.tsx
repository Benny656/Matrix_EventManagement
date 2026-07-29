"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { completeOnboardingAction } from "@/actions/onboarding";

export default function OnboardingForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName || "");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }
    if (!department) {
      setError("Please select a department.");
      return;
    }
    if (!yearOfStudy) {
      setError("Please select your year of study.");
      return;
    }

    setLoading(true);

    try {
      const res = await completeOnboardingAction({
        name: trimmedName,
        department,
        yearOfStudy,
      });

      if (res.status === "error") {
        setError(res.message || "Something went wrong.");
        setLoading(false);
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete onboarding.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/20 p-3 rounded-xl text-destructive text-xs font-sans leading-relaxed"
          >
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name" className="text-xs">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="department" className="text-xs">
          Department <span className="text-destructive">*</span>
        </Label>
        <Select value={department} onValueChange={(val) => setDepartment(val || "")} required>
          <SelectTrigger id="department">
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AI">AI</SelectItem>
            <SelectItem value="AIML">AIML</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="yearOfStudy" className="text-xs">
          Year of Study <span className="text-destructive">*</span>
        </Label>
        <Select value={yearOfStudy} onValueChange={(val) => setYearOfStudy(val || "")} required>
          <SelectTrigger id="yearOfStudy">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1st Year">1st Year</SelectItem>
            <SelectItem value="2nd Year">2nd Year</SelectItem>
            <SelectItem value="3rd Year">3rd Year</SelectItem>
            <SelectItem value="4th Year">4th Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <motion.button
        type="submit"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        disabled={loading}
        className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground font-sans text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-sm disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin shrink-0" />
            <span>Saving...</span>
          </>
        ) : (
          <span>Continue to Dashboard</span>
        )}
      </motion.button>
    </form>
  );
}
