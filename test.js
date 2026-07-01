const resultsDiv = document.getElementById('results');

function logResult(suite, name, passed, details = '') {
    const el = document.createElement('div');
    el.innerHTML = `[${suite}] ${name}: <span class="${passed ? 'pass' : 'fail'}">${passed ? 'PASS' : 'FAIL'}</span> ${details}`;
    resultsDiv.appendChild(el);
}

function logHeader(text) {
    const el = document.createElement('div');
    el.className = 'header';
    el.textContent = text;
    resultsDiv.appendChild(el);
}

async function runTests() {
    const app = window.ResizerApp;
    if (!app) {
        logResult('Setup', 'App Loaded', false, 'window.ResizerApp not found');
        return;
    }
    
    logHeader('Running Automated Tests');

    const testImages = [
        { url: 'sample_face.png', type: 'photo', desc: 'Sample Face' },
        { url: 'sample_signature.png', type: 'signature', desc: 'Sample Signature' }
    ];

    const presetsToTest = ['ssc', 'upsc'];

    for (let presetKey of presetsToTest) {
        const rules = app.examPresets[presetKey];
        logHeader(`Testing Preset: ${presetKey.toUpperCase()}`);

        for (let imgInfo of testImages) {
            try {
                // 1. Load Image
                const img = await loadImage(imgInfo.url);
                const targetRules = rules[imgInfo.type];
                
                // 2. Setup Canvas (simulating cropper output)
                const canvas = document.createElement('canvas');
                canvas.width = targetRules.width;
                canvas.height = targetRules.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // 3. Run Compression Loop
                const blob = await app.compressToTarget(canvas, targetRules.minKB, targetRules.maxKB, imgInfo.type);
                
                // 4. Validate output
                const validations = app.validateResult(blob, canvas.width, canvas.height, targetRules);
                
                let allPassed = true;
                validations.forEach(v => {
                    if (!v.passed) allPassed = false;
                    logResult(presetKey, `${imgInfo.desc} -> ${v.text}`, v.passed);
                });

                if (allPassed) {
                    logResult(presetKey, `${imgInfo.desc} Overall Validation`, true, `Final Size: ${(blob.size/1024).toFixed(2)} KB`);
                } else {
                    logResult(presetKey, `${imgInfo.desc} Overall Validation`, false);
                }

            } catch (err) {
                logResult(presetKey, `${imgInfo.desc} Execution`, false, err.message);
            }
        }
    }
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load ${url}`));
        img.src = url;
    });
}

// Start tests
runTests();
