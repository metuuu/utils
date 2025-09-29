import { useCallback, useMemo, useState } from "react";

export function useLoadingTasks(initializeTaskId?: string) {
  const [loadingTasks, setLoadingTasks] = useState<
    Map<string, (() => void) | undefined> | undefined
  >(initializeTaskId ? new Map([[initializeTaskId, undefined]]) : undefined);

  const addTask = useCallback(
    (task: string | { id: string; onReset?: () => void }) => {
      if (typeof task === "string")
        setLoadingTasks((prevTasks) => new Map(prevTasks).set(task, undefined));
      else
        setLoadingTasks((prevTasks) =>
          new Map(prevTasks).set(task.id, task.onReset)
        );
    },
    []
  );

  const completeTask = useCallback((taskId: string) => {
    setLoadingTasks((prevTasks) => {
      const updatedTasks = new Map(prevTasks);
      updatedTasks.delete(taskId);
      return updatedTasks;
    });
  }, []);

  const reset = useCallback(
    () =>
      setLoadingTasks((currentTasks) => {
        currentTasks?.forEach((onReset) => onReset?.());
        if (initializeTaskId) return new Map([[initializeTaskId, undefined]]);
        return undefined;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const setCompleted = useCallback(() => setLoadingTasks(new Map()), []);

  const isCompleted = useMemo(() => {
    if (!loadingTasks) return undefined;
    return loadingTasks.size === 0 ? true : false;
  }, [loadingTasks]);

  return useMemo(
    () => ({
      add: addTask,
      complete: completeTask,
      isCompleted,
      setCompleted,
      reset,
    }),
    [addTask, completeTask, setCompleted, isCompleted, reset]
  );
}

export const loadingTaskFromEvent = <
  // TEvent extends string,
  TEventEmitter extends {
    on: (event: string, handler: () => void) => void;
    off: (event: string, handler: () => void) => void;
  }
>({
  emitter,
  event = "load",
  loadingTasks,
}: {
  emitter: TEventEmitter;
  event?: string; // TEvent,
  loadingTasks: Pick<ReturnType<typeof useLoadingTasks>, "complete">;
}) => {
  const taskId = `${Date.now()}${event.toString()}${Math.random()}${Math.random()}`;
  const handler = () => loadingTasks.complete(taskId);
  emitter.on(event, handler);
  return { id: taskId, onReset: () => emitter.off(event, handler) };
};
