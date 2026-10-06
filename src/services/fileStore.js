/**
 * CarbonChain  -  IndexedDB File Store (`carbonchain-files`)
 * Per spec §7: Stores actual file bytes in IndexedDB.
 * Metadata and SHA-256 hash are recorded in submission and on ledger block FILES_FINGERPRINTED.
 */

const DB_NAME = "carbonchain-files";
const DB_VERSION = 1;
const STORE_NAME = "files";

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Computes SHA-256 hex string from an ArrayBuffer or Blob
 */
export async function computeSHA256(data) {
  let arrayBuffer;
  if (data instanceof Blob || data instanceof File) {
    arrayBuffer = await data.arrayBuffer();
  } else if (data instanceof ArrayBuffer) {
    arrayBuffer = data;
  } else {
    const encoder = new TextEncoder();
    arrayBuffer = encoder.encode(String(data));
  }

  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Resizes an image file if dimensions exceed maxSide (default 1600px),
 * converts to JPEG quality ~0.82 per spec §7.
 */
export async function resizeImageFile(file, maxSide = 1600, quality = 0.82) {
  return new Promise((resolve) => {
    // If not an image, return original
    if (!file.type.startsWith("image/")) {
      return resolve(file);
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width <= maxSide && height <= maxSide && file.type === "image/jpeg") {
        return resolve(file);
      }

      if (width > maxSide || height > maxSide) {
        if (width > height) {
          height = Math.round((height * maxSide) / width);
          width = maxSide;
        } else {
          width = Math.round((width * maxSide) / height);
          height = maxSide;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Saves a file to IndexedDB
 */
export async function saveFileRecord({ id, name, type, size, fileBlob, hash, category = "photo" }) {
  const db = await openDB();
  const fileId = id || `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const sha = hash || (await computeSHA256(fileBlob));

  const record = {
    id: fileId,
    name,
    type: fileBlob.type || type,
    size: fileBlob.size || size,
    sha256: sha,
    category, // "photo" or "document"
    blob: fileBlob,
    savedAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve({ ...record, blob: undefined }); // return metadata
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves a file from IndexedDB by id
 */
export async function getFileRecord(fileId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(fileId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Verifies if file bytes match a given SHA-256 fingerprint
 */
export async function verifyFileFingerprint(fileId, expectedHash) {
  const record = await getFileRecord(fileId);
  if (!record || !record.blob) return { match: false, found: false };
  const currentHash = await computeSHA256(record.blob);
  return {
    match: currentHash.toLowerCase() === expectedHash.toLowerCase(),
    found: true,
    currentHash,
    expectedHash,
  };
}

/**
 * Removes a file from IndexedDB
 */
export async function deleteFileRecord(fileId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(fileId);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * High-level helper: resizes image, computes SHA-256, generates data URL preview, and stores in IndexedDB
 */
export async function processAndStorePhoto(file) {
  const resized = await resizeImageFile(file, 1600, 0.82);
  const hash = await computeSHA256(resized);
  const dataUrl = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve("");
    reader.readAsDataURL(resized);
  });
  const record = await saveFileRecord({
    name: file.name,
    type: resized.type || "image/jpeg",
    size: resized.size,
    fileBlob: resized,
    hash,
    category: "photo",
  });
  return { ...record, dataUrl };
}

/**
 * High-level helper: computes SHA-256 and stores document in IndexedDB
 */
export async function processAndStoreDocument(file) {
  const hash = await computeSHA256(file);
  const record = await saveFileRecord({
    name: file.name,
    type: file.type || "application/pdf",
    size: file.size,
    fileBlob: file,
    hash,
    category: "document",
  });
  return record;
}

