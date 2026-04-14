/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { 
  Upload, 
  Video, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Zap,
  Cpu,
  Palette,
  Play,
  Share2,
  Copy,
  Check,
  Crown,
  Lock,
  ExternalLink,
  Settings
} from "lucide-react";

// Types for the structured response
interface AestheticCaption {
  hype: string;
  tech: string;
  aesthetic: string;
}

interface ViralAnalysis {
  viral_start_timestamp: string;
  viral_end_timestamp: string;
  aesthetic_caption: AestheticCaption;
}

interface Sticker {
  id: string;
  url: string;
  caption: string;
  style: string;
  timestamp: number;
}

interface StickerOptions {
  strokeWidth: number;
  fillColor: string;
  outlineColor: string;
  style: string;
}

// ==========================================
// PREVIEW MODE CONFIG
// Set to false for the full launch
// ==========================================
const SHOW_PREVIEW_BANNER = true; 

const PointyStar = ({ className = "w-5 h-5", glow = true }: { className?: string, glow?: boolean }) => (
  <div className={`relative ${className}`}>
    {glow && (
      <div className="absolute inset-0 bg-yellow-400/40 blur-[8px] rounded-full animate-pulse" />
    )}
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={`relative z-10 ${glow ? 'text-yellow-400' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
    </svg>
  </div>
);

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ViralAnalysis | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [showShareToast, setShowShareToast] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveSuccess, setArchiveSuccess] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [trimmedVideoUrl, setTrimmedVideoUrl] = useState<string | null>(null);
  const [isForging, setIsForging] = useState<string | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [proUsageCount, setProUsageCount] = useState(0);
  const [starsBalance, setStarsBalance] = useState(0);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [stickerLibrary, setStickerLibrary] = useState<Sticker[]>([]);
  const [showForgeModal, setShowForgeModal] = useState(false);
  const [forgeModalData, setForgeModalData] = useState<{ caption: string, aesthetic: string } | null>(null);
  const [stickerOptions, setStickerOptions] = useState<StickerOptions>({
    strokeWidth: 2,
    fillColor: "#ffffff",
    outlineColor: "#000000",
    style: "Cyberpunk"
  });
  const [stickerPreview, setStickerPreview] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);

  // Initialize Gemini API
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Cleanup video URLs
  useEffect(() => {
    // Load Pro status and usage from localStorage
    const savedPro = localStorage.getItem("stix_magic_pro") === "true";
    const savedUsage = parseInt(localStorage.getItem("stix_magic_usage") || "0");
    const savedProUsage = parseInt(localStorage.getItem("stix_magic_pro_usage") || "0");
    const savedStars = parseInt(localStorage.getItem("stix_magic_stars") || "0");
    const savedCustomerId = localStorage.getItem("stix_magic_customer_id");
    const savedLibrary = JSON.parse(localStorage.getItem("stix_magic_library") || "[]");
    
    setStripeCustomerId(savedCustomerId);
    setStickerLibrary(savedLibrary);

    // Check URL for success
    const params = new URLSearchParams(window.location.search);
    if (params.get("pro") === "true") {
      setIsPro(true);
      localStorage.setItem("stix_magic_pro", "true");
      window.history.replaceState({}, document.title, "/");
    } else if (params.get("stars") === "true") {
      const newStars = savedStars + 10;
      setStarsBalance(newStars);
      localStorage.setItem("stix_magic_stars", newStars.toString());
      window.history.replaceState({}, document.title, "/");
    } else {
      setIsPro(savedPro);
      setStarsBalance(savedStars);
    }
    
    setUsageCount(savedUsage);
    setProUsageCount(savedProUsage);

    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      if (trimmedVideoUrl) URL.revokeObjectURL(trimmedVideoUrl);
    };
  }, [videoUrl, trimmedVideoUrl]);

  const handleUpgrade = async (type: "pro" | "stars" = "pro") => {
    // Grant access (Demo Mode)
    if (type === "pro") {
      // Simulate Telegram Stars Payment for Pro (699 Stars)
      setProcessingStatus("Processing Telegram Stars Payment (699)...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsPro(true);
      const demoCustomerId = "cus_demo123"; 
      setStripeCustomerId(demoCustomerId);
      localStorage.setItem("stix_magic_pro", "true");
      localStorage.setItem("stix_magic_customer_id", demoCustomerId);
      setProcessingStatus("Clipsflow Pro Unlocked! ✦");
    } else {
      // Simulate buying 10 stars
      setProcessingStatus("Processing Stars Purchase...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newStars = starsBalance + 10;
      setStarsBalance(newStars);
      localStorage.setItem("stix_magic_stars", newStars.toString());
      setProcessingStatus("10 Stars Added! ✦");
    }
    setShowUpsell(false);
    setTimeout(() => setProcessingStatus(""), 3000);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      setFile(selectedFile);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      setVideoUrl(URL.createObjectURL(selectedFile));
      setError(null);
      setResult(null);
    } else {
      setError("Please select a valid video file (.mp4, .mov, etc.)");
    }
  };

  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(":").map(Number);
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return parts[0] || 0;
  };

  const seekTo = (timestamp: string) => {
    if (videoRef.current) {
      const seconds = parseTimestamp(timestamp);
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {}); 
    }
  };

  const handleVideoLoad = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
    const params = new URLSearchParams(window.location.search);
    const startTime = params.get("t");
    if (startTime && videoRef.current) {
      const seconds = parseInt(startTime);
      if (!isNaN(seconds)) {
        videoRef.current.currentTime = seconds;
      }
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setProcessingStatus(`Copied ${type} to clipboard!`);
      setTimeout(() => setProcessingStatus(""), 3000);
    });
  };

  const shareAnalysis = () => {
    if (!result) return;
    
    const seconds = parseTimestamp(result.viral_start_timestamp);
    const shareUrl = new URL(window.location.href);
    shareUrl.searchParams.set("t", seconds.toString());
    
    navigator.clipboard.writeText(shareUrl.toString()).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    });
  };

  const handleManageSubscription = async () => {
    if (!stripeCustomerId) {
      setError("No active subscription found to manage.");
      return;
    }

    try {
      setProcessingStatus("Opening subscription portal...");
      const response = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: stripeCustomerId }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create portal session.");
      }
    } catch (err: any) {
      setError(err.message);
      setProcessingStatus("");
    }
  };

  const archiveToTelegram = async () => {
    if (!result || !file) return;
    
    setIsArchiving(true);
    setArchiveSuccess(false);
    setError(null);

    try {
      const response = await fetch("/api/archive/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: result,
          fileName: file.name
        }),
      });

      const data = await response.json();
      if (data.success) {
        setArchiveSuccess(true);
        setTimeout(() => setArchiveSuccess(false), 5000);
      } else {
        throw new Error(data.error || "Failed to archive to Telegram.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsArchiving(false);
    }
  };

  // Auto-seek to viral start when result is available
  useEffect(() => {
    if (result && videoUrl && videoRef.current) {
      // Small delay to ensure video element is ready
      const timer = setTimeout(() => {
        seekTo(result.viral_start_timestamp);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [result, videoUrl]);

  const loadFFmpeg = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";
    const ffmpeg = new FFmpeg();
    ffmpeg.on("log", ({ message }) => {
      console.log(message);
      if (message.includes("frame=")) {
        setProcessingStatus(`Trimming: ${message}`);
      }
    });
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });
    ffmpegRef.current = ffmpeg;
  };

  const trimVideo = async () => {
    if (!result || !file) return;
    if (file.size > 500 * 1024 * 1024) {
      setError("Video is too large for browser-side trimming (max 500MB). Please use the timestamps in your editor.");
      return;
    }

    setIsTrimming(true);
    setError(null);
    setProcessingStatus("Loading FFmpeg...");

    try {
      if (!ffmpegRef.current) {
        await loadFFmpeg();
      }
      const ffmpeg = ffmpegRef.current!;

      setProcessingStatus("Writing file to virtual filesystem...");
      await ffmpeg.writeFile("input.mp4", await fetchFile(file));

      const start = parseTimestamp(result.viral_start_timestamp);
      const end = parseTimestamp(result.viral_end_timestamp);
      const duration = end - start;

      setProcessingStatus("Trimming video...");
      // -ss before -i for fast seeking
      await ffmpeg.exec([
        "-ss", start.toString(),
        "-i", "input.mp4",
        "-t", duration.toString(),
        "-c", "copy", // Use copy codec for speed and to avoid re-encoding issues in browser
        "output.mp4"
      ]);

      setProcessingStatus("Reading trimmed file...");
      const data = await ffmpeg.readFile("output.mp4");
      const url = URL.createObjectURL(new Blob([(data as any).buffer], { type: "video/mp4" }));
      setTrimmedVideoUrl(url);
      
      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `trimmed_${file.name}`;
      a.click();

      setProcessingStatus("Trimming complete!");
      setTimeout(() => setProcessingStatus(""), 3000);
    } catch (err: any) {
      console.error("Trimming error:", err);
      setError("Failed to trim video. Browser-side trimming can be unstable for large files.");
    } finally {
      setIsTrimming(false);
    }
  };

  const forgeSticker = async (caption: string, aesthetic: string) => {
    setForgeModalData({ caption, aesthetic });
    setShowForgeModal(true);
    setStickerPreview(null);
  };

  const generateStickerPreview = async () => {
    if (!forgeModalData) return;
    setIsPreviewing(true);
    setError(null);

    try {
      const response = await fetch("/api/forge-sticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: forgeModalData.caption,
          aesthetic: forgeModalData.aesthetic,
          previewOnly: true,
          options: stickerOptions
        }),
      });

      const data = await response.json();
      if (data.success) {
        setStickerPreview(data.previewUrl);
      } else {
        throw new Error(data.error || "Failed to generate preview.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPreviewing(false);
    }
  };

  const finalizeStickerForge = async () => {
    if (!forgeModalData || !stickerPreview) return;
    setIsForging(forgeModalData.aesthetic);
    setError(null);

    try {
      const response = await fetch("/api/forge-sticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: forgeModalData.caption,
          aesthetic: forgeModalData.aesthetic,
          options: stickerOptions
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProcessingStatus(`✨ Sticker forged and sent to Telegram!`);
        
        // Save to library
        const newSticker: Sticker = {
          id: Date.now().toString(),
          url: data.stickerUrl || stickerPreview,
          caption: forgeModalData.caption,
          style: stickerOptions.style,
          timestamp: Date.now()
        };
        
        const updatedLibrary = [newSticker, ...stickerLibrary];
        setStickerLibrary(updatedLibrary);
        localStorage.setItem("stix_magic_library", JSON.stringify(updatedLibrary));
        
        setShowForgeModal(false);
        setTimeout(() => setProcessingStatus(""), 5000);
      } else {
        throw new Error(data.error || "Failed to forge sticker.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsForging(null);
    }
  };

  const resendSticker = async (sticker: Sticker) => {
    setIsForging(sticker.id);
    try {
      // For resending, we can just send the existing URL if it's base64 or re-forge
      // For now, let's just re-forge with the same caption and style
      const response = await fetch("/api/forge-sticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: sticker.caption,
          aesthetic: sticker.style,
          options: { ...stickerOptions, style: sticker.style }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setProcessingStatus("✨ Sticker re-sent to Telegram!");
        setTimeout(() => setProcessingStatus(""), 3000);
      }
    } catch (err: any) {
      setError("Failed to re-send sticker.");
    } finally {
      setIsForging(null);
    }
  };

  const downloadSticker = (url: string, id: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `sticker-${id}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const analyzeVideo = async () => {
    if (!file) return;

    // Quota Logic
    let canProceed = false;
    let quotaType: "free" | "pro" | "stars" | null = null;

    if (isPro && proUsageCount < 50) {
      canProceed = true;
      quotaType = "pro";
    } else if (usageCount < 2) {
      canProceed = true;
      quotaType = "free";
    } else if (starsBalance > 0) {
      canProceed = true;
      quotaType = "stars";
    }

    if (!canProceed) {
      setShowUpsell(true);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(10);

      // 1. Upload the file to Google File API
      setProcessingStatus("Uploading video to Google File API...");
      
      const uploadResult = await ai.files.upload({
        file: file,
      });

      const fileUri = uploadResult.uri;
      const fileName = uploadResult.name;

      setUploadProgress(50);
      setIsUploading(false);
      setIsProcessing(true);

      // 2. Poll for processing state
      setProcessingStatus("Waiting for Google to process the video...");
      let fileState = "PROCESSING";
      
      while (fileState === "PROCESSING") {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const fileInfo = await ai.files.get({ name: fileName });
        fileState = fileInfo.state;
        
        if (fileState === "FAILED") {
          throw new Error("Video processing failed on Google's servers.");
        }
      }

      setIsProcessing(false);
      setIsAnalyzing(true);
      setProcessingStatus("Analyzing video for viral potential...");

      // 3. Construct Multimodal Prompt and Structured JSON Enforcer
      const prompt = "Watch this entire video. Identify the absolute highest-retention, most viral 15-second segment based on visual framing, audio spikes, and hook delivery.";

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          viral_start_timestamp: { 
            type: Type.STRING,
            description: "The start time of the viral segment (e.g., '0:05')"
          },
          viral_end_timestamp: { 
            type: Type.STRING,
            description: "The end time of the viral segment (e.g., '0:20')"
          },
          aesthetic_caption: {
            type: Type.OBJECT,
            properties: {
              hype: { type: Type.STRING, description: "A high-energy, viral-style caption." },
              tech: { type: Type.STRING, description: "A technical, feature-focused caption." },
              aesthetic: { type: Type.STRING, description: "A minimal, visually-driven caption." },
            },
            required: ["hype", "tech", "aesthetic"],
          },
        },
        required: ["viral_start_timestamp", "viral_end_timestamp", "aesthetic_caption"],
      };

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: [
          {
            parts: [
              { fileData: { fileUri, mimeType: file.type } },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      if (response.text) {
        const analysis: ViralAnalysis = JSON.parse(response.text);
        setResult(analysis);
        
        // Update appropriate quota
        if (quotaType === "free") {
          const newUsage = usageCount + 1;
          setUsageCount(newUsage);
          localStorage.setItem("stix_magic_usage", newUsage.toString());
        } else if (quotaType === "pro") {
          const newUsage = proUsageCount + 1;
          setProUsageCount(newUsage);
          localStorage.setItem("stix_magic_pro_usage", newUsage.toString());
        } else if (quotaType === "stars") {
          const newStars = starsBalance - 1;
          setStarsBalance(newStars);
          localStorage.setItem("stix_magic_stars", newStars.toString());
        }
      } else {
        throw new Error("Failed to get analysis from Gemini.");
      }

    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      setIsAnalyzing(false);
      setProcessingStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans selection:bg-purple-500/30">
      {/* Background Glows & Noise */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[70%] bg-purple-600/10 blur-[140px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] bg-indigo-600/10 blur-[130px] rounded-full" />
        <div className="absolute inset-0 noise-bg mix-blend-overlay" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-24">
        {/* Exclusive Sneak Peak Banner */}
        {SHOW_PREVIEW_BANNER && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 p-[1px] rounded-3xl bg-gradient-to-r from-purple-600/50 via-blue-500/50 to-cyan-400/50 shadow-[0_0_50px_rgba(147,51,234,0.1)]"
          >
            <div className="bg-white/5 backdrop-blur-xl rounded-[1.4rem] px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-widest uppercase text-white">Exclusive Sneak Peak</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">The full MΛGIC Engine is coming soon</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-cyan-400">
                  Early Access v0.1
                </span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Header */}
        <header className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex flex-col items-center gap-10 mb-12">
              {/* Logo Animation Container */}
              <div className="relative group">
                <div className="absolute inset-0 bg-purple-600/20 blur-[160px] rounded-full group-hover:bg-purple-500/30 transition-all duration-1000 scale-150" />
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="relative w-56 h-56 md:w-72 md:h-72 flex items-center justify-center p-2"
                >
                  <video 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-[150%] h-[150%] max-w-none object-contain mix-blend-screen pointer-events-none drop-shadow-[0_0_40px_rgba(168,85,247,0.3)] brightness-125 contrast-125"
                  >
                    <source src="/logo-anim.webm" type="video/webm" />
                    <source src="/logo-anim.mp4" type="video/mp4" />
                    {/* Fallback to static logo */}
                    <img src="/logo.png" className="w-full h-full object-contain mix-blend-screen brightness-125 contrast-125" alt="STIX MAGIC" />
                  </video>
                </motion.div>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center justify-center gap-6">
                  <h1 className="text-6xl md:text-9xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/20">
                    STIX ✦ MΛGIC
                  </h1>
                  {isPro && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                      CLIPSFLOW PRO
                    </motion.div>
                  )}
                </div>

                {/* Fun Dynamic Subtitle */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-3">
                    <PointyStar className="w-4 h-4" />
                    <p className="text-[10px] md:text-xs text-purple-400/80 uppercase tracking-[0.6em] font-black animate-gradient-x bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400">
                      Magic Powder Powered
                    </p>
                    <PointyStar className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-3 text-[8px] text-gray-600 uppercase tracking-[0.2em] font-bold">
                    <span>GenAI Intelligence</span>
                    <span className="w-1 h-1 rounded-full bg-gray-800" />
                    <div className="flex items-center gap-1.5">
                      <PointyStar className="w-2 h-2" glow={false} />
                      <span>Powered by Gemini 1.5 Pro</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex items-center gap-4 px-8 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_30px_rgba(168,85,247,0.15)] mx-auto w-fit mb-10"
            >
                <motion.div
                  animate={{ 
                    rotate: [0, 15, -15, 0],
                    scale: [1, 1.2, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </motion.div>
                <span className="text-xs md:text-sm font-black tracking-[0.6em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
                  MΛGIC CLIPS
                </span>
                <motion.div
                  animate={{ 
                    rotate: [0, -15, 15, 0],
                    scale: [1, 1.2, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                >
                  <Sparkles className="w-5 h-5 text-pink-500" />
                </motion.div>
              </motion.div>

              <div className="flex items-center gap-4">
                {(starsBalance > 0 || isPro) && (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="px-5 py-2.5 rounded-2xl glass-card flex items-center gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">{starsBalance} Stars</span>
                    <button 
                      onClick={() => setShowUpsell(true)}
                      className="ml-2 w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    >
                      <Upload className="w-3.5 h-3.5 rotate-45" />
                    </button>
                  </motion.div>
                )}

                {isPro && (
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowLibrary(!showLibrary)}
                      className={`p-3 rounded-2xl glass-card border-white/10 transition-all flex items-center justify-center group ${showLibrary ? 'bg-purple-500/20 border-purple-500/50' : 'hover:bg-white/10'}`}
                      title="Sticker Library"
                    >
                      <Palette className={`w-5 h-5 ${showLibrary ? 'text-purple-400' : 'text-gray-400 group-hover:text-white'} transition-colors`} />
                    </motion.button>
                    <div className="px-5 py-2.5 rounded-2xl glass-card flex flex-col items-start border-yellow-500/30">
                      <span className="text-[9px] uppercase tracking-[0.15em] text-yellow-500 font-black flex items-center gap-1.5">
                        <Crown className="w-2.5 h-2.5" />
                        Clipsflow Pro
                      </span>
                      <span className="text-sm font-bold tracking-tight">High-Capacity Access</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleManageSubscription}
                      className="p-3 rounded-2xl glass-card border-white/10 hover:bg-white/10 transition-all flex items-center justify-center group"
                      title="Manage Subscription"
                    >
                      <Settings className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                    </motion.button>
                  </div>
                )}
              </div>
            
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
              Forge viral hooks with AI. Upload your video and let <span className="text-white font-medium">STIX ✦ MΛGIC</span> identify the 
              <span className="text-white font-medium"> 15-second window</span> that commands attention.
            </p>
            
            {!isPro && (
              <div className="mt-10 flex flex-col items-center gap-5">
                <div className="flex items-center gap-3 text-xs text-gray-500 font-bold uppercase tracking-widest">
                  <div className="flex gap-1.5">
                    {[1, 2].map((i) => (
                      <div 
                        key={i} 
                        className={`w-10 h-1.5 rounded-full transition-all duration-700 ${i <= usageCount ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : "bg-white/10"}`} 
                      />
                    ))}
                  </div>
                  <span>{usageCount}/2 Free Credits</span>
                </div>
                {usageCount >= 2 && (
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUpsell(true)}
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-xs uppercase tracking-widest hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all flex items-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Unlock High-Volume Magic
                  </motion.button>
                )}
              </div>
            )}

            {/* Aesthetic Style Selector */}
            <div className="mt-12 max-w-2xl mx-auto">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6 text-center">Select Your Forge Aesthetic</p>
              <div className="flex flex-wrap justify-center gap-3">
                {['Cyberpunk', 'Retro Futurism', 'Synthwave', 'Minimalist', 'Glitch Art'].map((s) => (
                  <motion.button
                    key={s}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setStickerOptions({ ...stickerOptions, style: s })}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                      stickerOptions.style === s 
                        ? "bg-purple-500 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </header>

        {/* Upload Section */}
        <section className="mb-12">
          {!result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className={`relative group rounded-[2.5rem] border-2 border-dashed transition-all duration-500 ${
                file ? "border-purple-500/40 bg-purple-500/5" : "border-white/10 hover:border-white/20 glass-card"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
              />
              
              <div className="p-16 text-center">
                <div className="mb-8 flex justify-center">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-24 h-24 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-2xl ${
                      file ? "bg-purple-500 text-white shadow-purple-500/20" : "bg-white/5 text-gray-400"
                    }`}
                  >
                    {file ? <Video className="w-12 h-12" /> : <Upload className="w-12 h-12" />}
                  </motion.div>
                </div>

                {file ? (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <p className="text-2xl font-bold mb-2 tracking-tight">{file.name}</p>
                    <p className="text-sm text-gray-500 mb-10 font-medium">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for magic
                    </p>
                    <button
                      onClick={analyzeVideo}
                      disabled={isUploading || isProcessing || isAnalyzing || (!isPro && usageCount >= 2 && starsBalance === 0)}
                      className="px-10 py-5 rounded-[2rem] bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-lg hover:shadow-[0_0_40px_rgba(147,51,234,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto shadow-2xl"
                    >
                      {isUploading || isProcessing || isAnalyzing ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          <span>Forging Hook...</span>
                        </>
                      ) : (!isPro && usageCount >= 2) && starsBalance === 0 ? (
                        <>
                          <Crown className="w-6 h-6" />
                          <span>Get Clipsflow Pro</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6" />
                          <span>Analyze Viral Potential</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <div className="max-w-xs mx-auto">
                    <p className="text-2xl font-bold mb-3 tracking-tight">Drop your video here</p>
                    <p className="text-sm text-gray-500 mb-10 font-medium leading-relaxed">Support MP4, MOV, WEBM up to 2GB. High resolution preferred.</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-10 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black text-xs tracking-[0.2em] shadow-[0_10px_40px_rgba(147,51,234,0.3)] hover:scale-105 transition-all"
                    >
                      Browse Files
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Status Indicators */}
          <AnimatePresence>
            {(isUploading || isProcessing || isAnalyzing) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <p className="font-medium">{processingStatus}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                      {isUploading ? "Uploading" : isProcessing ? "Processing" : "Analyzing"}
                    </p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-purple-500"
                    initial={{ width: "0%" }}
                    animate={{ 
                      width: isUploading ? "50%" : isProcessing ? "75%" : "95%" 
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </motion.div>
          )}
        </section>

        {/* Results Section */}
        <AnimatePresence>
          {showUpsell && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowUpsell(false)}
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-[0_0_100px_rgba(0,0,0,0.3)] overflow-hidden"
              >
                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/20 blur-[80px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full" />
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-600 via-yellow-500 to-blue-600" />
                
                <div className="relative z-10 text-center">
                  <motion.div 
                    initial={{ scale: 0.5, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center mx-auto mb-10 shadow-[0_20px_50px_rgba(234,179,8,0.3)]"
                  >
                    <Crown className="w-12 h-12 text-black" />
                  </motion.div>
                  
                  <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">
                    Clipsflow Pro
                  </h2>
                  
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 mb-8">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Limited Spots Available</span>
                  </div>
                  
                  <p className="text-lg text-gray-400 mb-12 leading-relaxed font-light px-4">
                    You've reached your free limit. Unlock <span className="text-white font-bold">Clipsflow Pro</span> for the ultimate engine experience.
                  </p>

                  <div className="grid grid-cols-1 gap-5">
                    <motion.button 
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleUpgrade("pro")}
                      className="w-full py-6 rounded-3xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-black text-xl hover:from-blue-500 hover:to-purple-500 transition-all flex flex-col items-center justify-center gap-1 shadow-[0_20px_40px_rgba(37,99,235,0.3)]"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="w-7 h-7 text-yellow-400 fill-current" />
                        UNLOCK PRO • 699 STARS
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] opacity-80">Native Telegram Stars Payment</span>
                    </motion.button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUpgrade("stars")}
                        className="w-full py-5 rounded-3xl bg-white/5 border border-white/10 text-white font-bold text-base hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                      >
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                        BUY 10 STARS
                      </motion.button>
                      
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowUpsell(false)}
                        className="w-full py-5 rounded-3xl bg-transparent border border-white/5 text-gray-500 font-bold text-base hover:text-white hover:border-white/10 transition-all"
                      >
                        MAYBE LATER
                      </motion.button>
                    </div>
                  </div>

                  <p className="mt-10 text-[10px] text-gray-600 uppercase tracking-[0.2em] font-black flex items-center justify-center gap-4">
                    <span>Secure Telegram Stars Payment</span>
                    <span className="w-1 h-1 rounded-full bg-gray-800" />
                    <a href="https://t.me/clipsflow" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition-colors">
                      @clipsflow
                    </a>
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black flex items-center gap-3 tracking-[0.2em] text-white">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-7 h-7 text-yellow-400 fill-current shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                  </motion.div>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-white animate-pulse">
                    MΛGIC COMPLETE
                  </span>
                </h2>
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                    if (videoUrl) URL.revokeObjectURL(videoUrl);
                    if (trimmedVideoUrl) URL.revokeObjectURL(trimmedVideoUrl);
                    setVideoUrl(null);
                    setTrimmedVideoUrl(null);
                  }}
                  className="text-sm text-gray-500 hover:text-white transition-colors"
                >
                  Start Over
                </button>
              </div>

              {/* Video Player Section */}
              <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative aspect-video rounded-3xl overflow-hidden bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl"
                >
                  {videoUrl && (
                    <video 
                      ref={videoRef}
                      src={videoUrl} 
                      controls 
                      onLoadedMetadata={handleVideoLoad}
                      className="w-full h-full object-contain"
                    />
                  )}
                </motion.div>

                {/* Gold Glowing Timeline */}
                {videoDuration > 0 && result && (
                  <div className="px-2">
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute h-full bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.8)]"
                        style={{ 
                          left: `${(parseTimestamp(result.viral_start_timestamp) / videoDuration) * 100}%`,
                          width: `${((parseTimestamp(result.viral_end_timestamp) - parseTimestamp(result.viral_start_timestamp)) / videoDuration) * 100}%`
                        }}
                      >
                        <div className="absolute inset-0 bg-yellow-400 animate-pulse" />
                      </motion.div>
                    </div>
                    <div className="flex justify-between mt-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <span>0:00</span>
                      <span className="text-yellow-500">Viral Window Detected</span>
                      <span>{Math.floor(videoDuration / 60)}:{Math.floor(videoDuration % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Viral Segment Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="md:col-span-1 p-10 rounded-[2.5rem] glass-card flex flex-col items-center justify-center text-center relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6 shadow-xl relative z-10">
                    <Clock className="w-10 h-10 text-purple-400" />
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mb-3 relative z-10">Viral Window</p>
                  <div className="text-4xl font-black mb-8 tracking-tighter relative z-10">
                    {result.viral_start_timestamp} — {result.viral_end_timestamp}
                  </div>
                  
                  <div className="flex flex-col gap-3 w-full relative z-10">
                    <button 
                      onClick={() => seekTo(result.viral_start_timestamp)}
                      className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Jump to Start
                    </button>
                    <button 
                      onClick={() => seekTo(result.viral_end_timestamp)}
                      className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                      <Clock className="w-4 h-4" />
                      Jump to End
                    </button>
                  </div>

                  <p className="mt-8 text-xs text-gray-500 font-medium leading-relaxed relative z-10">
                    Gemini identified this 15s segment as the peak retention window based on visual and audio spikes.
                  </p>
                </motion.div>

                <div className="md:col-span-2 space-y-6">
                  {[
                    { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: "Hype Caption", text: result.aesthetic_caption.hype, color: "border-yellow-500/20 bg-yellow-500/5", type: "Hype" },
                    { icon: <Cpu className="w-5 h-5 text-blue-400" />, title: "Tech Caption", text: result.aesthetic_caption.tech, color: "border-blue-500/20 bg-blue-500/5", type: "Tech" },
                    { icon: <Palette className="w-5 h-5 text-pink-400" />, title: "Aesthetic Caption", text: result.aesthetic_caption.aesthetic, color: "border-pink-500/20 bg-pink-500/5", type: "Aesthetic" }
                  ].map((caption, idx) => (
                    <motion.div
                      key={caption.type}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                    >
                      <CaptionCard 
                        icon={caption.icon}
                        title={caption.title}
                        text={caption.text}
                        color={caption.color}
                        onCopy={() => copyToClipboard(caption.text, caption.title)}
                        onForge={() => forgeSticker(caption.text, caption.type)}
                        isForging={isForging === caption.type}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action */}
              <div className="p-8 rounded-3xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-current" />
                  </div>
                  <div>
                    <p className="font-bold">Ready to Export</p>
                    <p className="text-sm text-gray-500">Use these timestamps in your editor.</p>
                  </div>
                </div>
                <button className="w-full md:w-auto px-8 py-4 rounded-2xl bg-white text-black font-bold hover:bg-gray-200 transition-colors">
                  Copy All Data
                </button>
                <button 
                  onClick={trimVideo}
                  disabled={isTrimming}
                  className="w-full md:w-auto px-8 py-4 rounded-2xl bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isTrimming ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {isTrimming ? "Trimming..." : "Trim & Download"}
                </button>
                <button 
                  onClick={shareAnalysis}
                  className="w-full md:w-auto px-8 py-4 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition-colors font-bold flex items-center justify-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Share Link
                </button>
                <button 
                  onClick={archiveToTelegram}
                  disabled={isArchiving}
                  className={`w-full md:w-auto px-8 py-4 rounded-2xl border transition-all duration-300 font-bold flex items-center justify-center gap-2 ${
                    archiveSuccess 
                    ? "bg-green-500/20 border-green-500/50 text-green-400" 
                    : "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {isArchiving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : archiveSuccess ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  {archiveSuccess ? "Archived to Telegram" : "Archive to Telegram"}
                </button>
              </div>

              {!isPro && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="p-12 rounded-[2.5rem] bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-purple-500/10 border border-yellow-500/20 text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
                  <div className="relative z-10">
                    <div className="w-20 h-20 rounded-3xl bg-yellow-500 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(234,179,8,0.4)]">
                      <Crown className="w-10 h-10 text-black" />
                    </div>
                    <h3 className="text-3xl font-bold mb-4">Unlock High-Volume Magic</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-8">
                      You're currently on the free tier. Upgrade to Pro for high-capacity video analyses, 
                      high-speed trimming, and priority sticker forging.
                    </p>
                    <button 
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                      className="px-12 py-5 rounded-2xl bg-white text-black font-black text-lg hover:bg-yellow-500 transition-all hover:scale-105 flex items-center gap-3 mx-auto shadow-2xl"
                    >
                      {isUpgrading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6 fill-current" />}
                      GET PRO ACCESS NOW
                    </button>
                    <p className="mt-6 text-xs text-gray-500 uppercase tracking-widest">One-time payment • Lifetime access</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticker Forge Modal */}
        <AnimatePresence>
          {showForgeModal && forgeModalData && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowForgeModal(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="relative w-full max-w-2xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 md:p-10 shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black uppercase tracking-tight">Forge Sticker</h2>
                  <button onClick={() => setShowForgeModal(false)} className="p-2 rounded-full hover:bg-white/10">
                    <AlertCircle className="w-6 h-6 rotate-45" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Style</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Cyberpunk', 'Retro Futurism', 'Synthwave', 'Minimalist', 'Glitch Art'].map(s => (
                          <button
                            key={s}
                            onClick={() => setStickerOptions({...stickerOptions, style: s})}
                            className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${stickerOptions.style === s ? 'bg-purple-500 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Fill Color</label>
                        <input 
                          type="color" 
                          value={stickerOptions.fillColor} 
                          onChange={(e) => setStickerOptions({...stickerOptions, fillColor: e.target.value})}
                          className="w-full h-10 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Outline</label>
                        <input 
                          type="color" 
                          value={stickerOptions.outlineColor} 
                          onChange={(e) => setStickerOptions({...stickerOptions, outlineColor: e.target.value})}
                          className="w-full h-10 rounded-xl bg-white/5 border border-white/10 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Stroke Width: {stickerOptions.strokeWidth}px</label>
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={stickerOptions.strokeWidth} 
                        onChange={(e) => setStickerOptions({...stickerOptions, strokeWidth: parseInt(e.target.value)})}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    <button
                      onClick={generateStickerPreview}
                      disabled={isPreviewing}
                      className="w-full py-4 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all font-bold flex items-center justify-center gap-2"
                    >
                      {isPreviewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      {stickerPreview ? "Regenerate Preview" : "Generate Preview"}
                    </button>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="w-full aspect-square rounded-[2rem] bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden relative">
                      {stickerPreview ? (
                        <img src={stickerPreview} className="w-full h-full object-contain p-4" alt="Preview" />
                      ) : (
                        <div className="text-center p-6">
                          <Palette className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                          <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Preview will appear here</p>
                        </div>
                      )}
                      {isPreviewing && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={finalizeStickerForge}
                      disabled={!stickerPreview || isForging !== null}
                      className="w-full mt-6 py-5 rounded-2xl bg-purple-500 text-white font-black text-lg hover:bg-purple-600 transition-all shadow-xl shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isForging ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                      FORGE & SEND
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Sticker Library */}
        <AnimatePresence>
          {showLibrary && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white/5 backdrop-blur-3xl border-l border-white/10 z-[120] p-8 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black uppercase tracking-tight">Sticker Library</h2>
                <button onClick={() => setShowLibrary(false)} className="p-2 rounded-full hover:bg-white/10">
                  <AlertCircle className="w-6 h-6 rotate-45" />
                </button>
              </div>

              {stickerLibrary.length === 0 ? (
                <div className="text-center py-20">
                  <Palette className="w-16 h-16 text-gray-700 mx-auto mb-6" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Your library is empty</p>
                  <p className="text-xs text-gray-600 mt-2">Forge some stickers to see them here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {stickerLibrary.map(sticker => (
                    <div key={sticker.id} className="p-4 rounded-[2rem] bg-white/5 border border-white/10 group">
                      <div className="aspect-square rounded-2xl bg-black/40 mb-4 overflow-hidden relative">
                        <img src={sticker.url} className="w-full h-full object-contain p-4" alt="Sticker" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button 
                            onClick={() => downloadSticker(sticker.url, sticker.id)}
                            className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                            title="Download"
                          >
                            <Upload className="w-5 h-5 rotate-180" />
                          </button>
                          <button 
                            onClick={() => resendSticker(sticker)}
                            disabled={isForging === sticker.id}
                            className="p-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white"
                            title="Re-send to Telegram"
                          >
                            {isForging === sticker.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Share2 className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                      <div className="px-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{sticker.style}</span>
                          <span className="text-[8px] text-gray-600">{new Date(sticker.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 font-medium">{sticker.caption}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Toast */}
        <AnimatePresence>
          {showShareToast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-white text-black font-bold shadow-2xl flex items-center gap-3"
            >
              <Check className="w-5 h-5 text-green-600" />
              <span>Link copied to clipboard!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-20 text-center relative z-10">
        <div className="flex flex-col items-center gap-8">
          <div className="flex items-center gap-4 text-purple-500/40 font-light tracking-[0.3em] text-xs">
            <span>△</span>
            <span className="w-8 h-px bg-current opacity-20" />
            <span>○</span>
            <span className="w-8 h-px bg-current opacity-20" />
            <span className="text-purple-400">✦</span>
            <span className="w-8 h-px bg-current opacity-20" />
            <span>○</span>
            <span className="w-8 h-px bg-current opacity-20" />
            <span>△</span>
          </div>

          <div className="space-y-3">
            <p className="text-gray-400 font-light flex items-center justify-center gap-2">
              <span className="text-lg">🐾</span> Forged with a Frisky Paw and a daring heart.
            </p>
            <p className="text-gray-300 font-medium">
              Bringing the magic of <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 font-black">STIX ✦ MΛGIC</span> to life ✨
            </p>
            <p className="text-gray-600 text-xs uppercase tracking-[0.2em] font-bold pt-4">
              — FriskyDevelopments
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CaptionCard({ icon, title, text, color, onCopy, onForge, isForging }: { 
  icon: React.ReactNode, 
  title: string, 
  text: string, 
  color: string, 
  onCopy: () => void,
  onForge: () => void,
  isForging: boolean
}) {
  return (
    <div className={`p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden ${color}`}>
      {/* Loading Overlay */}
      <AnimatePresence>
        {isForging && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/5 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-3"
          >
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">Forging Sticker...</span>
            <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-full h-full bg-gradient-to-r from-transparent via-purple-500 to-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`absolute top-4 right-4 flex gap-2 transition-opacity duration-300 ${isForging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
        <button 
          onClick={onForge}
          disabled={isForging}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50"
          title="Forge Telegram Sticker"
        >
          <Sparkles className="w-4 h-4 text-purple-400" />
        </button>
        <button 
          onClick={onCopy}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
          title="Copy Caption"
        >
          <Copy className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <span className="font-bold text-sm uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-gray-300 leading-relaxed pr-16">{text}</p>
    </div>
  );
}
