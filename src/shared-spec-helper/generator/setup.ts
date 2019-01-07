import * as fs from "fs";

/**
 * Generate a setup for the generator specs. It will create a utterances.json and entities.json for the given language.
 * It allows you to create theses files by
 */
export const setup = async function(fileType: "js" | "json" = "json", isCompiled: boolean) {
  // Generate an utterances.json and entities.json file for a given language
  generateUtterancesAndEntities.bind(this)(fileType, isCompiled);

  // Register the intents form the given utterances to the state machine
  this.container.inversifyInstance.unbind("core:state-machine:used-intents");
  this.container.inversifyInstance.bind("core:state-machine:used-intents").toDynamicValue(() => {
    return this.intents;
  });
};

/**
 *  Generate an utterances.json and entities.json file for a given language
 */
export const generateUtterancesAndEntities = async function(fileType: "js" | "json", isCompiled: boolean = true) {
  checkNeededValues.bind(this)();

  this.buildDir = `${this.rootDir}/${new Date().getTime()}`;
  fs.mkdirSync(this.buildDir);
  fs.mkdirSync(`${this.buildDir}/config`);
  fs.mkdirSync(`${this.buildDir}/config/${this.language}`);

  if (fileType === "json") {
    fs.writeFileSync(`${this.buildDir}/config/${this.language}/utterances.json`, JSON.stringify(this.utterances || {}));
    fs.writeFileSync(`${this.buildDir}/config/${this.language}/entities.json`, JSON.stringify(this.entities || {}));
  } else {
    fs.writeFileSync(`${this.buildDir}/config/${this.language}/utterances.js`, `module.exports = ${JSON.stringify(this.utterances || {})};`);
    fs.writeFileSync(`${this.buildDir}/config/${this.language}/entities.js`, `module.exports = ${JSON.stringify(this.entities || {})};`);
  }

  // Configure Generator Dependencies
  this.assistantJs.configureComponent("core:unifier", {
    utterancePath: `${this.buildDir}/config`,
  });
};

const checkNeededValues = function() {
  if (!this.rootDir) throw new Error("this.rootDir is missing");
  if (!this.language) throw new Error("this.language is missing");
  if (!this.intents) throw new Error("this.intents are missing");
};
