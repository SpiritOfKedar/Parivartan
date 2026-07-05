import Link from "next/link";
import { notFound } from "next/navigation";
import { CompressImageTool } from "../../../components/compress-image-tool";
import { BlurFacesTool } from "../../../components/blur-faces-tool";
import { RemoveBackgroundTool } from "../../../components/remove-background-tool";
import { UpscaleImageTool } from "../../../components/upscale-image-tool";
import { PhotoEditorTool } from "../../../components/photo-editor-tool";
import { ResizeImageTool } from "../../../components/resize-image-tool";
import { CompressPdfTool } from "../../../components/compress-pdf-tool";
import { EditPdfTool } from "../../../components/edit-pdf-tool";
import { JpgToPdfTool } from "../../../components/jpg-to-pdf-tool";
import { MergeAudioTool } from "../../../components/merge-audio-tool";
import { MergePdfTool } from "../../../components/merge-pdf-tool";
import { PageNumbersPdfTool } from "../../../components/page-numbers-pdf-tool";
import { PdfSummarizeTool } from "../../../components/pdf-summarize-tool";
import { PdfToJpgTool } from "../../../components/pdf-to-jpg-tool";
import { PdfTranslateTool } from "../../../components/pdf-translate-tool";
import { ProtectPdfTool } from "../../../components/protect-pdf-tool";
import { RotatePdfTool } from "../../../components/rotate-pdf-tool";
import {
  PdfToExcelTool,
  PdfToPptTool,
  PdfToWordTool,
  WordToPdfTool,
} from "../../../components/server-conversion-tool";
import { SplitPdfTool } from "../../../components/split-pdf-tool";
import { WatermarkPdfTool } from "../../../components/watermark-pdf-tool";
import { UploadZone } from "../../../components/upload-zone";
import {
  getProcessingNote,
  getTool,
  getToolDescription,
} from "../../../lib/tools";

interface ToolPageProps {
  params: Promise<{ toolId: string }>;
}

const PDF_TOOL_IDS = new Set([
  "merge-pdf",
  "compress-pdf",
  "split-pdf",
  "pdf-to-word",
  "pdf-to-ppt",
  "pdf-to-excel",
  "pdf-to-jpg",
  "edit-pdf",
  "watermark-pdf",
  "rotate-pdf",
  "pdf-summarize",
  "pdf-translate",
  "protect-pdf",
  "page-numbers-pdf",
]);

function acceptForTool(toolId: string): string | undefined {
  if (PDF_TOOL_IDS.has(toolId)) {
    return "application/pdf,.pdf";
  }
  switch (toolId) {
    case "jpg-to-pdf":
      return "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";
    case "word-to-pdf":
      return ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "compress-image":
      return "image/*";
    case "resize-image":
    case "photo-editor":
    case "upscale-image":
    case "remove-background":
    case "blur-faces":
      return "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";
    case "merge-audio":
      return "audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac";
    case "mp4-to-webm":
      return "video/mp4,.mp4";
    default:
      return undefined;
  }
}

function uploadLabel(toolId: string): string {
  if (toolId === "merge-audio") return "Select audio files";
  if (toolId === "merge-pdf") return "Select PDF files";
  if (toolId === "jpg-to-pdf") return "Select image files";
  if (toolId === "compress-image") return "Select an image file";
  if (toolId === "resize-image") return "Select an image file";
  if (toolId === "photo-editor") return "Select an image to edit";
  if (toolId === "upscale-image") return "Select an image file";
  if (toolId === "remove-background") return "Select an image file";
  if (toolId === "blur-faces") return "Select an image file";
  if (PDF_TOOL_IDS.has(toolId)) return "Select a PDF file";
  if (toolId === "word-to-pdf") return "Select a Word document";
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
      case "merge-audio":
        return <MergeAudioTool />;
      case "compress-pdf":
        return <CompressPdfTool />;
      case "compress-image":
        return <CompressImageTool />;
      case "resize-image":
        return <ResizeImageTool />;
      case "photo-editor":
        return <PhotoEditorTool />;
      case "upscale-image":
        return <UpscaleImageTool />;
      case "remove-background":
        return <RemoveBackgroundTool />;
      case "blur-faces":
        return <BlurFacesTool />;
      case "split-pdf":
        return <SplitPdfTool />;
      case "edit-pdf":
        return <EditPdfTool />;
      case "watermark-pdf":
        return <WatermarkPdfTool />;
      case "rotate-pdf":
        return <RotatePdfTool />;
      case "pdf-summarize":
        return <PdfSummarizeTool />;
      case "pdf-translate":
        return <PdfTranslateTool />;
      case "protect-pdf":
        return <ProtectPdfTool />;
      case "page-numbers-pdf":
        return <PageNumbersPdfTool />;
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
