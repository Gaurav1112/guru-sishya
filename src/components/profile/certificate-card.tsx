"use client";

import { useRef, useCallback, useState } from "react";
import { Download, Linkedin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ────────────────────────────────────────────────────────────────────────────
// Certificate data shape
// ────────────────────────────────────────────────────────────────────────────

export interface CertificateData {
  userName: string;
  topicName: string;
  topicCategory: string;
  completedAt: string; // ISO date string
  accuracy: number; // 0-100
  questionsAnswered: number;
  totalQuestions: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Certificate visual component (rendered as HTML for html2canvas capture)
// ────────────────────────────────────────────────────────────────────────────

function CertificateVisual({
  data,
  innerRef,
}: {
  data: CertificateData;
  innerRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const completionDate = new Date(data.completedAt).toLocaleDateString(
    "en-IN",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // Generate a certificate ID from topic + date
  const certId = `GS-${data.topicName.replace(/\s+/g, "").slice(0, 6).toUpperCase()}-${data.completedAt.slice(0, 10).replace(/-/g, "")}`;

  return (
    <div
      ref={innerRef}
      className="relative w-full max-w-[800px] aspect-[1.414/1] bg-[#0C0A15] overflow-hidden"
      style={{ fontFamily: "Plus Jakarta Sans, system-ui, sans-serif" }}
    >
      {/* Gold border */}
      <div className="absolute inset-0 p-[3px]">
        <div
          className="h-full w-full rounded-none"
          style={{
            background:
              "linear-gradient(135deg, #FDB813 0%, #E85D26 25%, #FDB813 50%, #E85D26 75%, #FDB813 100%)",
          }}
        />
      </div>

      {/* Inner dark background */}
      <div className="absolute inset-[3px] bg-[#0C0A15]" />

      {/* Inner gold border line */}
      <div className="absolute inset-[12px] border border-[#FDB813]/30 rounded-sm" />

      {/* Corner ornaments */}
      <svg
        className="absolute top-[16px] left-[16px] w-12 h-12 text-[#FDB813]/40"
        viewBox="0 0 48 48"
        fill="none"
      >
        <path
          d="M4 24C4 12.954 12.954 4 24 4"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M4 16C4 9.373 9.373 4 16 4"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <svg
        className="absolute top-[16px] right-[16px] w-12 h-12 text-[#FDB813]/40 rotate-90"
        viewBox="0 0 48 48"
        fill="none"
      >
        <path
          d="M4 24C4 12.954 12.954 4 24 4"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M4 16C4 9.373 9.373 4 16 4"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <svg
        className="absolute bottom-[16px] left-[16px] w-12 h-12 text-[#FDB813]/40 -rotate-90"
        viewBox="0 0 48 48"
        fill="none"
      >
        <path
          d="M4 24C4 12.954 12.954 4 24 4"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M4 16C4 9.373 9.373 4 16 4"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <svg
        className="absolute bottom-[16px] right-[16px] w-12 h-12 text-[#FDB813]/40 rotate-180"
        viewBox="0 0 48 48"
        fill="none"
      >
        <path
          d="M4 24C4 12.954 12.954 4 24 4"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M4 16C4 9.373 9.373 4 16 4"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-between p-8 sm:p-10">
        {/* Logo + brand */}
        <div className="flex flex-col items-center gap-1">
          {/* Inline flame+book logo (simplified) */}
          <svg
            viewBox="0 0 512 512"
            className="w-12 h-12 sm:w-14 sm:h-14"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="cert-flame"
                x1="0.5"
                y1="1"
                x2="0.5"
                y2="0"
              >
                <stop offset="0%" stopColor="#E85D26" />
                <stop offset="100%" stopColor="#FDB813" />
              </linearGradient>
              <linearGradient
                id="cert-book"
                x1="0.5"
                y1="1"
                x2="0.5"
                y2="0"
              >
                <stop offset="0%" stopColor="#1DD1A1" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#1DD1A1" />
              </linearGradient>
            </defs>
            <path
              d="M144 340 C144 310 180 290 256 280 L256 380 C180 370 144 360 144 340 Z"
              fill="url(#cert-book)"
              opacity="0.9"
            />
            <path
              d="M368 340 C368 310 332 290 256 280 L256 380 C332 370 368 360 368 340 Z"
              fill="#0EA88A"
              opacity="0.85"
            />
            <path
              d="M256 100 C230 150 190 195 200 240 C208 275 230 280 240 278 C235 268 230 250 238 235 C242 225 250 230 256 245 C262 230 270 225 274 235 C282 250 277 268 272 278 C282 280 304 275 312 240 C322 195 282 150 256 100 Z"
              fill="url(#cert-flame)"
            />
          </svg>
          <div className="text-[#FDB813] text-xs sm:text-sm tracking-[0.2em] uppercase font-semibold">
            Guru Sishya
          </div>
        </div>

        {/* Title */}
        <div className="text-center -mt-2">
          <h2 className="text-lg sm:text-2xl font-light tracking-[0.15em] uppercase text-[#FDB813]/80">
            Certificate of Completion
          </h2>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-[#FDB813]/50 to-transparent mx-auto mt-2" />
        </div>

        {/* Recipient */}
        <div className="text-center -mt-1">
          <p className="text-[#FDB813]/50 text-xs sm:text-sm mb-1">
            This is to certify that
          </p>
          <p className="text-white text-xl sm:text-3xl font-bold">
            {data.userName}
          </p>
          <p className="text-gray-400 text-xs sm:text-sm mt-2">
            has successfully completed the topic
          </p>
          <p className="text-[#1DD1A1] text-lg sm:text-2xl font-bold mt-1">
            {data.topicName}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Category: {data.topicCategory}
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 sm:gap-10">
          <div className="text-center">
            <p className="text-[#E85D26] text-lg sm:text-xl font-bold">
              {data.accuracy}%
            </p>
            <p className="text-gray-500 text-[10px] sm:text-xs">Accuracy</p>
          </div>
          <div className="w-px h-8 bg-[#FDB813]/20" />
          <div className="text-center">
            <p className="text-[#E85D26] text-lg sm:text-xl font-bold">
              {data.questionsAnswered}/{data.totalQuestions}
            </p>
            <p className="text-gray-500 text-[10px] sm:text-xs">
              Questions Answered
            </p>
          </div>
          <div className="w-px h-8 bg-[#FDB813]/20" />
          <div className="text-center">
            <p className="text-[#E85D26] text-lg sm:text-xl font-bold">
              {completionDate}
            </p>
            <p className="text-gray-500 text-[10px] sm:text-xs">
              Completion Date
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between w-full">
          <p className="text-gray-600 text-[10px]">ID: {certId}</p>
          <p className="text-gray-600 text-[10px]">www.guru-sishya.in</p>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// CertificateCard — wraps the visual with download + share buttons
// ────────────────────────────────────────────────────────────────────────────

interface CertificateCardProps {
  data: CertificateData;
}

export function CertificateCard({ data }: CertificateCardProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadAsImage = useCallback(async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certRef.current, {
        backgroundColor: "#0C0A15",
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `guru-sishya-certificate-${data.topicName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast("Certificate downloaded!");
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download certificate. Please try again.");
    } finally {
      setDownloading(false);
    }
  }, [data.topicName]);

  const shareOnLinkedIn = useCallback(() => {
    const text =
      `I earned a completion certificate for "${data.topicName}" on Guru Sishya!\n\n` +
      `Score: ${data.accuracy}% accuracy across ${data.questionsAnswered} questions.\n\n` +
      `Preparing for software engineering interviews with adaptive quizzes, mock interviews, and spaced repetition.\n\n` +
      `Try it: https://www.guru-sishya.in\n\n` +
      `#InterviewPrep #SoftwareEngineering #GuruSishya #CodingInterview #TechCareer`;

    window.open(
      `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`,
      "_blank"
    );
  }, [data.topicName, data.accuracy, data.questionsAnswered]);

  return (
    <div className="space-y-4">
      {/* Certificate visual */}
      <div className="rounded-xl overflow-hidden border border-border/50">
        <CertificateVisual data={data} innerRef={certRef} />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={downloadAsImage}
          disabled={downloading}
          className="gap-2"
        >
          {downloading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          Download as PNG
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={shareOnLinkedIn}
          className="gap-2 bg-[#0077B5]/10 text-[#0077B5] hover:bg-[#0077B5]/20 border-[#0077B5]/30"
        >
          <Linkedin className="size-4" />
          Share on LinkedIn
        </Button>
      </div>
    </div>
  );
}
