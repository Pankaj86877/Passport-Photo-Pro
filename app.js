// Exam Presets Configuration
const examPresets = {
    ssc: {
        photo: { minKB: 20, maxKB: 50, width: 275, height: 354, ratio: 275 / 354 }, 
        signature: { minKB: 10, maxKB: 20, width: 140, height: 60, ratio: 140 / 60 }
    },
    upsc: {
        photo: { minKB: 20, maxKB: 300, width: 350, height: 350, ratio: 1 },
        signature: { minKB: 20, maxKB: 300, width: 350, height: 350, ratio: 1 }
    },
    ibps: {
        photo: { minKB: 20, maxKB: 50, width: 275, height: 354, ratio: 275 / 354 },
        signature: { minKB: 10, maxKB: 20, width: 140, height: 60, ratio: 140 / 60 }
    },
    rrb: {
        photo: { minKB: 20, maxKB: 50, width: 275, height: 354, ratio: 275 / 354 },
        signature: { minKB: 10, maxKB: 40, width: 250, height: 100, ratio: 2.5 }
    }
};

let currentPreset = 'ssc';
let croppers = { photo: null, signature: null };
let finalBlobs = { photo: null, signature: null };
let videoStreams = { photo: null, signature: null };

// DOM Elements
const elements = {
    presetCards: document.querySelectorAll('.preset-card'),
    globalUpload: document.getElementById('globalUpload'),
    hero: document.querySelector('.hero'),
    cardContainer: document.getElementById('cardContainer'),
    idCard: document.getElementById('idCard'),
    mainWorkspace: document.getElementById('mainWorkspace'),
    photo: {
        btnCamera: document.getElementById('btnHeroCamera'),
        input: document.getElementById('heroPhotoInput'),
        video: document.getElementById('heroVideo'),
        guides: document.getElementById('heroGuides'),
        controls: document.getElementById('heroCameraControls'),
        btnShutter: document.getElementById('btnHeroShutter'),
        error: document.getElementById('heroCameraError'),
        placeholder: document.getElementById('heroPhotoPlaceholder'),
        workspace: document.getElementById('photoWorkspace'),
        target: document.getElementById('photoTarget'),
        resultArea: document.getElementById('photoResultArea'),
        preview: document.getElementById('photoPreview'),
        stats: document.getElementById('photoStats'),
        validation: document.getElementById('photoValidation'),
        btnFix: document.getElementById('btnFixPhoto'),
        btnRetake: document.getElementById('btnRetakePhoto'),
        btnDownload: document.getElementById('btnDownloadPhoto'),
        sliders: {
            rot: document.getElementById('photoRotation'),
            bri: document.getElementById('photoBrightness'),
            con: document.getElementById('photoContrast'),
            rotVal: document.getElementById('photoRotVal'),
            briVal: document.getElementById('photoBriVal'),
            conVal: document.getElementById('photoConVal')
        }
    },
    signature: {
        btnCamera: document.getElementById('btnSigCamera'),
        input: document.getElementById('signatureInput'),
        video: document.getElementById('sigVideo'),
        guides: document.getElementById('sigGuides'),
        uploadArea: document.getElementById('signatureUploadArea'),
        cameraWorkspace: document.getElementById('signatureCameraWorkspace'),
        btnShutter: document.getElementById('btnSigShutter'),
        btnCancelCam: document.getElementById('btnCancelSigCam'),
        error: document.getElementById('sigCameraError'),
        workspace: document.getElementById('signatureWorkspace'),
        target: document.getElementById('signatureTarget'),
        resultArea: document.getElementById('signatureResultArea'),
        preview: document.getElementById('signaturePreview'),
        stats: document.getElementById('signatureStats'),
        validation: document.getElementById('signatureValidation'),
        btnFix: document.getElementById('btnFixSignature'),
        btnRetake: document.getElementById('btnRetakeSignature'),
        btnDownload: document.getElementById('btnDownloadSignature'),
        sliders: {
            rot: document.getElementById('sigRotation'),
            bri: document.getElementById('sigBrightness'),
            con: document.getElementById('sigContrast'),
            rotVal: document.getElementById('sigRotVal'),
            briVal: document.getElementById('sigBriVal'),
            conVal: document.getElementById('sigConVal')
        }
    },
    batch: {
        section: document.getElementById('batchActions'),
        btnDownloadPrint: document.getElementById('btnDownloadPrintSheet')
    },
    bgTool: {
        btnToggle: document.getElementById('btnToggleBgTool'),
        spinner: document.getElementById('bgToolSpinner'),
        hint: document.getElementById('bgHintText'),
        panel: document.getElementById('bgEditorPanel'),
        canvas: document.getElementById('bgEditorCanvas'),
        swatches: document.querySelectorAll('.swatch'),
        btnErase: document.getElementById('btnBrushErase'),
        btnRestore: document.getElementById('btnBrushRestore'),
        brushSize: document.getElementById('brushSize'),
        btnCancel: document.getElementById('btnCancelBg'),
        btnApply: document.getElementById('btnApplyBg'),
        customPicker: document.getElementById('customColorPicker')
    }
};

