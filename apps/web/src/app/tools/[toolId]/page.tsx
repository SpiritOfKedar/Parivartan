import Link from "next/link";
import { notFound } from "next/navigation";
import { CompressPdfTool } from "../../../components/compress-pdf-tool";
import { MergePdfTool } from "../../../components/merge-pdf-tool";
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
    case "pdf-to-word":
      return "application/pdf,.pdf";
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
  if (toolId === "compress-pdf") {
    return "Select a PDF file";
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

      <div className="mt-10">
        {toolId === "merge-pdf" ? (
          <MergePdfTool />
        ) : toolId === "compress-pdf" ? (
          <CompressPdfTool />
        ) : (
          <UploadZone
            accept={acceptForTool(toolId)}
            multiple={false}
            label={uploadLabel(toolId)}
          />
        )}
      </div>
    </main>
  );
}
