import { injectable, inject, multiInject, optional } from "inversify";
import { Component } from "inversify-components";

import { featureIsAvailable } from "./feature-checker";
import { injectionNames } from '../../injection-names';
import { RequestContext, ContextDeriver as ContextDeriverI, Logger } from "../root/public-interfaces";
import { RequestConversationExtractor, OptionalExtractions, MinimalRequestExtraction } from "./public-interfaces";
import { Configuration, componentInterfaces } from "./private-interfaces";

@injectable()
export class ContextDeriver implements ContextDeriverI {
  loggingWhitelist: Configuration.LogWhitelistSet;

  constructor(
    @optional() @multiInject(componentInterfaces.requestProcessor) private extractors: RequestConversationExtractor[] = [],
    @inject(injectionNames.logger) private logger: Logger,
    @inject("meta:component//core:unifier") componentMeta: Component<Configuration.Runtime>
  ) {
    this.loggingWhitelist = componentMeta.configuration.logExtractionWhitelist;
  }

  async derive(context: RequestContext): Promise<[any, string] | undefined> {
    const extractor = await this.findExtractor(context);

    if (extractor !== null) {
      const extractionResult = await extractor.extract(context);
      const logableExtractionResult = this.prepareExtractionResultForLogging(extractionResult);

      this.logger.info( { requestId: context.id, extraction: logableExtractionResult }, "Resolved current extraction by platform.");
      return [extractionResult, "core:unifier:current-extraction"];
    } else {
      return undefined;
    }
  }

  async findExtractor(context: RequestContext): Promise<RequestConversationExtractor | null> {
    const isRunable = (await Promise.all(this.extractors.map(extensionPoint => extensionPoint.fits(context))));
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
    this.logger.warn({ requestId: context.id }, "None of the registered extractors respond to this request. You possibly need to install platforms. Sending 404.");
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
  private extractorSupportsFeature<Feature extends MinimalRequestExtraction>(extraction: MinimalRequestExtraction, feature: string[]) {
    return featureIsAvailable<Feature>(extraction, feature);
  }

  /** Filters sensitive values, making the extraction result logable */
  private prepareExtractionResultForLogging(extraction: MinimalRequestExtraction): MinimalRequestExtraction {
    // Deep clone extraction object, just to be sure we don't change any values
    extraction = JSON.parse(JSON.stringify(extraction));

    /** "filtered" String */
    const filteredPlaceholder = "**filtered**";

    /** Sets all entries to "filteredPlaceholder" except the ones in the given whitelist */
    const filterSet = <T>(set: T, whitelist: Configuration.LogWhitelistSet): T => {
      // Get a merged set of all used object keys in whitelist. For example, if whitelist is ["a", {b: ["c"], d: ["e"]}, {f: "g"}], this would be {b: ["c"], d: ["e"], f: ["g"]}
      const mergedObject = whitelist.filter(entry => typeof(entry) === "object").reduce((prev, curr) => Object.assign(prev, curr), {});

      /** Check filtering for every key */
      Object.keys(set).forEach(extractionKey => {
        if (mergedObject.hasOwnProperty(extractionKey)) {
          // Is filtered by object key => call filterSet with sub-whitelist recursivly
          set[extractionKey] = filterSet(set[extractionKey], mergedObject[extractionKey]);
        } else if (whitelist.indexOf(extractionKey) === -1) {
          set[extractionKey] = filteredPlaceholder;
        }
      });

      return set;
    };

    return filterSet(extraction, this.loggingWhitelist);
  }
}