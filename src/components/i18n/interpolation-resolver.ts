import { inject, injectable, multiInject, optional } from "inversify";
import { injectionNames } from "../../injection-names";
import { Logger } from "../root/public-interfaces";
import { componentInterfaces } from "./component-interfaces";
import { InterpolationResolver as InterpolationResolverInterface, MissingInterpolationExtension } from "./public-interfaces";
import { TranslateHelper } from "./translate-helper";

@injectable()
export class InterpolationResolver implements InterpolationResolverInterface {
  constructor(
    @inject(injectionNames.logger) public logger: Logger,
    @optional()
    @multiInject(componentInterfaces.missingInterpolation)
    private missingInterpolationExtensions: MissingInterpolationExtension[]
  ) {
    if (typeof missingInterpolationExtensions === "undefined") {
      // tslint:disable-next-line:no-parameter-reassignment
      missingInterpolationExtensions = [];
    }
  }

  /**
   * resolves all missing interpolations in the given translation iteratively by executing missingInterpolation extensions
   * @param translatedValue text containing missing interpolations
   */
  public async resolveMissingInterpolations(translatedValue: string, translateHelper: TranslateHelper): Promise<string> {
    let resolvedText = translatedValue;

    // return if translatedValue does not contain any further interpolations
    if (!translatedValue.includes("~")) {
      return resolvedText;
    }

    // fill missing interpolations in parallel
    const interpolations = translatedValue.split(/(?<=\*~~)(.*?)(?=\~~*)/g, undefined).filter(value => value.includes("~") === false);
    let replacement: string | undefined;

    for (const interpolation of interpolations) {
      const missingInterpolationExtensionsPromises = this.missingInterpolationExtensions.map(missingInterpolationExtension =>
        missingInterpolationExtension.execute(interpolation, translateHelper)
      );
      const interpolationValues = await Promise.all(missingInterpolationExtensionsPromises);

      for (const value of interpolationValues) {
        if (typeof value !== "undefined") {
          replacement = value;

          // if interpolationValue contains futher interpolations, call this method recursively
          if (replacement.includes("~")) {
            replacement = await this.resolveMissingInterpolations(replacement, translateHelper);
          }

          break;
        }
      }

      if (typeof replacement === "undefined") {
        this.logger.warn(
          `Missing translation interpolation value for {{${interpolation}}}. Neither you nor one of the ${
            this.missingInterpolationExtensions.length
          } registered missingInterpolationExtensions provided a value. Now using "" instead.`
        );
        replacement = "";
      }

      // resolve interpolations in given Text
      resolvedText = translatedValue.replace("*~~" + interpolation + "~~*", replacement);
    }

    return resolvedText;
  }
}
