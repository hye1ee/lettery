import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getStorage, ref, uploadString, getDownloadURL, listAll, deleteObject, getMetadata, type FirebaseStorage } from 'firebase/storage';

/**
 * Firebase configuration placeholder
 * Replace these values with your Firebase project configuration
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

/**
 * Singleton class for Firebase operations
 */
class FirebaseService {
  private static instance: FirebaseService;
  private app: FirebaseApp | null = null;
  private storage: FirebaseStorage | null = null;
  private initialized: boolean = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Initialize Firebase
   */
  public init(): void {
    if (this.initialized) return;

    try {
      // Check if required config is present
      if (!firebaseConfig.apiKey || !firebaseConfig.storageBucket) {
        console.warn('Firebase configuration is incomplete');
        return;
      }

      this.app = initializeApp(firebaseConfig);
      this.storage = getStorage(this.app);
      this.initialized = true;
      console.log('Firebase initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      // Don't throw - allow the app to continue without Firebase
      this.initialized = false;
    }
  }

  /**
   * Check if Firebase is properly configured
   */
  public isConfigured(): boolean {
    return (
      !!firebaseConfig.apiKey &&
      !!firebaseConfig.storageBucket &&
      firebaseConfig.apiKey !== 'undefined' &&
      firebaseConfig.storageBucket !== 'undefined' &&
      this.initialized
    );
  }

  /**
   * List all files in exports folder with metadata
   */
  private async listExportFiles(): Promise<Array<{ ref: any; timeCreated: Date }>> {
    if (!this.storage) {
      throw new Error('Firebase Storage not initialized.');
    }

    const exportsRef = ref(this.storage, 'exports');
    const result = await listAll(exportsRef);

    const filesWithMetadata = await Promise.all(
      result.items.map(async (itemRef) => {
        const metadata = await getMetadata(itemRef);
        return {
          ref: itemRef,
          timeCreated: new Date(metadata.timeCreated)
        };
      })
    );

    // Sort by time created (oldest first)
    return filesWithMetadata.sort((a, b) => a.timeCreated.getTime() - b.timeCreated.getTime());
  }

  /**
   * Clean up old files if there are more than 10
   */
  private async cleanupOldFiles(): Promise<void> {
    try {
      const files = await this.listExportFiles();

      if (files.length > 10) {
        // Delete the oldest 3 files
        const filesToDelete = files.slice(0, 3);
        console.log(`Cleaning up ${filesToDelete.length} old files...`);

        await Promise.all(
          filesToDelete.map(file => deleteObject(file.ref))
        );

        console.log('Old files deleted successfully');
      }
    } catch (error) {
      console.error('Error cleaning up old files:', error);
      // Don't throw - allow upload to continue even if cleanup fails
    }
  }

  /**
   * Upload image to Firebase Storage
   * @param dataUrl - Base64 data URL of the image
   * @returns Object with file ID and download URL
   */
  public async uploadImage(dataUrl: string): Promise<{ fileId: string; downloadURL: string }> {
    if (!this.storage) {
      throw new Error('Firebase Storage not initialized. Call init() first.');
    }

    if (!this.isConfigured()) {
      throw new Error('Firebase is not properly configured. Please set up your Firebase credentials.');
    }

    try {
      // Clean up old files before uploading
      await this.cleanupOldFiles();

      // Create a unique file ID
      const timestamp = Date.now();
      const fileId = `${timestamp}_${Math.random().toString(36).substring(7)}`;
      const storageRef = ref(this.storage, `exports/${fileId}.png`);

      // Upload the base64 string
      await uploadString(storageRef, dataUrl, 'data_url');

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      console.log('Image uploaded successfully:', downloadURL);
      return { fileId, downloadURL };
    } catch (error) {
      console.error('Error uploading image to Firebase:', error);
      throw error;
    }
  }

  /**
   * Check if a file exists and get its download URL
   * @param fileId - The file ID to check
   * @returns Download URL if exists, null otherwise
   */
  public async getFileDownloadURL(fileId: string): Promise<string | null> {
    if (!this.storage) {
      throw new Error('Firebase Storage not initialized. Call init() first.');
    }

    try {
      const storageRef = ref(this.storage, `exports/${fileId}.png`);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error: any) {
      if (error.code === 'storage/object-not-found') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Initialize Firebase if not already initialized
   * @returns Promise that resolves when initialization is complete
   */
  public async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      this.init();
      // Give it a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}

export default FirebaseService;

