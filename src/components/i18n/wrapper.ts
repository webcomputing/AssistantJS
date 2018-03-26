import { Component } from "inversify-components";
import { componentInterfaces } from "./component-interfaces";
import { Configuration } from "./private-interfaces";

import * as i18next from "i18next";
import * as i18nextBackend from "i18next-sync-fs-backend";
import { inject, injectable, multiInject, optional } from "inversify";
import { injectionNames } from "../../injection-names";
import { Logger } from "../root/public-interfaces";

import { arraySplitter, processor } from "./plugins/array-returns-sample.plugin";
import { processor as templateParser } from "./plugins/parse-template-language.plugin";
import { MissingInterpolationExtension } from "./public-interfaces";

@injectable()
export class I18nextWrapper {
  public instance: i18next.I18n;
  private component: Component<Configuration.Runtime>;
  private configuration: Configuration.Runtime;
  private logger: Logger;


  /**
   * @param componentMeta Component meta data
   * @param returnOnlySample If set to true, translation calls return a sample out of many options (for production), if false, you get all options (for specs only)
   */
  constructor(
    @inject("meta:component//core:i18n") componentMeta: Component<Configuration.Runtime>,
    @optional()
    @multiInject(componentInterfaces.missingInterpolation)
    private missingInterpolationExtensions: MissingInterpolationExtension[],
    @inject(injectionNames.logger) logger: Logger,
    returnOnlySample = true
  ) {
    if (typeof missingInterpolationExtensions === "undefined") {
      // tslint:disable-next-line:no-parameter-reassignment
      missingInterpolationExtensions = [];
    }

    this.component = componentMeta;
    this.configuration = componentMeta.configuration;
    this.logger = logger;

    if (typeof this.configuration.i18nextAdditionalConfiguration === "undefined" || this.configuration.i18nextAdditionalConfiguration === "undefined") {
      throw new Error("i18next configuration and instance must not be undefined! Please check your configuration.");
    }

    this.instance = Object.assign(Object.create(Object.getPrototypeOf(this.configuration.i18nextInstance)), this.configuration.i18nextInstance);
    const i18nextConfiguration = {
      ...{ initImmediate: false, missingInterpolationHandler: this.onInterpolationMissing.bind(this) },
      ...this.configuration.i18nextAdditionalConfiguration,
    };

    if (typeof i18nextConfiguration.postProcess === "string") {
      i18nextConfiguration.postProcess = [i18nextConfiguration.postProcess];
    } else if (typeof i18nextConfiguration.postProcess === "undefined") {
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

    this.instance
      .use(i18nextBackend)
      .use(templateParser)
      .use(processor)
      .init(i18nextConfiguration, err => {
        if (err) throw err;
      });
  }

  /**
   * handles missing interpolation in translation.js
   * @param str translation-string
   * @param match interpolation that is missing
   */
  private onInterpolationMissing(str, match) {
    this.logger.info("onInterpolationMissing callback called for missing value", match[0]);

    let interpolationValue: string | undefined;

    this.missingInterpolationExtensions.forEach(missingInterpolationExtension => {
      interpolationValue = missingInterpolationExtension.execute(this.parseInterpolation(match[0]));
    });

    if (typeof interpolationValue !== "undefined") {
      return interpolationValue;
    }

    this.logger.warn(`no matching extension found for ${match[0]}`);
  }

  private parseInterpolation(interpolation: string) {
    const interpolationValue = interpolation.replace(/(\{{2}|\}{2})/g, "");
    return interpolationValue;
  }
}
