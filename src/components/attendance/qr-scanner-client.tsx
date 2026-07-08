"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { markAttendanceByQR, markAttendanceManual } from "@/actions/attendance.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Search, CheckCircle, Loader2 } from "lucide-react";

interface Session {
  id: string;
  title: string;
  eventTitle: string;
}

interface QRScannerClientProps {
  sessions: Session[];
}

export function QRScannerClient({ sessions }: QRScannerClientProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [registerNumber, setRegisterNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const startScanner = async () => {
    if (!selectedSessionId) {
      toast.error("Please select a session first");
      return;
    }

    try {
      const { Html5QrcodeScanner } = await import("html5-qrcode");
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        async (decodedText: string) => {
          setIsLoading(true);
          const result = await markAttendanceByQR(decodedText, selectedSessionId);
          if (result.success) {
            toast.success(`✓ ${result.data.studentName} marked present`);
            setLastResult(result.data.studentName);
          } else {
            toast.error(result.error);
          }
          setIsLoading(false);
        },
        (error: string) => {
          // Suppress scan errors (normal when camera is searching)
          console.debug("QR scan error:", error);
        }
      );

      html5QrCodeRef.current = scanner;
      setIsScanning(true);
    } catch (error) {
      toast.error("Failed to start camera. Check permissions.");
    }
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      (html5QrCodeRef.current as { clear: () => Promise<void> }).clear().catch(() => {});
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      toast.error("Please select a session first");
      return;
    }
    if (!registerNumber.trim()) {
      toast.error("Please enter a register number");
      return;
    }

    setIsLoading(true);
    const result = await markAttendanceManual(registerNumber.trim(), selectedSessionId);
    if (result.success) {
      toast.success(`✓ ${result.data.studentName} marked present`);
      setRegisterNumber("");
    } else {
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-xl space-y-4">
      {/* Session Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Session</CardTitle>
          <CardDescription>Choose which session to mark attendance for</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a session..." />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.eventTitle} — {s.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="qr">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="qr">
            <QrCode className="mr-2 h-4 w-4" />
            QR Scan
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Search className="mr-2 h-4 w-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        {/* QR Scanner Tab */}
        <TabsContent value="qr">
          <Card>
            <CardContent className="pt-4 space-y-4">
              <div id="qr-reader" ref={scannerRef} className={isScanning ? "block" : "hidden"} />

              {!isScanning ? (
                <div className="text-center py-8">
                  <QrCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <Button onClick={startScanner} disabled={!selectedSessionId}>
                    Start Scanner
                  </Button>
                  {!selectedSessionId && (
                    <p className="text-xs text-muted-foreground mt-2">Select a session first</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Button variant="outline" onClick={stopScanner} className="w-full">
                    Stop Scanner
                  </Button>
                  {lastResult && (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Last: {lastResult}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Tab */}
        <TabsContent value="manual">
          <Card>
            <CardContent className="pt-4">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regNumber">Student Register Number</Label>
                  <Input
                    id="regNumber"
                    placeholder="e.g. 21CS001"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Mark Attendance
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
