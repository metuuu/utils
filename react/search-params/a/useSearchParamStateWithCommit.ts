import { useCallback, useState } from 'react'
import { useEffectOnce } from 'react-use'
import useSearchParams from './useSearchParams'

/**
 * Works like regular useState, but provides a third commitToSearchParams function
 * that manually stores the current state value to URL search parameters.
 */
const useSearchParamStateWithCommit = <S extends string>(props: {
  name: string
  defaultValue?: S
  /** If the existing value in url search params should be initially overwritten with the default value. */
  overwriteExistingWithDefault?: boolean
  /** If undefined values should be converted to the default value when committing. If false, undefined values will show default value in search params. */
  convertUndefinedToDefault?: boolean
}) => {
  const {
    name,
    defaultValue,
    overwriteExistingWithDefault,
    convertUndefinedToDefault = true,
  } = props
  const searchParams = useSearchParams()

  const [state, setState] = useState<S | undefined>(
    overwriteExistingWithDefault ? defaultValue : (searchParams.values[name] as S) || defaultValue,
  )

  useEffectOnce(() => {
    if (overwriteExistingWithDefault && searchParams.values[name] !== defaultValue)
      searchParams.set(name, defaultValue)
    if (!convertUndefinedToDefault && defaultValue && searchParams.values[name] === undefined)
      searchParams.set(name, defaultValue)
  })

  const commitToSearchParams = useCallback(() => {
    if (state === undefined) {
      if (convertUndefinedToDefault && defaultValue) {
        searchParams.remove(name)
      } else {
        searchParams.remove(name)
      }
      return
    }

    if (state === defaultValue) {
      if (convertUndefinedToDefault) {
        searchParams.remove(name)
      } else {
        searchParams.set(name, state)
      }
    } else {
      searchParams.set(name, state)
    }
  }, [state, searchParams.set, searchParams.remove, convertUndefinedToDefault, defaultValue, name])

  return [state, setState, commitToSearchParams] as [
    S | undefined,
    React.Dispatch<React.SetStateAction<S | undefined>>,
    () => void,
  ]
}

export default useSearchParamStateWithCommit
