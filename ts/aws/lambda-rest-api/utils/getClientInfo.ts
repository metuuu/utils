import getRequestEvent from "./getRequestEvent";

/** Parses client info from user agent header. */
const getClientInfo = () => {
  const event = getRequestEvent();

  let type: "web" | "mobile" = "web";
  let version: string | undefined;

  const userAgent = event.requestContext.identity.userAgent;

  if (userAgent?.startsWith("xxx-mobile-app/")) {
    type = "mobile";
    version = userAgent.split(" ")[0].split("/")[1];
  }

  return { type, version };
};

export default getClientInfo;
