import { inject, injectable } from "inversify";
import * as util from "util";
import { injectionNames } from "../../../injection-names";
import { RequestContext, ResponseCallback } from "../../root/public-interfaces";
import { MinimalRequestExtraction } from "../public-interfaces";
import { BasicAnswerTypes, BasicHandable, ResponseHandlerExtensions } from "./handler-types";

/**
 * This Class represents the basic features a ResponseHandler should have. It implements all Basic functions,
 * so a specific Handler has to implement only the own methods and functions.
 *
 * All public methods are specified in the interface @see {@link BasicHandable} and most of the methods supports Method-Chaining
 * All methods allows to add a Promise, so that all promises are awaited concurrently when the method send is called
 *
 * To uses the Generic 'B' the specific handler should use its own interface, which extends the @see {@link BasicAnswerTypes}
 *
 * For the docs of the Methods see also the implemented interfaces
 */
@injectable()
export class BasicHandler<MergedAnswerTypes extends BasicAnswerTypes> implements BasicHandable<MergedAnswerTypes> {
  /**
   * As every call can add a Promise, this property is used to save all Promises
   *
   * A final object with only a prompt could look like this:
   * <pre><code>
   * {
   *    prompt: {
   *       resolver: "<speak>Hallo</speak>",
   *       thenMap: (value: string) => {...}
   *     }
   * }
   * </code></pre>
   *
   * In case of that the resolver is either a Promise which returns the correct object,
   * or the correct object no Method 'thenMap()' is necessary
   *
   * In case that a Promise which does not return the correct type or an object of the wrong type is provided
   * the Method thenMap MUST be provided. This method is called automatically with the result of the Promise or the wrong object
   * and can build and provide the correct object.
   */
  protected promises: {
    [key in keyof MergedAnswerTypes]?: {
      /**
       * 1.) Promise of a final object
       * 2.) final object itself
       * 3.) Promise of intermediate Object which is given to the thenMap-function
       * 4.) intermediate Object which is given to the thenMap-function
       */
      resolver: Promise<MergedAnswerTypes[key]> | MergedAnswerTypes[key] | Promise<any> | any;

      /**
       * function to build the final object from an intermediate object
       */
      thenMap?: (value: any) => MergedAnswerTypes[key] | Promise<MergedAnswerTypes[key]>; // todo conditional type when it is possible to reference the type of the property "resolver"
    }
  } = {} as any;

  /**
   * Property to save the final results
   *
   * The result should look identical to the type 'B extends BasicAnswerTypes.
   *
   * A final object with only a prompt could look like this:
   * <pre><code>
   * {
   *    prompt: {
   *       text: "<speak>Hallo</speak>",
   *       isSSML: true
   *     }
   * }
   * </code></pre>
   */
  private results: Partial<MergedAnswerTypes> = {} as any;

  /**
   * property to save if the answers were sent
   */
  private isSent: boolean = false;

  private responseCallback: ResponseCallback;

  constructor(
    @inject(injectionNames.current.requestContext) private requestContext: RequestContext,
    @inject(injectionNames.current.extraction) private extraction: MinimalRequestExtraction,
    @inject(injectionNames.current.killSessionService) private killSession: () => Promise<void>,
    @inject(injectionNames.current.responseHandlerExtensions)
    private responseHandlerExtensions: ResponseHandlerExtensions<MergedAnswerTypes, BasicHandable<MergedAnswerTypes>>
  ) {
    this.responseCallback = requestContext.responseCallback;
  }

  /**
   * Method to give the final resolved results to the specific Hanlder Implementation of the Method @see {@link sendResults()}
   */
  public async send(): Promise<void> {
    this.failIfInactive();

    // first check if BeforeResponseHandlers are set,
    // because specific ResponseHandlers inherits from this BasicHandler and calls super().
    // This prevents DI and this.beforeSendResponseHandler are undefined
    if (this.responseHandlerExtensions) {
      const beforeResponseHandlerPromises = this.responseHandlerExtensions.beforeExtensions.map(beforeResponseHandler => {
        return beforeResponseHandler.execute(this);
      });

      await Promise.all(beforeResponseHandlerPromises);
    }

    await this.resolveResults();

    // everything was sent successfully
    this.isSent = true;

    // give results to the specific handler
    this.responseCallback(JSON.stringify(this.getBody(this.results)), this.getHeaders());
    if (this.results.shouldSessionEnd) {
      await this.killSession();
    }

    // first check if AfterResponseHandlers are set,
    // because normal ResponseHandlers inherits from this AbstractResponseHandler and calls super().
    // This prevents DI and this.afterSendResponseHandler are undefined
    if (this.responseHandlerExtensions) {
      const afterResponseHandlerPromises = this.responseHandlerExtensions.afterExtensions.map(afterResponseHandler => {
        afterResponseHandler.execute(this.results);
      });

      await Promise.all(afterResponseHandlerPromises);
    }
  }

