export type Messages = {
  meta: {
    title: string;
    description: string;
    toolNotFound: string;
  };
  nav: {
    allTools: string;
    language: string;
    english: string;
    marathi: string;
    searchTools: string;
    searchPlaceholder: string;
    noToolsMatch: string;
    openMenu: string;
    closeMenu: string;
    menu: {
      organizePdf: string;
      convertPdf: string;
      editImage: string;
      enhanceImage: string;
      convertImage: string;
      toPdf: string;
      fromPdf: string;
      videoTools: string;
      audioTools: string;
    };
  };
  hero: {
    chip: string;
    brand: string;
    line1: string;
    line2Before: string;
    line2Emphasized: string;
    line2After: string;
    body: string;
    imageAlt: string;
    scrollHint: string;
  };
  footer: {
    privacy: string;
  };
  common: {
    open: string;
    remove: string;
    download: string;
    downloadPdf: string;
    toolsCount: string;
    toolCountOne: string;
    orDragDrop: string;
    processedLocally: string;
    selectPdf: string;
    selectFile: string;
    selectImage: string;
    selectImages: string;
    selectJpg: string;
    selectAudio: string;
    selectPdfs: string;
    selectWord: string;
    selectImageToEdit: string;
    pasteHtml: string;
    converting: string;
    applying: string;
    processing: string;
    backToTools: string;
    toolMissingTitle: string;
    toolMissingBody: string;
  };
  notes: {
    browser: string;
    server: string;
    ai: string;
  };
  categories: {
    pdf: { label: string; tagline: string; blurb: string };
    image: { label: string; tagline: string; blurb: string };
    office: { label: string; tagline: string; blurb: string };
    video: { label: string; tagline: string; blurb: string };
    audio: { label: string; tagline: string; blurb: string };
  };
  tools: Record<
    string,
    {
      name: string;
      description: string;
    }
  >;
  ui: {
    selectPdfFile: string;
    mergePdfs: string;
    merging: string;
    compressPdf: string;
    compressing: string;
    splitPdf: string;
    splitting: string;
    addTextToPdf: string;
    addWatermark: string;
    rotatePdf: string;
    rotating: string;
    summarizePdf: string;
    summarizing: string;
    extractingText: string;
    translatePdf: string;
    translating: string;
    downloadTranslation: string;
    downloadSummary: string;
    protectPdf: string;
    encrypting: string;
    addPageNumbers: string;
    convertToJpg: string;
    convertToImage: string;
    convertToWord: string;
    convertToPowerPoint: string;
    convertToExcel: string;
    convertToPdf: string;
    downloadDocx: string;
    downloadPptx: string;
    downloadXlsx: string;
    convertingOnServer: string;
    conversionCompleteWord: string;
    conversionCompletePpt: string;
    conversionCompleteExcel: string;
    conversionCompletePdf: string;
    compressImage: string;
    resizeImage: string;
    resizing: string;
    cropImage: string;
    cropping: string;
    rotateImage: string;
    createMeme: string;
    creating: string;
    upscaleImage: string;
    upscaling: string;
    removeBackground: string;
    removingBackground: string;
    blurFaces: string;
    blurringFaces: string;
    watermarkImage: string;
    createPdf: string;
    creatingPdf: string;
    downloadZip: string;
    keepTextSharp: string;
    keepTextSharpDesc: string;
    balanced: string;
    balancedDesc: string;
    smallestFile: string;
    smallestFileDesc: string;
    everyPageSeparately: string;
    everyPageSeparatelyDesc: string;
    splitByRanges: string;
    splitByRangesDesc: string;
    extractToOnePdf: string;
    extractToOnePdfDesc: string;
    targetSizeKb: string;
    enterSizeKb: string;
    password: string;
    confirmPassword: string;
    watermarkText: string;
    pageNumberPosition: string;
    enterTextOverlay: string;
    topCaption: string;
    bottomCaption: string;
    width: string;
    height: string;
    percent: string;
    pixels: string;
    angle: string;
    opacity: string;
    position: string;
    format: string;
    quality: string;
    htmlMarkup: string;
    loadingModel: string;
    loadingFaceModel: string;
    loadingUpscaleModel: string;
    loadingBgModel: string;
    loadingAudioEngine: string;
    editTrim: string;
    hideTrim: string;
    mergeAudio: string;
    mergingAudio: string;
    downloadMp3: string;
    downloadWav: string;
    yourText: string;
    exportImage: string;
    exporting: string;
    onlyImagesAccepted: string;
    onlyImagesAcceptedShort: string;
    onlyJpgAccepted: string;
    onlyAudioAccepted: string;
    onlyPdfAccepted: string;
    onlyWordAccepted: string;
    selectAtLeastTwoPdfs: string;
    couldNotMergePdfs: string;
    uploading: string;
    passwordTooShort: string;
    passwordsDoNotMatch: string;
    enterTargetSize: string;
    enterValidDimensions: string;
    enterCaption: string;
    addAtLeastOneImage: string;
    addAtLeastOneClip: string;
    enterPagesToSplit: string;
    couldNotReadPdf: string;
    couldNotReadPdfProtected: string;
    couldNotCompressPdf: string;
    couldNotCompressImage: string;
    couldNotSplitPdf: string;
    couldNotEditPdf: string;
    couldNotWatermarkPdf: string;
    couldNotRotatePdf: string;
    couldNotProtectPdf: string;
    couldNotAddPageNumbers: string;
    couldNotCreatePdf: string;
    couldNotConvertPdf: string;
    couldNotConvertImages: string;
    couldNotConvertHtml: string;
    couldNotResizeImage: string;
    couldNotRotateImage: string;
    couldNotCropImage: string;
    couldNotCreateMeme: string;
    couldNotUpscale: string;
    couldNotRemoveBg: string;
    couldNotBlurFaces: string;
    couldNotExportImage: string;
    couldNotMergeAudio: string;
    couldNotPlayClip: string;
    couldNotConvertFile: string;
    conversionFailed: string;
    downloadFailed: string;
    translationFailed: string;
    summaryFailed: string;
    invalidPageRange: string;
    noFacesDetected: string;
    upscaledAi: string;
    upscaledFallback: string;
    backgroundRemoved: string;
    provider: string;
    targetLanguage: string;
  };
};

