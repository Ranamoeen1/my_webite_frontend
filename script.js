/**
 * SOCIAL MEDIA VIDEO DOWNLOADER - SCRIPT.JS
 * Author: Rana Moeen
 * 
 * This script handles video URL validation, platform detection,
 * and download functionality for various social media platforms.
 */

// ============================================
// CONFIGURATION
// ============================================
// Change this to your Hugging Face Space URL after deployment
// Example: 'https://user-space.hf.space'
const API_BASE_URL = 'https://ranamoeen1-vedio-downloader.hf.space';

// ============================================
// DOM ELEMENTS
// ============================================
const urlInput = document.getElementById('video-url-input');
const downloadBtn = document.getElementById('download-btn');
const btnText = document.getElementById('btn-text');
const platformIndicator = document.getElementById('platform-indicator');
const platformIcon = document.getElementById('platform-icon');
const platformName = document.getElementById('platform-name');

// ============================================
// PLATFORM CONFIGURATIONS
// ============================================
const platforms = {
    youtube: {
        name: 'YouTube',
        icon: '▶️',
        patterns: [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
        ],
        color: '#FF0000'
    },
    instagram: {
        name: 'Instagram',
        icon: '📸',
        patterns: [
            /instagram\.com\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/,
            /instagram\.com\/stories\/([a-zA-Z0-9._]+)\/([0-9]+)/
        ],
        color: '#E4405F'
    },
    tiktok: {
        name: 'TikTok',
        icon: '🎵',
        patterns: [
            /tiktok\.com\/@([^\/]+)\/video\/(\d+)/,
            /vm\.tiktok\.com\/([a-zA-Z0-9]+)/,
            /vt\.tiktok\.com\/([a-zA-Z0-9]+)/
        ],
        color: '#000000'
    },
    facebook: {
        name: 'Facebook',
        icon: '👥',
        patterns: [
            /facebook\.com\/.*\/videos\/(\d+)/,
            /facebook\.com\/watch\/\?v=(\d+)/,
            /facebook\.com\/reel\/(\d+)/,
            /facebook\.com\/reels\/(\d+)/,
            /facebook\.com\/share\/[rvp]\/([a-zA-Z0-9_-]+)/,
            /facebook\.com\/groups\/[^\/]+\/posts\/(\d+)/,
            /facebook\.com\/[^\/]+\/posts\/([a-zA-Z0-9_-]+)/,
            /facebook\.com\/story\.php\?story_fbid=([a-zA-Z0-9_-]+)/,
            /facebook\.com\/permalink\.php\?story_fbid=([a-zA-Z0-9_-]+)/,
            /fb\.watch\/([a-zA-Z0-9_-]+)/
        ],
        color: '#1877F2'
    },
    twitter: {
        name: 'Twitter/X',
        icon: '🐦',
        patterns: [
            /twitter\.com\/.*\/status\/(\d+)/,
            /x\.com\/.*\/status\/(\d+)/
        ],
        color: '#1DA1F2'
    },
    vimeo: {
        name: 'Vimeo',
        icon: '🎬',
        patterns: [
            /vimeo\.com\/(\d+)/,
            /player\.vimeo\.com\/video\/(\d+)/
        ],
        color: '#1AB7EA'
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Detects the platform from a given URL
 * @param {string} url - The video URL to analyze
 * @returns {object|null} Platform object or null if not detected
 */
function detectPlatform(url) {
    if (!url || typeof url !== 'string') return null;

    const cleanUrl = url.trim().toLowerCase();

    for (const [key, platform] of Object.entries(platforms)) {
        for (const pattern of platform.patterns) {
            if (pattern.test(cleanUrl)) {
                return { key, ...platform };
            }
        }
    }

    return null;
}

/**
 * Validates if the URL is properly formatted
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
        return false;
    }
}

/**
 * Shows a notification to the user
 * @param {string} message - The message to display
 * @param {string} type - The notification type (success, error, warning)
 */
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <p style="margin: 0; font-weight: 600;">${message}</p>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

/**
 * Updates the platform indicator UI
 * @param {object|null} platform - The detected platform object
 */
function updatePlatformIndicator(platform) {
    if (platform) {
        platformIcon.textContent = platform.icon;
        platformName.textContent = `${platform.name} video detected`;
        platformIndicator.classList.remove('hidden');
    } else {
        platformIndicator.classList.add('hidden');
    }
}

/**
 * Sets the loading state of the download button
 * @param {boolean} isLoading - Whether the button should show loading state
 */
function setLoadingState(isLoading) {
    if (isLoading) {
        downloadBtn.classList.add('loading');
        downloadBtn.disabled = true;
        btnText.innerHTML = '<span class="spinner"></span> <span id="loading-msg">Fetching...</span>';
    } else {
        downloadBtn.classList.remove('loading');
        downloadBtn.disabled = false;
        btnText.textContent = 'Download';
    }
}

/**
 * Downloads video using the backend API
 * @param {string} url - The video URL to download
 * @param {object} platform - The detected platform
 */
async function downloadVideo(url, platform) {
    setLoadingState(true);

    // Dynamic message timer
    const msgTimer = setTimeout(() => {
        const msg = document.getElementById('loading-msg');
        if (msg) msg.textContent = 'Almost there...';
    }, 10000);

    const longMsgTimer = setTimeout(() => {
        const msg = document.getElementById('loading-msg');
        if (msg) msg.textContent = 'Large video detected, please wait...';
    }, 20000);

    // Set up timeout controller
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 55000); // 55s timeout

    try {
        // Call the backend API
        const response = await fetch(`${API_BASE_URL}/api/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
                url: url,
                quality: 'best'
            })
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            if (text.includes('Your space is sleeping') || response.status === 503) {
                throw new Error('The backend server is currently sleeping. Please visit your Hugging Face Space to wake it up, then try again.');
            }
            throw new Error('The server returned an unexpected response. Please try again later.');
        }

        const data = await response.json();

        // Show success message
        showNotification(
            `✅ ${data.title} is ready! Downloading...`,
            'success'
        );

        // Download the file
        const fileUrl = data.download_url.startsWith('http') ? data.download_url : `${API_BASE_URL}${data.download_url}`;
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Show additional info
        const sizeInMB = (data.file_size / (1024 * 1024)).toFixed(2);
        setTimeout(() => {
            showNotification(
                `📥 Downloaded: ${data.title} (${sizeInMB} MB)`,
                'success'
            );
        }, 1500);

        // Clear input after successful download
        setTimeout(() => {
            urlInput.value = '';
            updatePlatformIndicator(null);
        }, 2000);

    } catch (error) {
        console.error('Download error:', error);

        if (error.name === 'AbortError') {
            showNotification(
                '⏱️ The server is taking too long to respond. This video might be too large or currently unavailable. Please try again or try another link.',
                'error'
            );
        } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
            showNotification(
                '❌ Connection lost. The server might be busy or restarting. Please wait a moment and try again.',
                'error'
            );
        } else if (error.message.includes('timeout')) {
            showNotification(
                '⏱️ The download is taking longer than expected. It might still be processing on the server.',
                'warning'
            );
        } else {
            showNotification(
                `❌ ${error.message}`,
                'error'
            );
        }
    } finally {
        clearTimeout(msgTimer);
        clearTimeout(longMsgTimer);
        clearTimeout(fetchTimeout);
        setLoadingState(false);
    }
}

/**
 * Handles the download button click
 */
async function handleDownload() {
    const url = urlInput.value.trim();

    // Validate URL
    if (!url) {
        urlInput.classList.add('error');
        showNotification('⚠️ Please enter a video URL', 'warning');
        setTimeout(() => urlInput.classList.remove('error'), 500);
        return;
    }

    if (!isValidUrl(url)) {
        urlInput.classList.add('error');
        showNotification('⚠️ Please enter a valid URL', 'warning');
        setTimeout(() => urlInput.classList.remove('error'), 500);
        return;
    }

    // Detect platform
    const platform = detectPlatform(url);

    if (!platform) {
        urlInput.classList.add('error');
        showNotification(
            '⚠️ Platform not supported. We support YouTube, Instagram, TikTok, Facebook, Twitter, and Vimeo.',
            'warning'
        );
        setTimeout(() => urlInput.classList.remove('error'), 500);
        return;
    }

    // Mark as valid
    urlInput.classList.add('success');
    setTimeout(() => urlInput.classList.remove('success'), 1000);

    // Start download
    await downloadVideo(url, platform);
}

// ============================================
// EVENT LISTENERS
// ============================================

// Input change event - detect platform as user types
urlInput.addEventListener('input', (e) => {
    const url = e.target.value.trim();

    // Remove error state when user starts typing
    urlInput.classList.remove('error');

    if (url && isValidUrl(url)) {
        const platform = detectPlatform(url);
        updatePlatformIndicator(platform);
    } else {
        updatePlatformIndicator(null);
    }
});

// Download button click
downloadBtn.addEventListener('click', handleDownload);

// Enter key press in input field
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleDownload();
    }
});

// Paste event - auto-detect platform
urlInput.addEventListener('paste', (e) => {
    setTimeout(() => {
        const url = urlInput.value.trim();
        if (url && isValidUrl(url)) {
            const platform = detectPlatform(url);
            updatePlatformIndicator(platform);

            if (platform) {
                showNotification(
                    `🎯 ${platform.name} video detected! Click download to proceed.`,
                    'success'
                );
            }
        }
    }, 100);
});

// ============================================
// INITIALIZATION
// ============================================

// Focus input on page load
window.addEventListener('load', () => {
    urlInput.focus();

    // Show welcome notification
    setTimeout(() => {
        showNotification(
            '👋 Welcome! Paste any video URL to get started.',
            'success'
        );
    }, 500);
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ============================================
// DEMO HELPER FUNCTIONS
// ============================================

/**
 * For demonstration: Log supported platforms to console
 */
console.log('📱 Supported Platforms:', Object.keys(platforms).map(key => platforms[key].name).join(', '));

/**
 * For demonstration: Example URLs for testing
 */
const exampleUrls = {
    youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    instagram: 'https://www.instagram.com/p/ABC123/',
    tiktok: 'https://www.tiktok.com/@user/video/1234567890',
    facebook: 'https://www.facebook.com/watch/?v=1234567890',
    twitter: 'https://twitter.com/user/status/1234567890',
    vimeo: 'https://vimeo.com/123456789'
};

console.log('🔗 Example URLs for testing:', exampleUrls);

// ============================================
// PRODUCTION NOTES
// ============================================

/**
 * IMPORTANT: For production use, you need to:
 * 
 * 1. Set up a backend server (Node.js, Python, etc.)
 * 2. Use appropriate libraries for video downloading:
 *    - youtube-dl or yt-dlp for YouTube
 *    - instagram-scraper for Instagram
 *    - TikTok API or scraping libraries
 *    - Platform-specific APIs where available
 * 
 * 3. Handle rate limiting and caching
 * 4. Implement proper error handling
 * 5. Add user authentication if needed
 * 6. Comply with platform terms of service
 * 7. Respect copyright and fair use policies
 * 
 * Example backend endpoint structure:
 * POST /api/download
 * Body: { url: string, platform: string, quality: string }
 * Response: { downloadUrl: string, filename: string, size: number }
 */
