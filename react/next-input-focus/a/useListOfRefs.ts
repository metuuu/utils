import { useCallback, useRef } from "react"

const useListOfRefs = <T>() => {
  const refs = useRef<T[]>([])

  const addRef = useCallback((ref: T | null, refIndex: number) => {
    if (!ref) refs.current.splice(refIndex, 1)
    else refs.current[refIndex] = ref!
  }, [])

  return { addRef, refs }
}

export default useListOfRefs
