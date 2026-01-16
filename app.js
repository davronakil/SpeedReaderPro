// State management
const state = {
    words: [],
    wordParagraphs: [], // Track which paragraph each word belongs to
    currentIndex: 0,
    isPlaying: false,
    intervalId: null,
    timeoutId: null,
    speed: 300, // words per minute
    fontSize: 48,
    text: '',
    paragraphPauseMultiplier: 2.5 // Pause duration multiplier for paragraph breaks
};

// DOM elements
const inputScreen = document.getElementById('inputScreen');
const readerScreen = document.getElementById('readerScreen');
const textInput = document.getElementById('textInput');
const startBtn = document.getElementById('startBtn');
const loadBtn = document.getElementById('loadBtn');
const wordDisplay = document.getElementById('wordText');
const speedControl = document.getElementById('speedControl');
const fontSizeControl = document.getElementById('fontSizeControl');
const speedValue = document.getElementById('speedValue');
const fontSizeValue = document.getElementById('fontSizeValue');
const pauseBtn = document.getElementById('pauseBtn');
const saveBtn = document.getElementById('saveBtn');
const backBtn = document.getElementById('backBtn');
const progressFill = document.getElementById('progressFill');
const charCount = document.getElementById('charCount');
const pauseOverlay = document.getElementById('pauseOverlay');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');

// Get the alphanumeric core of a word (handles punctuation and contractions)
function getCoreSlices(raw) {
    // Keep middle apostrophes/hyphens as part of the core
    const match = raw.match(/^([^A-Za-z0-9']*)([A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*)([^A-Za-z0-9']*)$/);
    if (!match) {
        return { pre: '', core: raw, post: '', coreStart: 0 };
    }
    const [, pre, core, post] = match;
    return { pre, core, post, coreStart: pre.length };
}

// Calculate Optimal Recognition Point (ORP) index based on core length
// Based on Spritz-style speed reading research
function getORPIndex(coreLength) {
    if (coreLength <= 1) return 0;
    if (coreLength <= 5) return 1;
    if (coreLength <= 9) return 2;
    if (coreLength <= 13) return 3;
    return 4;
}

// Split word for highlighting with optimal focal point
function splitForHighlight(rawWord) {
    const { pre, core, post, coreStart } = getCoreSlices(rawWord);

    // Calculate ORP index within the core
    const idxInCore = Math.min(getORPIndex(core.length), Math.max(core.length - 1, 0));

    // Build the parts
    const left = rawWord.slice(0, coreStart) + core.slice(0, idxInCore);
    const pivot = core[idxInCore] || '';
    const right = core.slice(idxInCore + 1) + post;

    return { left, pivot, right };
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render word with optimal focal point highlighted
function renderWord(word) {
    if (!word) return '';

    const { left, pivot, right } = splitForHighlight(word);

    return `<span class="word-left">${escapeHtml(left)}</span><span class="focal-letter">${escapeHtml(pivot)}</span><span class="word-right">${escapeHtml(right)}</span>`;
}

// Position word parts around the fixed focal letter
function positionWordParts() {
    // Use requestAnimationFrame to ensure DOM and fonts are fully rendered
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const focalSpan = wordDisplay.querySelector('.focal-letter');
            const leftSpan = wordDisplay.querySelector('.word-left');
            const rightSpan = wordDisplay.querySelector('.word-right');

            if (focalSpan && leftSpan && rightSpan) {
                // Measure the focal letter width
                const focalWidth = focalSpan.offsetWidth;

                // Position left part: its right edge should align with the left edge of focal letter
                // Since focal letter is centered at 50%, we position left part's right edge at 50% - focalWidth/2
                leftSpan.style.right = `calc(50% + ${focalWidth / 2}px)`;

                // Position right part: its left edge should align with the right edge of focal letter
                // Since focal letter is centered at 50%, we position right part's left edge at 50% + focalWidth/2
                rightSpan.style.left = `calc(50% + ${focalWidth / 2}px)`;
            }
        });
    });
}

// Update word display
function updateWordDisplay() {
    if (state.currentIndex >= state.words.length) {
        // Finished reading
        wordDisplay.innerHTML = '<span style="color: #4a90e2;">Reading Complete!</span>';
        pause();
        return;
    }

    const word = state.words[state.currentIndex];
    wordDisplay.innerHTML = renderWord(word);
    wordDisplay.style.fontSize = `${state.fontSize}px`;

    // Position word parts around the fixed focal letter
    positionWordParts();

    // Update progress
    const progress = ((state.currentIndex + 1) / state.words.length) * 100;
    progressFill.style.width = `${progress}%`;
}