// 3D Parallax Mouse Move
if (elements.hero && elements.cardContainer) {
    elements.hero.addEventListener('mousemove', (e) => {
        const rect = elements.hero.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -15; 
        const rotateY = ((x - centerX) / centerX) * 15;
        
        elements.cardContainer.style.transform = `rotateX(${10 + rotateX}deg) rotateY(${-15 + rotateY}deg)`;
    });
    elements.hero.addEventListener('mouseleave', () => {
        elements.cardContainer.style.transform = `rotateX(10deg) rotateY(-15deg)`;
    });
}

// Preset Selection
if (elements.presetCards.length > 0) {
    elements.presetCards.forEach(card => {
        card.addEventListener('click', () => {
            elements.presetCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentPreset = card.dataset.preset;
            
            if (croppers.photo) croppers.photo.setAspectRatio(examPresets[currentPreset].photo.ratio);
            if (croppers.signature) croppers.signature.setAspectRatio(examPresets[currentPreset].signature.ratio);
            
            // Update background hint
            if (elements.bgTool.hint) {
                if (currentPreset === 'ssc') elements.bgTool.hint.textContent = "SSC requires a white or light background.";
                else if (currentPreset === 'upsc') elements.bgTool.hint.textContent = "UPSC requires a white background.";
                else elements.bgTool.hint.textContent = "Only use this if your background isn't plain white.";
            }
        });
    });
}

// --- Camera Logic ---
async function startCamera(type) {
    const isPhoto = type === 'photo';
    const constraints = {
        video: {
            facingMode: isPhoto ? 'user' : 'environment',
            width: { ideal: 1280 },
            height: { ideal: 1280 }
        }
    };

    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error("Camera API not supported in this browser.");
        }
        
        // HTTPS check
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
            throw new Error("Camera access requires a secure HTTPS connection.");
        }

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoStreams[type] = stream;
        elements[type].video.srcObject = stream;
        
        elements[type].error.classList.add('hidden');
        elements[type].video.classList.remove('hidden');
        elements[type].guides.classList.remove('hidden');

        if (isPhoto) {
            elements.photo.placeholder.classList.add('hidden');
            elements.photo.controls.classList.remove('hidden');
        } else {
            elements.signature.uploadArea.classList.add('hidden');
            elements.signature.cameraWorkspace.classList.remove('hidden');
        }

    } catch (err) {
        console.error(err);
        elements[type].error.innerHTML = `Camera access denied or unavailable. <br><small>(${err.message})</small><br>Please check browser permissions or use "UPLOAD_FILE".`;
        elements[type].error.classList.remove('hidden');
    }
}

function stopCamera(type) {
    if (videoStreams[type]) {
        videoStreams[type].getTracks().forEach(track => track.stop());
        videoStreams[type] = null;
    }
}

