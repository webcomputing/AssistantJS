export const componentInterfaces = {
  "contextDeriver": Symbol("request-handler"),
  "afterContextExtension": Symbol("after-context-extension"),
  "generator": Symbol("generator")
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

export interface GeneratorExtension {
  execute(buildPath: string): void;
}