import { Component } from "ioc-container";
import { inject, injectable } from "inversify";
import * as i18next from "i18next";
import * as i18nextBackend from "i18next-sync-fs-backend";

import { processor, arraySplitter } from "./plugins/array-returns-sample.plugin";
import { Configuration } from "./interfaces";

@injectable()
export class I18nextWrapper {
  private component: Component;
  private configuration: Configuration;

  instance: i18next.I18n;

  constructor(@inject("meta:component//core:i18n") componentMeta: Component) {
    this.component = componentMeta;
    this.configuration = componentMeta.configuration as Configuration;

    if (typeof this.configuration.i18nextAdditionalConfiguration === "undefined" || 
     this.configuration.i18nextAdditionalConfiguration === "undefined")
     throw new Error("i18next configuration and instance must not be undefined! Please check your configuration.");

    this.instance = this.configuration.i18nextInstance;
    let i18nextConfiguration = Object.assign({}, this.configuration.i18nextAdditionalConfiguration);

    if (typeof(i18nextConfiguration.postProcess) === "string") {
      i18nextConfiguration.postProcess = [i18nextConfiguration.postProcess];
    } else if (typeof(i18nextConfiguration.postProcess) === "undefined") {
      i18nextConfiguration.postProcess = [];
    }
    i18nextConfiguration.postProcess.push("arrayReturnsSample");
    i18nextConfiguration.joinArrays = arraySplitter;

    this.instance.use(i18nextBackend).use(processor).init(i18nextConfiguration, err => { if (err) throw err; });
  }
}