function captureFrame(type) {
    const video = elements[type].video;
    if (!video.videoWidth) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw raw frame (un-mirrored, true orientation)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    stopCamera(type);
    
    // Transition UI
    if (type === 'photo') {
        elements.photo.video.classList.add('hidden');
        elements.photo.guides.classList.add('hidden');
        elements.photo.controls.classList.add('hidden');
        elements.photo.placeholder.classList.remove('hidden');
        elements.photo.placeholder.src = canvas.toDataURL('image/jpeg');
        elements.photo.placeholder.style.filter = 'none';
        
        elements.idCard.classList.add('scanning');
        setTimeout(() => {
            elements.mainWorkspace.classList.remove('hidden');
            elements.mainWorkspace.scrollIntoView({ behavior: 'smooth' });
            loadToCropper(type, canvas.toDataURL('image/jpeg'));
        }, 1500);
    } else {
        elements.signature.cameraWorkspace.classList.add('hidden');
        loadToCropper(type, canvas.toDataURL('image/jpeg'));
    }
}

function loadToCropper(type, dataUrl) {
    elements[type].target.src = dataUrl;
    elements[type].workspace.classList.remove('hidden');
    
    // Reset sliders
    elements[type].sliders.rot.value = 0;
    elements[type].sliders.bri.value = 100;
    elements[type].sliders.con.value = 100;
    updateSliderLabels(type);

    initCropper(type);
}

// --- Upload Logic ---
function handleUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        if (type === 'photo') {
            elements.photo.placeholder.src = e.target.result;
            elements.photo.placeholder.style.filter = 'none';
            elements.idCard.classList.add('scanning');
            setTimeout(() => {
                elements.mainWorkspace.classList.remove('hidden');
                elements.mainWorkspace.scrollIntoView({ behavior: 'smooth' });
                loadToCropper(type, e.target.result);
            }, 1500);
        } else {
            elements.signature.uploadArea.classList.add('hidden');
            loadToCropper(type, e.target.result);
        }
    };
    reader.readAsDataURL(file);
}

// Bind Camera & Upload Events
if (elements.photo.btnCamera) {
    elements.photo.btnCamera.addEventListener('click', () => startCamera('photo'));
    elements.photo.btnShutter.addEventListener('click', () => captureFrame('photo'));
    elements.photo.input.addEventListener('change', (e) => handleUpload(e, 'photo'));
    if (elements.globalUpload) elements.globalUpload.addEventListener('change', (e) => handleUpload(e, 'photo'));
}

if (elements.signature.btnCamera) {
    elements.signature.btnCamera.addEventListener('click', () => startCamera('signature'));
    elements.signature.btnShutter.addEventListener('click', () => captureFrame('signature'));
    elements.signature.btnCancelCam.addEventListener('click', () => {
        stopCamera('signature');
        elements.signature.cameraWorkspace.classList.add('hidden');
        elements.signature.uploadArea.classList.remove('hidden');
    });
    elements.signature.input.addEventListener('change', (e) => handleUpload(e, 'signature'));
}

// --- Adjustments & Cropper Logic ---
function initCropper(type) {
    if (croppers[type]) {
        croppers[type].destroy();
    }
    const ratio = examPresets[currentPreset][type].ratio;
    croppers[type] = new Cropper(elements[type].target, {
        aspectRatio: ratio,
        viewMode: 1,
        autoCropArea: 0.8,
        guides: true,
        center: true,
        highlight: false,
        background: false,
    });
}

function updateSliderLabels(type) {
    const s = elements[type].sliders;
    s.rotVal.textContent = s.rot.value + '°';
    s.briVal.textContent = s.bri.value + '%';
    s.conVal.textContent = s.con.value + '%';
}

function setupSliders(type) {
    const s = elements[type].sliders;
    s.rot.addEventListener('input', () => {
        updateSliderLabels(type);
        if (croppers[type]) croppers[type].rotateTo(parseFloat(s.rot.value));
    });
    s.bri.addEventListener('input', () => updateSliderLabels(type));
    s.con.addEventListener('input', () => updateSliderLabels(type));
}

