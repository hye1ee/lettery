export type Language = 'ko' | 'en';

type TranslationEntry = {
  ko: string;
  en: string;
};

const translations: Record<string, TranslationEntry> = {
  'sidebar.syllables': { ko: '레터링 글자', en: 'Syllables' },
  'sidebar.jamos': { ko: '자모 레이어', en: 'Jamos' },
  'ui.status.ready': { ko: '준비 완료', en: 'Ready' },
  'logger.ready': {
    ko: '벡터 편집기가 준비되었습니다. 선택(V), 연필(B), 마커(M), 펜(A)을 사용해보세요.',
    en: 'Vector editor ready. Use V for select, B for pencil, M for marker, A for pen',
  },
  'tool.hand': { ko: '손 도구 (H)', en: 'Hand Tool (H)' },
  'tool.select': { ko: '선택 도구 (V)', en: 'Select Tool (V)' },
  'tool.edit': { ko: '편집 도구 (E)', en: 'Edit Tool (E)' },
  'tool.pencil': { ko: '연필 도구 (B)', en: 'Pencil Tool (B)' },
  'tool.marker': { ko: '마커 도구 (M)', en: 'Marker Tool (M)' },
  'tool.pen': { ko: '펜 도구 (A)', en: 'Pen Tool (A)' },
  'tool.rectangle': { ko: '사각형 도구 (R)', en: 'Rectangle Tool (R)' },
  'tool.ellipse': { ko: '타원 도구 (L)', en: 'Ellipse Tool (L)' },
  'button.addElement': { ko: '새 요소 추가', en: 'Add New Element' },
  'button.addJamoLayer': { ko: '자모 레이어 추가', en: 'Add Jamo Layer' },
  'button.importSvg': { ko: 'SVG 가져오기', en: 'Import SVG' },
  'button.zoomOut': { ko: '축소', en: 'Zoom Out' },
  'button.zoomIn': { ko: '확대', en: 'Zoom In' },
  'button.undo': { ko: '되돌리기', en: 'Undo' },
  'button.redo': { ko: '다시 실행', en: 'Redo' },
  'button.exportSvg': { ko: 'SVG 내보내기', en: 'Export SVG' },
  'agent.status.empty': { ko: '작업할 레이어를 생성해주세요', en: 'Create a layer to work with Gulo' },
  'agent.status.active': {
    ko: "에이전트 '글로'와 '{{layer}}' 자모 작업 중",
    en: "Work with agent Gulo on layer '{{layer}}'",
  },
  'agent.status.tool': {
    ko: "{{tool}} · '{{layer}}' 레이어",
    en: "{{tool}} on layer '{{layer}}'",
  },
  'agent.status.layer.untitled': { ko: '이름 없음', en: 'Untitled' },
  'agent.tool.guidedEdit': { ko: '가이드 편집', en: 'Guided Edit' },
  'agent.tool.smartPropagation': { ko: '스마트 전파', en: 'Smart Propagation' },
  'agent.tool.placeholderAgent': { ko: '준비 중', en: 'Coming Soon' },
  'agent.tool.guidedEdit.description': {
    ko: '가이드 스케치와 설명을 기반으로 선택한 자모를 수정합니다',
    en: 'Edit the selected jamo based on your sketch and description',
  },
  'agent.tool.smartPropagation.description': {
    ko: '수정한 자모를 관련 자모에 자동으로 전파합니다',
    en: 'Automatically apply your edits across related jamos',
  },
  'agent.tool.placeholderAgent.description': {
    ko: '이 기능은 곧 제공될 예정입니다!',
    en: 'This feature is coming soon!',
  },
  'tags.before': { ko: '이전', en: 'Before' },
  'tags.after': { ko: '이후', en: 'After' },
  'tags.preview': { ko: '미리보기', en: 'Preview' },
  'tags.noPaths': { ko: '경로 없음', en: 'No paths' },
  'logger.error': { ko: '오류: {{message}}', en: 'Error: {{message}}' },
  'logger.warning': { ko: '경고: {{message}}', en: 'Warning: {{message}}' },
  'modal.close': { ko: '닫기', en: 'Close' },
  'modal.continue': { ko: '계속', en: 'Continue' },
  'modal.syllable.title': { ko: '레터링 글자 추가', en: 'Add Korean Letters' },
  'modal.syllable.inputLabel': { ko: '레터링 글자를 입력하세요:', en: 'Enter Korean words:' },
  'modal.syllable.placeholder': { ko: '안녕', en: 'Hello' },
  'modal.syllable.preview': { ko: '미리보기:', en: 'Preview:' },
  'modal.syllable.confirm': { ko: '레이어 생성', en: 'Create Layers' },
  'modal.jamo.title': { ko: '자모 글자 가져오기', en: 'Import Jamo' },
  'modal.jamo.info': {
    ko: "글자 '{{syllable}}'의 자모 벡터를 가져옵니다",
    en: "Import jamo path for syllable '{{syllable}}'",
  },
  'modal.jamo.fontLabel': { ko: '폰트:', en: 'Font:' },
  'modal.jamo.loadAs': { ko: '가져오기 옵션:', en: 'Load as:' },
  'modal.jamo.option.decomposed': { ko: '자모 분해하기', en: 'Decomposed Jamos' },
  'modal.jamo.option.composed': { ko: '자모 결합하기', en: 'Composed Syllables' },
  'modal.jamo.preview': { ko: '미리보기:', en: 'Preview:' },
  'modal.jamo.confirm': { ko: '가져오기', en: 'Import' },
  'modal.export.title': { ko: '내보내기', en: 'Export' },
  'modal.export.downloadSvg': { ko: 'SVG 다운로드', en: 'Download SVG' },
  'modal.export.downloadImage': { ko: '이미지 다운로드', en: 'Download Image' },
  'modal.export.qrCode': { ko: 'QR 코드', en: 'QR Code' },
  'modal.export.preview': { ko: '미리보기:', en: 'Preview:' },
  'export.success.svg': { ko: 'SVG 파일이 다운로드되었습니다', en: 'SVG file downloaded' },
  'export.success.image': { ko: '이미지가 다운로드되었습니다', en: 'Image downloaded' },
  'export.error.svg': { ko: 'SVG 내보내기 실패', en: 'Failed to export SVG' },
  'export.error.image': { ko: '이미지 내보내기 실패', en: 'Failed to export image' },
  'export.preview.error': { ko: '미리보기 로드 실패', en: 'Failed to load preview' },
  'export.qr.dev': { ko: 'QR 코드는 현재 사용할 수 없습니다. 로컬 기기에서 다운로드하세요.', en: 'QR code is not currently available. Download in local device.' },
  'export.qr.notConfigured': { ko: 'Firebase가 설정되지 않았습니다. .env 파일에 Firebase 정보를 추가하세요.', en: 'Firebase is not configured. Please add Firebase credentials to .env file.' },
  'export.qr.placeholder': { ko: 'QR 코드 생성 중...', en: 'Generating QR code...' },
  'export.qr.initializing': { ko: 'Firebase 초기화 중...', en: 'Initializing Firebase...' },
  'export.qr.uploading': { ko: '이미지를 업로드하는 중...', en: 'Uploading image...' },
  'export.qr.success': { ko: 'QR 코드가 생성되었습니다!', en: 'QR code generated!' },
  'export.qr.error': { ko: 'QR 코드 생성 실패', en: 'Failed to generate QR code' },
  'export.qr.viewDownloadPage': { ko: '다운로드 페이지', en: 'Download Page' },
  'export.qr.viewLink': { ko: '직접 다운로드', en: 'Direct Download' },
  'export.qr.instruction': { ko: 'QR 코드를 스캔하여 다른 기기에서 이미지를 다운로드하세요', en: 'Scan QR code to download the image on another device' },
  'export.qr.complete': { ko: 'QR 코드 생성 완료', en: 'QR code generated successfully' },
};

