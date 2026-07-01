// Exam Presets Configuration
const examPresets = {
    ssc: {
        photo: { minKB: 20, maxKB: 50, width: 275, height: 354, ratio: 275 / 354 }, // ~3.5x4.5cm at 200DPI
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

// DOM Elements
const elements = {
    presetCards: document.querySelectorAll('.preset-card'),
    globalUpload: document.getElementById('globalUpload'),
    heroUpload: document.getElementById('heroPhotoInput'),
    hero: document.querySelector('.hero'),
    cardContainer: document.getElementById('cardContainer'),
    idCard: document.getElementById('idCard'),
    mainWorkspace: document.getElementById('mainWorkspace'),
    photo: {
        input: document.getElementById('heroPhotoInput'), // Can be overriden
        workspace: document.getElementById('photoModule'),
        target: document.getElementById('photoTarget'),
        resultArea: document.getElementById('photoResultArea'),
        preview: document.getElementById('photoPreview'),
        stats: document.getElementById('photoStats'),
        validation: document.getElementById('photoValidation'),
        btnFix: document.getElementById('btnFixPhoto'),
        btnDownload: document.getElementById('btnDownloadPhoto'),
        cropperContainer: document.getElementById('photoCropperContainer')
    },
    signature: {
        input: document.getElementById('signatureInput'),
        workspace: document.getElementById('signatureWorkspace'),
        target: document.getElementById('signatureTarget'),
        resultArea: document.getElementById('signatureResultArea'),
        preview: document.getElementById('signaturePreview'),
        stats: document.getElementById('signatureStats'),
        validation: document.getElementById('signatureValidation'),
        btnFix: document.getElementById('btnFixSignature'),
        btnDownload: document.getElementById('btnDownloadSignature')
    },
    batch: {
        section: document.getElementById('batchActions'),
        btnDownloadPrint: document.getElementById('btnDownloadPrintSheet')
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

// Event Listeners
if (elements.presetCards.length > 0) {
    elements.presetCards.forEach(card => {
        card.addEventListener('click', () => {
            elements.presetCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            currentPreset = card.dataset.preset;
            
            if (croppers.photo) croppers.photo.setAspectRatio(examPresets[currentPreset].photo.ratio);
            if (croppers.signature) croppers.signature.setAspectRatio(examPresets[currentPreset].signature.ratio);
        });
    });

    // Upload Triggers
    const handleInitialUpload = (e) => {
        // Transition to workspace
        document.getElementById('idCard').classList.add('scanning');
        setTimeout(() => {
            elements.mainWorkspace.classList.remove('hidden');
            elements.mainWorkspace.scrollIntoView({ behavior: 'smooth' });
            handleUpload(e, 'photo');
        }, 1500); // Simulate scan delay before jumping to workspace
    };

    if (elements.globalUpload) elements.globalUpload.addEventListener('change', handleInitialUpload);
    if (elements.heroUpload) elements.heroUpload.addEventListener('change', handleInitialUpload);

    elements.photo.btnFix.addEventListener('click', () => processImage('photo'));
    elements.photo.btnDownload.addEventListener('click', () => downloadResult('photo'));

    if (elements.signature.input) elements.signature.input.addEventListener('change', (e) => handleUpload(e, 'signature'));
    elements.signature.btnFix.addEventListener('click', () => processImage('signature'));
    elements.signature.btnDownload.addEventListener('click', () => downloadResult('signature'));

    elements.batch.btnDownloadPrint.addEventListener('click', generatePrintSheet);
}

function handleUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        elements[type].target.src = e.target.result;
        
        if (type === 'signature') {
            elements.signature.workspace.classList.remove('hidden');
            document.getElementById('signatureUploadArea').classList.add('hidden');
        } else {
            // update hero photo placeholder for visual effect
            const placeholder = document.getElementById('heroPhotoPlaceholder');
            if (placeholder) {
                placeholder.src = e.target.result;
                placeholder.style.filter = 'none';
            }
        }

        initCropper(type);
    };
    reader.readAsDataURL(file);
}

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

async function processImage(type) {
    if (!croppers[type]) return;

    elements[type].btnFix.disabled = true;
    elements[type].btnFix.textContent = 'PROCESSING...';

    const rules = examPresets[currentPreset][type];
    const canvas = croppers[type].getCroppedCanvas({
        width: rules.width,
        height: rules.height,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
    });

    try {
        const resultBlob = await compressToTarget(canvas, rules.minKB, rules.maxKB, type);
        finalBlobs[type] = resultBlob;
        displayResult(type, resultBlob, rules);
        
        // Trigger live checkmarks for hero visual
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
        }, index * 400); // Sequence pop-in
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
                    resolve(bestBlob);
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
        item.innerHTML = `
            <span>${v.text}</span>
            <span class="${v.passed ? 'val-pass' : 'val-fail'}">[ ${v.passed ? 'PASS' : 'FAIL'} ]</span>
        `;
        container.appendChild(item);
    });

    elements[type].btnDownload.disabled = !allPassed;
}

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

// Generate A4 Sheet (approx 2480 x 3508 px at 300 DPI)
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

// Expose core functions for testing
window.ResizerApp = {
    compressToTarget,
    validateResult,
    examPresets
};