setupSliders('photo');
setupSliders('signature');

// --- Process & Compress ---
async function processImage(type) {
    if (!croppers[type]) return;

    elements[type].btnFix.disabled = true;
    elements[type].btnFix.textContent = 'PROCESSING...';

    const rules = examPresets[currentPreset][type];
    const cropCanvas = croppers[type].getCroppedCanvas({
        width: rules.width,
        height: rules.height,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    // Apply Brightness & Contrast via temp canvas
    const bri = elements[type].sliders.bri.value;
    const con = elements[type].sliders.con.value;
    
    const filterCanvas = document.createElement('canvas');
    filterCanvas.width = cropCanvas.width;
    filterCanvas.height = cropCanvas.height;
    const ctx = filterCanvas.getContext('2d');
    ctx.filter = `brightness(${bri}%) contrast(${con}%)`;
    ctx.drawImage(cropCanvas, 0, 0);
    
    // Apply Background Replacement (if active)
    let finalSourceCanvas = filterCanvas;
    if (bgState.isActive && bgState.finalCompositedCanvas) {
        // Draw the background composed image instead, applying brightness/contrast to it first
        const bgFilterCanvas = document.createElement('canvas');
        bgFilterCanvas.width = bgState.finalCompositedCanvas.width;
        bgFilterCanvas.height = bgState.finalCompositedCanvas.height;
        const bgCtx = bgFilterCanvas.getContext('2d');
        bgCtx.filter = `brightness(${bri}%) contrast(${con}%)`;
        bgCtx.drawImage(bgState.finalCompositedCanvas, 0, 0);
        finalSourceCanvas = bgFilterCanvas;
    }

    try {
        const resultBlob = await compressToTarget(finalSourceCanvas, rules.minKB, rules.maxKB, type);
        finalBlobs[type] = resultBlob;
        displayResult(type, resultBlob, rules);
        if (type === 'photo') animateHeroChecks();
    } catch (error) {
        console.error("Compression failed:", error);
        alert("Could not compress image to target size. Please try a different image.");
    } finally {
        elements[type].btnFix.disabled = false;
        elements[type].btnFix.textContent = 'RUN_PROCESS';
    }
}

function animateHeroChecks() {
    const checks = ['checkDim', 'checkSize', 'checkBg', 'checkFace'];
    checks.forEach((id, index) => {
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.classList.add('active');
        }, index * 400);
    });
}

function compressToTarget(canvas, minKB, maxKB, type) {
    return new Promise((resolve, reject) => {
        let minQ = 0.1;
        let maxQ = 1.0;
        let bestBlob = null;
        let attempts = 0;
        const maxAttempts = 15;
        const targetBytes = ((minKB + maxKB) / 2) * 1024;
        const minBytes = minKB * 1024;
        const maxBytes = maxKB * 1024;

        function attempt() {
            if (attempts > maxAttempts) {
                if (bestBlob && bestBlob.size <= maxBytes) {
                    if (bestBlob.size < minBytes) {
                        // Image is too small even at max quality, pad it with trailing zeroes
                        const paddingSize = minBytes - bestBlob.size + 1024; // Pad to min + 1KB
                        const padding = new Uint8Array(paddingSize);
                        const paddedBlob = new Blob([bestBlob, padding], { type: 'image/jpeg' });
                        resolve(paddedBlob);
                    } else {
                        resolve(bestBlob);
                    }
                } else {
                    reject(new Error("Could not reach target size"));
                }
                return;
            }

            let currentQ = (minQ + maxQ) / 2;
            canvas.toBlob((blob) => {
                attempts++;
                if (!bestBlob || (blob.size <= maxBytes && blob.size > bestBlob.size)) {
                    bestBlob = blob;
                }
                if (blob.size >= minBytes && blob.size <= maxBytes) {
                    resolve(blob);
                } else if (blob.size > maxBytes) {
                    maxQ = currentQ; 
                    attempt();
                } else {
                    minQ = currentQ; 
                    attempt();
                }
            }, 'image/jpeg', currentQ);
        }
        attempt();
    });
}

