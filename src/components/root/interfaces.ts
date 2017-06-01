export const componentInterfaces = {
  "requestHandler": Symbol("request-handler")
};

export interface RequestContext {
  method: string;
  path: string;
  body: string;
  headers: { [name: string]: string }
  responseCallback: ResponseCallback;
}

export interface ResponseCallback {
  (body: string, headers?: { [name: string]: string | string[] });
}