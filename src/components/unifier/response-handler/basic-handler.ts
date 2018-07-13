import { inject, injectable } from "inversify";
import * as util from "util";
import { injectionNames } from "../../../injection-names";
import { RequestContext, ResponseCallback } from "../../root/public-interfaces";
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
export abstract class BasicHandler<B extends BasicAnswerTypes> implements BasicHandable<B> {
  /**
   * this is the minmal set of methods which a specific handler should support, it is used by the proxy from the @see {@link HandlerProxyFactory} to identify the supported Methods.
   */
  public readonly whitelist: Array<keyof BasicHandler<B>> = ["prompt", "setEndSession", "endSessionWith", "send", "wasSent"];

  /**
   * This set of Methods can be used from the specific Handler, all Methods which starts with 'set<HandlerName>' are added to the list of valid methods automatically
   * private and protected methods MUST be added here too, because all Method-calls, also internal method-calls are proxied and are filtered with this whitelist
   */
  public abstract readonly specificWhitelist: string[];
  /**
   * As every call can add a Promise, this property is used to save all Promises
   *
   * A final object with only a prompt could look like this:
   * <pre><code>
   * {
   *    prompt: {
   *       resolver: "<ssml>Hallo</ssml>",
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
    [key in keyof B]?: {
      /**
       * 1.) Promise of a final object
       * 2.) final object itself
       * 3.) Promise of intermediate Object which is given to the thenMap-function
       * 4.) intermediate Object which is given to the thenMap-function
       */
      resolver: Promise<B[key]> | B[key] | Promise<any> | any;

