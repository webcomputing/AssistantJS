import { I18n } from "i18next";
import { inject, injectable, multiInject, optional } from "inversify";

import { Logger } from "../root/public-interfaces";
import { featureIsAvailable } from "../unifier/feature-checker";
import { MinimalRequestExtraction, OptionalExtractions } from "../unifier/public-interfaces";

import { injectionNames } from "../../injection-names";
import { componentInterfaces } from "./component-interfaces";
import { I18nContext } from "./context";
import { arraySplitter, optionEnablingArrayReturn, optionsObjectName } from "./plugins/array-returns-sample.plugin";
import { InterpolationResolver, MissingInterpolationExtension, TranslateHelper as TranslateHelperInterface } from "./public-interfaces";

@injectable()
export class TranslateHelper implements TranslateHelperInterface {
  constructor(
    @inject(injectionNames.i18nInstance) public i18n: I18n,
    @inject(injectionNames.current.i18nContext) public context: I18nContext,
    @inject(injectionNames.current.extraction) public extraction: MinimalRequestExtraction,
    @inject(injectionNames.current.logger) public logger: Logger,
    @inject(injectionNames.i18nInterpolationResolver) public interpolationResolver: InterpolationResolver
  ) {}

  // tslint:disable-next-line:function-name
  public async t(key?: string, locals?: {});
  // tslint:disable-next-line:function-name
  public async t(key: {});
  // tslint:disable-next-line:function-name
  public async t(key?: string | {}, locals = {}) {
    // To make it compatible with other signature
    if (typeof key === "object") {
      // tslint:disable-next-line:no-parameter-reassignment
      locals = key === null ? {} : key;
      // tslint:disable-next-line:no-parameter-reassignment
      key = undefined;
    }

    // Set language
    // Disable returning of objects so that lookup works properly with state keys.
    // Else, '.mainState' returns a valid result because of sub keys!
    const options = { ...{ lng: this.extraction.language, returnObjectTrees: false }, ...locals };
    const extractorName = this.extraction.platform;

    // Catch up device name or set to undefined
    const device = featureIsAvailable<OptionalExtractions.Device & MinimalRequestExtraction>(
      this.extraction,
      OptionalExtractions.FeatureChecker.DeviceExtraction
    )
      ? this.extraction.device
      : undefined;

    if (typeof key === "undefined") {
      // tslint:disable-next-line:no-parameter-reassignment
      key = "";
    }

    let lookupKeys: string[];
    if (key === "" || (key as string).charAt(0) === ".") {
      if (typeof device === "string") {
        // Lookup keys shall include device specific lookups
        lookupKeys = [
          this.context.state + "." + this.context.intent + key + "." + extractorName + "." + device,
          this.context.state + "." + this.context.intent + key + "." + extractorName,
          this.context.state + "." + this.context.intent + key,
          this.context.state + key + "." + extractorName + "." + device,
          this.context.state + key + "." + extractorName,
          this.context.state + key,
          "root" + "." + this.context.intent + key + "." + extractorName + "." + device,
          "root" + "." + this.context.intent + key + "." + extractorName,
          "root" + "." + this.context.intent + key,
          "root" + key + "." + extractorName + "." + device,
          "root" + key + "." + extractorName,
          "root" + key,
        ];
      } else {
        // Lookup keys shall not include device specific lookups
        lookupKeys = [
          this.context.state + "." + this.context.intent + key + "." + extractorName,
          this.context.state + "." + this.context.intent + key,
          this.context.state + key + "." + extractorName,
          this.context.state + key,
          "root" + "." + this.context.intent + key + "." + extractorName,
          "root" + "." + this.context.intent + key,
          "root" + key + "." + extractorName,
          "root" + key,
        ];
      }
    } else {
      lookupKeys = [key as string];
    }

    this.logger.debug("I18N: using key resolvings %o", lookupKeys);
    const translatedValue = this.translateOrFail(lookupKeys, options);

    return this.interpolationResolver.resolveMissingInterpolations(translatedValue, this);
  }

  public async getAllAlternatives(key?: string, locals?: {});
  public async getAllAlternatives(key: {});
  public async getAllAlternatives(key?: string | {}, locals = {}): Promise<string[]> {
    // Set internal assistantjs option for array-returns-sample.plugin
    locals[optionsObjectName] = { [optionEnablingArrayReturn]: true };

    // Get regular translation string. Multiple translations are concatenated by arraySplitter per default...
    const translation = await this.t(key as any, locals);

    // ... so we have to split to return in array format
    return translation.split(arraySplitter);
  }

  public async getObject(key?: string, locals: { [name: string]: string | number | object } = {}): Promise<string | string[] | object> {
    // Set internal assistantjs option for array-returns-sample.plugin
    locals[optionsObjectName] = { [optionEnablingArrayReturn]: true };

    // Get regular translation string. Multiple translations are concatenated by arraySplitter per default...
    const translation = await this.t(key as any, {
      ...locals,
      /* Maintain object structure below requested key */
      returnObjects: true,
      /* Don't used `arraySplitter` to join keys and maintain structure */
      joinArrays: false,
    });

    // ... so we have to split to return in array format
    return TranslateHelper.resolveTranslatedAndTemplatedResult(translation);
  }

  /**
   * Finds first existing locale or throws exception if none of the lookups exist.
   * i18n.exists() won't work here: it returns true for keys returning an object, even if returnObjectTrees is false. t() then returns undefined.
   */
  private translateOrFail(lookups: string[], options = {}) {
    for (const lookup of lookups) {
      if (this.i18n.exists(lookup, options)) {
        const translation = this.i18n.t(lookup, options);

        if (typeof translation === "object" && (options as any).returnObjects) {
          this.logger.debug("I18N: choosing key: " + lookup);
          return JSON.stringify(translation);
        }

        if (typeof translation === "string") {
          this.logger.debug("I18N: choosing key: " + lookup);
          return translation;
        }
      }
    }

    throw new Error("I18n key lookup could not be resolved: " + lookups.join(", "));
  }

  private static resolveTranslatedAndTemplatedResult(argRes: any) {
    // Parse JSON objects and arrays to JavaScript literals and keep all other primitives
    const res = typeof argRes === "string" && /^[\[|\{]/.test(argRes) ? JSON.parse(argRes) : argRes;

    if (typeof res === "string") {
      // Resolve `arraySplitter` for combinations resulting from `{a|b}` templates
      return res.indexOf(arraySplitter) !== -1 ? res.split(arraySplitter) : res;
    }

    for (const k in res) {
      if (res.hasOwnProperty(k)) {
        res[k] = TranslateHelper.resolveTranslatedAndTemplatedResult(res[k]);
      }
    }

    return res;
  }
}