export const en: Messages = {
  meta: {
    title: "Parivartan",
    description:
      "A premium suite of browser-based tools for images, PDFs, video, and audio.",
    toolNotFound: "Tool not found",
  },
  nav: {
    allTools: "All tools",
    language: "Language",
    english: "EN",
    marathi: "मरा",
    searchTools: "Search tools",
    searchPlaceholder: "Search tools…",
    noToolsMatch: "No tools match “{query}”.",
    openMenu: "Open menu",
    closeMenu: "Close",
    menu: {
      organizePdf: "Organize & edit",
      convertPdf: "Convert & AI",
      editImage: "Edit",
      enhanceImage: "Enhance",
      convertImage: "Convert",
      toPdf: "Convert to PDF",
      fromPdf: "Convert from PDF",
      videoTools: "Video tools",
      audioTools: "Audio tools",
    },
  },
  hero: {
    chip: "Runs privately in your browser",
    brand: "Parivartan",
    line1: "Everything you need",
    line2Before: "to ",
    line2Emphasized: "transform",
    line2After: " a file.",
    body: "Premium tools for images, PDFs, video, and audio. Fast, private, and free.",
    imageAlt:
      "A figure resting in a sunlit meadow beneath towering clouds",
    scrollHint: "Browse tools",
  },
  footer: {
    privacy: "Files are processed privately and deleted within 24 hours.",
  },
  common: {
    open: "Open",
    remove: "Remove",
    download: "Download",
    downloadPdf: "Download PDF",
    toolsCount: "{count} tools",
    toolCountOne: "1 tool",
    orDragDrop: "or drag and drop here",
    processedLocally: "Processed locally",
    selectPdf: "Select a PDF file",
    selectFile: "Select a file",
    selectImage: "Select an image file",
    selectImages: "Select image files",
    selectJpg: "Select JPG files",
    selectAudio: "Select audio files",
    selectPdfs: "Select PDF files",
    selectWord: "Select a Word document",
    selectImageToEdit: "Select an image to edit",
    pasteHtml: "Paste HTML below",
    converting: "Converting…",
    applying: "Applying…",
    processing: "Processing…",
    backToTools: "All tools",
    toolMissingTitle: "Tool not found",
    toolMissingBody: "That conversion tool does not exist.",
  },
  notes: {
    browser: "Runs in your browser.",
    server: "Processed on our servers.",
    ai: "Text is extracted in your browser, then sent to our API for AI processing.",
  },
  categories: {
    image: {
      label: "Images",
      tagline: "Craft, convert, and clean up",
      blurb:
        "Crop, resize, convert, watermark, and retouch. Every pixel handled right in your browser.",
    },
    pdf: {
      label: "PDF & Documents",
      tagline: "Shape your documents",
      blurb:
        "Merge, split, compress, protect, and edit PDFs. Office conversions run on our servers.",
    },
    office: {
      label: "Office",
      tagline: "Convert between formats",
      blurb: "Turn PDFs into editable Word, PowerPoint, and Excel, and back.",
    },
    video: {
      label: "Video",
      tagline: "Reformat and compress",
      blurb: "Transcode and shrink footage without leaving the page.",
    },
    audio: {
      label: "Audio",
      tagline: "Mix, trim, and merge",
      blurb: "Combine tracks, trim clips, and export clean MP3 or WAV files.",
    },
  },
  tools: {
    "merge-pdf": {
      name: "Merge PDF",
      description: "Combine multiple PDF files into a single document.",
    },
    "compress-pdf": {
      name: "Compress PDF",
      description:
        "Shrink a PDF to a target size. Lossless mode keeps text sharp; balanced mode only re-encodes when needed.",
    },
    "split-pdf": {
      name: "Split PDF",
      description:
        "Separate one page or a whole set into independent PDF files.",
    },
    "edit-pdf": {
      name: "Edit PDF",
      description:
        "Add text overlays to your PDF pages.",
    },
    "watermark-pdf": {
      name: "Watermark PDF",
      description:
        "Stamp a diagonal text watermark on every page of your PDF.",
    },
    "rotate-pdf": {
      name: "Rotate PDF",
      description: "Rotate all pages in a PDF by 90°, 180°, or 270°.",
    },
    "pdf-summarize": {
      name: "PDF AI Summarizer",
      description:
        "Extract text from a PDF and generate an AI summary using Gemini or NVIDIA NIM.",
    },
    "pdf-translate": {
      name: "Translate PDF",
      description:
        "Extract text from a PDF and translate it with AI. Choose Gemini or NVIDIA NIM.",
    },
    "protect-pdf": {
      name: "Protect PDF",
      description:
        "Password-protect a PDF with local encryption.",
    },
    "page-numbers-pdf": {
      name: "Add Page Numbers",
      description:
        "Add page numbers to the footer of every page in your PDF.",
    },
    "pdf-to-word": {
      name: "PDF to Word",
      description:
        "Convert a PDF to an editable Word document on our servers. Text-focused output; scanned pages are OCR'd when needed.",
    },
    "pdf-to-ppt": {
      name: "PDF to PowerPoint",
      description:
        "Convert a PDF to PowerPoint on our servers. Each page becomes a visual slide.",
    },
    "pdf-to-excel": {
      name: "PDF to Excel",
      description:
        "Extract structured text from a PDF into Excel. Best for documents with selectable text or tables.",
    },
    "word-to-pdf": {
      name: "Word to PDF",
      description: "Convert a Word document to PDF on our servers.",
    },
    "jpg-to-pdf": {
      name: "JPG to PDF",
      description:
        "Combine multiple images into one PDF. Reorder pages before creating the file.",
    },
    "pdf-to-jpg": {
      name: "PDF to JPG",
      description:
        "Export each PDF page as a JPEG image. Multi-page PDFs download as a ZIP archive.",
    },
    "compress-image": {
      name: "Compress Image",
      description: "Reduce image file size while keeping acceptable quality.",
    },
    "resize-image": {
      name: "Resize Image",
      description:
        "Change image dimensions by pixels or percentage.",
    },
    "crop-image": {
      name: "Crop Image",
      description:
        "Crop JPG, PNG, WebP, or GIF images with a visual editor or exact pixel values.",
    },
    "convert-to-jpg": {
      name: "Convert to JPG",
      description:
        "Turn PNG, GIF, WebP, and other images into JPG.",
    },
    "convert-from-jpg": {
      name: "Convert from JPG",
      description:
        "Turn JPG images into PNG or WebP, or combine several JPGs into an animated GIF.",
    },
    "photo-editor": {
      name: "Photo Editor",
      description:
        "Crop, rotate, adjust colors, add text, draw, and apply filters.",
    },
    "upscale-image": {
      name: "Upscale Image",
      description:
        "AI super-resolution to 2× or 4× resolution.",
    },
    "remove-background": {
      name: "Remove Background",
      description:
        "Automatically remove the background and export a transparent PNG.",
    },
    "watermark-image": {
      name: "Watermark Image",
      description:
        "Stamp text or an image watermark over your pictures. Choose opacity and position.",
    },
    "meme-generator": {
      name: "Meme Generator",
      description:
        "Caption an image with classic top and bottom meme text.",
    },
    "rotate-image": {
      name: "Rotate Image",
      description:
        "Rotate JPG, PNG, WebP, or GIF images by 90°, 180°, or 270°.",
    },
    "html-to-image": {
      name: "HTML to Image",
      description:
        "Convert HTML markup into a JPG or PNG image. Paste HTML and export with one click.",
    },
    "blur-faces": {
      name: "Blur Faces",
      description:
        "Detect and blur faces for privacy.",
    },
    "merge-audio": {
      name: "Merge Audio",
      description:
        "Upload multiple audio files, trim and reorder them, then merge and download as MP3 or WAV. Runs in your browser.",
    },
    "mp4-to-webm": {
      name: "MP4 to WebM",
      description: "Convert MP4 video to WebM format.",
    },
  },
  ui: {
    selectPdfFile: "Select a PDF file",
    mergePdfs: "Merge PDFs",
    merging: "Merging…",
    compressPdf: "Compress PDF",
    compressing: "Compressing…",
    splitPdf: "Split PDF",
    splitting: "Splitting…",
    addTextToPdf: "Add text to PDF",
    addWatermark: "Add watermark",
    rotatePdf: "Rotate PDF",
    rotating: "Rotating…",
    summarizePdf: "Summarize PDF",
    summarizing: "Summarizing…",
    extractingText: "Extracting text…",
    translatePdf: "Translate PDF",
    translating: "Translating…",
    downloadTranslation: "Download translation",
    downloadSummary: "Download summary",
    protectPdf: "Protect PDF",
    encrypting: "Encrypting…",
    addPageNumbers: "Add page numbers",
    convertToJpg: "Convert to JPG",
    convertToImage: "Convert to image",
    convertToWord: "Convert to Word",
    convertToPowerPoint: "Convert to PowerPoint",
    convertToExcel: "Convert to Excel",
    convertToPdf: "Convert to PDF",
    downloadDocx: "Download .docx",
    downloadPptx: "Download .pptx",
    downloadXlsx: "Download .xlsx",
    convertingOnServer: "Converting on server…",
    conversionCompleteWord:
      "Conversion complete. Download your editable Word document above.",
    conversionCompletePpt:
      "Conversion complete. Download your PowerPoint file above.",
    conversionCompleteExcel:
      "Conversion complete. Download your Excel spreadsheet above.",
    conversionCompletePdf: "Conversion complete. Download your PDF above.",
    compressImage: "Compress image",
    resizeImage: "Resize image",
    resizing: "Resizing…",
    cropImage: "Crop image",
    cropping: "Cropping…",
    rotateImage: "Rotate image",
    createMeme: "Create meme",
    creating: "Creating…",
    upscaleImage: "Upscale image",
    upscaling: "Upscaling…",
    removeBackground: "Remove background",
    removingBackground: "Removing background…",
    blurFaces: "Blur faces",
    blurringFaces: "Blurring faces…",
    watermarkImage: "Add watermark",
    createPdf: "Create PDF",
    creatingPdf: "Creating PDF…",
    downloadZip: "Download ZIP",
    keepTextSharp: "Keep text sharp",
    keepTextSharpDesc:
      "Lossless optimization only. Text stays selectable. Usually saves 5-20%.",
    balanced: "Balanced",
    balancedDesc:
      "Tries lossless first, then high-quality re-encoding only if needed for your target.",
    smallestFile: "Smallest file",
    smallestFileDesc:
      "Maximum compression. Text may become blurry and unselectable.",
    everyPageSeparately: "Every page separately",
    everyPageSeparatelyDesc:
      "Create one PDF per page and download as a ZIP file.",
    splitByRanges: "Split by ranges",
    splitByRangesDesc:
      "Each range becomes its own PDF. Example: 1-3, 4-6",
    extractToOnePdf: "Extract to one PDF",
    extractToOnePdfDesc:
      "Pull selected pages into a single new PDF. Example: 1, 3-5",
    targetSizeKb: "Target size (KB)",
    enterSizeKb: "Enter a size in kilobytes.",
    password: "Password",
    confirmPassword: "Confirm password",
    watermarkText: "Watermark text",
    pageNumberPosition: "Position",
    enterTextOverlay: "Enter text overlay…",
    topCaption: "Top caption",
    bottomCaption: "Bottom caption",
    width: "Width",
    height: "Height",
    percent: "Percent",
    pixels: "Pixels",
    angle: "Angle",
    opacity: "Opacity",
    position: "Position",
    format: "Format",
    quality: "Quality",
    htmlMarkup: "HTML markup",
    loadingModel: "Loading model…",
    loadingFaceModel: "Loading face detection model…",
    loadingUpscaleModel: "Loading upscale model…",
    loadingBgModel: "Loading background removal model…",
    loadingAudioEngine: "Loading audio engine…",
    editTrim: "Edit trim",
    hideTrim: "Hide trim",
    mergeAudio: "Merge audio",
    mergingAudio: "Merging…",
    downloadMp3: "Download MP3",
    downloadWav: "Download WAV",
    yourText: "Your text",
    exportImage: "Export image",
    exporting: "Exporting…",
    onlyImagesAccepted:
      "Only image files are accepted (JPEG, PNG, WebP, GIF).",
    onlyImagesAcceptedShort: "Only image files are accepted.",
    onlyJpgAccepted: "Only JPG files are accepted.",
    onlyAudioAccepted: "Only supported audio files are accepted.",
    onlyPdfAccepted: "Only PDF files are accepted.",
    onlyWordAccepted: "Only Word documents (.doc, .docx) are accepted.",
    selectAtLeastTwoPdfs: "Select at least two PDF files to merge.",
    couldNotMergePdfs: "Could not merge these PDFs.",
    uploading: "Uploading…",
    passwordTooShort: "Password must be at least 4 characters.",
    passwordsDoNotMatch: "Passwords do not match.",
    enterTargetSize: "Enter a target size of at least 1 KB.",
    enterValidDimensions: "Enter valid width and height values.",
    enterCaption: "Enter top or bottom caption text.",
    addAtLeastOneImage: "Add at least one image.",
    addAtLeastOneClip: "Add at least one audio clip.",
    enterPagesToSplit: "Enter which pages to split or extract.",
    couldNotReadPdf: "Could not read this PDF.",
    couldNotReadPdfProtected:
      "Could not read this PDF. It may be password-protected.",
    couldNotCompressPdf: "Could not compress this PDF.",
    couldNotCompressImage: "Could not compress this image.",
    couldNotSplitPdf: "Could not split this PDF.",
    couldNotEditPdf: "Could not edit PDF.",
    couldNotWatermarkPdf: "Could not watermark PDF.",
    couldNotRotatePdf: "Could not rotate PDF.",
    couldNotProtectPdf: "Could not protect PDF.",
    couldNotAddPageNumbers: "Could not add page numbers.",
    couldNotCreatePdf: "Could not create PDF.",
    couldNotConvertPdf: "Could not convert this PDF.",
    couldNotConvertImages: "Could not convert images.",
    couldNotConvertHtml: "Could not convert HTML to an image.",
    couldNotResizeImage: "Could not resize this image.",
    couldNotRotateImage: "Could not rotate this image.",
    couldNotCropImage: "Could not crop this image.",
    couldNotCreateMeme: "Could not create meme.",
    couldNotUpscale: "Could not upscale this image.",
    couldNotRemoveBg: "Could not remove the background from this image.",
    couldNotBlurFaces: "Could not blur faces in this image.",
    couldNotExportImage: "Could not export this image.",
    couldNotMergeAudio: "Could not merge audio.",
    couldNotPlayClip: "Could not play this clip.",
    couldNotConvertFile: "Could not convert this file.",
    conversionFailed: "Conversion did not complete successfully.",
    downloadFailed: "Download failed.",
    translationFailed: "Translation failed.",
    summaryFailed: "Summary failed.",
    invalidPageRange: "Invalid page range.",
    noFacesDetected:
      "No faces detected. Downloaded the original image unchanged.",
    upscaledAi: "Upscaled with AI super-resolution.",
    upscaledFallback: "Upscaled with high-quality resize fallback.",
    backgroundRemoved:
      "Background removed. Download your transparent PNG above.",
    provider: "AI provider",
    targetLanguage: "Target language",
  },
};
