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

    let options = Object.assign({ lng:  this.extraction.language}, locals);
    let extractorName = this.extraction.component.name;

    log("I18N: local resolving key '" + key + "' (language: '" + this.extraction.language + " ') with context: %o", this.context);

    if (typeof(key) === "undefined") {
      key = "";
    }

    if (key === "" || (key as string).charAt(0) === ".") {
      return this.i18n.t([
        this.context.state + "." + this.context.intent + "." + extractorName + key, 
        this.context.state + "." + this.context.intent + key, 
        this.context.state + key,
        "root" + "." + this.context.intent + "." + extractorName + key, 
        "root" + "." + this.context.intent + key, 
        "root" + key
      ] as any, options);
    } else {
      return this.i18n.t(key as string, options);
    }
  }
}