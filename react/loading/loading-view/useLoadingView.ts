import {
  FetchStatus,
  MutationStatus,
  QueryStatus,
} from "@tanstack/react-query";
import React, { useCallback } from "react";
import { SetRequired } from "type-fest";
// import { errorToMessage } from "../utils/error-utils";

let renderDefaultErrorComponent: (params: {
  errorTitle?: string;
  defaultErrorMessage: string;
}) => React.ReactNode = () => null;

let renderDefaultLoadingComponent: (params: {
  className?: string;
  loadingText?: string;
  center?: boolean;
}) => React.ReactNode = () => null;

export const initializeLoadingViewUI = (options: {
  renderDefaultLoadingComponent: typeof renderDefaultLoadingComponent;
  renderDefaultErrorComponent: typeof renderDefaultErrorComponent;
}) => {
  renderDefaultLoadingComponent = options.renderDefaultLoadingComponent;
  renderDefaultErrorComponent = options.renderDefaultErrorComponent;
};

export type LoadingViewTask = {
  status?: MutationStatus | QueryStatus;
  fetchStatus?: FetchStatus;
  isLoading?: boolean;
  isPending?: boolean;
  error?: unknown;
  isRefetchError?: boolean;
  refetch?: () => void;
};

type ErrorTask = SetRequired<
  Pick<LoadingViewTask, "error" | "refetch">,
  "error"
>;

type LoadingProps = {
  /** Array of loading tasks, false values are ignored */
  tasks: (LoadingViewTask | false)[];
  /**
   * Whether to show loading state when tasks are idle
   * @default true
   */
  isIdleTaskTreatedAsLoading?: boolean;
  /** Class name for the loading view */
  className?: string;
  /** Text to display during loading */
  loadingText?: string;
  /**
   * Whether to center the loading/error content\
   * (When `true`, adds `"flex w-full items-center justify-center"` to `className)
   * @default true // (if className is provided defaults to false)
   */
  center?: boolean;
  /** Whether to ignore error states completely */
  ignoreErrors?: boolean;
  /** Title for the error when error is rendered */
  errorTitle?: string;
  /**
   * Function to transform/filter errors before rendering
   * Can be used for example:
   *   - For modifying the error
   *   - For ignoring specific errors by returning undefined
   */
  transformError?: (error: unknown) => unknown;
  /** Custom error rendering. Returning "undefined" renders the original error message. */
  renderErrors?: (params: {
    errorTitle?: string;
    errorTasks: ErrorTask[];
    defaultErrorMessage: string;
    renderDefault: () => React.ReactNode;
  }) => React.ReactNode;
  /** @default false */
  /** Whether to show errors on refetch failures (for example when react query refetches data in background and the refetch fails) */
  showErrorOnRefetchFailure?: boolean;
  /** @default `true` when size is "large" or "errorRenderMode" is "screen" */
  // showRetryButton?: boolean;
  renderLoading?: () => React.ReactNode;
};

/**
 * A React hook that manages loading and error states for multiple asynchronous tasks.
 *
 * This hook consolidates the loading and error states of multiple tasks (like API calls)
 * and returns appropriate components to render based on the current state. It handles:
 * - Loading states (when tasks are pending or loading)
 * - Error states (when tasks have failed)
 * - Idle states (when tasks are in idle state)
 *
 * @returns Object containing rendering components and state flags, or undefined if no loading/error state is present.
 *
 * @example
 * ```tsx
 * const loadingView = useLoadingView({
 *   tasks: [fooQuery, barQuery],
 *   loadingText: "Loading data...",
 *   errorTitle: "Failed to load"
 * });
 *
 * if (loadingView?.component) return loadingView.component;
 * return <YourContent />;
 * ```
 */
const useLoadingView = (
  options: LoadingProps
):
  | {
      /**
       * Component to render in most cases. Is the loading or error component depending on the state.
       * Use other properties to access the loading or error component / state directly for more control.
       */
      component?: React.ReactNode;
      loadingComponent?: React.ReactNode;
      errorComponent?: React.ReactNode;
      isLoading?: boolean;
      isError?: boolean;
    }
  | undefined => {
  const {
    tasks: tasks,
    loadingText,
    isIdleTaskTreatedAsLoading = true,
    className,
    center = !className,
    ignoreErrors,
    errorTitle,
    transformError,
    renderErrors,
    showErrorOnRefetchFailure,
    renderLoading,
    // ...restProps
  } = options;
  const getIsTaskIdle = useCallback(
    (task?: LoadingViewTask) =>
      task &&
      (task.status === "idle" ||
        (task.fetchStatus === "idle" && task.status === "pending")),
    []
  );
  const isTaskLoading = !!tasks.find(
    (t) =>
      t &&
      (t.isLoading || t.status === "pending") &&
      (isIdleTaskTreatedAsLoading || !getIsTaskIdle(t))
  );

  // Errors
  let errorTasks: ErrorTask[] = [];
  if (!ignoreErrors) {
    errorTasks = tasks.filter((t) => {
      if (!t || t.isLoading || t.isPending) return false;
      return t.error && (showErrorOnRefetchFailure || !t.isRefetchError);
    }) as ErrorTask[];
    if (transformError)
      errorTasks = errorTasks
        .map((t) => {
          const error = transformError(t.error);
          if (error) return { ...t, error };
        })
        .filter((t) => t) as ErrorTask[];
  }

  if (errorTasks.length > 0) {
    const errorMessagesSet = new Set<string>();
    errorTasks.forEach(({ error }) => {
      // errorMessagesSet.add(errorToMessage(error) || "");
      errorMessagesSet.add((error as any)?.message || "");
    });
    const uniqueErrorMessages = Array.from(errorMessagesSet);
    const defaultErrorMessage = uniqueErrorMessages.join("\n");

    // const retryFunctions = errorTasks
    //   .map(({ error, refetch }) => {
    //     if (!refetch) return;
    //     if (isApiError(error) && !isRetryableApiError(error)) return; // Skip retry functions of non retryable api errors
    //     return refetch;
    //   })
    //   .filter((r) => r);

    // const isRetryButtonShown =
    //   !!retryFunctions.length && restProps.showRetryButton;
    // const retry =
    //   isRetryButtonShown &&
    //   (() => retryFunctions.forEach((retry) => retry?.()));

    const errorComponent = renderErrors
      ? renderErrors({
          errorTitle,
          errorTasks,
          defaultErrorMessage,
          renderDefault: () =>
            renderDefaultErrorComponent({ errorTitle, defaultErrorMessage }),
        })
      : renderDefaultErrorComponent({ errorTitle, defaultErrorMessage });
    return {
      component: errorComponent,
      errorComponent,
      isError: true,
    };
  }

  // Loading
  if (isTaskLoading) {
    const loadingComponent = renderLoading
      ? renderLoading()
      : renderDefaultLoadingComponent({ center, className, loadingText });
    return {
      component: loadingComponent,
      loadingComponent,
      isLoading: !!loadingComponent,
    };
  }
};

export default useLoadingView;
