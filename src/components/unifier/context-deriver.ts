import { inject, injectable, multiInject, optional } from "inversify";
import { Component, getMetaInjectionName } from "inversify-components";

import { injectionNames } from "../../injection-names";
import { ContextDeriver as ContextDeriverI, Logger, RequestContext } from "../root/public-interfaces";
import { featureIsAvailable } from "./feature-checker";
import { componentInterfaces, Configuration } from "./private-interfaces";
import { MinimalRequestExtraction, OptionalExtractions, RequestExtractionModifier, RequestExtractor } from "./public-interfaces";

@injectable()
export class ContextDeriver implements ContextDeriverI {
  public loggingWhitelist: Configuration.LogWhitelistSet;

  constructor(
    @optional()
    @multiInject(componentInterfaces.requestProcessor)
    private extractors: RequestExtractor[] = [],
    @optional()
    @multiInject(componentInterfaces.requestModifier)
    private extractionModifiers: RequestExtractionModifier[] = [],
    @inject(injectionNames.logger) private logger: Logger,
    @inject(getMetaInjectionName("core:unifier")) private componentMeta: Component<Configuration.Runtime>
  ) {
    this.loggingWhitelist = componentMeta.configuration.logExtractionWhitelist;
  }

  public async derive(context: RequestContext): Promise<[any, string] | undefined> {
    const extractor = await this.findExtractor(context);

    if (extractor !== null) {
      let extractionResult = await extractor.extract(context);

      // change sessionId
      extractionResult = this.unifySession(extractionResult);

      // allow changing extractions from extension
      extractionResult = await this.changeExtraction(extractionResult);

      const logableExtractionResult = this.prepareExtractionResultForLogging(extractionResult);

      this.logger.info({ requestId: context.id, extraction: logableExtractionResult }, "Resolved current extraction by platform.");
      return [extractionResult, injectionNames.current.extraction];
    }

    return undefined;
  }

  public async findExtractor(context: RequestContext): Promise<RequestExtractor | null> {
    const { requestExtractorPriority = false, disableMostFeaturesWin = false } = this.componentMeta.configuration.contextDeriver || {};
    const isRunable = await Promise.all(this.extractors.map(extensionPoint => extensionPoint.fits(context)));
    let runnableExtensions = this.extractors.filter((extractor, index) => isRunable[index]);

    if (disableMostFeaturesWin && !requestExtractorPriority) {
      throw new Error("You cannot set disableMostFeaturesWin without requestExtractorPriority");
    }

    // Don't filter by most supported features if diabled and a priority list is given
    if (!disableMostFeaturesWin) {
      runnableExtensions = await this.selectExtractorsWithMostOptionalExtractions(runnableExtensions, context);
    }

    // Get extractors sorted by priority and select the one with the highest.
    if (runnableExtensions.length > 1 && requestExtractorPriority) {
      runnableExtensions = this.getExtractorsByPriority(runnableExtensions, requestExtractorPriority).slice(0, 1);
    }

    if (runnableExtensions.length > 1) {
      throw new Error("Multiple extractors fit to this request. " + "Please check your registerend platforms for duplicate extractors.");
    }

    if (runnableExtensions.length !== 1) {
      this.respondWithNoExtractor(context);
      return null;
    }
    if (typeof runnableExtensions[0] === "undefined") throw new TypeError("Single found extractor was undefined!");

    return runnableExtensions[0];
  }

  public respondWithNoExtractor(context: RequestContext) {
    this.logger.warn(
      { requestId: context.id },
      "None of the registered extractors respond to this request. You possibly need to install platforms. Sending 404."
    );
    context.responseCallback("", {}, 404);
  }

  /** Returns list of extractors which implement most of all available optional extractor interfaces */
  public async selectExtractorsWithMostOptionalExtractions(extractors: RequestExtractor[], context: RequestContext): Promise<RequestExtractor[]> {
    if (extractors.length <= 1) return extractors; // Performance reasons

    // Build all extractions
    const extractions = await Promise.all(extractors.map(e => e.extract(context)));

    // Count supported features per extractor / extraction
    const featureSupportings = extractions.map(e => {
      return Object.keys(OptionalExtractions.FeatureChecker).reduce((prev, curr) => {
        return this.extractorSupportsFeature(e, OptionalExtractions.FeatureChecker[curr]) ? prev + 1 : prev;
      }, 0);
    });

    const maximumFeatureSupport = Math.max(...featureSupportings);
    return extractors.filter((extractor, index) => featureSupportings[index] === maximumFeatureSupport);
  }

  /** Returns extractor with highest priority */
  private getExtractorsByPriority(
    extractors: RequestExtractor[],
    priorityList: Required<Configuration.Runtime>["contextDeriver"]["requestExtractorPriority"] = []
  ): RequestExtractor[] {
    return priorityList
      .map(name => extractors.find(ext => name === ext.component.name))
      .filter<RequestExtractor>((ext): ext is RequestExtractor => ext !== undefined);
  }

  /**
   * this method allows the Extensions with the interface RequestExtractionModifier at the extensionpoint 'requestModifier' to
   * change the RequestExtraction after the requestProcessor has set them
   */
  private async changeExtraction(extraction: MinimalRequestExtraction): Promise<MinimalRequestExtraction> {
    let result: MinimalRequestExtraction = extraction;

    if (this.extractionModifiers) {
      for (const extractionModifier of this.extractionModifiers) {
        result = await extractionModifier.modify(result);
      }
    }

    return result;
  }

  /**
   * Adds plattform as prefix for every session
   * @param extractionResult exractionResult with session and platform
   */
  private unifySession(extractionResult: MinimalRequestExtraction): MinimalRequestExtraction {
    if (extractionResult.sessionID) {
      extractionResult.sessionID = extractionResult.platform + "-" + extractionResult.sessionID;
    }
    return extractionResult;
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
      const mergedObject = whitelist
        .filter(entry => typeof entry === "object")
        .reduce((prev, curr) => {
          return { ...(prev as Configuration.LogWhitelistElement), ...(curr as Configuration.LogWhitelistElement) };
        }, {});

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