// Start reading
function startReading() {
    const text = textInput.value.trim();

    if (!text) {
        alert('Please enter some text to read.');
        return;
    }

    // Parse text into words and track paragraphs
    state.text = text;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    state.words = [];
    state.wordParagraphs = [];

    paragraphs.forEach((paragraph, paraIndex) => {
        const words = paragraph.split(/\s+/).filter(word => word.length > 0);
        words.forEach(word => {
            state.words.push(word);
            state.wordParagraphs.push(paraIndex);
        });
    });

    state.currentIndex = 0;
    state.isPlaying = true;

    // Switch screens
    inputScreen.classList.remove('active');
    readerScreen.classList.add('active');

    // Start reading
    updateWordDisplay();
    scheduleNextWord();

    pauseBtn.textContent = 'Pause';
    pauseOverlay.classList.remove('show');
}

// Schedule next word
function scheduleNextWord() {
    if (state.timeoutId) {
        clearTimeout(state.timeoutId);
        state.timeoutId = null;
    }

    // Calculate base delay in milliseconds (words per minute to ms per word)
    const baseDelay = (60 / state.speed) * 1000;

    // Function to advance to next word
    const advanceWord = () => {
        if (!state.isPlaying) return;

        // Show current word
        updateWordDisplay();

        // Move to next word
        state.currentIndex++;

        if (state.currentIndex >= state.words.length) {
            pause();
            return;
        }

        // Check if the next word we're about to show starts a new paragraph
        const isNewParagraph = state.wordParagraphs[state.currentIndex] !== state.wordParagraphs[state.currentIndex - 1];

        // Use longer delay for paragraph breaks (pause before showing first word of new paragraph)
        const delay = isNewParagraph ? baseDelay * state.paragraphPauseMultiplier : baseDelay;

        // Schedule next word with appropriate delay
        state.timeoutId = setTimeout(advanceWord, delay);
    };

    // Start the cycle
    advanceWord();
}

// Pause/Resume
function pause() {
    state.isPlaying = !state.isPlaying;

    if (state.isPlaying) {
        pauseBtn.textContent = 'Pause';
        pauseOverlay.classList.remove('show');
        scheduleNextWord();
    } else {
        pauseBtn.textContent = 'Resume';
        pauseOverlay.classList.add('show');
        if (state.timeoutId) {
            clearTimeout(state.timeoutId);
            state.timeoutId = null;
        }
    }
}

// Go back to input screen
function goBack() {
    pause();
    if (state.timeoutId) {
        clearTimeout(state.timeoutId);
        state.timeoutId = null;
    }
    readerScreen.classList.remove('active');
    inputScreen.classList.add('active');
}

// Save progress
function saveProgress() {
    const progress = {
        text: state.text,
        currentIndex: state.currentIndex,
        speed: state.speed,
        fontSize: state.fontSize,
        timestamp: Date.now()
    };

    try {
        localStorage.setItem('speedReaderProgress', JSON.stringify(progress));
        alert('Progress saved successfully!');
    } catch (e) {
        alert('Failed to save progress. ' + e.message);
    }
}

// Load progress
function loadProgress() {
    try {
        const saved = localStorage.getItem('speedReaderProgress');
        if (!saved) {
            alert('No saved progress found.');
            return;
        }

        const progress = JSON.parse(saved);

        // Restore text
        textInput.value = progress.text;
        updateCharCount();

        // Restore settings
        state.speed = progress.speed || 300;
        state.fontSize = progress.fontSize || 48;
        speedControl.value = state.speed;
        fontSizeControl.value = state.fontSize;
        speedValue.textContent = state.speed;
        fontSizeValue.textContent = state.fontSize;

        // Parse text into words and track paragraphs
        state.text = progress.text;
        const paragraphs = progress.text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        state.words = [];
        state.wordParagraphs = [];

        paragraphs.forEach((paragraph, paraIndex) => {
            const words = paragraph.split(/\s+/).filter(word => word.length > 0);
            words.forEach(word => {
                state.words.push(word);
                state.wordParagraphs.push(paraIndex);
            });
        });

        state.currentIndex = progress.currentIndex || 0;

        // Switch to reader screen
        inputScreen.classList.remove('active');
        readerScreen.classList.add('active');

        updateWordDisplay();
        pause(); // Start paused so user can resume

        alert(`Loaded progress. You were at word ${state.currentIndex + 1} of ${state.words.length}.`);
    } catch (e) {
        alert('Failed to load progress. ' + e.message);
    }
}

// Update character count
function updateCharCount() {
    const count = textInput.value.length;
    charCount.textContent = count.toLocaleString();
}

// Event listeners
startBtn.addEventListener('click', startReading);
loadBtn.addEventListener('click', loadProgress);
pauseBtn.addEventListener('click', pause);
saveBtn.addEventListener('click', saveProgress);
backBtn.addEventListener('click', goBack);

// Click/tap on word display to pause/resume
wordDisplay.addEventListener('click', pause);
wordDisplay.addEventListener('touchend', (e) => {
    e.preventDefault();
    pause();
});

