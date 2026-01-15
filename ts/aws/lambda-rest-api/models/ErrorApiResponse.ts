import status from "http-status";

export interface InvalidParam {
  // name: string
  path: (string | number | symbol)[];
  /** Reason why validation failed */
  message: string;
  code?: string;
}

/** API Error response object (https://datatracker.ietf.org/doc/html/rfc9457) */
export interface ResponseError {
  /**
   * The "type" member is a JSON string containing a URI reference [URI] that identifies the problem type. Consumers MUST use the "type" URI (after resolution, if necessary) as the problem type's primary identifier.
   * When this member is not present, its value is assumed to be "about:blank".
   * If the type URI is a locator (e.g., those with an "http" or "https" scheme), dereferencing it SHOULD provide human-readable documentation for the problem type (e.g., using HTML [HTML5]). However, consumers SHOULD NOT automatically dereference the type URI, unless they do so when providing information to developers (e.g., when a debugging tool is in use).
   * When "type" contains a relative URI, it is resolved relative to the document's base URI, as per [URI], Section 5. However, using relative URIs can cause confusion, and they might not be handled correctly by all implementations.
   * For example, if the two resources "https://api.example.org/foo/bar/123" and "https://api.example.org/widget/456" both respond with a "type" equal to the relative URI reference "example-problem", when resolved they will identify different resources ("https://api.example.org/foo/bar/example-problem" and "https://api.example.org/widget/example-problem", respectively). As a result, it is RECOMMENDED that absolute URIs be used in "type" when possible and that when relative URIs are used, they include the full path (e.g., "/types/123").
   * The type URI is allowed to be a non-resolvable URI. For example, the tag URI scheme [TAG] can be used to uniquely identify problem types:
   * tag:example@example.org,2021-09-17:OutOfLuck
   * However, resolvable type URIs are encouraged by this specification because it might become desirable to resolve the URI in the future. For example, if an API designer used the URI above and later adopted a tool that resolves type URIs to discover information about the error, taking advantage of that capability would require switching to a resolvable URI, creating a new identity for the problem type and thus introducing a breaking change.
   */
  type?: string;
  /**
   * The "title" member is a JSON string containing a short, human-readable summary of the problem type.
   * It SHOULD NOT change from occurrence to occurrence of the problem, except for localization (e.g., using proactive content negotiation; see [HTTP], Section 12.1).
   * The "title" string is advisory and is included only for users who are unaware of and cannot discover the semantics of the type URI (e.g., during offline log analysis).
   */
  title?: string;
  /**
   * The "detail" member is a JSON string containing a human-readable explanation specific to this occurrence of the problem.
   * The "detail" string, if present, ought to focus on helping the client correct the problem, rather than giving debugging information.
   * Consumers SHOULD NOT parse the "detail" member for information; extensions are more suitable and less error-prone ways to obtain such information.
   */
  detail?: string;
  /**
   * The "instance" member is a JSON string containing a URI reference that identifies the specific occurrence of the problem.
   * When the "instance" URI is dereferenceable, the problem details object can be fetched from it. It might also return information about the problem occurrence in other formats through use of proactive content negotiation (see [HTTP], Section 12.5.1).
   * When the "instance" URI is not dereferenceable, it serves as a unique identifier for the problem occurrence that may be of significance to the server but is opaque to the client.
   * When "instance" contains a relative URI, it is resolved relative to the document's base URI, as per [URI], Section 5. However, using relative URIs can cause confusion, and they might not be handled correctly by all implementations.
   * For example, if the two resources "https://api.example.org/foo/bar/123" and "https://api.example.org/widget/456" both respond with an "instance" equal to the relative URI reference "example-instance", when resolved they will identify different resources ("https://api.example.org/foo/bar/example-instance" and "https://api.example.org/widget/example-instance", respectively). As a result, it is RECOMMENDED that absolute URIs be used in "instance" when possible, and that when relative URIs are used, they include the full path (e.g., "/instances/123").
   */
  instance?: string;
  /**
   * https://datatracker.ietf.org/doc/html/rfc9457#name-extension-members
   */
  invalidParams?: InvalidParam[];
}

/**
 * Used for returning API Error responses from param validation utils
 * @see utils/validateParameters
 */
export default class ErrorApiResponse extends Error {
  responseError: ResponseError;
  responseStatusCode: number;
  name: string;

  constructor(responseStatusCode: number, responseError: ResponseError = {}) {
    const msg = (status as any)[responseStatusCode] || "Unknown Error";
    const resErr = { ...responseError };
    if (!resErr.title) resErr.title = (status as any)[responseStatusCode];

    super(msg);
    this.responseError = resErr;
    this.responseStatusCode = responseStatusCode;
    this.name = this.constructor.name;
  }
}
