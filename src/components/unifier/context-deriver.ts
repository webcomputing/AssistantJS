import { injectable, inject, multiInject, optional } from "inversify";

import { log } from "../../setup";
import { featureIsAvailable } from "./feature-checker";
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
    const extractor = await this.findExtractor(context);

    if (extractor !== null) {
      const extractionResult = await extractor.extract(context);
      const logableExtractionResult = this.prepareExtractionResultForLogging(extractionResult);

      log("Resolved platform context = %o", logableExtractionResult);
      return [extractionResult, "core:unifier:current-extraction"];
    } else {
      return undefined;
    }
  }

  async findExtractor(context: RequestContext): Promise<RequestConversationExtractor | null> {
    let isRunable = (await Promise.all(this.extractors.map(extensionPoint => extensionPoint.fits(context))));
    let runnableExtensions = this.extractors.filter((extractor, index) => isRunable[index]);
    
    runnableExtensions = await this.selectExtractorsWithMostOptionalExtractions(runnableExtensions, context);
    if (runnableExtensions.length > 1) throw new Error("Multiple extractors fit to this request. "+ 
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
    return featureIsAvailable(extraction, feature);
  }

  /** Filters sensitive values, making the extraction result logable */
  private prepareExtractionResultForLogging(extraction: MinimalRequestExtraction): MinimalRequestExtraction {
    /** List of entity names to filter */
    const entityNamesToFilter = ["pin", "password", "secure"];

    /** "filtered" String */
    const filteredPlaceholder = "**filtered**";

    // Filter tokens
    let filtered = Object.assign({}, extraction, {
      "component": filteredPlaceholder,
      "oAuthToken": filteredPlaceholder,
      "temporalAuthToken": filteredPlaceholder
    });

    // Filter entities
    if (typeof filtered.entities !== "undefined") {
      Object.keys(filtered.entities).forEach(key => (filtered.entities as object)[key] = filteredPlaceholder);
    }

    return filtered;
  }
}