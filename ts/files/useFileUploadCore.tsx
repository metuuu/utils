import axios, { AxiosProgressEvent, CancelTokenSource } from "axios";
import imageCompression, { Options } from "browser-image-compression";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type FileUploadCoreItem = {
  file: File;
  url?: string;
  fields?: Record<string, string>;
};

export type UseFileUploadCoreOptions = {
  imageCompression?: {
    isEnabled?: boolean;
  } & Pick<Options, "maxSizeMB" | "maxWidthOrHeight">;
};

export type UseFileUploadCoreProps = {
  uploads: FileUploadCoreItem[];
  options?: UseFileUploadCoreOptions;
};

export type FileUploadState = {
  progress: number;
  isPreparing: boolean;
  isUploaded: boolean;
  error: unknown;
};

/**
 * Low-level hook for uploading multiple files to S3 with signed URLs.
 * This hook handles the actual upload logic, including optional image compression
 * and progress tracking, but does not manage UI or 2-phase upload flow.
 *
 * @param props Configuration including the files to upload and compression options.
 * @returns Upload states and control functions (retry, cancel).
 */
const useFileUploadCore = (props?: UseFileUploadCoreProps) => {
  const [statesMap, setStatesMap] = useState<Record<string, FileUploadState>>(
    {},
  );
  const cancelSourcesRef = useRef<Record<string, CancelTokenSource | null>>({});
  const handledSignaturesRef = useRef<Set<string>>(new Set());
  const uploadBatchIdRef = useRef(0);

  const { uploads, options } = props || {};

  const getItemSignature = useCallback((item: FileUploadCoreItem) => {
    const { file, url } = item;
    return `${url}|${file.name}|${file.size}|${file.lastModified}|${file.type}`;
  }, []);

  const uploadsSignature = useMemo(() => {
    if (!uploads || uploads.length === 0) return null;
    return uploads.map(getItemSignature).join("||");
  }, [uploads, getItemSignature]);

  const cancelAllUploads = useCallback((message: string) => {
    Object.values(cancelSourcesRef.current).forEach((source) =>
      source?.cancel(message),
    );
  }, []);

  const updateState = useCallback(
    (signature: string, partialState: Partial<FileUploadState>) => {
      setStatesMap((prev) => {
        const currentState = prev[signature] || {
          progress: 0,
          isPreparing: true, // Default to true while we don't have state yet
          isUploaded: false,
          error: null,
        };
        return {
          ...prev,
          [signature]: { ...currentState, ...partialState },
        };
      });
    },
    [],
  );

  const uploadFile = useCallback(
    async (item: FileUploadCoreItem, batchId = uploadBatchIdRef.current) => {
      const signature = getItemSignature(item);
      handledSignaturesRef.current.add(signature);
      if (batchId !== uploadBatchIdRef.current) return;
      const { file, url } = item;

      // Reset state for this item
      updateState(signature, {
        progress: 0,
        isUploaded: false,
        error: null,
        isPreparing: true, // Mark as preparing by default
      });

      // Cancel existing request for this item if any
      cancelSourcesRef.current[signature]?.cancel("New upload started");

      if (!url) {
        return;
      }

      const cancelSource = axios.CancelToken.source();
      cancelSourcesRef.current[signature] = cancelSource;

      let f = file;

      // Compression
      const { isEnabled: isImageCompressionEnabled = true } =
        options?.imageCompression || {};
      if (isImageCompressionEnabled && f.type.includes("image")) {
        const { maxSizeMB = 0.8, maxWidthOrHeight = 1920 } =
          options?.imageCompression || {};
        try {
          f = await imageCompression(file, {
            useWebWorker: true,
            preserveExif: false,
            maxWidthOrHeight,
            maxSizeMB,
          });
        } catch (error) {
          console.error(`Failed to compress image file "${file.name}"`, error);
          // Continue with original file
        } finally {
          if (batchId !== uploadBatchIdRef.current) return;
        }
      }

      // Finish preparing before actual upload starts
      updateState(signature, { isPreparing: false });

      try {
        await axios.put(url, f, {
          headers: { "Content-Type": f.type },
          cancelToken: cancelSource.token,
          onUploadProgress: (e: AxiosProgressEvent) => {
            if (batchId !== uploadBatchIdRef.current) return;
            const progress = e.total ? e.loaded / e.total : 0;
            updateState(signature, { progress });
          },
        });
        if (batchId !== uploadBatchIdRef.current) return;
        updateState(signature, { isUploaded: true, progress: 1 });
      } catch (error) {
        if (batchId !== uploadBatchIdRef.current) return;
        if (axios.isCancel(error)) {
          console.debug("Upload cancelled", url);
        } else {
          updateState(signature, { error, isPreparing: false });
        }
      } finally {
        if (cancelSourcesRef.current[signature] === cancelSource) {
          cancelSourcesRef.current[signature] = null;
        }
      }
    },
    [getItemSignature, options?.imageCompression, updateState],
  );

  const uploadAll = useCallback(() => {
    if (!uploads) return;
    const batchId = uploadBatchIdRef.current;
    uploads.forEach((item) => {
      void uploadFile(item, batchId);
    });
  }, [uploads, uploadFile]);

  // Initialize states and auto-start uploads only when content changes.
  useEffect(() => {
    if (!uploads || uploads.length === 0) {
      cancelAllUploads("Uploads cleared");
      uploadBatchIdRef.current += 1;
      setStatesMap({});
      cancelSourcesRef.current = {};
      handledSignaturesRef.current.clear();
      return;
    }

    const currentSignatures = uploads.map(getItemSignature);
    const batchId = uploadBatchIdRef.current;

    // 1. Identify and cancel/remove items that are no longer present
    const existingSignatures = Array.from(handledSignaturesRef.current);
    const removedSignatures = existingSignatures.filter(
      (sig) => !currentSignatures.includes(sig),
    );

    if (removedSignatures.length > 0) {
      removedSignatures.forEach((sig) => {
        cancelSourcesRef.current[sig]?.cancel("Item removed");
        delete cancelSourcesRef.current[sig];
        handledSignaturesRef.current.delete(sig);
      });

      setStatesMap((prev) => {
        const next = { ...prev };
        removedSignatures.forEach((sig) => delete next[sig]);
        return next;
      });
    }

    // 2. Identify new items and start their upload
    uploads.forEach((item) => {
      const sig = getItemSignature(item);
      if (!handledSignaturesRef.current.has(sig)) {
        handledSignaturesRef.current.add(sig);
        void uploadFile(item, batchId);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadsSignature]);

  // Derive states array from uploads and statesMap
  const states = useMemo(() => {
    return (uploads || []).map((item) => {
      const sig = getItemSignature(item);
      return (
        statesMap[sig] || {
          progress: 0,
          isPreparing: true, // Default to true while we don't have state yet
          isUploaded: false,
          error: null,
        }
      );
    });
  }, [uploads, statesMap, getItemSignature]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAllUploads("Component unmounted");
    };
  }, [cancelAllUploads]);

  const totalProgress = useMemo(() => {
    if (states.length === 0) return 0;
    const sum = states.reduce((acc, s) => acc + s.progress, 0);
    return sum / states.length;
  }, [states]);

  const isAllUploaded = useMemo(
    () => states.length > 0 && states.every((s) => s.isUploaded),
    [states],
  );

  const isAnyError = useMemo(() => states.some((s) => s.error), [states]);

  const isPreparingAny = useMemo(
    () => states.some((s) => s.isPreparing),
    [states],
  );

  const retry = useCallback(
    (index?: number) => {
      if (index !== undefined) {
        if (uploads?.[index]) {
          void uploadFile(uploads[index]);
        }
      } else {
        uploadAll();
      }
    },
    [uploads, uploadFile, uploadAll],
  );

  const cancel = useCallback(
    (index?: number) => {
      if (index !== undefined) {
        if (uploads?.[index]) {
          const sig = getItemSignature(uploads[index]);
          cancelSourcesRef.current[sig]?.cancel("User cancelled");
        }
      } else {
        Object.values(cancelSourcesRef.current).forEach((source) =>
          source?.cancel("User cancelled"),
        );
      }
    },
    [uploads, getItemSignature],
  );

  return useMemo(
    () => ({
      states,
      totalProgress,
      isAllUploaded,
      isAnyError,
      isPreparingAny,
      retry,
      cancel,
    }),
    [
      states,
      totalProgress,
      isAllUploaded,
      isAnyError,
      isPreparingAny,
      retry,
      cancel,
    ],
  );
};

export default useFileUploadCore;
