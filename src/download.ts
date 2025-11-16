import { initializeApp } from 'firebase/app';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// Get file ID from URL
const urlParams = new URLSearchParams(window.location.search);
const fileId = urlParams.get('id');

// DOM elements
const loading = document.getElementById('loading') as HTMLElement;
const success = document.getElementById('success') as HTMLElement;
const error = document.getElementById('error') as HTMLElement;
const preview = document.getElementById('preview') as HTMLImageElement;
const downloadBtn = document.getElementById('downloadBtn') as HTMLAnchorElement;
const downloadBtnImage = document.getElementById('downloadBtnImage') as HTMLImageElement;
const errorMessage = document.getElementById('errorMessage') as HTMLParagraphElement;
const subtitle = document.getElementById('subtitle') as HTMLParagraphElement;
const logo = document.getElementById('logo') as HTMLImageElement;

// Detect language
const lang = window.location.pathname.startsWith('/en') ? 'en' : 'ko';

// Translations
const translations = {
  ko: {
    subtitle: '한 글자에서 한글 자로,\n디자인 에이전트와 함께 만드는 한글레터링',
    loading: '이미지를 불러오는 중...',
    download: '다운로드',
    error: '이 링크는 만료되었거나 존재하지 않습니다.<br>링크를 다시 확인해주세요.',
    backHome: '홈으로 돌아가기',
    logoSrc: '/hangulo_text_kr.png',
    downloadBtnSrc: '/label-download.png'
  },
  en: {
    subtitle: 'From one character to Korean letter design,\ncreate Korean lettering with design agents',
    loading: 'Loading image...',
    download: 'Download',
    error: 'This link has expired or does not exist.<br>Please check the link again.',
    backHome: 'Back to Home',
    logoSrc: '/hangulo_text_en.png',
    downloadBtnSrc: '/label-download-en.png'
  }
};

// Update text based on language
function updateLanguage() {
  document.documentElement.lang = lang;
  const t = translations[lang as keyof typeof translations];

  subtitle.textContent = t.subtitle;
  const loadingText = loading.querySelector('p');
  if (loadingText) loadingText.textContent = t.loading;
  downloadBtnImage.src = t.downloadBtnSrc;
  downloadBtnImage.alt = t.download;
  logo.src = t.logoSrc;
  errorMessage.innerHTML = t.error;
  const backLink = error.querySelector('.back-link') as HTMLAnchorElement;
  if (backLink) backLink.textContent = t.backHome;
}

async function loadImage() {
  if (!fileId) {
    showError();
    return;
  }

  try {
    // Get download URL from Firebase
    const storageRef = ref(storage, `exports/${fileId}.png`);
    const downloadURL = await getDownloadURL(storageRef);


    // Set preview and download link
    preview.src = downloadURL;
    preview.style.display = 'block';
    // downloadBtn.href = downloadURL;

    const xhr = new XMLHttpRequest();
    xhr.responseType = 'blob';
    xhr.onload = () => {
      const blob = xhr.response;
      const blobUrl = URL.createObjectURL(blob);

      downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `${fileId}.png`;
        a.click();
        URL.revokeObjectURL(blobUrl);
      };
    };
    xhr.open("GET", downloadURL);
    xhr.send();

    // Show success state
    loading.style.display = 'none';
    success.classList.add('active');

  } catch (err) {
    console.error('Error loading image:', err);
    showError();
  }
}

function showError() {
  loading.style.display = 'none';
  error.classList.add('active');
}

// Initialize
updateLanguage();
loadImage();