  public wasSent(): boolean {
    return this.isSent;
  }

  public setEndSession(): this {
    this.failIfInactive();

    this.promises.shouldSessionEnd = { resolver: true };
    return this;
  }

  public endSessionWith(text: MergedAnswerTypes["voiceMessage"]["text"] | Promise<MergedAnswerTypes["voiceMessage"]["text"]>): this {
    this.failIfInactive();

    this.promises.shouldSessionEnd = { resolver: true };
    this.prompt(text);

    return this;
  }

  public prompt(inputText: MergedAnswerTypes["voiceMessage"]["text"] | Promise<MergedAnswerTypes["voiceMessage"]["text"]>): this {
    this.failIfInactive();

    // add a thenMap function to build the correct object from the simple strings
    this.promises.voiceMessage = {
      resolver: Promise.resolve(inputText),
      thenMap: this.createPromptAnswer,
    };

    return this;
  }

  /**
   * generates the concrete data for a specific Handler
   * has to be implemented by the specific handler, cannot be abstract for the mixins
   * @param results one file which contains all answers/prompts
   * @returns e.g. the Object to send as result to the calling service
   */
  protected getBody(results: Partial<MergedAnswerTypes>): any {
    throw new Error("Not implemented");
  }

  /**
   *  Headers of response, default is Contet-Type "application/json" only
   */
  protected getHeaders() {
    return { "Content-Type": "application/json" };
  }

  /**
   * Creates from a String the correct prompt object
   * @param text text with or without SSML
   */
  protected createPromptAnswer(text: string): BasicAnswerTypes["voiceMessage"] {
    const isSSML = BasicHandler.isSSML(text);

    return {
      isSSML,
      text: isSSML ? `<speak>${text}</speak>` : text,
    };
  }

  protected failIfInactive() {
    if (this.isSent) {
      throw Error(
        "This handle is already inactive, an response was already sent. You cannot send text or any oher data to a platform multiple times in one request. Current response handler: " +
          util.inspect(this)
      );
    }
  }

  /**
   * This method resolves all promises which were added via the Handler-Functions
   * It should only be called once at a time, as otherwise the results could interfere
   */
  private async resolveResults(): Promise<void> {
    // first get all keys, these are the properties which are filled
    const promiseKeys: string[] = [];
    for (const key in this.promises) {
      if (this.promises.hasOwnProperty(key)) {
        promiseKeys.push(key);
      }
    }
    // resolve all intermediate and final results from the Promises and build an Array of new Promises
    // and fill the results array
    const concurrentProcesses = promiseKeys.map(async (key: string) => {
      const currentKey = key as keyof BasicAnswerTypes; // we have to set the type here to 'BasicAnswerTypes', as if we set the type to 'B' the type of the const resolver is wrong
      // get resolver and check if the resolver is not 'undefined' (should not be possible, but the type requests it)
      const resolver = this.promises[currentKey];
      if (resolver) {
        // resolve the final or intermediate result
        const currentValue = await Promise.resolve(resolver.resolver);
        // remap the intermediate Results, when an thenMap function is present
        if (resolver.thenMap) {
          const finalResult = await Promise.resolve(resolver.thenMap.bind(this)(currentValue));
          this.results[currentKey] = finalResult;
        } else {
          // here are only final results
          this.results[currentKey] = currentValue;
        }
      }
    });
    // wait for all Prmises at once, after this
    await Promise.all(concurrentProcesses);
  }

  /**
   * checks wether the text contains SSML
   * @param text with or without SSML
   * @returns true when the text conatins SSML, otherwise false
   */
  private static isSSML(text: string): boolean {
    return text.includes("</") || text.includes("/>");
  }
}
