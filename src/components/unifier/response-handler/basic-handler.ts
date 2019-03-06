import { inject, injectable } from "inversify";
import { merge } from "lodash";
import { injectionNames } from "../../../injection-names";
import { RequestContext, ResponseCallback } from "../../root/public-interfaces";
import { KillSessionPromise } from "../../services/public-interfaces";
import { MinimalRequestExtraction, OptionallyPromise } from "../public-interfaces";
import { BasicAnswerTypes, BasicHandable, ResponseHandlerExtensions, UnsupportedFeatureSupportForHandables } from "./handler-types";

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
export class BasicHandler<MergedAnswerTypes extends BasicAnswerTypes> implements BasicHandable<MergedAnswerTypes>, UnsupportedFeatureSupportForHandables {
  /** See BasicHandable interface */
  public unsupportedFeatureCalls: Array<{ methodName: string | number | symbol; args: any[] }> = [];

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
      resolver: OptionallyPromise<MergedAnswerTypes[key] | any>;

      /**
       * function to build the final object from an intermediate object
       */
      thenMap?: (value: any) => OptionallyPromise<MergedAnswerTypes[key]>; // todo conditional type when it is possible to reference the type of the property "resolver"
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
   *
   * On a regular basis, your response handler won't need this - just implement your getBody() method and your fine.
   */
  protected results: Partial<MergedAnswerTypes> = {} as any;

  /**
   * property to save if the answers were sent
   */
  private isSent: boolean = false;

  private responseCallback: ResponseCallback;

  constructor(
    @inject(injectionNames.current.requestContext) private requestContext: RequestContext,
    @inject(injectionNames.current.extraction) private extraction: MinimalRequestExtraction,
    @inject(injectionNames.current.killSessionService) private killSession: KillSessionPromise,
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

    // default http status code 200 or resolved status code
    const httpStatusCode = this.results.httpStatusCode ? this.results.httpStatusCode : 200;

    // give results to the specific handler and resolve json
    const handlerJSON = this.getBody(this.results);

    // append handler json with possible custom attributes
    const responseJSON = merge({ ...handlerJSON }, this.results.appendedJSON ? this.results.appendedJSON : {});

    // Send using assistantjs response callbacḱ
    this.responseCallback(JSON.stringify(responseJSON), this.getHeaders(), httpStatusCode);

    // everything was sent successfully
    this.isSent = true;

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
    return this.setResolverAndReturnThis("shouldSessionEnd", true);
  }

  public endSessionWith(text: OptionallyPromise<MergedAnswerTypes["voiceMessage"]["text"]>): this {
    this.setEndSession();
    return this.prompt(text);
  }

  public setHttpStatusCode(httpStatusCode: OptionallyPromise<MergedAnswerTypes["httpStatusCode"]>): this {
    return this.setResolverAndReturnThis("httpStatusCode", httpStatusCode);
  }

  public prompt(inputText: OptionallyPromise<MergedAnswerTypes["voiceMessage"]["text"]>): this {
    return this.setResolverAndReturnThis("voiceMessage", inputText, this.createPromptAnswer);
  }

  public setAppendedJSON(appendedJSON: OptionallyPromise<MergedAnswerTypes["appendedJSON"]>): this {
    return this.setResolverAndReturnThis("appendedJSON", appendedJSON);
  }

  public async resolveAnswerField<AnswerTypeKey extends keyof MergedAnswerTypes>(
    answerType: AnswerTypeKey
  ): Promise<MergedAnswerTypes[AnswerTypeKey] | undefined> {
    // get resolver and check if the resolver is not 'undefined' (should not be possible, but the type requests it)
    const resolver = this.promises[answerType];

    if (resolver) {
      // resolve the final or intermediate result
      const currentValue = await Promise.resolve(resolver.resolver);

      // remap the intermediate Results, when an thenMap function is present
      if (resolver.thenMap) {
        return Promise.resolve<any>(resolver.thenMap.bind(this)(currentValue));
      }

      return currentValue;
    }
  }

  public unsupportedFeature(methodName: string | number | symbol, ...args: any[]): void {
    this.unsupportedFeatureCalls.push({ methodName, args });
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
        "The currently used response handle is already inactive, a response was already sent. You cannot send text or any oher data to a platform multiple times in one request."
      );
    }
  }

  /**
   * This method resolves all promises which were added via the Handler-Functions
   * It should only be called once at a time, as otherwise the results could interfere.
   * In a regular case, you don't need to call this, since it is called automatically during send()
   */
  protected async resolveResults(): Promise<void> {
    // first get all keys, these are the properties which are filled
    const promiseKeys: string[] = [];
    for (const key in this.promises) {
      if (this.promises.hasOwnProperty(key)) {
        promiseKeys.push(key);
      }
    }
    // resolve all intermediate and final results from the Promises and build an Array of new Promises
    // and fill the results array
    const concurrentProcesses = promiseKeys.map(async key => {
      this.results[key] = await this.resolveAnswerField(key as keyof MergedAnswerTypes);
    });

    // wait for all Prmises at once, after this
    await Promise.all(concurrentProcesses);
  }

  /** Sets resolver to given value and return this. Checks if response handler is still active using failIfInactive(). */
  protected setResolverAndReturnThis<AnswerKey extends keyof MergedAnswerTypes>(
    answerKey: AnswerKey,
    resolver: OptionallyPromise<MergedAnswerTypes[AnswerKey] | any>,
    thenMap?: (value: any) => OptionallyPromise<MergedAnswerTypes[AnswerKey]>
  ) {
    this.failIfInactive();

    this.promises[answerKey] = { resolver, thenMap };

    return this;
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
