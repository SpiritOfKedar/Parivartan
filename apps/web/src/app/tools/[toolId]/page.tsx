import Link from "next/link";
import { notFound } from "next/navigation";
import { CompressImageTool } from "../../../components/compress-image-tool";
import { CompressPdfTool } from "../../../components/compress-pdf-tool";
import { JpgToPdfTool } from "../../../components/jpg-to-pdf-tool";
import { MergePdfTool } from "../../../components/merge-pdf-tool";
import { PdfToJpgTool } from "../../../components/pdf-to-jpg-tool";
import {
  PdfToExcelTool,
  PdfToPptTool,
  PdfToWordTool,
  WordToPdfTool,
} from "../../../components/server-conversion-tool";
import { SplitPdfTool } from "../../../components/split-pdf-tool";
import { UploadZone } from "../../../components/upload-zone";
import {
  getProcessingNote,
  getTool,
  getToolDescription,
} from "../../../lib/tools";

interface ToolPageProps {
  params: Promise<{ toolId: string }>;
}

function acceptForTool(toolId: string): string | undefined {
  switch (toolId) {
    case "merge-pdf":
    case "compress-pdf":
    case "split-pdf":
    case "pdf-to-word":
    case "pdf-to-ppt":
    case "pdf-to-excel":
      return "application/pdf,.pdf";
    case "pdf-to-jpg":
      return "application/pdf,.pdf";
    case "jpg-to-pdf":
      return "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
    case "word-to-pdf":
      return ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "compress-image":
      return "image/*";
    case "mp4-to-webm":
      return "video/mp4,.mp4";
    default:
      return undefined;
  }
}

function uploadLabel(toolId: string): string {
  if (toolId === "merge-pdf") {
    return "Select PDF files";
  }
  if (toolId === "jpg-to-pdf") {
    return "Select image files";
  }
  if (toolId === "compress-image") {
    return "Select an image file";
  }
  if (
    toolId === "compress-pdf" ||
    toolId === "split-pdf" ||
    toolId === "pdf-to-word" ||
    toolId === "pdf-to-ppt" ||
    toolId === "pdf-to-excel" ||
    toolId === "pdf-to-jpg"
  ) {
    return "Select a PDF file";
  }
  if (toolId === "word-to-pdf") {
    return "Select a Word document";
  }
  return "Select a file";
}

export async function generateMetadata({ params }: ToolPageProps) {
  const { toolId } = await params;
  const tool = getTool(toolId);
  if (!tool) {
    return { title: "Tool not found" };
  }
  return {
    title: tool.name,
    description: getToolDescription(toolId),
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolId } = await params;
  const tool = getTool(toolId);

  if (!tool) {
    notFound();
  }

  function renderTool() {
    switch (toolId) {
      case "merge-pdf":
        return <MergePdfTool />;
      case "compress-pdf":
        return <CompressPdfTool />;
      case "compress-image":
        return <CompressImageTool />;
      case "split-pdf":
        return <SplitPdfTool />;
      case "pdf-to-word":
        return <PdfToWordTool />;
      case "pdf-to-ppt":
        return <PdfToPptTool />;
      case "pdf-to-excel":
        return <PdfToExcelTool />;
      case "word-to-pdf":
        return <WordToPdfTool />;
      case "jpg-to-pdf":
        return <JpgToPdfTool />;
      case "pdf-to-jpg":
        return <PdfToJpgTool />;
      default:
        return (
          <UploadZone
            accept={acceptForTool(toolId)}
            multiple={false}
            label={uploadLabel(toolId)}
          />
        );
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center rounded border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-background-subtle"
      >
        ← All tools
      </Link>

      <div className="mt-6 max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight">{tool.name}</h1>
        <p className="mt-2 text-[15px] text-muted">
          {getToolDescription(toolId)}
        </p>
        <p className="mt-1 text-sm text-faint">{getProcessingNote(tool)}</p>
      </div>

      <div className="mt-10">{renderTool()}</div>
    </main>
  );
}
