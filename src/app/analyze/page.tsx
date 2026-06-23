"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, sentinelApi } from "@/services";
import type { ThreatAnalysisResponse } from "@/types";
import {
  loadAnalysisHistory,
  saveAnalysisToHistory,
  type AnalysisRecord,
} from "@/lib/analysis-store";
import { motion } from "framer-motion";
import {
  UploadCloud,
  FileImage,
  X,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Link2,
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  Fingerprint,
  TerminalSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  FadeIn,
  RevealOnScroll,
  StaggerContainer,
  AnimatedCounter,
  MagneticButton,
  HoverGlow,
  PageTransition,
  LoadingPulse,
  EASES,
} from "@/components/motion";
import { cn } from "@/lib/utils";

// Types for analysis history
interface AnalysisHistoryItem {
  id: string;
  name: string;
  type: AnalysisRecord["type"];
  level: AnalysisRecord["level"];
  date: string;
  status: "Completed" | "Failed" | "Analyzing";
  score: number;
}

const SCAN_STEPS = [
  "Uploading",
  "Extracting Text",
  "Running Threat Analysis",
  "Generating Scam DNA",
  "Finalizing Report",
];

export default function ThreatAnalyzerPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"screenshot" | "url" | "text">("screenshot");
  
  // Drag & Drop State
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // URL State
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  // Text State
  const [textInput, setTextInput] = useState("");
  const CHAR_LIMIT = 2000;

  // Scanning State
  const [scanState, setScanState] = useState<"idle" | "scanning" | "completed">("idle");
  const [currentStep, setCurrentStep] = useState(0);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisHistoryItem[]>([]);
  const [serviceWarning, setServiceWarning] = useState<string | null>(null);
  
  // Result State
  const [currentResult, setCurrentResult] = useState<AnalysisHistoryItem | null>(null);

  useEffect(() => {
    const history = loadAnalysisHistory();
    setRecentAnalyses(
      history.map(({ id, name, type, level, date, status, score }) => ({
        id,
        name,
        type,
        level,
        date,
        status,
        score,
      }))
    );

    sentinelApi
      .healthCheck()
      .then((health) => {
        const warnings: string[] = [];
        if (!health.ai_available) {
          warnings.push(
            "Gemini API key is not configured. Threat analysis will use heuristic fallback responses."
          );
        }
        if (!health.ocr_available) {
          warnings.push(
            "Tesseract OCR is not installed. Screenshot text extraction will use fallback mode."
          );
        }
        setServiceWarning(warnings.length > 0 ? warnings.join(" ") : null);
      })
      .catch(() => {
        setServiceWarning(
          "Unable to reach the Sentinel backend. Start the API server before running analyses."
        );
      });
  }, []);

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle Drag Leave
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      processFile(droppedFile);
    }
  };

  // Process selected file
  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setIsUploading(true);
    setUploadProgress(0);

    // Create image preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);

    // Simulate progress bar movement
    const duration = 1200;
    const intervalTime = 50;
    const step = 100 / (duration / intervalTime);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= 100) {
        setUploadProgress(100);
        setIsUploading(false);
        clearInterval(timer);
      } else {
        setUploadProgress(Math.round(current));
      }
    }, intervalTime);
  };

  // Handle File Input Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  // Clear File Upload
  const triggerClearFile = () => {
    setFile(null);
    setFilePreview(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // URL input helper
  const handleUrlSubmit = () => {
    if (!urlInput) {
      setUrlError("Please enter a URL to analyze.");
      return;
    }

    // Basic URL regex
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    if (!urlPattern.test(urlInput)) {
      setUrlError("Please enter a valid URL (e.g., https://example.com).");
      return;
    }

    setUrlError(null);
    startScanning("URL", urlInput);
  };

  // Text input helper
  const handleTextSubmit = () => {
    if (!textInput.trim()) return;
    startScanning("Text", textInput.substring(0, 32) + "...");
  };

  // Screenshot input helper
  const handleScreenshotSubmit = () => {
    if (!file) return;
    startScanning("Screenshot", file.name);
  };

  const getAnalysisErrorMessage = (error: unknown): string => {
    if (error instanceof ApiError) {
      if (error.status === 408) {
        return "Analysis timed out. The security engine took too long to respond. Please try again.";
      }
      if (error.status === 400) {
        return error.detail ?? error.message ?? "Invalid analysis request.";
      }
      if (error.status === 503 || error.status === 502) {
        return "The Sentinel backend is unavailable right now. Verify the API server is running.";
      }
      return error.detail ?? error.message ?? "Analysis request failed.";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred during threat scanning.";
  };

  // Threat Scanner simulation and backend integration
  const startScanning = async (type: AnalysisRecord["type"], name: string) => {
    setErrorMessage(null);
    setScanState("scanning");
    setCurrentStep(0);

    let apiCompleted = false;
    let apiError: unknown = null;
    let apiResponse: ThreatAnalysisResponse | null = null;

    // Start API request
    const apiPromise = (async () => {
      try {
        if (type === "Screenshot") {
          if (!filePreview) {
            throw new Error("No image payload found. Please select an image first.");
          }
          apiResponse = await sentinelApi.analyzeImage({
            image_base64: filePreview,
            filename: name,
          });
        } else if (type === "URL") {
          apiResponse = await sentinelApi.analyzeUrl({
            url: urlInput,
          });
        } else {
          apiResponse = await sentinelApi.analyzeText({
            text: textInput,
          });
        }
      } catch (err: unknown) {
        apiError = err;
      } finally {
        apiCompleted = true;
      }
    })();

    // Step progression timer
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < SCAN_STEPS.length - 1) {
        stepIndex += 1;
        setCurrentStep(stepIndex);
      } else {
        // Wait at the final step "Finalizing Report" until API request resolves
        if (apiCompleted) {
          clearInterval(interval);
          handleResolution(apiError, apiResponse, type, name);
        }
      }
    }, 900); // 900ms per step for smooth scanning UX

    // Handle Resolution of API Response
    const handleResolution = (
      error: unknown,
      response: ThreatAnalysisResponse | null,
      scanType: AnalysisRecord["type"],
      displayName: string
    ) => {
      if (error) {
        setScanState("idle");
        setErrorMessage(getAnalysisErrorMessage(error));
        return;
      }

      if (!response) {
        setScanState("idle");
        setErrorMessage("Empty analysis report received from security engine.");
        return;
      }

      const analysisId = `an-${Math.floor(100 + Math.random() * 900)}`;
      const completedAt = new Date().toISOString();
      const newAnalysis: AnalysisHistoryItem = {
        id: analysisId,
        name: displayName,
        type: scanType,
        level: response.threat_level,
        date: completedAt.split("T")[0] || "2026-06-23",
        status: "Completed",
        score: response.threat_score,
      };

      saveAnalysisToHistory({
        ...newAnalysis,
        category: response.category,
        confidence: response.confidence,
        result: response,
        timestamp: completedAt,
      });
      
      setRecentAnalyses((old) => [newAnalysis, ...old]);
      setScanState("completed");

      // Save to sessionStorage for Results Page retrieval
      try {
        sessionStorage.setItem("sentinel_analysis_result", JSON.stringify(response));
        sessionStorage.setItem("sentinel_analysis_meta", JSON.stringify({ name: displayName, type: scanType }));
      } catch (e) {
        console.error("Failed to store results in sessionStorage", e);
      }

      // Automatically navigate to results page
      setTimeout(() => {
        router.push("/results");
      }, 500);
    };

    // Wait for the API request to resolve
    await apiPromise;
  };

  // Reset to Scan Tab
  const handleReset = () => {
    setScanState("idle");
    setCurrentResult(null);
    if (activeTab === "screenshot") {
      triggerClearFile();
    } else if (activeTab === "url") {
      setUrlInput("");
    } else {
      setTextInput("");
    }
  };

  return (
    <PageTransition variant="fade">
      <main className="relative min-h-screen bg-background pb-16">
        {/* Navigation bar */}
        <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-2xl">
          <nav className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 md:px-6">
            <Link href="/" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors group">
              <span className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 group-hover:border-white/20 transition-colors">
                <ArrowLeft className="size-4" />
              </span>
              <span className="text-sm font-medium">Back to Home</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <ShieldCheck className="size-4" />
              </span>
              <span className="text-xs font-semibold tracking-wider font-mono uppercase text-foreground">
                Sentinel Guard
              </span>
            </div>
          </nav>
        </header>

        {/* Page Shell */}
        <div className="page-shell">
          
          {/* Header */}
          <div className="mb-10 text-center md:text-left">
            <RevealOnScroll type="mask" direction="up" duration={0.6}>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                Threat Analyzer
              </h1>
            </RevealOnScroll>
            <RevealOnScroll type="slide-fade" direction="up" delay={0.1} duration={0.6}>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Analyze screenshots, URLs, emails, messages and suspicious content.
              </p>
            </RevealOnScroll>
          </div>

          {/* Main Grid */}
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            
            {/* Left Side: Analyzer Input Panel */}
            <HoverGlow borderGlow={true} containerClassName="h-full">
              <div className="p-6 md:p-8">
                {scanState === "scanning" ? (
                  // Scanning Loading experience
                  <div className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[380px]">
                    <div className="relative flex size-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-primary mb-6">
                      <Loader2 className="size-10 animate-spin" />
                      <span className="absolute inset-0 rounded-2xl border border-primary/40 animate-ping opacity-25" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground">Scam DNA Scanner Active</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      Executing cognitive threat intelligence matrix models to dissect sample signatures.
                    </p>

                    <div className="mt-8 w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-4 text-left font-mono text-xs text-muted-foreground">
                      <div className="flex items-center justify-between mb-2">
                        <span>STAGE {currentStep + 1}/5</span>
                        <span className="text-primary font-bold">ANALYZING</span>
                      </div>
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: "0%" }}
                          animate={{ width: `${((currentStep + 1) / SCAN_STEPS.length) * 100}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <StaggerContainer key={currentStep}>
                        <FadeIn direction="none" duration={0.3} className="text-foreground leading-5 flex items-start gap-2">
                          <span className="text-primary">▶</span>
                          <span>{SCAN_STEPS[currentStep]}</span>
                        </FadeIn>
                      </StaggerContainer>
                    </div>

                    <div className="mt-8 flex gap-3 w-full max-w-md justify-center">
                      <LoadingPulse variant="glow" width={100} height={36} radius="0.5rem" />
                      <LoadingPulse variant="shimmer" width={220} height={36} radius="0.5rem" />
                    </div>
                  </div>
                ) : scanState === "completed" ? (
                  // Scan Complete Actions
                  <div className="flex flex-col items-center justify-center py-12 text-center h-full min-h-[380px]">
                    <div className="flex size-16 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success mb-6">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">Analysis Complete</h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                      Heuristic checks and Scam DNA signals resolved. Score cards have been compiled.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-xs justify-center">
                      <MagneticButton
                        onClick={handleReset}
                        className="w-full py-2.5 bg-primary rounded-xl text-sm font-semibold text-white border border-primary/20 hover:bg-primary/90 transition-colors"
                      >
                        Analyze Another Item
                      </MagneticButton>
                    </div>
                  </div>
                ) : (
                  // Idle: Input Forms
                  <div>
                    {serviceWarning && (
                      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-200 flex items-start gap-3 mb-6">
                        <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                        <p className="text-xs opacity-90">{serviceWarning}</p>
                      </div>
                    )}
                    {errorMessage && (
                      <div className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger flex items-start gap-3 mb-6">
                        <AlertTriangle className="size-5 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-semibold">Analysis Failed</p>
                          <p className="text-xs opacity-90">{errorMessage}</p>
                        </div>
                      </div>
                    )}
                    {/* Method Selector Tabs */}
                    <div className="flex space-x-1 rounded-xl bg-white/5 border border-white/5 p-1 mb-6">
                      {(["screenshot", "url", "text"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            "w-full rounded-lg py-2.5 text-sm font-medium transition-all duration-300 capitalize",
                            activeTab === tab
                              ? "bg-primary/20 text-primary border border-primary/20 shadow-lg"
                              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          )}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Tab contents */}
                    <div className="min-h-[220px]">
                      {activeTab === "screenshot" && (
                        // Screenshot Upload UI
                        <div className="space-y-4">
                          {!file ? (
                            <div
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              onClick={() => fileInputRef.current?.click()}
                              className={cn(
                                "flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 p-10 text-center cursor-pointer transition-all duration-300 hover:border-primary/40 hover:bg-primary/[0.02]",
                                isDragging && "border-primary bg-primary/5 scale-[0.99]"
                              )}
                            >
                              <UploadCloud className="size-10 text-muted-foreground mb-4 group-hover:text-primary transition-colors" />
                              <p className="text-sm font-medium text-foreground">
                                Drag and drop screenshot here, or <span className="text-primary hover:underline">browse</span>
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                PNG, JPG, or WEBP (Max 5MB)
                              </p>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-white/10 p-4 bg-white/5 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-primary">
                                    <FileImage className="size-5" />
                                  </div>
                                  <div className="max-w-[200px] sm:max-w-xs">
                                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                  </div>
                                </div>
                                <button
                                  onClick={triggerClearFile}
                                  className="flex size-7 items-center justify-center rounded-full bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <X className="size-4" />
                                </button>
                              </div>

                              {isUploading ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
                                    <span>Uploading sample payload...</span>
                                    <span>{uploadProgress}%</span>
                                  </div>
                                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                      className="h-full bg-primary"
                                      initial={{ width: "0%" }}
                                      animate={{ width: `${uploadProgress}%` }}
                                      transition={{ duration: 0.1 }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                filePreview && (
                                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/5 bg-background">
                                    <img
                                      src={filePreview}
                                      alt="Screenshot preview"
                                      className="h-full w-full object-contain"
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          <Button
                            onClick={handleScreenshotSubmit}
                            disabled={!file || isUploading}
                            className="w-full rounded-xl py-6"
                          >
                            Scan Screenshot
                          </Button>
                        </div>
                      )}

                      {activeTab === "url" && (
                        // URL input UI
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="url-input" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Suspicious Link</label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Link2 className="size-4" />
                              </span>
                              <input
                                id="url-input"
                                type="text"
                                placeholder="Enter suspicious link (e.g. https://bank-security-alert.net)"
                                value={urlInput}
                                onChange={(e) => {
                                  setUrlInput(e.target.value);
                                  if (urlError) setUrlError(null);
                                }}
                                className={cn(
                                  "w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary/60 focus:bg-white/[0.08]",
                                  urlError && "border-danger/60 focus:border-danger/80 focus:ring-danger/20"
                                )}
                              />
                            </div>
                            {urlError && (
                              <FadeIn direction="none" duration={0.2} className="flex items-center gap-1.5 text-xs text-danger font-medium">
                                <AlertTriangle className="size-3.5" />
                                <span>{urlError}</span>
                              </FadeIn>
                            )}
                          </div>
                          
                          <Button
                            onClick={handleUrlSubmit}
                            className="w-full rounded-xl py-6"
                          >
                            Analyze Link URL
                          </Button>
                        </div>
                      )}

                      {activeTab === "text" && (
                        // Textarea UI
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="text-input" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Message Content</label>
                            <div className="relative">
                              <textarea
                                id="text-input"
                                rows={6}
                                placeholder="Paste suspicious emails, SMS messages, job offers or request text here..."
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value.substring(0, CHAR_LIMIT))}
                                className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-foreground outline-none resize-none transition-all focus:border-primary/60 focus:bg-white/[0.08]"
                              />
                              <div className="absolute bottom-3 right-3 text-[10px] font-mono text-muted-foreground">
                                {textInput.length} / {CHAR_LIMIT}
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            onClick={handleTextSubmit}
                            disabled={!textInput.trim()}
                            className="w-full rounded-xl py-6"
                          >
                            Classify Message Text
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </HoverGlow>

            {/* Right Side: Scan Progress & Results */}
            <div className="flex flex-col justify-between h-full">
              {scanState === "idle" ? (
                // Initial Onboarding Placeholder
                <Card className="border-white/10 bg-surface/50 backdrop-blur-xl h-full flex flex-col justify-center items-center p-8 text-center min-h-[380px]">
                  <div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-muted-foreground mb-4">
                    <Fingerprint className="size-6" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Scam IQ Workspace</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                    Select a tab to import a suspicious payload. Hit Scan to extract threats, indicators, and malicious intent.
                  </p>
                </Card>
              ) : scanState === "scanning" ? (
                // scanning placeholder card
                <Card className="border-white/10 bg-surface/50 backdrop-blur-xl h-full flex flex-col justify-center items-center p-8 text-center min-h-[380px]">
                  <LoadingPulse variant="glow" width={100} height={100} radius="100%" className="mb-4" />
                  <div className="space-y-3 w-full">
                    <LoadingPulse variant="shimmer" width="60%" className="mx-auto" />
                    <LoadingPulse variant="shimmer" width="80%" className="mx-auto animate-pulse" />
                    <LoadingPulse variant="shimmer" width="50%" className="mx-auto" />
                  </div>
                </Card>
              ) : (
                // completed state: Display Custom Interactive Score Card
                currentResult && (
                  <FadeIn direction="up" className="h-full">
                    <div className="rounded-3xl border border-white/10 bg-surface/75 backdrop-blur-xl p-6 md:p-8 h-full space-y-6">
                      
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-5">
                        <div>
                          <p className="text-xs font-mono text-muted-foreground uppercase">Threat Report ID: {currentResult.id}</p>
                          <h3 className="mt-1.5 text-xl font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
                            {currentResult.name}
                          </h3>
                        </div>
                        <Badge
                          className={cn(
                            "rounded-full px-3 py-1 font-semibold",
                            currentResult.level === "Critical" && "bg-danger/15 text-danger border border-danger/25 animate-pulse",
                            currentResult.level === "High" && "bg-orange-500/15 text-orange-500 border border-orange-500/25",
                            currentResult.level === "Moderate" && "bg-yellow-500/15 text-yellow-500 border border-yellow-500/25",
                            currentResult.level === "Safe" && "bg-success/15 text-success border border-success/25"
                          )}
                        >
                          {currentResult.level}
                        </Badge>
                      </div>

                      {/* Circle Gauge & Summary */}
                      <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
                        {/* Score Circle */}
                        <div className="relative flex size-36 shrink-0 items-center justify-center rounded-full border border-white/5 bg-[#0A0A0A] shadow-[inset_0_2px_12px_rgba(0,0,0,0.8)]">
                          {/* Inner glowing pulse ring */}
                          <div
                            className={cn(
                              "absolute inset-3 rounded-full opacity-10 blur-md",
                              currentResult.score >= 65 ? "bg-danger" : currentResult.score >= 35 ? "bg-yellow-500" : "bg-success"
                            )}
                          />
                          
                          {/* SVG Progress Circle */}
                          <svg className="absolute inset-0 size-full -rotate-95">
                            <circle
                              cx="72"
                              cy="72"
                              r="64"
                              className="stroke-white/5"
                              strokeWidth="4"
                              fill="transparent"
                            />
                            <motion.circle
                              cx="72"
                              cy="72"
                              r="64"
                              className={cn(
                                currentResult.score >= 85 ? "stroke-danger" : currentResult.score >= 65 ? "stroke-orange-500" : currentResult.score >= 35 ? "stroke-yellow-500" : "stroke-success"
                              )}
                              strokeWidth="5"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 64}
                              initial={{ strokeDashoffset: 2 * Math.PI * 64 }}
                              animate={{ strokeDashoffset: 2 * Math.PI * 64 - (currentResult.score / 100) * (2 * Math.PI * 64) }}
                              transition={{ duration: 1.5, ease: EASES.linear }}
                            />
                          </svg>

                          <div className="text-center">
                            <span className="font-mono text-4xl font-bold tracking-tight text-foreground">
                              <AnimatedCounter from={0} to={currentResult.score} duration={1.5} />
                            </span>
                            <span className="absolute bottom-9 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground font-mono">/100</span>
                          </div>
                        </div>

                        {/* Finding text */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <Sparkles className="size-4 text-primary" />
                            AI Intelligence Finding
                          </h4>
                          <p className="text-xs leading-5 text-muted-foreground">
                            {currentResult.score >= 85 ? (
                              "High-confidence threat signatures matched credential phishing kits. The portal attempts to harvest active accounts using domain spoofing tricks and high-urgency notifications."
                            ) : currentResult.score >= 65 ? (
                              "High likelihood of social engineering. Content mirrors common urgency-based luring campaigns designed to induce impulsive link clicking or credential exposure."
                            ) : currentResult.score >= 35 ? (
                              "Medium-risk indicator flags resolved. Text structures contain moderate influence metrics, though no verified malicious domains or exploit hooks were found."
                            ) : (
                              "Sample validated as safe. Structurally clean. No blacklisted redirects, pressure hooks, spoofing anomalies, or high-risk content markers detected."
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Scam DNA Markers & Breakdown */}
                      <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-white/5">
                        
                        {/* Scam DNA Markers */}
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Fingerprint className="size-4 text-primary" />
                            <span className="text-xs font-semibold text-foreground">Scam DNA Markers</span>
                          </div>
                          <div className="space-y-2 text-xs">
                            {currentResult.score >= 85 ? (
                              <>
                                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Authority spoof</span><span className="text-danger font-medium">Verified</span></div>
                                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Payment lure</span><span className="text-danger font-medium">High</span></div>
                                <div className="flex justify-between py-1"><span className="text-muted-foreground">Credential capture</span><span className="text-danger font-medium">Critical</span></div>
                              </>
                            ) : currentResult.score >= 65 ? (
                              <>
                                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Sender mismatch</span><span className="text-orange-500 font-medium">High</span></div>
                                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Urgency hook</span><span className="text-orange-500 font-medium">Verified</span></div>
                                <div className="flex justify-between py-1"><span className="text-muted-foreground">Pretext incentive</span><span className="text-yellow-500 font-medium">Low</span></div>
                              </>
                            ) : currentResult.score >= 35 ? (
                              <>
                                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Incentive bias</span><span className="text-yellow-500 font-medium">Moderate</span></div>
                                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Suspicious link</span><span className="text-success font-medium">Negative</span></div>
                                <div className="flex justify-between py-1"><span className="text-muted-foreground">Redirection logic</span><span className="text-success font-medium">Negative</span></div>
                              </>
                            ) : (
                              <>
                                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Urgency signals</span><span className="text-success font-medium">Clean</span></div>
                                <div className="flex justify-between py-1 border-b border-white/5"><span className="text-muted-foreground">Impersonation markers</span><span className="text-success font-medium">Clean</span></div>
                                <div className="flex justify-between py-1"><span className="text-muted-foreground">Exploit vectors</span><span className="text-success font-medium">Clean</span></div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action checklist */}
                        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <TerminalSquare className="size-4 text-success" />
                            <span className="text-xs font-semibold text-foreground">Mitigation Checklist</span>
                          </div>
                          <div className="space-y-2 text-xs">
                            {currentResult.score >= 65 ? (
                              <>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="size-1.5 rounded-full bg-danger shrink-0" />
                                  <span>Flag & quarantine sender domain</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="size-1.5 rounded-full bg-danger shrink-0" />
                                  <span>Force-expire active sessions</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="size-1.5 rounded-full bg-yellow-500 shrink-0" />
                                  <span>Distribute phish-marker block</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="size-1.5 rounded-full bg-success shrink-0" />
                                  <span>Mark sample safe in system</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="size-1.5 rounded-full bg-success shrink-0" />
                                  <span>No firewall block required</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span className="size-1.5 rounded-full bg-success shrink-0" />
                                  <span>Heuristics log logged</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  </FadeIn>
                )
              )}
            </div>

          </div>

          {/* Section: Recent Analyses Ledger */}
          <div className="mt-12">
            <RevealOnScroll type="slide-fade" direction="up" threshold={0.05} duration={0.6}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Recent Analyses</h2>
                  <p className="text-xs text-muted-foreground">Logs of suspicious payloads scanned globally.</p>
                </div>
                <div className="flex size-9 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-muted-foreground">
                  <Clock className="size-4" />
                </div>
              </div>
            </RevealOnScroll>

            <StaggerContainer staggerChildren={0.06} className="grid gap-4">
              {recentAnalyses.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-surface/40 p-6 text-sm text-muted-foreground">
                  No analyses yet. Run your first scan above to populate this ledger.
                </div>
              ) : (
              recentAnalyses.map((analysis) => (
                <FadeIn
                  key={analysis.id}
                  direction="up"
                  viewportTrigger={true}
                  className="rounded-2xl border border-white/5 bg-surface/40 hover:bg-surface/70 hover:border-white/10 transition-all p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                        analysis.type === "Screenshot" && "border-blue-500/20 bg-blue-500/10 text-blue-500",
                        analysis.type === "URL" && "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
                        analysis.type === "Text" && "border-purple-500/20 bg-purple-500/10 text-purple-500"
                      )}
                    >
                      {analysis.type === "Screenshot" && <FileImage className="size-5" />}
                      {analysis.type === "URL" && <Link2 className="size-5" />}
                      {analysis.type === "Text" && <FileText className="size-5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate max-w-[240px] sm:max-w-md">
                        {analysis.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">{analysis.id}</span>
                        <span className="size-1 rounded-full bg-white/10" />
                        <span className="text-[10px] text-muted-foreground">{analysis.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 font-mono text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Score:</span>
                      <span className="font-semibold text-foreground">{analysis.score}/100</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="text-foreground">{analysis.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-semibold border",
                          analysis.level === "Critical" && "bg-danger/15 text-danger border-danger/25",
                          analysis.level === "High" && "bg-orange-500/15 text-orange-500 border-orange-500/25",
                          analysis.level === "Moderate" && "bg-yellow-500/15 text-yellow-500 border-yellow-500/25",
                          analysis.level === "Safe" && "bg-success/15 text-success border-success/25"
                        )}
                      >
                        {analysis.level}
                      </Badge>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                      <span className="text-success flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-success" />
                        <span>Completed</span>
                      </span>
                    </div>
                  </div>
                </FadeIn>
              ))
              )}
            </StaggerContainer>
          </div>

        </div>
      </main>
    </PageTransition>
  );
}
