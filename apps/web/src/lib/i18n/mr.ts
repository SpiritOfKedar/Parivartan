import type { Messages } from "./messages";

export const mr: Messages = {
  meta: {
    title: "परिवर्तन",
    description:
      "प्रतिमा, PDF, व्हिडिओ आणि ऑडिओसाठी ब्राउझर-आधारित प्रीमियम साधनांचा संच.",
    toolNotFound: "साधन सापडले नाही",
  },
  nav: {
    allTools: "सर्व साधने",
    language: "भाषा",
    english: "EN",
    marathi: "मरा",
    searchTools: "साधने शोधा",
    searchPlaceholder: "साधने शोधा…",
    noToolsMatch: "“{query}” शी जुळणारी साधने नाहीत.",
  },
  hero: {
    chip: "तुमच्या ब्राउझरमध्ये खाजगीरित्या चालते",
    line1: "फाईल बदलण्यासाठी",
    line2Before: "",
    line2Emphasized: "जे हवे",
    line2After: " ते सर्व.",
    body: "परिवर्तन म्हणजे प्रतिमा, PDF, व्हिडिओ आणि ऑडिओसाठी प्रीमियम साधनांचा संच. जलद, खाजगी आणि मोफत. बहुतेक कामांसाठी खाते किंवा अपलोड लागत नाही.",
    imageAlt: "उन्हाळ्याच्या कुरणात ढगांखाली विश्रांती घेतलेली व्यक्ती",
  },
  footer: {
    privacy: "फाईल्स खाजगीरित्या प्रक्रिया होतात आणि २४ तासांत हटवल्या जातात.",
  },
  common: {
    open: "उघडा",
    remove: "काढा",
    download: "डाउनलोड",
    downloadPdf: "PDF डाउनलोड करा",
    toolsCount: "{count} साधने",
    toolCountOne: "१ साधन",
    orDragDrop: "किंवा येथे ड्रॅग आणि ड्रॉप करा",
    processedLocally: "स्थानिकरित्या प्रक्रिया",
    selectPdf: "PDF फाइल निवडा",
    selectFile: "फाईल निवडा",
    selectImage: "प्रतिमा फाइल निवडा",
    selectImages: "प्रतिमा फाइल्स निवडा",
    selectJpg: "JPG फाइल्स निवडा",
    selectAudio: "ऑडिओ फाइल्स निवडा",
    selectPdfs: "PDF फाइल्स निवडा",
    selectWord: "Word दस्तऐवज निवडा",
    selectImageToEdit: "संपादनासाठी प्रतिमा निवडा",
    pasteHtml: "खाली HTML पेस्ट करा",
    converting: "रूपांतर करत आहे…",
    applying: "लागू करत आहे…",
    processing: "प्रक्रिया सुरू…",
    backToTools: "सर्व साधने",
    toolMissingTitle: "साधन सापडले नाही",
    toolMissingBody: "ते रूपांतरण साधन अस्तित्वात नाही.",
  },
  notes: {
    browser: "तुमच्या ब्राउझरमध्ये चालते.",
    server: "आमच्या सर्व्हरवर प्रक्रिया होते.",
    ai: "मजकूर तुमच्या ब्राउझरमध्ये काढला जातो, नंतर AI प्रक्रियेसाठी आमच्या API कडे पाठवला जातो.",
  },
  categories: {
    image: {
      label: "प्रतिमा",
      tagline: "तयार करा, रूपांतर करा, स्वच्छ करा",
      blurb:
        "क्रॉप, रीसाइझ, रूपांतर, वॉटरमार्क आणि रिटच. प्रत्येक पिक्सेल थेट तुमच्या ब्राउझरमध्ये.",
    },
    pdf: {
      label: "PDF आणि दस्तऐवज",
      tagline: "दस्तऐवज आकारा",
      blurb:
        "PDF विलीन, विभाजित, संकुचित, संरक्षित आणि संपादित करा. ऑफिस रूपांतरे आमच्या सर्व्हरवर चालतात.",
    },
    office: {
      label: "ऑफिस",
      tagline: "स्वरूपांमध्ये रूपांतर",
      blurb:
        "PDF ला संपादनक्षम Word, PowerPoint आणि Excel मध्ये बदला, आणि परत.",
    },
    video: {
      label: "व्हिडिओ",
      tagline: "स्वरूप बदला आणि संकुचित करा",
      blurb: "पृष्ठ न सोडता फुटेज ट्रान्सकोड आणि संकुचित करा.",
    },
    audio: {
      label: "ऑडिओ",
      tagline: "मिक्स, ट्रिम आणि विलीन",
      blurb: "ट्रॅक्स एकत्र करा, क्लिप ट्रिम करा आणि स्वच्छ MP3 किंवा WAV निर्यात करा.",
    },
  },
  tools: {
    "merge-pdf": {
      name: "PDF विलीन करा",
      description: "अनेक PDF फाइल्स एका दस्तऐवजात एकत्र करा.",
    },
    "compress-pdf": {
      name: "PDF संकुचित करा",
      description:
        "PDF ला लक्ष्य आकारात आणा. लॉसलेस मोड मजकूर स्पष्ट ठेवतो; संतुलित मोड फक्त गरज पडल्यास पुन्हा एन्कोड करतो.",
    },
    "split-pdf": {
      name: "PDF विभाजित करा",
      description: "एक पृष्ठ किंवा संपूर्ण संच स्वतंत्र PDF फाइल्समध्ये वेगळा करा.",
    },
    "edit-pdf": {
      name: "PDF संपादित करा",
      description:
        "PDF पृष्ठांवर मजकूर ओव्हरले जोडा. तुमच्या ब्राउझरमध्ये स्थानिकरित्या चालते.",
    },
    "watermark-pdf": {
      name: "PDF वॉटरमार्क",
      description: "PDF च्या प्रत्येक पृष्ठावर कर्णरेषेने मजकूर वॉटरमार्क लावा.",
    },
    "rotate-pdf": {
      name: "PDF फिरवा",
      description: "PDF मधील सर्व पृष्ठे ९०°, १८०° किंवा २७०° ने फिरवा.",
    },
    "pdf-summarize": {
      name: "PDF AI सारांश",
      description:
        "PDF मधून मजकूर काढा आणि Gemini किंवा NVIDIA NIM वापरून AI सारांश तयार करा.",
    },
    "pdf-translate": {
      name: "PDF भाषांतर",
      description:
        "PDF मधून मजकूर काढा आणि AI ने भाषांतर करा. Gemini किंवा NVIDIA NIM निवडा.",
    },
    "protect-pdf": {
      name: "PDF संरक्षित करा",
      description:
        "PDF ला पासवर्ड संरक्षण द्या. एनक्रिप्शन तुमच्या ब्राउझरमध्ये स्थानिकरित्या होते.",
    },
    "page-numbers-pdf": {
      name: "पृष्ठ क्रमांक जोडा",
      description: "PDF च्या प्रत्येक पृष्ठाच्या तळाला पृष्ठ क्रमांक जोडा.",
    },
    "pdf-to-word": {
      name: "PDF ते Word",
      description:
        "आमच्या सर्व्हरवर PDF ला संपादनक्षम Word दस्तऐवजात रूपांतरित करा. मजकूर-केंद्रित आउटपुट; स्कॅन केलेल्या पृष्ठांसाठी OCR.",
    },
    "pdf-to-ppt": {
      name: "PDF ते PowerPoint",
      description:
        "आमच्या सर्व्हरवर PDF ला PowerPoint मध्ये रूपांतरित करा. प्रत्येक पृष्ठ एक स्लाइड होते.",
    },
    "pdf-to-excel": {
      name: "PDF ते Excel",
      description:
        "PDF मधील संरचित मजकूर Excel मध्ये काढा. निवडण्यायोग्य मजकूर किंवा तक्त्यांसाठी सर्वोत्तम.",
    },
    "word-to-pdf": {
      name: "Word ते PDF",
      description: "आमच्या सर्व्हरवर Word दस्तऐवज PDF मध्ये रूपांतरित करा.",
    },
    "jpg-to-pdf": {
      name: "JPG ते PDF",
      description:
        "अनेक प्रतिमा एका PDF मध्ये एकत्र करा. फाइल तयार करण्यापूर्वी पृष्ठे क्रमबद्ध करा.",
    },
    "pdf-to-jpg": {
      name: "PDF ते JPG",
      description:
        "प्रत्येक PDF पृष्ठ JPEG प्रतिमा म्हणून निर्यात करा. बहु-पृष्ठ PDF ZIP म्हणून डाउनलोड होतात.",
    },
    "compress-image": {
      name: "प्रतिमा संकुचित करा",
      description: "स्वीकार्य गुणवत्ता राखून प्रतिमेचा फाइल आकार कमी करा.",
    },
    "resize-image": {
      name: "प्रतिमा रीसाइझ करा",
      description:
        "पिक्सेल किंवा टक्केवारीने प्रतिमेचे परिमाण बदला. तुमच्या ब्राउझरमध्ये चालते.",
    },
    "crop-image": {
      name: "प्रतिमा क्रॉप करा",
      description:
        "दृश्य संपादक किंवा अचूक पिक्सेल मूल्यांनी JPG, PNG, WebP किंवा GIF क्रॉप करा.",
    },
    "convert-to-jpg": {
      name: "JPG मध्ये रूपांतर",
      description:
        "PNG, GIF, WebP आणि इतर प्रतिमा JPG मध्ये बदला. तुमच्या ब्राउझरमध्ये चालते.",
    },
    "convert-from-jpg": {
      name: "JPG मधून रूपांतर",
      description:
        "JPG प्रतिमा PNG किंवा WebP मध्ये बदला, किंवा अनेक JPG चे अ‍ॅनिमेटेड GIF बनवा.",
    },
    "photo-editor": {
      name: "फोटो संपादक",
      description:
        "क्रॉप, फिरवा, रंग समायोजित करा, मजकूर जोडा, रेखाटा आणि फिल्टर लावा. ब्राउझरमध्ये चालते.",
    },
    "upscale-image": {
      name: "प्रतिमा अपस्केल",
      description:
        "AI सुपर-रेझोल्यूशनने २× किंवा ४× रेझोल्यूशन. तुमच्या ब्राउझरमध्ये चालते.",
    },
    "remove-background": {
      name: "पार्श्वभूमी काढा",
      description:
        "पार्श्वभूमी आपोआप काढा आणि पारदर्शक PNG निर्यात करा. ब्राउझरमध्ये चालते.",
    },
    "watermark-image": {
      name: "प्रतिमा वॉटरमार्क",
      description:
        "प्रतिमांवर मजकूर किंवा प्रतिमा वॉटरमार्क लावा. अपारदर्शकता आणि स्थान निवडा.",
    },
    "meme-generator": {
      name: "मीम जनरेटर",
      description:
        "क्लासिक वरच्या आणि खालच्या मीम मजकुराने प्रतिमेला मथळा द्या. ब्राउझरमध्ये चालते.",
    },
    "rotate-image": {
      name: "प्रतिमा फिरवा",
      description:
        "JPG, PNG, WebP किंवा GIF ९०°, १८०° किंवा २७०° ने फिरवा. ब्राउझरमध्ये चालते.",
    },
    "html-to-image": {
      name: "HTML ते प्रतिमा",
      description:
        "HTML मार्कअप JPG किंवा PNG प्रतिमेत रूपांतरित करा. HTML पेस्ट करा आणि एका क्लिकने निर्यात करा.",
    },
    "blur-faces": {
      name: "चेहरे अस्पष्ट करा",
      description:
        "गोपनीयतेसाठी चेहरे शोधा आणि अस्पष्ट करा. तुमच्या ब्राउझरमध्ये चालते.",
    },
    "merge-audio": {
      name: "ऑडिओ विलीन करा",
      description:
        "अनेक ऑडिओ फाइल्स अपलोड करा, ट्रिम आणि क्रम बदला, नंतर MP3 किंवा WAV म्हणून विलीन व डाउनलोड करा.",
    },
    "mp4-to-webm": {
      name: "MP4 ते WebM",
      description: "MP4 व्हिडिओ WebM स्वरूपात रूपांतरित करा.",
    },
  },
  ui: {
    selectPdfFile: "PDF फाइल निवडा",
    mergePdfs: "PDF विलीन करा",
    merging: "विलीन करत आहे…",
    compressPdf: "PDF संकुचित करा",
    compressing: "संकुचित करत आहे…",
    splitPdf: "PDF विभाजित करा",
    splitting: "विभाजित करत आहे…",
    addTextToPdf: "PDF मध्ये मजकूर जोडा",
    addWatermark: "वॉटरमार्क जोडा",
    rotatePdf: "PDF फिरवा",
    rotating: "फिरवत आहे…",
    summarizePdf: "PDF चा सारांश",
    summarizing: "सारांश तयार करत आहे…",
    extractingText: "मजकूर काढत आहे…",
    translatePdf: "PDF भाषांतर",
    translating: "भाषांतर करत आहे…",
    downloadTranslation: "भाषांतर डाउनलोड करा",
    downloadSummary: "सारांश डाउनलोड करा",
    protectPdf: "PDF संरक्षित करा",
    encrypting: "एनक्रिप्ट करत आहे…",
    addPageNumbers: "पृष्ठ क्रमांक जोडा",
    convertToJpg: "JPG मध्ये रूपांतर",
    convertToImage: "प्रतिमेत रूपांतर",
    convertToWord: "Word मध्ये रूपांतर",
    convertToPowerPoint: "PowerPoint मध्ये रूपांतर",
    convertToExcel: "Excel मध्ये रूपांतर",
    convertToPdf: "PDF मध्ये रूपांतर",
    downloadDocx: ".docx डाउनलोड करा",
    downloadPptx: ".pptx डाउनलोड करा",
    downloadXlsx: ".xlsx डाउनलोड करा",
    convertingOnServer: "सर्व्हरवर रूपांतर करत आहे…",
    conversionCompleteWord:
      "रूपांतर पूर्ण. वरून तुमचा संपादनक्षम Word दस्तऐवज डाउनलोड करा.",
    conversionCompletePpt:
      "रूपांतर पूर्ण. वरून तुमची PowerPoint फाइल डाउनलोड करा.",
    conversionCompleteExcel:
      "रूपांतर पूर्ण. वरून तुमची Excel स्प्रेडशीट डाउनलोड करा.",
    conversionCompletePdf: "रूपांतर पूर्ण. वरून तुमची PDF डाउनलोड करा.",
    compressImage: "प्रतिमा संकुचित करा",
    resizeImage: "प्रतिमा रीसाइझ करा",
    resizing: "रीसाइझ करत आहे…",
    cropImage: "प्रतिमा क्रॉप करा",
    cropping: "क्रॉप करत आहे…",
    rotateImage: "प्रतिमा फिरवा",
    createMeme: "मीम तयार करा",
    creating: "तयार करत आहे…",
    upscaleImage: "प्रतिमा अपस्केल करा",
    upscaling: "अपस्केल करत आहे…",
    removeBackground: "पार्श्वभूमी काढा",
    removingBackground: "पार्श्वभूमी काढत आहे…",
    blurFaces: "चेहरे अस्पष्ट करा",
    blurringFaces: "चेहरे अस्पष्ट करत आहे…",
    watermarkImage: "वॉटरमार्क जोडा",
    createPdf: "PDF तयार करा",
    creatingPdf: "PDF तयार करत आहे…",
    downloadZip: "ZIP डाउनलोड करा",
    keepTextSharp: "मजकूर स्पष्ट ठेवा",
    keepTextSharpDesc:
      "फक्त लॉसलेस ऑप्टिमायझेशन. मजकूर निवडण्यायोग्य राहतो. साधारणतः ५-२०% बचत.",
    balanced: "संतुलित",
    balancedDesc:
      "आधी लॉसलेस प्रयत्न, नंतर लक्ष्यासाठी गरज पडल्यास उच्च-गुणवत्तेचे पुन्हा एन्कोडिंग.",
    smallestFile: "सर्वात लहान फाइल",
    smallestFileDesc:
      "कमाल संकुचन. मजकूर अस्पष्ट आणि निवडता न येण्याजोगा होऊ शकतो.",
    everyPageSeparately: "प्रत्येक पृष्ठ वेगळे",
    everyPageSeparatelyDesc:
      "प्रत्येक पृष्ठासाठी एक PDF तयार करा आणि ZIP म्हणून डाउनलोड करा.",
    splitByRanges: "श्रेणीनुसार विभाजित",
    splitByRangesDesc: "प्रत्येक श्रेणी स्वतंत्र PDF होते. उदाहरण: १-३, ४-६",
    extractToOnePdf: "एका PDF मध्ये काढा",
    extractToOnePdfDesc:
      "निवडलेली पृष्ठे एका नवीन PDF मध्ये आणा. उदाहरण: १, ३-५",
    targetSizeKb: "लक्ष्य आकार (KB)",
    enterSizeKb: "किलोबाइटमध्ये आकार लिहा.",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड पुष्टी करा",
    watermarkText: "वॉटरमार्क मजकूर",
    pageNumberPosition: "स्थान",
    enterTextOverlay: "ओव्हरले मजकूर लिहा…",
    topCaption: "वरचा मथळा",
    bottomCaption: "खालचा मथळा",
    width: "रुंदी",
    height: "उंची",
    percent: "टक्के",
    pixels: "पिक्सेल",
    angle: "कोन",
    opacity: "अपारदर्शकता",
    position: "स्थान",
    format: "स्वरूप",
    quality: "गुणवत्ता",
    htmlMarkup: "HTML मार्कअप",
    loadingModel: "मॉडेल लोड होत आहे…",
    loadingFaceModel: "चेहरा शोध मॉडेल लोड होत आहे…",
    loadingUpscaleModel: "अपस्केल मॉडेल लोड होत आहे…",
    loadingBgModel: "पार्श्वभूमी काढण्याचे मॉडेल लोड होत आहे…",
    loadingAudioEngine: "ऑडिओ इंजिन लोड होत आहे…",
    editTrim: "ट्रिम संपादित करा",
    hideTrim: "ट्रिम लपवा",
    mergeAudio: "ऑडिओ विलीन करा",
    mergingAudio: "विलीन करत आहे…",
    downloadMp3: "MP3 डाउनलोड करा",
    downloadWav: "WAV डाउनलोड करा",
    yourText: "तुमचा मजकूर",
    exportImage: "प्रतिमा निर्यात करा",
    exporting: "निर्यात करत आहे…",
    onlyImagesAccepted:
      "फक्त प्रतिमा फाइल्स स्वीकारल्या जातात (JPEG, PNG, WebP, GIF).",
    onlyImagesAcceptedShort: "फक्त प्रतिमा फाइल्स स्वीकारल्या जातात.",
    onlyJpgAccepted: "फक्त JPG फाइल्स स्वीकारल्या जातात.",
    onlyAudioAccepted: "फक्त समर्थित ऑडिओ फाइल्स स्वीकारल्या जातात.",
    onlyPdfAccepted: "फक्त PDF फाइल्स स्वीकारल्या जातात.",
    onlyWordAccepted: "फक्त Word दस्तऐवज (.doc, .docx) स्वीकारले जातात.",
    selectAtLeastTwoPdfs: "विलीन करण्यासाठी किमान दोन PDF फाइल्स निवडा.",
    couldNotMergePdfs: "या PDF विलीन करता आल्या नाहीत.",
    uploading: "अपलोड करत आहे…",
    passwordTooShort: "पासवर्ड किमान ४ अक्षरांचा असावा.",
    passwordsDoNotMatch: "पासवर्ड जुळत नाहीत.",
    enterTargetSize: "किमान १ KB चा लक्ष्य आकार लिहा.",
    enterValidDimensions: "वैध रुंदी आणि उंची मूल्ये लिहा.",
    enterCaption: "वरचा किंवा खालचा मथळा लिहा.",
    addAtLeastOneImage: "किमान एक प्रतिमा जोडा.",
    addAtLeastOneClip: "किमान एक ऑडिओ क्लिप जोडा.",
    enterPagesToSplit: "विभाजित किंवा काढायची पृष्ठे लिहा.",
    couldNotReadPdf: "ही PDF वाचता आली नाही.",
    couldNotReadPdfProtected:
      "ही PDF वाचता आली नाही. पासवर्ड-संरक्षित असू शकते.",
    couldNotCompressPdf: "ही PDF संकुचित करता आली नाही.",
    couldNotCompressImage: "ही प्रतिमा संकुचित करता आली नाही.",
    couldNotSplitPdf: "ही PDF विभाजित करता आली नाही.",
    couldNotEditPdf: "PDF संपादित करता आली नाही.",
    couldNotWatermarkPdf: "PDF वर वॉटरमार्क लावता आला नाही.",
    couldNotRotatePdf: "PDF फिरवता आली नाही.",
    couldNotProtectPdf: "PDF संरक्षित करता आली नाही.",
    couldNotAddPageNumbers: "पृष्ठ क्रमांक जोडता आले नाहीत.",
    couldNotCreatePdf: "PDF तयार करता आली नाही.",
    couldNotConvertPdf: "ही PDF रूपांतरित करता आली नाही.",
    couldNotConvertImages: "प्रतिमा रूपांतरित करता आल्या नाहीत.",
    couldNotConvertHtml: "HTML प्रतिमेत रूपांतरित करता आली नाही.",
    couldNotResizeImage: "ही प्रतिमा रीसाइझ करता आली नाही.",
    couldNotRotateImage: "ही प्रतिमा फिरवता आली नाही.",
    couldNotCropImage: "ही प्रतिमा क्रॉप करता आली नाही.",
    couldNotCreateMeme: "मीम तयार करता आला नाही.",
    couldNotUpscale: "ही प्रतिमा अपस्केल करता आली नाही.",
    couldNotRemoveBg: "या प्रतिमेची पार्श्वभूमी काढता आली नाही.",
    couldNotBlurFaces: "या प्रतिमेतील चेहरे अस्पष्ट करता आले नाहीत.",
    couldNotExportImage: "ही प्रतिमा निर्यात करता आली नाही.",
    couldNotMergeAudio: "ऑडिओ विलीन करता आला नाही.",
    couldNotPlayClip: "ही क्लिप प्ले करता आली नाही.",
    couldNotConvertFile: "ही फाइल रूपांतरित करता आली नाही.",
    conversionFailed: "रूपांतर यशस्वीरित्या पूर्ण झाले नाही.",
    downloadFailed: "डाउनलोड अयशस्वी.",
    translationFailed: "भाषांतर अयशस्वी.",
    summaryFailed: "सारांश अयशस्वी.",
    invalidPageRange: "अवैध पृष्ठ श्रेणी.",
    noFacesDetected:
      "चेहरे आढळले नाहीत. मूळ प्रतिमा अपरिवर्तित डाउनलोड केली.",
    upscaledAi: "AI सुपर-रेझोल्यूशनने अपस्केल केले.",
    upscaledFallback: "उच्च-गुणवत्तेच्या रीसाइझ फॉलबॅकने अपस्केल केले.",
    backgroundRemoved:
      "पार्श्वभूमी काढली. वरून तुमची पारदर्शक PNG डाउनलोड करा.",
    provider: "AI प्रदाता",
    targetLanguage: "लक्ष्य भाषा",
  },
};
