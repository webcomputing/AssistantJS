import { RequestContext } from "../../../../src/components/root/public-interfaces";
import { extraction } from "../unifier/extraction";

// tslint:disable-next-line:no-empty
const dummyCallback = () => {};
export function createContext(method = "POST", path = "/fitting_path", body = extraction, headers = {}, responseCallback = dummyCallback): RequestContext {
  return {
    id: "mock-fixed-request-id",
    method,
    path,
    body,
    headers,
    responseCallback,
  };
}

export const context = createContext();
