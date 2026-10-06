/**
 * Encodes off-chain project metadata into a standard base64 JSON data URI.
 * Stored directly on-chain in metadataURI without requiring external databases.
 */
export function encodeMetadata({ description = "", proofUrl = "", imageUrl = "", sdgs = [] }) {
  try {
    const payload = {
      description: String(description || "").trim(),
      proofUrl: String(proofUrl || "").trim(),
      imageUrl: String(imageUrl || "").trim(),
      sdgs: Array.isArray(sdgs) ? sdgs : [],
      timestamp: Date.now(),
    };

    const jsonStr = JSON.stringify(payload);
    
    // UTF-8 safe base64 encoding
    const bytes = new TextEncoder().encode(jsonStr);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    return `data:application/json;base64,${base64}`;
  } catch (err) {
    console.warn("Failed to encode metadata:", err);
    return "";
  }
}

/**
 * Decodes metadataURI back into an object.
 * Handles data URIs, raw JSON, plain URLs, and malformed strings safely without throwing.
 */
export function decodeMetadata(uri) {
  const defaults = {
    description: "",
    proofUrl: "",
    imageUrl: "",
    sdgs: [13],
  };

  if (!uri || typeof uri !== "string") {
    return defaults;
  }

  const cleanUri = uri.trim();

  // If it's a data:application/json;base64,... URI
  if (cleanUri.startsWith("data:application/json;base64,")) {
    try {
      const base64Str = cleanUri.replace("data:application/json;base64,", "");
      const binary = atob(base64Str);
      const bytes = Uint8Array.from(binary, (m) => m.charCodeAt(0));
      const jsonStr = new TextDecoder().decode(bytes);
      const parsed = JSON.parse(jsonStr);

      return {
        description: parsed.description || "",
        proofUrl: parsed.proofUrl || "",
        imageUrl: parsed.imageUrl || "",
        sdgs: Array.isArray(parsed.sdgs) && parsed.sdgs.length > 0 ? parsed.sdgs : [13],
      };
    } catch (err) {
      console.warn("Could not parse base64 metadata URI:", err.message);
      return defaults;
    }
  }

  // If it's a direct JSON string
  if (cleanUri.startsWith("{") && cleanUri.endsWith("}")) {
    try {
      const parsed = JSON.parse(cleanUri);
      return {
        description: parsed.description || "",
        proofUrl: parsed.proofUrl || "",
        imageUrl: parsed.imageUrl || "",
        sdgs: Array.isArray(parsed.sdgs) ? parsed.sdgs : [13],
      };
    } catch {
      return defaults;
    }
  }

  // If it's a plain HTTP/HTTPS link to a proof doc
  if (cleanUri.startsWith("http://") || cleanUri.startsWith("https://")) {
    return {
      ...defaults,
      proofUrl: cleanUri,
    };
  }

  return defaults;
}
