import { Component } from "inversify-components";
import { inject, injectable } from "inversify";
import * as i18next from "i18next";
import * as i18nextBackend from "i18next-sync-fs-backend";

import { processor, arraySplitter } from "./plugins/array-returns-sample.plugin";
import { processor as templateParser } from "./plugins/parse-template-language.plugin";
import { Configuration } from "./interfaces";
import { log } from "../../setup";

@injectable()
export class I18nextWrapper {
  private component: Component;
  private configuration: Configuration;

  instance: i18next.I18n;

  /**
   * @param componentMeta Component meta data
   * @param returnOnlySample If set to true, translation calls return a sample out of many options (for production), if false, you get all options (for specs only)
   */
  constructor(@inject("meta:component//core:i18n") componentMeta: Component, returnOnlySample = true) {
    this.component = componentMeta;
    this.configuration = componentMeta.configuration as Configuration;

    if (typeof this.configuration.i18nextAdditionalConfiguration === "undefined" || 
     this.configuration.i18nextAdditionalConfiguration === "undefined")
     throw new Error("i18next configuration and instance must not be undefined! Please check your configuration.");

    this.instance = this.configuration.i18nextInstance;
    let i18nextConfiguration = Object.assign({ initImmediate: false }, this.configuration.i18nextAdditionalConfiguration);

    if (typeof(i18nextConfiguration.postProcess) === "string") {
      i18nextConfiguration.postProcess = [i18nextConfiguration.postProcess];
    } else if (typeof(i18nextConfiguration.postProcess) === "undefined") {
      i18nextConfiguration.postProcess = [];
    }

    // Tell I18next to join arrays by a join string
    i18nextConfiguration.joinArrays = arraySplitter;

    // 1) Grab a sample from all translation entries in array syntax
    if (returnOnlySample) i18nextConfiguration.postProcess.push("arrayReturnsSample");

    // 2) Parse this sample -> create a new array with all variants
    i18nextConfiguration.postProcess.push("parseTemplateLanguage");

    // 3) Grab a sample from the array of variants
    if (returnOnlySample) i18nextConfiguration.postProcess.push("arrayReturnsSample");

    log("Using i18next configuration: %o", i18nextConfiguration);
    log("Loading from path: ", i18nextConfiguration.backend.loadPath);

    this.instance.use(i18nextBackend).use(templateParser).use(processor).init(i18nextConfiguration, err => { if (err) throw err; });
  }
}