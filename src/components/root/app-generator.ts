import { MainApplication, Container } from "inversify-components";
import { GeneratorExtension } from "./public-interfaces";
import { componentInterfaces } from "./private-interfaces";

import * as fs from "fs";

// This class is the main application thread. Therefore it acts like a singleton!
export class GeneratorApplication implements MainApplication {
  private baseDir: string;
  private buildNr: number;
  private buildDir: string;
  private container: Container;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  public execute(container: Container) {
    this.container = container;
    this.buildNr = Date.now();
    this.buildDir = this.baseDir + "/" + this.buildNr;

    // Create directory for current build
    fs.mkdirSync(this.buildDir);

    // Get and execute all builders
    let builders = this.container.inversifyInstance.getAll<GeneratorExtension>(componentInterfaces.generator);
    builders.forEach(builder => builder.execute(this.buildDir));
  }
}