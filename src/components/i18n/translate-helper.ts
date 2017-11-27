import { inject, injectable } from "inversify";
import { I18n } from "i18next";
import { TranslateHelper as TranslateHelperInterface } from "./interfaces";
import { MinimalRequestExtraction } from "../unifier/interfaces";
import { I18nContext } from "./context";
import { log } from "../../setup";

@injectable()
export class TranslateHelper implements TranslateHelperInterface {
  context: I18nContext;
  extraction: MinimalRequestExtraction;
  i18n: I18n;

  constructor(
    @inject("core:i18n:instance") i18n: I18n, 
    @inject("core:i18n:current-context") context: I18nContext,
    @inject("core:unifier:current-extraction") extraction: MinimalRequestExtraction) 
  {
    this.i18n = i18n;
    this.context = context;
    this.extraction = extraction;
  }


  t(key?: string, locals?: {});
  t(key: {});
  t(key?: string | {}, locals = {}) {
    // To make it compatible with other signature
    if (typeof(key) === "object") {
      locals = key === null ? {} : key;
      key = undefined;
    }

    // Set language 
    // Disable returning of objects so that lookup works properly with state keys.
    // Else, '.mainState' returns a valid result because of sub keys!
    let options = Object.assign({ lng:  this.extraction.language, returnObjectTrees: false }, locals);
    let extractorName = this.extraction.component.name;

    if (typeof key === "undefined") {
      key = "";
    }

    let lookupKeys: string[];
    if (key === "" || (key as string).charAt(0) === ".") {
      lookupKeys = [
        this.context.state + "." + this.context.intent + key + "." + extractorName, 
        this.context.state + "." + this.context.intent + key, 
        this.context.state + key + "." + extractorName,
        this.context.state + key,
        "root" + "." + this.context.intent + key + "." + extractorName, 
        "root" + "." + this.context.intent + key, 
        "root" + key + "." + extractorName,
        "root" + key
      ];
    } else {
      lookupKeys = [key as string];
    }

    log("I18N: using key resolvings %o with options/locals %o", lookupKeys, options);
    return this.translateOrFail(lookupKeys, options);
  }

  /** 
   * Finds first existing locale or throws exception if none of the lookups exist.
   * i18n.exists() won't work here: it returns true for keys returning an object, even if returnObjectTrees is false. t() then returns undefined.
   */
  private translateOrFail(lookups: string[], options = {}) {
    let foundTranslation: string | undefined = undefined;

    lookups.some(lookup => {
      if (typeof foundTranslation === "undefined" && this.i18n.exists(lookup, options)) {
        let translation = this.i18n.t(lookup, options);
        if (typeof translation === "string") {
          log("I18N: choosing key: " + lookup);
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