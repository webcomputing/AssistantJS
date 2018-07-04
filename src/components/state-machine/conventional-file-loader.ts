import * as fs from "fs";
import { ComponentDescriptor } from "inversify-components";
import { Constructor } from "../../assistant-source";
import { AssistantJSSetup } from "../../setup";

export abstract class ConventionalFileLoader {
  private assistantJS: AssistantJSSetup;

  constructor(assistantJS: AssistantJSSetup) {
    this.assistantJS = assistantJS;
  }

  /**
   * Adds a class to setup
   * @param classToAdd class to add
   * @param name name to use for class
   * @param args further params
   */

  public abstract addClass(classToAdd: Constructor<any>, name?: string, ...args: any[]);

  /**
   * Builds a component descriptor out of all added classes
   */
  public abstract toComponentDescriptor(): ComponentDescriptor;

  /**
   * [Sync!] Adds all classes in a specific directory as filters.
   * @param addOnly If set to true, this method only calls "addFilter", but not "registerFilters" finally
   * @param baseDirectory Base directory to start (process.cwd() + "/js/app")
   * @param dictionary Dictionary which contains filter classes, defaults to "filters"
   */
  public registerByConvention(addOnly = false, baseDirectory = process.cwd() + "/js/app", dictionary) {
    fs.readdirSync(baseDirectory + dictionary).forEach(file => {
      const suffixParts = file.split(".");
      const suffix = suffixParts[suffixParts.length - 1];

      // Load if file is a JavaScript file
      if (suffix !== "js") return;
      const classModule = require(baseDirectory + dictionary + "/" + file);

      Object.keys(classModule).forEach(exportName => {
        this.addClass(classModule[exportName]);
      });
    });

    if (!addOnly) this.registerClasses();
  }

  /** Registers all states in dependency injection container */
  public registerClasses() {
    this.assistantJS.registerComponent(this.toComponentDescriptor());
  }

  /** Returns a states name based on its constructor */
  public static deriveClassName<T>(classToDerive: Constructor<T>): string {
    return classToDerive.name;
  }
}
