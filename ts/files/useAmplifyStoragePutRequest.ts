import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import {
  uploadData,
  UploadDataWithPathInput,
  UploadDataWithPathOutput,
} from "aws-amplify/storage";
import { useMemo, useRef } from "react";
import { errorToMessage } from "../utils/error-utils";

/**
 * Hook for doing Amplify Storage PUT requests one at a time.
 */
const useAmplifyStoragePutRequest = (
  props?: UseMutationOptions<
    Awaited<UploadDataWithPathOutput["result"]>,
    any,
    UploadDataWithPathInput
  >,
) => {
  const refCancelFunction = useRef<() => void>(() => {});

  const mutation = useMutation<
    Awaited<UploadDataWithPathOutput["result"]>,
    any,
    UploadDataWithPathInput
  >({
    ...props,

    mutationFn: async (
      uploadDataOptions,
    ): Promise<Awaited<UploadDataWithPathOutput["result"]>> => {
      // Request
      const request = uploadData(uploadDataOptions);

      // Cancel configuration
      refCancelFunction.current = () => request.cancel();

      return request.result.catch((err) => {
        console.debug(
          `Storage put failed for object with path "${uploadDataOptions.path}"`,
          errorToMessage(err),
        );
        throw err;
      });
    },
  });

  return useMemo(() => {
    return {
      ...mutation,
      cancel: () => refCancelFunction.current?.(),
    };
  }, [mutation]);
};

export default useAmplifyStoragePutRequest;
