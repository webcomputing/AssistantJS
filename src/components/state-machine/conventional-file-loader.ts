import * as fs from "fs";
import { ComponentDescriptor } from "inversify-components";
import { Constructor } from "../../assistant-source";
import { AssistantJSSetup } from "../../setup";

export abstract class ConventionalFileLoader<ClassType> {
  public classes: { [name: string]: Constructor<ClassType> } = {};
  protected assistantJS: AssistantJSSetup;

  constructor(assistantJS: AssistantJSSetup) {
    this.assistantJS = assistantJS;
  }

  /**
   * Builds a component descriptor out of all added classes
   */
  public abstract toComponentDescriptor(): ComponentDescriptor;

  /**
   * [Sync!] Adds all classes in a specific directory to this.classes.
   * @param addOnly If set to true, this method only calls "addClass", but not "registerClasses" finally, so does not register the component descriptor
   * @param baseDirectory Base directory to start (process.cwd() + "/js/app")
   * @param dictionary Dictionary which contains the classes to add
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

  /** Registers all classes in dependency injection container */
  protected registerClasses() {
    this.assistantJS.registerComponent(this.toComponentDescriptor());
  }

  /**
   * Adds a class to setup
   * @param classToAdd class to add
   * @param name name to use for class
   * @param args further params
   * @return Name of class which was added
   */
  protected addClass(classToAdd: Constructor<ClassType>, name?: string, ...args: any[]): string {
    const className = typeof name === "undefined" ? ConventionalFileLoader.deriveClassName<ClassType>(classToAdd) : name;
    this.classes[className] = classToAdd;
    return className;
  }

  /** Returns a class name based on its constructor */
  public static deriveClassName<ClassType>(classToDerive: Constructor<ClassType>): string {
    return classToDerive.name;
  }
}
