import React, { Children, PropsWithChildren } from "react";

/**
 * Can be used for example for rendering element wrapper view only if element is not empty
 */
export const checkIsReactNodeNonEmpty = (node?: React.ReactNode) => {
  return !!React.Children.toArray(node).filter((child) => child != null).length;
};

/** Renders the passed element if is non-empty component */
export const renderIfNodeNonEmpty = (node?: React.ReactNode) => {
  if (checkIsReactNodeNonEmpty(node)) return node;
};

/** Renders the passed element if it has non-empty children */
export const renderIfChildrenNonEmpty = (
  element: React.ReactElement<PropsWithChildren>
) => {
  const areChildrenNonEmpty = !!Children.toArray(element.props.children).find(
    checkIsReactNodeNonEmpty
  );
  if (areChildrenNonEmpty) return element;
};
