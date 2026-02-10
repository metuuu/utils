import {
  UploadDataWithPathInput,
  UploadDataWithPathOutput,
} from "aws-amplify/storage";
import imageCompression, { Options } from "browser-image-compression";
import { useCallback, useEffect, useMemo, useState } from "react";
import useAmplifyStoragePutRequest from "./useAmplifyStorageRequest";
import useAxiosRequest from "./useAxiosRequest";

/** Received from create upload url endpoint */
type SignedFileUploadFields = {
  url: string;
  fields: Record<string, string>;
};

export type UseFileUploadProps = {
  file: File;
  axiosDirectUpload?: SignedFileUploadFields;
  amplifyStoragePut?: {
    path: UploadDataWithPathInput["path"];
    options?: UploadDataWithPathInput["options"];
    /** Optional async task that has to be done for file upload to complete after it has been uploaded to amplify storage. This is currently required for Planyo file upload. */
    finalizeAsyncTask?: (
      uploadResult: Awaited<UploadDataWithPathOutput["result"]>,
    ) => Promise<any>;
  };
  options?: UseFileUploadOptions;
};

export type UseFileUploadOptions = {
  imageCompression?: {
    isEnabled?: boolean;
  } & Pick<Options, "maxSizeMB" | "maxWidthOrHeight">;
};

/**
 * Used for uploading images to S3 with signed url and fields.
 * Image file compression is enabled by default.
 * This hook can be used only for uploading a single file.
 * Upload is cancelled on unmount and upload can also be cancelled by setting the props parameter to undefined.
 * After upload has been succeeded, upload can't trigger again
 */
const useFileUpload = (props?: UseFileUploadProps) => {
  const [progress, setProgress] = useState(0);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  // `undefined` if no finalize task to do.
  const [isFinalizeTaskCompleted, setIsFinalizeTaskCompleted] =
    useState<boolean>();

  const amplifyStoragePutRequest = useAmplifyStoragePutRequest();
  const axiosPutRequest = useAxiosRequest();

  const { file, options } = props || {};

  const [finalizeError, setFinalizeError] = useState<any>();
  const [finalizeResponseData, setFinalizeResponseData] = useState<any>();
  const {
    error: uploadError,
    isSuccess,
    cancel,
    isIdle,
  } = "axiosDirectUpload" in (props || {})
    ? axiosPutRequest
    : amplifyStoragePutRequest;

  const upload = useCallback(async () => {
    if (!props) return;
    if (isSuccess) {
      // Finalize task
      if (
        props.amplifyStoragePut?.finalizeAsyncTask &&
        isFinalizeTaskCompleted === false
      ) {
        if (finalizeError) setFinalizeError(undefined);
        props.amplifyStoragePut
          .finalizeAsyncTask(amplifyStoragePutRequest.data!)
          .then((data) => {
            setFinalizeResponseData(data);
            setIsFinalizeTaskCompleted(true);
          })
          .catch((err) => setFinalizeError(err));
      }
      return;
    }
    setProgress(0);
    setIsFinalizeTaskCompleted(
      props.amplifyStoragePut?.finalizeAsyncTask ? false : undefined,
    );

    if (!file) return;
    if ("axiosDirectUpload" in props) {
      if (!props.axiosDirectUpload) return;
    }
    if ("amplifyStoragePut" in props) {
      if (!props.amplifyStoragePut) return;
      if (props.amplifyStoragePut.finalizeAsyncTask) {
        setIsFinalizeTaskCompleted(false);
      }
    }

    cancel();

    let f = file;

    // Compress image files when compression is enabled
    setIsCompressingImage(true);
    const { isEnabled: isImageCompressionEnabled = true } =
      options?.imageCompression || {};
    if (isImageCompressionEnabled && f.type.includes("image")) {
      // TODO: Are these ok default compression settings? Is it possible to manually set output image quality. It seems that "initialQuality" options isn't that.
      // https://github.com/Donaldcwl/browser-image-compression/issues/154
      const { maxSizeMB = 0.75, maxWidthOrHeight = 1920 } =
        options?.imageCompression || {};
      f = await imageCompression(file, {
        useWebWorker: true,
        maxWidthOrHeight,
        maxSizeMB,
      })
        .catch((error) => {
          console.error(`Failed to compress image file "${file.name}"`, error);
          return file; // We upload the original file if error happens in file compression
        })
        .finally(() => {
          setIsCompressingImage(false);
        });
    }

    if ("amplifyStoragePut" in props) {
      amplifyStoragePutRequest.mutate({
        path: props.amplifyStoragePut!.path,
        data: f,
        options: {
          ...props.amplifyStoragePut!.options,
          onProgress: (e) => {
            if (!e.totalBytes) setProgress(0);
            else setProgress(e.transferredBytes / e.totalBytes);
          },
        },
      });
    }

    if ("axiosDirectUpload" in props) {
      // TODO: props.axiosDirectUpload?.fields
      axiosPutRequest.mutate({
        method: "put",
        url: props.axiosDirectUpload!.url,
        data: f,
        headers: { "Content-Type": f.type },
        onUploadProgress: (e) => {
          if (!e.total) setProgress(0);
          else setProgress(e.loaded / e.total);
        },
      });
    }

    // Cancel upload when upload function changes or on unmount
    return () => cancel();
  }, [file, isSuccess]);

  // We call upload automatically when
  useEffect(() => {
    if (uploadError || finalizeError) return;
    upload();
  }, [upload]);

  return useMemo(
    () => ({
      progress,
      isCompressingImage,
      isUploaded: isSuccess && isFinalizeTaskCompleted !== false,
      error: uploadError || finalizeError,
      finalizeResponseData,
      retry:
        !isCompressingImage &&
        ((!isSuccess && !isIdle && uploadError) || finalizeError)
          ? upload
          : undefined,
    }),
    [
      upload,
      progress,
      isSuccess,
      progress,
      uploadError,
      finalizeError,
      finalizeResponseData,
      isCompressingImage,
      isIdle,
      isFinalizeTaskCompleted,
    ],
  );
};

export default useFileUpload;
