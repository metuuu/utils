# EXAMPLE CODE OF HOW TO INITIALIZE THE LOADING VIEW UI

```ts
initializeLoadingViewUI({
  renderDefaultErrorComponent: ({ errorTitle, defaultErrorMessage }) => (
    <ErrorCard title={errorTitle} error={defaultErrorMessage} />
  ),
  renderDefaultLoadingComponent: ({ className, center, loadingText }) => (
    <div
      className={twMerge(
        clsx({ "flex w-full items-center justify-center": center }),
        className
      )}
    >
      {!!loadingText && (
        <Text className="mr-3 text-gray-500">{loadingText}</Text>
      )}
      <LoadingSpinner />
    </div>
  ),
});
```