      /**
       * function to build the final object from an intermediate object
       */
      thenMap?: (value: any) => B[key] | Promise<B[key]>; // todo conditional type when it is possible to reference the type of the property "resolver"
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
   *       text: "<ssml>Hallo</ssml>",
   *       isSSML: true
   *     }
   * }
   * </code></pre>
   */
  private results: { [key in keyof B]?: B[key] } = {} as any;

  /**
   * property to save if the answers were sent
   */
  private isSent: boolean = false;

  private responseCallback: ResponseCallback;
  private killSession: () => Promise<void>;

  constructor(
    @inject(injectionNames.current.requestContext) extraction: RequestContext,
    @inject(injectionNames.current.killSessionService) killSession: () => Promise<void>,
    @inject(injectionNames.current.responseHandlerExtensions) private responseHandlerExtensions: ResponseHandlerExtensions<B, BasicHandler<B>>
  ) {
    this.responseCallback = extraction.responseCallback;
    this.killSession = killSession;
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
      this.responseHandlerExtensions.beforeExtensions.forEach(beforeResponseHandler => {
        beforeResponseHandler.execute(this);
      });
    }

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

    // give results to the specific handler
    this.getBody(this.results);

    // everything was sent successfully
    this.isSent = true;

    this.responseCallback(JSON.stringify(this.getBody(this.results)), this.getHeaders());
    if (this.results.shouldSessionEnd) {
      this.killSession();
    }

    // first check if AfterResponseHandlers are set,
    // because normal ResponseHandlers inherits from this AbstractResponseHandler and calls super().
    // This prevents DI and this.afterSendResponseHandler are undefined
    if (this.responseHandlerExtensions) {
      this.responseHandlerExtensions.afterExtensions.forEach(afterResponseHandler => {
        afterResponseHandler.execute(this.results);
      });
    }
  }

  public wasSent(): boolean {
    return this.isSent;
  }

  public setUnauthenticated(): this {
    this.promises.shouldAuthenticate = { resolver: true };
    return this;
  }

  /**
   * Adds Data to session
   *
   * Most of the time it is better to use the @see {@link Session}-Implementation, as the Session-Implemention will set it automatically to the handler
   * or use another SessionStorage like Redis. And it has some more features.
   */
  public setSessionData(sessionData: B["sessionData"] | Promise<B["sessionData"]>): this {
    if (!(this.whitelist.indexOf("setSessionData") > 0 || this.specificWhitelist.indexOf("setSessionData") > 0)) {
      throw new Error(
        "You are trying to use the platform's session handling, but the platform's response handler does not support session handling. In consequence, you can't remain in sessions. Please consider using redis as session storage."
      );
    }

    this.promises.sessionData = { resolver: sessionData };

    return this;
  }

  /**
   * gets the current SessionData
   */
  public getSessionData(): Promise<B["sessionData"]> | undefined {
    return this.promises.sessionData ? Promise.resolve(this.promises.sessionData.resolver) : undefined;
  }

  public setEndSession(): this {
    this.promises.shouldSessionEnd = { resolver: true };
    return this;
  }

  public endSessionWith(text: B["voiceMessage"]["text"] | Promise<B["voiceMessage"]["text"]>): this {
    this.promises.shouldSessionEnd = { resolver: true };
    this.prompt(text);

    return this;
  }

  public prompt(
    inputText: B["voiceMessage"]["text"] | Promise<B["voiceMessage"]["text"]>,
    ...reprompts: Array<B["voiceMessage"]["text"] | Promise<B["voiceMessage"]["text"]>>
  ): this {
    // add a thenMap function to build the correct object from the simple strings
    this.promises.voiceMessage = {
      resolver: Promise.resolve(inputText),
      thenMap: this.createPromptAnswer,
    };

    // add reprompts with remapper function
    if (reprompts && reprompts.length > 0) {
      this.promises.reprompts = this.getRepromptArrayRemapper(reprompts);
    }

    return this;
  }

  public setReprompts(reprompts: Array<B["voiceMessage"]["text"] | Promise<B["voiceMessage"]["text"]>> | Promise<Array<B["voiceMessage"]["text"]>>): this {
    // check wether it is an Arry or an Promise
    if (Array.isArray(reprompts)) {
      // add reprompts as Array with remapper function
      this.promises.reprompts = this.getRepromptArrayRemapper(reprompts);
    } else {
      // Add Promise and thenMap function
      this.promises.reprompts = {
        resolver: reprompts,
        thenMap: this.createRepromptAnswerArray,
      };
    }

    return this;
  }

  public setSuggestionChips(suggestionChips: B["suggestionChips"] | Promise<B["suggestionChips"]>): this {
    this.promises.suggestionChips = { resolver: suggestionChips };
    return this;
  }

  public setChatBubbles(chatBubbles: B["chatBubbles"] | Promise<B["chatBubbles"]>): this {
    this.promises.chatBubbles = { resolver: chatBubbles };
    return this;
  }

  public setCard(card: B["card"] | Promise<B["card"]>): this {
    this.promises.card = { resolver: card };
    return this;
  }

  /**
   * generates the concrete data for a specific Handler
   * has to be implemented by the specific handler
   * @param results one file which contains all answers/prompts
   * @returns e.g. the Object to send as result to the calling service
   */
  protected abstract getBody(results: Partial<B>): any;

  /**
   *  Headers of response, default is Contet-Type "application/json" only
   */
  protected getHeaders() {
    return { "Content-Type": "application/json" };
  }

  private failIfInactive() {
    if (this.isSent) {
      throw Error(
        "This handle is already inactive, an response was already sent. You cannot send text to a platform multiple times in one request. Current response handler: " +
          util.inspect(this)
      );
    }
  }

  /**
   * Creates from a String the correct prompt object
   * @param text text with or without SSML
   */
  private createPromptAnswer(text: string): BasicAnswerTypes["voiceMessage"] {
    return {
      text,
      isSSML: BasicHandler.isSSML(text),
    };
  }

  /**
   * Builds the Remapper for Reprompts in an Array of promises and strings
   * @param reprompts
   */
  private getRepromptArrayRemapper(
    reprompts: Array<B["voiceMessage"]["text"] | Promise<B["voiceMessage"]["text"]>>
  ): {
    resolver: Promise<Array<B["voiceMessage"]["text"]>>;
    thenMap: (finaleReprompts: Array<B["voiceMessage"]["text"]>) => B["reprompts"];
  } {
    return {
      resolver: Promise.all(reprompts),
      thenMap: this.createRepromptAnswerArray,
    };
  }

  /**
   * Builds ther Remappee from an string Array
   * @param reprompts
   */
  private createRepromptAnswerArray(reprompts: string[]) {
    return reprompts.map(this.createPromptAnswer);
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
