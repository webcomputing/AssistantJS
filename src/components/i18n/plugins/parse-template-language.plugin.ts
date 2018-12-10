// import * as generateUtterances from "alexa-utterances"; // We are only using alexa-independet stuff here
import * as combinatorics from "js-combinatorics";
import { arraySplitter } from "./array-returns-sample.plugin";

export const processor = {
  type: "postProcessor",
  name: "parseTemplateLanguage",
  process(value: string, key, options, translator) {
    // Get already split-up values
    let dialogOptions = value.split(arraySplitter);

    // Parse language strings out of templates (respecting alternatives like "{Can I|May I} help you?")
    dialogOptions = dialogOptions.reduce<string[]>((parsedStrings, templateString) => {
      // Find all occurences of {Can I|May I} pattern
      const re = /[^\{\s]??\{([^\{\}]+)\}[^\}\s]??/g;
      const matches: RegExpMatchArray | null = templateString.match(re);

      if (matches !== null) {
        const slots: string[][] = matches.map(match => match.substring(1, match.length - 1).split("|"));
        const combinations: string[][] = combinatorics.cartesianProduct.apply(combinatorics, slots).toArray();
        combinations.forEach(combination => parsedStrings.push(templateString.replace(re, () => combination.shift() || "")));
      } else {
        parsedStrings.push(templateString);
      }

      return parsedStrings;
    }, []);

    // Join with array splitter again to make it usable for other plugins
    return dialogOptions.join(arraySplitter);
  },
};