// Speed control
speedControl.addEventListener('input', (e) => {
    state.speed = parseInt(e.target.value);
    speedValue.textContent = state.speed;

    // Restart interval with new speed if playing
    if (state.isPlaying) {
        scheduleNextWord();
    }
});

// Font size control
fontSizeControl.addEventListener('input', (e) => {
    state.fontSize = parseInt(e.target.value);
    fontSizeValue.textContent = state.fontSize;
    wordDisplay.style.fontSize = `${state.fontSize}px`;

    // Reposition word parts after font size change
    if (state.currentIndex < state.words.length) {
        positionWordParts();
    }
});

// Character count update
textInput.addEventListener('input', updateCharCount);

// Initialize PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// File upload handler - ensure DOM is ready
function initializeFileUpload() {
    const fileInputEl = document.getElementById('fileInput');
    const fileNameEl = document.getElementById('fileName');
    
    if (!fileInputEl) {
        console.error('fileInput element not found!');
        return;
    }
    
    if (!fileNameEl) {
        console.error('fileName element not found!');
        return;
    }
    
    fileInputEl.addEventListener('change', handleFileUpload);
    console.log('File upload handler attached successfully');
    
    // Also add click handler to label for debugging and to ensure it works
    const labelEl = document.querySelector('label[for="fileInput"]');
    if (labelEl) {
        labelEl.addEventListener('click', function(e) {
            console.log('Upload button clicked');
            // Ensure the file input is triggered
            if (fileInputEl && !fileInputEl.disabled) {
                // The label's 'for' attribute should handle this, but let's be explicit
                setTimeout(() => {
                    if (fileInputEl.files && fileInputEl.files.length > 0) {
                        console.log('File selected via label click');
                    }
                }, 100);
            }
        });
    } else {
        console.warn('Label for fileInput not found');
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFileUpload);
} else {
    // DOM is already ready
    initializeFileUpload();
}

// Debug: Log when page loads
console.log('SpeedReaderPro app.js loaded');
console.log('File input element exists:', !!document.getElementById('fileInput'));
console.log('File name element exists:', !!document.getElementById('fileName'));

// Handle file upload
async function handleFileUpload(event) {
    console.log('handleFileUpload called', event);
    // Get file immediately and store reference
    const inputElement = event.target;
    console.log('Input element:', inputElement, 'Files:', inputElement.files);
    const file = inputElement.files && inputElement.files[0];
    if (!file) {
        console.log('No file selected');
        const fileNameEl = document.getElementById('fileName');
        if (fileNameEl) fileNameEl.textContent = '';
        return;
    }

    // Store file info immediately to prevent object invalidation
    const fileNameStr = file.name;
    const fileSize = file.size;
    const fileType = file.type;
    const fileExtension = fileNameStr.split('.').pop().toLowerCase();

    console.log('File selected:', fileNameStr, fileType, fileSize, 'Extension:', fileExtension);
    const fileNameEl = document.getElementById('fileName');
    if (fileNameEl) {
        fileNameEl.textContent = `Loading ${fileNameStr}...`;
        fileNameEl.style.color = '#667eea';
    }

    // Don't reset file input until after we're done reading
    try {
        let text = '';

        // Read file immediately - don't delay
        if (fileExtension === 'txt' || fileExtension === 'md' || fileExtension === 'markdown') {
            console.log('Reading text file...');
            text = await readTextFile(file);
            console.log('Text file read, length:', text ? text.length : 0);
        } else if (fileExtension === 'pdf') {
            console.log('Reading PDF file...');
            text = await readPDFFile(file);
            console.log('PDF file read, length:', text ? text.length : 0);
        } else if (fileExtension === 'doc' || fileExtension === 'docx') {
            console.log('Reading DOCX file...');
            text = await readDocxFile(file);
            console.log('DOCX file read, length:', text ? text.length : 0);
        } else if (fileExtension === 'rtf') {
            console.log('Reading RTF file...');
            text = await readRTFFile(file);
            console.log('RTF file read, length:', text ? text.length : 0);
        } else {
            alert('Unsupported file type. Please upload .txt, .md, .pdf, .doc, .docx, or .rtf files.');
            const fileNameEl = document.getElementById('fileName');
            if (fileNameEl) fileNameEl.textContent = '';
            inputElement.value = ''; // Reset file input
            return;
        }

        if (text && text.trim().length > 0) {
            // Limit to maxlength
            if (text.length > 1000000) {
                text = text.substring(0, 1000000);
                alert('File is too large. Only the first 1,000,000 characters have been loaded.');
            }
            textInput.value = text;
            updateCharCount();
            const fileNameEl = document.getElementById('fileName');
            if (fileNameEl) {
                fileNameEl.textContent = `✓ Loaded: ${fileNameStr}`;
                fileNameEl.style.color = '#4caf50';
            }

            // Automatically switch to reader mode and prepare to start
            setTimeout(() => {
                startReading();
                // Start paused so user can press play/resume
                pause();
            }, 500);
        } else {
            throw new Error('No text could be extracted from the file.');
        }
    } catch (error) {
        console.error('Error reading file:', error);
        alert(`Error reading file: ${error.message}`);
        const fileNameEl = document.getElementById('fileName');
        if (fileNameEl) {
            fileNameEl.textContent = 'Error loading file';
            fileNameEl.style.color = '#f44336';
        }
        // Don't reset file input here - let it stay until after successful read
    }
}

