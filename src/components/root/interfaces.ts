export const componentInterfaces = {
  "contextDeriver": Symbol("request-handler"),
  "afterContextExtension": Symbol("after-context-extension")
};

export interface RequestContext {
  method: string;
  path: string;
  body: any;
  headers: { [name: string]: string }
  responseCallback: ResponseCallback;
}

export interface ResponseCallback {
  (body: string, headers?: { [name: string]: string | string[] }, statusCode?: number);
}

export interface ContextDeriver {
  derive(context: RequestContext): Promise<[any, string]> | Promise<undefined>;
}