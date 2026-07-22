import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryIcon } from "../../../components/category-icon";
import {
  getCategoryTheme,
  type CategoryId,
} from "../../../lib/category-theme";
import { CompressImageTool } from "../../../components/compress-image-tool";
import { BlurFacesTool } from "../../../components/blur-faces-tool";
import { ConvertFromJpgTool } from "../../../components/convert-from-jpg-tool";
import { ConvertToJpgTool } from "../../../components/convert-to-jpg-tool";
import { CropImageTool } from "../../../components/crop-image-tool";
import { HtmlToImageTool } from "../../../components/html-to-image-tool";
import { MemeGeneratorTool } from "../../../components/meme-generator-tool";
import { RemoveBackgroundTool } from "../../../components/remove-background-tool";
import { RotateImageTool } from "../../../components/rotate-image-tool";
import { UpscaleImageTool } from "../../../components/upscale-image-tool";
import { PhotoEditorTool } from "../../../components/photo-editor-tool";
import { ResizeImageTool } from "../../../components/resize-image-tool";
import { WatermarkImageTool } from "../../../components/watermark-image-tool";
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
  getDictionary,
  getToolCopy,
} from "../../../lib/i18n";
import { getRequestLocale } from "../../../lib/i18n/request-locale";
import {
  getProcessingNote,
  getTool,
  getUploadLabel,
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
    case "convert-to-jpg":
      return "image/*";
    case "convert-from-jpg":
      return "image/jpeg,.jpg,.jpeg";
    case "resize-image":
    case "crop-image":
    case "photo-editor":
    case "upscale-image":
    case "remove-background":
    case "watermark-image":
    case "meme-generator":
    case "rotate-image":
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

export async function generateMetadata({ params }: ToolPageProps) {
  const { toolId } = await params;
  const tool = getTool(toolId);
  const locale = await getRequestLocale();
  if (!tool) {
    return { title: getDictionary(locale).meta.toolNotFound };
  }
  const copy = getToolCopy(locale, toolId);
  return {
    title: copy.name,
    description: copy.description,
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { toolId } = await params;
  const tool = getTool(toolId);
  const locale = await getRequestLocale();
  const messages = getDictionary(locale);

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
      case "crop-image":
        return <CropImageTool />;
      case "convert-to-jpg":
        return <ConvertToJpgTool />;
      case "convert-from-jpg":
        return <ConvertFromJpgTool />;
      case "photo-editor":
        return <PhotoEditorTool />;
      case "upscale-image":
        return <UpscaleImageTool />;
      case "remove-background":
        return <RemoveBackgroundTool />;
      case "watermark-image":
        return <WatermarkImageTool />;
      case "meme-generator":
        return <MemeGeneratorTool />;
      case "rotate-image":
        return <RotateImageTool />;
      case "html-to-image":
        return <HtmlToImageTool />;
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
            label={getUploadLabel(toolId, locale)}
          />
        );
    }
  }

  const category = tool.category as CategoryId;
  const theme = getCategoryTheme(category);
  const copy = getToolCopy(locale, toolId);

  return (
    <main
      className="mx-auto w-full max-w-3xl flex-1 animate-rise px-6 pb-14 pt-24"
      style={{
        ["--accent" as string]: theme.accentVar,
        ["--accent-soft" as string]: theme.accentSoftVar,
      }}
    >
      <div className="flex items-center gap-2 text-sm text-faint">
        <Link href="/" className="btn-ghost !px-3 !py-1.5 !text-sm">
          <span aria-hidden="true">←</span> {messages.common.backToTools}
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/#${category}`}
          className="transition-colors hover:text-foreground"
        >
          {messages.categories[category].label}
        </Link>
      </div>

      <div className="mt-8 flex items-start gap-4">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border text-[color:var(--accent)]"
          style={{ background: "var(--accent-soft)" }}
        >
          <CategoryIcon category={category} className="size-6" />
        </span>
        <div className="min-w-0">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-foreground">
            {copy.name}
          </h1>
          <p className="mt-1.5 text-[15px] text-muted">{copy.description}</p>
        </div>
      </div>

      <div className="mt-4">
        <span className="chip">{getProcessingNote(tool, locale)}</span>
      </div>

      <div className="glass-panel mt-8 p-6 sm:p-8">{renderTool()}</div>
    </main>
  );
}
