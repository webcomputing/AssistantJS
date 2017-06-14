import { injectable, inject, multiInject, optional } from "inversify";

import { log } from "../../setup";
import { RequestContext, ContextDeriver as ContextDeriverI } from "../root/interfaces";
import { componentInterfaces, RequestConversationExtractor, OptionalExtractions, MinimalRequestExtraction } from "./interfaces";

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
    
    runnableExtensions = await this.selectExtractorsWithMostOptionalExtractions(runnableExtensions, context);
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

  /** Returns list of extractors which implement most of all available optional extractor interfaces */
  async selectExtractorsWithMostOptionalExtractions(extractors: RequestConversationExtractor[], context: RequestContext): Promise<RequestConversationExtractor[]> {
    if (extractors.length <= 1) return extractors; // Performance reasons

    // Build all extractions
    let extractions = await Promise.all(extractors.map(e => e.extract(context)));

    // Count supported features per extractor / extraction
    let featureSupportings = extractions.map(e => {
      return Object.keys(OptionalExtractions.FeatureChecker).reduce((prev, curr) => {
        return this.extractorSupportsFeature(e, OptionalExtractions.FeatureChecker[curr]) ? prev + 1 : prev;
      }, 0);
    });

    let maximumFeatureSupport = Math.max(...featureSupportings);
    return extractors.filter((extractor, index) => featureSupportings[index] === maximumFeatureSupport);
  }

  /** Returns true if given extractor supports given feature (see FeatureChecker) */
  private extractorSupportsFeature(extraction: MinimalRequestExtraction, feature: string[]) {
    let objectKeys = Object.keys(extraction);
    return feature.filter(f => objectKeys.indexOf(f) === -1).length === 0;
  }
}