import { useCallback, useState } from 'react'
import { useEffectOnce } from 'react-use'
import useSearchParams from './useSearchParams'

/**
 * Gets initial value from url search params to useState and then updates the state value changes to url search params.
 */
const useSearchParamState = <S extends string>(props: {
  name: string
  defaultValue?: S
  /** If the existing value in url search params should be initially overwritten with the default value. */
  overwriteExistingWithDefault?: boolean
  /** If undefined values should be converted to the default value. If false, undefined values will show default value in search params. */
  convertUndefinedToDefault?: boolean
}) => {
  const {
    name,
    defaultValue,
    overwriteExistingWithDefault,
    convertUndefinedToDefault = true,
  } = props
  const searchParams = useSearchParams()

  const [state, setState] = useState(
    overwriteExistingWithDefault ? defaultValue : searchParams.values[name] || defaultValue,
  )

  useEffectOnce(() => {
    if (overwriteExistingWithDefault && searchParams.values[name] !== defaultValue)
      searchParams.set(name, defaultValue)
    if (!convertUndefinedToDefault && defaultValue && searchParams.values[name] === undefined)
      searchParams.set(name, defaultValue)
  })

  const setStateAndSearchParams = useCallback(
    (val: S | undefined) => {
      if (val === undefined) {
        if (convertUndefinedToDefault && defaultValue) {
          searchParams.remove(name)
          setState(defaultValue)
        } else {
          searchParams.remove(name)
          setState(undefined)
        }
        return
      }

      if (val === defaultValue) {
        if (convertUndefinedToDefault) {
          searchParams.remove(name)
        } else {
          searchParams.set(name, val)
        }
      } else {
        searchParams.set(name, val)
      }
      setState(val)
    },
    [searchParams.set, searchParams.remove, convertUndefinedToDefault, defaultValue, name],
  )

  return [state, setStateAndSearchParams] as [S | undefined, (val?: S) => void]
}

export default useSearchParamState
