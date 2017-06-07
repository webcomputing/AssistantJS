import { injectable, inject, multiInject, optional } from "inversify";

import { log } from "../../setup";
import { RequestContext, ContextDeriver as ContextDeriverI } from "../root/interfaces";
import { componentInterfaces, RequestConversationExtractor } from "./interfaces";

@injectable()
export class ContextDeriver implements ContextDeriverI {
  private extractors: RequestConversationExtractor[];

  constructor(
    @optional() @multiInject(componentInterfaces.requestProcessor) extractors: RequestConversationExtractor[] = []) {
    this.extractors = extractors;
  }

  async derive(context: RequestContext) {
    let extractor = await this.findExtractor(context);

    if (extractor !== null) {
      return [await extractor.extract(context), "core:unifier:current-extraction"];
    }
  }

  async findExtractor(context: RequestContext): Promise<RequestConversationExtractor | null> {
    let isRunable = (await Promise.all(this.extractors.map(extensionPoint => extensionPoint.fits(context))));
    let runnableExtensions = this.extractors.filter((extractor, index) => isRunable[index]);

    if (runnableExtensions.length > 1) throw new TypeError("Multiple extractors fit to this request. "+ 
      "Please check your registerend platforms for duplicate extractors.");
    if (runnableExtensions.length !== 1) {
      this.respondWithNoExtractor(context);
      return null;
    }
    if (typeof(runnableExtensions[0]) === "undefined") throw new TypeError("Single found extractor was undefined!");

    return runnableExtensions[0];
  } 

  respondWithNoExtractor(context: RequestContext) {
    log("None of the registered extractors respond to this request. You possibly need to install platforms. Sending 404.");
    context.responseCallback("", {}, 404);
  }
}