// Read text file (txt, md)
function readTextFile(file) {
    return new Promise((resolve, reject) => {
        try {
            // Check if file is still valid
            if (!file) {
                reject(new Error('Invalid file object'));
                return;
            }

            // Create a new FileReader for each read operation
            const reader = new FileReader();

            // Set up event handlers before reading
            reader.onload = function(e) {
                try {
                    const result = e.target.result;
                    if (result === null || result === undefined) {
                        reject(new Error('File read returned null or undefined'));
                        return;
                    }
                    const text = String(result);
                    if (!text || text.trim().length === 0) {
                        reject(new Error('File appears to be empty'));
                    } else {
                        resolve(text);
                    }
                } catch (error) {
                    reject(new Error('Error processing file content: ' + error.message));
                }
            };

            reader.onerror = function(e) {
                console.error('FileReader error:', e);
                reject(new Error('Failed to read text file: ' + (e.target.error ? e.target.error.message : 'Unknown error')));
            };

            reader.onabort = function() {
                reject(new Error('File reading was aborted'));
            };

            // Read the file immediately
            try {
                reader.readAsText(file, 'UTF-8');
            } catch (error) {
                reject(new Error('Error reading file: ' + error.message));
            }
        } catch (error) {
            reject(new Error('Error setting up file reader: ' + error.message));
        }
    });
}

// Read PDF file
async function readPDFFile(file) {
    try {
        // Check if file is still valid
        if (!file || !file.name) {
            throw new Error('Invalid file object');
        }

        // Wait for PDF.js to be available
        if (typeof pdfjsLib === 'undefined') {
            // Wait a bit and check again
            await new Promise(resolve => setTimeout(resolve, 500));
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js library not loaded. Please refresh the page.');
            }
        }

        // Read file as ArrayBuffer immediately
        let arrayBuffer;
        try {
            arrayBuffer = await file.arrayBuffer();
        } catch (error) {
            throw new Error('Failed to read file: ' + error.message);
        }

        // Check if arrayBuffer is valid
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            throw new Error('File appears to be empty');
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error('Failed to parse PDF: ' + error.message);
    }
}

// Read DOCX file (basic implementation)
async function readDocxFile(file) {
    try {
        // For DOCX, we'll use a simple approach - try to load mammoth.js dynamically
        // If it fails, suggest conversion
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js';
        document.head.appendChild(script);

        return new Promise((resolve, reject) => {
            script.onload = async () => {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    resolve(result.value);
                } catch (error) {
                    reject(new Error('Failed to parse DOCX. Please convert to PDF or TXT.'));
                }
            };
            script.onerror = () => {
                reject(new Error('DOCX parsing requires additional library. Please convert to PDF or TXT.'));
            };
        });
    } catch (error) {
        throw new Error('Failed to read DOCX file: ' + error.message);
    }
}

// Read RTF file (basic text extraction)
async function readRTFFile(file) {
    try {
        // Check if file is still valid
        if (!file || !file.name) {
            throw new Error('Invalid file object');
        }

        const text = await readTextFile(file);
        // Basic RTF text extraction - remove RTF control codes
        // This is a simple implementation - may not work for all RTF files
        return text
            .replace(/\\[a-z]+\d*\s?/gi, '') // Remove RTF control words
            .replace(/[{}]/g, '') // Remove braces
            .replace(/\n\s*\n/g, '\n\n') // Clean up extra newlines
            .trim();
    } catch (error) {
        throw new Error('Failed to read RTF file: ' + error.message);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Space bar to pause/resume when in reader screen
    if (readerScreen.classList.contains('active') && e.code === 'Space') {
        e.preventDefault();
        pause();
    }

    // Escape to go back
    if (readerScreen.classList.contains('active') && e.code === 'Escape') {
        e.preventDefault();
        goBack();
    }

    // Enter to start when in input screen
    if (inputScreen.classList.contains('active') && e.code === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        startReading();
    }
});

// Recalculate focal letter position on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (readerScreen.classList.contains('active') && state.currentIndex < state.words.length) {
            positionWordParts();
        }
    }, 100);
});

// Initialize
updateCharCount();