type AttrConfig = {
  attr: string;
  selector: string;
  datasetKey: keyof DOMStringMap;
};

const attributeConfigs: AttrConfig[] = [
  { attr: 'title', selector: '[data-i18n-title]', datasetKey: 'i18nTitle' },
  { attr: 'placeholder', selector: '[data-i18n-placeholder]', datasetKey: 'i18nPlaceholder' },
  { attr: 'aria-label', selector: '[data-i18n-aria-label]', datasetKey: 'i18nAriaLabel' },
  { attr: 'alt', selector: '[data-i18n-alt]', datasetKey: 'i18nAlt' },
];

const toolNameKeyMap: Record<string, string> = {
  'Guided Edit': 'agent.tool.guidedEdit',
  'Smart Propagation': 'agent.tool.smartPropagation',
  'Coming Soon': 'agent.tool.placeholderAgent',
};

const toolDescriptionKeyMap: Record<string, string> = {
  'guided-edit': 'agent.tool.guidedEdit.description',
  'smart-propagation': 'agent.tool.smartPropagation.description',
  'placeholder-agent': 'agent.tool.placeholderAgent.description',
};

let currentLanguage: Language = 'ko';

export const detectLanguage = (): Language => (window.location.pathname.startsWith('/en') ? 'en' : 'ko');

export const getCurrentLanguage = (): Language => currentLanguage;

export const initI18n = (language?: Language): Language => {
  currentLanguage = language ?? detectLanguage();
  applyTranslations();
  document.documentElement.lang = currentLanguage;
  return currentLanguage;
};

const applyTranslationsInternal = (language: Language): void => {
  if (typeof document === 'undefined') return;

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (!key) return;
    const text = translate(key, undefined, language);
    if (text) {
      element.textContent = text;
    }
  });

  attributeConfigs.forEach(({ attr, selector, datasetKey }) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      const key = element.dataset[datasetKey];
      if (!key) return;
      const text = translate(key, undefined, language);
      if (text) {
        element.setAttribute(attr, text);
      }
    });
  });

  // Update logo image based on language
  const logoElement = document.querySelector<HTMLImageElement>('[data-i18n-logo]');
  if (logoElement) {
    const logoSrc = language === 'en' ? '/hangulo_text_en.png' : '/hangulo_text_kr.png';
    logoElement.src = logoSrc;
  }

  // Update export button image based on language
  const exportElement = document.querySelector<HTMLImageElement>('[data-i18n-export]');
  if (exportElement) {
    const exportSrc = language === 'en' ? '/label-export-en.png' : '/label-export.png';
    exportElement.src = exportSrc;
  }
};

const applyTranslations = (): void => {
  applyTranslationsInternal(currentLanguage);
};

export const refreshTranslations = (): void => {
  applyTranslations();
};

export const translate = (
  key: string,
  params: Record<string, string> = {},
  language: Language = currentLanguage
): string => {
  const entry = translations[key];
  if (!entry) {
    console.warn(`[i18n] Missing translation key: ${key}`);
    return key;
  }

  const fallback = entry.en ?? key;
  let text = entry[language] ?? fallback;

  Object.entries(params).forEach(([paramKey, value]) => {
    const pattern = new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g');
    text = text.replace(pattern, value);
  });

  return text;
};

export const translateToolName = (name: string): string => {
  const key = toolNameKeyMap[name];
  if (!key) return name;
  return translate(key);
};

export const translateToolDescription = (toolId: string, fallback: string): string => {
  const key = toolDescriptionKeyMap[toolId];
  if (!key) return fallback;
  return translate(key);
};

