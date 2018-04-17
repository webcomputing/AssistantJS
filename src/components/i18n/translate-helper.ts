import { I18n } from "i18next";
import { inject, injectable, multiInject, optional } from "inversify";

import { Logger } from "../root/public-interfaces";
import { featureIsAvailable } from "../unifier/feature-checker";
import { MinimalRequestExtraction, OptionalExtractions } from "../unifier/public-interfaces";

import { componentInterfaces } from "./component-interfaces";
import { I18nContext } from "./context";
import { TranslateHelper as TranslateHelperInterface } from "./public-interfaces";

@injectable()
export class TranslateHelper implements TranslateHelperInterface {
  constructor(
    @inject("core:i18n:instance") public i18n: I18n,
    @inject("core:i18n:current-context") public context: I18nContext,
    @inject("core:unifier:current-extraction") public extraction: MinimalRequestExtraction,
    @inject("core:root:current-logger") public logger: Logger
  ) {}

  public t(key?: string, locals?: {});
  public t(key: {});
  public t(key?: string | {}, locals = {}) {
    // To make it compatible with other signature
    if (typeof key === "object") {
      locals = key === null ? {} : key;
      key = undefined;
    }

    // Set language
    // Disable returning of objects so that lookup works properly with state keys.
    // Else, '.mainState' returns a valid result because of sub keys!
    const options = { lng: this.extraction.language, returnObjectTrees: false, ...locals };
    const extractorName = this.extraction.platform;

    // Catch up device name or set to undefined
    const device = featureIsAvailable<OptionalExtractions.Device & MinimalRequestExtraction>(
      this.extraction,
      OptionalExtractions.FeatureChecker.DeviceExtraction
    )
      ? this.extraction.device
      : undefined;

    if (typeof key === "undefined") {
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
    return this.translateOrFail(lookupKeys, options);
  }

  /**
   * Finds first existing locale or throws exception if none of the lookups exist.
   * i18n.exists() won't work here: it returns true for keys returning an object, even if returnObjectTrees is false. t() then returns undefined.
   */
  private translateOrFail(lookups: string[], options = {}) {
    let foundTranslation: string | undefined;

    lookups.some(lookup => {
      if (typeof foundTranslation === "undefined" && this.i18n.exists(lookup, options)) {
        const translation = this.i18n.t(lookup, options);
        if (typeof translation === "string") {
          this.logger.debug("I18N: choosing key: " + lookup);
          foundTranslation = translation;
          return true;
        }
      }

      return false;
    });

    if (typeof foundTranslation === "undefined") {
      throw new Error("I18n key lookup could not be resolved: " + lookups.join(", "));
    } else {
      return foundTranslation;
    }
  }
}