function displayResult(type, blob, rules) {
    const url = URL.createObjectURL(blob);
    elements[type].preview.src = url;
    
    const img = new Image();
    img.onload = () => {
        const kbSize = (blob.size / 1024).toFixed(2);
        elements[type].stats.innerHTML = `W:${img.width}px H:${img.height}px | SIZE:${kbSize}KB`;
        
        const validations = validateResult(blob, img.width, img.height, rules);
        renderValidation(type, validations);
        
        elements[type].resultArea.classList.remove('hidden');
        checkBatchStatus();
    };
    img.src = url;
}

function validateResult(blob, width, height, rules) {
    const kb = blob.size / 1024;
    return [
        { text: `FORMAT: JPEG`, passed: blob.type === 'image/jpeg' },
        { text: `DIM: ${width}x${height}px`, passed: width === rules.width && height === rules.height },
        { text: `SIZE: ${kb.toFixed(2)}KB (Target: ${rules.minKB}-${rules.maxKB})`, passed: kb >= rules.minKB && kb <= rules.maxKB }
    ];
}

function renderValidation(type, validations) {
    const container = elements[type].validation;
    container.innerHTML = '';
    
    let allPassed = true;
    validations.forEach(v => {
        if (!v.passed) allPassed = false;
        const item = document.createElement('div');
        item.className = 'validation-item';
        item.innerHTML = `<span>${v.text}</span><span class="${v.passed ? 'val-pass' : 'val-fail'}">[ ${v.passed ? 'PASS' : 'FAIL'} ]</span>`;
        container.appendChild(item);
    });
    elements[type].btnDownload.disabled = !allPassed;
}

// Action Buttons
if(elements.photo.btnRetake) elements.photo.btnRetake.addEventListener('click', () => {
    elements.photo.workspace.classList.add('hidden');
    elements.photo.resultArea.classList.add('hidden');
    startCamera('photo'); // or scroll back to hero
});
if(elements.photo.btnFix) elements.photo.btnFix.addEventListener('click', () => processImage('photo'));
if(elements.photo.btnDownload) elements.photo.btnDownload.addEventListener('click', () => downloadResult('photo'));

if(elements.signature.btnRetake) elements.signature.btnRetake.addEventListener('click', () => {
    elements.signature.workspace.classList.add('hidden');
    elements.signature.resultArea.classList.add('hidden');
    startCamera('signature');
});
if(elements.signature.btnFix) elements.signature.btnFix.addEventListener('click', () => processImage('signature'));
if(elements.signature.btnDownload) elements.signature.btnDownload.addEventListener('click', () => downloadResult('signature'));

