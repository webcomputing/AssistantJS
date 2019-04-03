import * as fs from "fs";
import { Container, MainApplication } from "inversify-components";
import * as path from "path";
import { componentInterfaces } from "./private-interfaces";
import { CLIGeneratorExtension } from "./public-interfaces";

// This class is the main application thread. Therefore it acts like a singleton!
export class GeneratorApplication implements MainApplication {
  private baseDir: string;
  private buildNr!: number;
  private buildDir!: string;
  private container!: Container;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  public async execute(container: Container): Promise<void> {
    this.container = container;
    this.buildNr = Date.now();
    this.buildDir = path.join(this.baseDir, `${this.buildNr}`);

    /**
     * Check if the base directory exists and recreate it if it's not found.
     * Generally assistant new should create this directory.
     */
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir);
    }

    // Create directory for current build
    fs.mkdirSync(this.buildDir);

    // Get and execute all builders
    const builders = this.container.inversifyInstance.getAll<CLIGeneratorExtension>(componentInterfaces.generator);
    await Promise.all(builders.map(builder => Promise.resolve(builder.execute(this.buildDir))));
  }
}
