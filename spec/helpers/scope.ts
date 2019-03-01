// tslint:disable-next-line:no-var-requires
require("reflect-metadata");
import { RequestContext } from "../../src/components/root/public-interfaces";
import { BasicAnswerTypes, BasicHandable, MinimalRequestExtraction } from "../../src/components/unifier/public-interfaces";
import { SpecHelper } from "../../src/spec-helper";
import { context } from "../support/mocks/root/request-context";
import { extraction } from "../support/mocks/unifier/extraction";
import { MockHandlerA as ResponseHandler } from "../support/mocks/unifier/response-handler/mock-handler-a";

/**
 * Creates request scope in container manually, without firing a request.
 * @param specSetup Return value of createSpecHelper()
 * @param minimalExtraction Extraction result to add to di container for scope opening.
 * You can pass null if you don't want to pass a result. If you don't pass anything, mocks/unifier/extraction will be used
 * @param requestContext Request context to add to di container for scope opening. If you don't pass one, mocks/root/request-context will be used
 */
export function createRequestScope(
  specSetup: SpecHelper,
  minimalExtraction: MinimalRequestExtraction | null = JSON.parse(JSON.stringify(extraction)),
  requestContext: RequestContext = context,
  responseHandler: new (...args: any[]) => BasicHandable<BasicAnswerTypes> = ResponseHandler
) {
  specSetup.createRequestScope(minimalExtraction, requestContext, responseHandler);
}
