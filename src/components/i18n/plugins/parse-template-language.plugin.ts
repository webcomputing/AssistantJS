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
      const re = /\{([^\{\}]+)\}(?!\})/g;
      const matches: RegExpMatchArray | null = templateString.match(re);

      if (matches !== null) {
        // Removes curly braces and splits at "|"
        const slots: string[][] = matches.map(match => match.substring(1, match.length - 1).split("|"));
        // Gets all combinations of variations in this string
        const combinations: string[][] = combinatorics.cartesianProduct.apply(combinatorics, slots).toArray();
        // Fills all combinations back into positional slots of templateString
        const templateStringVariations = combinations.map(combination => templateString.replace(re, () => combination.shift() || ""));

        return [...parsedStrings, ...templateStringVariations];
      }

      return [...parsedStrings, templateString];
    }, []);

    // Join with array splitter again to make it usable for other plugins
    return dialogOptions.join(arraySplitter);
  },
};
