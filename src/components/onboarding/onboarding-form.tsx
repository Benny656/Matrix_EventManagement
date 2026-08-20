"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { completeOnboardingAction } from "@/actions/onboarding";

const UG_DEGREES = ["B.Tech", "B.Sc", "BCA", "B.Com", "BBA", "B.A"];
const PG_DEGREES = ["M.Tech", "M.Sc", "MCA", "MBA", "M.A", "Ph.D"];

export default function OnboardingForm({
  initialName,
  initialRollNumber,
  userRole,
}: {
  initialName: string;
  initialRollNumber: string;
  userRole?: string;
}) {
  const router = useRouter();
  const isFaculty = userRole === "FACULTY" || userRole === "FACULTY_ADMIN";

  const [name, setName] = useState(initialName || "");
  const [rollNumber, setRollNumber] = useState(initialRollNumber || "");
  const [programType, setProgramType] = useState<"UG" | "PG">("UG");
  const [degree, setDegree] = useState("");
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableDegrees = programType === "UG" ? UG_DEGREES : PG_DEGREES;

  const handleProgramTypeChange = (val: string | null) => {
    if (!val) return;
    const newType = val as "UG" | "PG";
    setProgramType(newType);
    const newAvailable = newType === "UG" ? UG_DEGREES : PG_DEGREES;
    if (!newAvailable.includes(degree)) {
      setDegree("");
    }
  };

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

    const cleanedPhone = phoneNumber.replace(/\D/g, "");
    if (!cleanedPhone) {
      setError("Phone Number is required.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    let trimmedRoll = "";
    if (!isFaculty) {
      trimmedRoll = rollNumber.trim().toUpperCase();
      if (!trimmedRoll) {
        setError("Roll Number is required.");
        return;
      }
      if (!programType) {
        setError("Please select Program Level (UG or PG).");
        return;
      }
      if (!degree) {
        setError("Please select your degree.");
        return;
      }
      if (!yearOfStudy) {
        setError("Please select your year of study.");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await completeOnboardingAction({
        name: trimmedName,
        rollNumber: isFaculty ? undefined : trimmedRoll,
        programType: isFaculty ? undefined : programType,
        degree: isFaculty ? undefined : degree,
        department,
        yearOfStudy: isFaculty ? undefined : yearOfStudy,
        phoneNumber: cleanedPhone,
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

      {!isFaculty && (
        <>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rollNumber" className="text-xs">
              Roll Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="rollNumber"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              placeholder="e.g. URK25CS7102"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="programType" className="text-xs">
                Program Level <span className="text-destructive">*</span>
              </Label>
              <Select value={programType} onValueChange={handleProgramTypeChange} required>
                <SelectTrigger id="programType">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UG">UG (Undergraduate)</SelectItem>
                  <SelectItem value="PG">PG (Postgraduate)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="degree" className="text-xs">
                Degree <span className="text-destructive">*</span>
              </Label>
              <Select value={degree} onValueChange={(val) => setDegree(val || "")} required>
                <SelectTrigger id="degree">
                  <SelectValue placeholder="Select degree" />
                </SelectTrigger>
                <SelectContent>
                  {availableDegrees.map((deg) => (
                    <SelectItem key={deg} value={deg}>
                      {deg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

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

      {!isFaculty && (
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
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phoneNumber" className="text-xs">
          Phone Number <span className="text-destructive">*</span>
        </Label>
        <Input
          id="phoneNumber"
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={10}
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="e.g. 9876543210"
          required
        />
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