function downloadResult(type) {
    if (!finalBlobs[type]) return;
    const url = URL.createObjectURL(finalBlobs[type]);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam_${type}_${currentPreset}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function checkBatchStatus() {
    if (finalBlobs.photo && finalBlobs.signature) {
        elements.batch.section.classList.remove('hidden');
    } else {
        elements.batch.section.classList.add('hidden');
    }
}

if(elements.batch.btnDownloadPrint) elements.batch.btnDownloadPrint.addEventListener('click', generatePrintSheet);

function generatePrintSheet() {
    if (!finalBlobs.photo || !finalBlobs.signature) return;

    elements.batch.btnDownloadPrint.textContent = 'GENERATING...';
    elements.batch.btnDownloadPrint.disabled = true;

    const canvas = document.getElementById('processingCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 2480;
    canvas.height = 3508;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const pImg = new Image();
    const sImg = new Image();

    Promise.all([
        new Promise(r => { pImg.onload = r; pImg.src = URL.createObjectURL(finalBlobs.photo); }),
        new Promise(r => { sImg.onload = r; sImg.src = URL.createObjectURL(finalBlobs.signature); })
    ]).then(() => {
        const startX = 100;
        const startY = 100;
        const gap = 50;

        for(let i=0; i<4; i++) {
            ctx.drawImage(pImg, startX + (pImg.width + gap) * i, startY);
        }
        for(let i=0; i<4; i++) {
            ctx.drawImage(sImg, startX + (sImg.width + gap) * i, startY + pImg.height + gap);
        }

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `print_sheet_${currentPreset}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            elements.batch.btnDownloadPrint.textContent = 'GENERATE_A4_SHEET';
            elements.batch.btnDownloadPrint.disabled = false;
        }, 'image/jpeg', 0.95);
    });
}

// --- Optional Background Remover Module ---
let bgState = {
    isActive: false,
    modelLoaded: false,
    segmentation: null,
    sourceCanvas: null,
    maskCanvas: null,
    finalCompositedCanvas: null,
    currentColor: '#FFFFFF',
    isDrawing: false,
    brushMode: 'erase', // 'erase' or 'restore'
    originalImageData: null
};

if (elements.bgTool.btnToggle) {
    elements.bgTool.btnToggle.addEventListener('click', async () => {
        // If already active, toggle it off
        if (bgState.isActive || !elements.bgTool.panel.classList.contains('hidden')) {
            elements.bgTool.panel.classList.add('hidden');
            return;
        }

        elements.bgTool.spinner.classList.remove('hidden');
        elements.bgTool.btnToggle.disabled = true;

        try {
            await loadSegmentationModel();
            await processBackgroundRemoval();
            elements.bgTool.panel.classList.remove('hidden');
        } catch (e) {
            console.error("Background removal failed:", e);
            alert("Failed to load background removal tool.");
        } finally {
            elements.bgTool.spinner.classList.add('hidden');
            elements.bgTool.btnToggle.disabled = false;
        }
    });

    elements.bgTool.swatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            elements.bgTool.swatches.forEach(s => s.classList.remove('active'));
            swatch.classList.add('active');
            
            if (swatch.classList.contains('custom-swatch-wrapper')) {
                bgState.currentColor = elements.bgTool.customPicker.value;
            } else {
                bgState.currentColor = swatch.dataset.color;
            }
            renderBgEditor();
        });
    });

    elements.bgTool.customPicker.addEventListener('input', (e) => {
        bgState.currentColor = e.target.value;
        renderBgEditor();
    });

    elements.bgTool.btnCancel.addEventListener('click', () => {
        bgState.isActive = false;
        bgState.finalCompositedCanvas = null;
        elements.bgTool.panel.classList.add('hidden');
    });

    elements.bgTool.btnApply.addEventListener('click', () => {
        bgState.isActive = true;
        // The final composited canvas is saved and will be used by processImage()
        elements.bgTool.panel.classList.add('hidden');
        elements.bgTool.btnToggle.innerHTML = `FIX_BACKGROUND // <span class="val-pass">[ APPLIED ]</span>`;
    });

    // Brush Controls
    elements.bgTool.btnErase.addEventListener('click', () => {
        bgState.brushMode = 'erase';
        elements.bgTool.btnErase.classList.add('active');
        elements.bgTool.btnRestore.classList.remove('active');
    });
    elements.bgTool.btnRestore.addEventListener('click', () => {
        bgState.brushMode = 'restore';
        elements.bgTool.btnRestore.classList.add('active');
        elements.bgTool.btnErase.classList.remove('active');
    });

    // Canvas Drawing
    const canvas = elements.bgTool.canvas;
    canvas.addEventListener('pointerdown', (e) => {
        bgState.isDrawing = true;
        drawBrush(e);
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!bgState.isDrawing) return;
        drawBrush(e);
    });
    window.addEventListener('pointerup', () => {
        bgState.isDrawing = false;
    });
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

async function loadSegmentationModel() {
    if (bgState.modelLoaded) return;
    
    // Load MediaPipe scripts dynamically
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js');
    
    bgState.segmentation = new SelfieSegmentation({ locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
    }});
    
    bgState.segmentation.setOptions({
        modelSelection: 1, // 1 is landscape (faster), 0 is general
    });

    bgState.segmentation.onResults(onSegmentationResults);
    bgState.modelLoaded = true;
}

async function processBackgroundRemoval() {
    // 1. Get current crop
    if (!croppers.photo) return;
    const rules = examPresets[currentPreset].photo;
    bgState.sourceCanvas = croppers.photo.getCroppedCanvas({
        width: rules.width,
        height: rules.height
    });

    // 2. Setup editor canvas dimensions
    elements.bgTool.canvas.width = bgState.sourceCanvas.width;
    elements.bgTool.canvas.height = bgState.sourceCanvas.height;
    
    // 3. Send to MediaPipe
    await bgState.segmentation.send({ image: bgState.sourceCanvas });
}

function onSegmentationResults(results) {
    // MediaPipe returns a segmentation mask
    // We will save this mask into our maskCanvas
    if (!bgState.maskCanvas) {
        bgState.maskCanvas = document.createElement('canvas');
    }
    bgState.maskCanvas.width = results.segmentationMask.width;
    bgState.maskCanvas.height = results.segmentationMask.height;
    
    const mCtx = bgState.maskCanvas.getContext('2d');
    mCtx.clearRect(0, 0, bgState.maskCanvas.width, bgState.maskCanvas.height);
    mCtx.drawImage(results.segmentationMask, 0, 0);
    
    renderBgEditor();
}

function renderBgEditor() {
    if (!bgState.sourceCanvas || !bgState.maskCanvas) return;
    
    const canvas = elements.bgTool.canvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 1. Draw solid background color
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = bgState.currentColor;
    ctx.fillRect(0, 0, width, height);

    // 2. We need to extract the person using the maskCanvas
    // Create a temporary canvas for the person cutout
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tCtx = tempCanvas.getContext('2d');
    
    // Draw the mask
    tCtx.drawImage(bgState.maskCanvas, 0, 0, width, height);
    // Draw the original image but only where the mask is solid (source-in)
    tCtx.globalCompositeOperation = 'source-in';
    tCtx.drawImage(bgState.sourceCanvas, 0, 0, width, height);

    // 3. Draw the extracted person over the background
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(tempCanvas, 0, 0);

    // Save final composited result to bgState
    if (!bgState.finalCompositedCanvas) {
        bgState.finalCompositedCanvas = document.createElement('canvas');
    }
    bgState.finalCompositedCanvas.width = width;
    bgState.finalCompositedCanvas.height = height;
    const fCtx = bgState.finalCompositedCanvas.getContext('2d');
    fCtx.drawImage(canvas, 0, 0);
}

function drawBrush(e) {
    const canvas = elements.bgTool.canvas;
    const rect = canvas.getBoundingClientRect();
    // Calculate scale between displayed CSS size and actual canvas pixel size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const radius = parseFloat(elements.bgTool.brushSize.value);

    const mCtx = bgState.maskCanvas.getContext('2d');
    
    if (bgState.brushMode === 'erase') {
        // Erase the mask (make person transparent)
        mCtx.globalCompositeOperation = 'destination-out';
        mCtx.fillStyle = 'rgba(0,0,0,1)';
        mCtx.beginPath();
        mCtx.arc(x, y, radius, 0, Math.PI * 2);
        mCtx.fill();
    } else {
        // Restore the mask (make person opaque)
        mCtx.globalCompositeOperation = 'source-over';
        mCtx.fillStyle = 'rgba(255,255,255,1)';
        mCtx.beginPath();
        mCtx.arc(x, y, radius, 0, Math.PI * 2);
        mCtx.fill();
    }
    
    // Re-render
    renderBgEditor();
}

// Expose core functions for testing
window.ResizerApp = { compressToTarget, validateResult, examPresets };
