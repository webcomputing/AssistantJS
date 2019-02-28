import * as fs from "fs";
import * as path from "path";
import { CLIGeneratorExtension, GeneratorApplication } from "../../../src/assistant-source";
import { componentInterfaces } from "../../../src/components/root/private-interfaces";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  /** Base directory used by the GeneratorApplication */
  baseDir: string;
  /** Build directory used by the GeneratorApplication */
  buildDir: string;
  /** Instance of the current GeneratorApplication Class */
  generatorApplication: GeneratorApplication;
  /** Current build timestamp */
  buildTimestamp: Date;
  /** Mocked instance of the Generator class. */
  generatorExtension: CLIGeneratorExtension;
  /** All Spy instances used by the current specs */
  spy: Partial<{
    /** fs.mkdirSync Spy */
    mkdirSync: jasmine.Spy;
    /** fs.existsSync Spy */
    existsSync: jasmine.Spy;
    /** Spy for the this.generatorExtension.execute method */
    execute: jasmine.Spy;
  }>;
}

describe("GeneratorApplication", function() {
  beforeEach(async function(this: CurrentThisContext) {
    /** Mock the build timestamp used by the GeneratorApplication to create a build number */
    jasmine.clock().install();
    this.buildTimestamp = new Date();
    jasmine.clock().mockDate(this.buildTimestamp);

    /** Mock data for the base directory */
    this.baseDir = "tmp";

    /** Disable hard disk operations  */
    this.spy = {};
    this.spy.mkdirSync = jasmine.createSpy("mkdirSync");
    (fs as any).mkdirSync = this.spy.mkdirSync;
    this.spy.existsSync = jasmine.createSpy("existsSync");
    (fs as any).existsSync = this.spy.existsSync;

    /** Create an instance of the GeneratorApplication */
    this.generatorApplication = new GeneratorApplication(this.baseDir);

    /** Create a spy on the used CLIGeneratorExtension */
    this.generatorExtension = this.container.inversifyInstance.getAll<CLIGeneratorExtension>(componentInterfaces.generator)[0];
    this.spy.execute = jasmine.createSpy("execute");
    (this.generatorExtension as any).execute = this.spy.execute;
    this.container.inversifyInstance.rebind(componentInterfaces.generator).toConstantValue(this.generatorExtension);
  });

  afterEach(function() {
    /** Cleanup the mocked date */
    jasmine.clock().uninstall();
  });

  describe("#execute", function() {
    describe("with existing base directory", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.spy.existsSync!.and.returnValue(true);
        this.generatorApplication.execute(this.container);
      });

      it("will not create the base directory", async function(this: CurrentThisContext) {
        expect(this.spy.mkdirSync!).not.toHaveBeenCalledWith(this.baseDir);
      });
    });

    describe("without existing base directory", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.spy.existsSync!.and.returnValue(false);
        this.generatorApplication.execute(this.container);
      });

      it("creates the base directory", async function(this: CurrentThisContext) {
        expect(this.spy.mkdirSync!).toHaveBeenCalledWith(this.baseDir);
      });
    });

    describe("regarding general behavior", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.generatorApplication.execute(this.container);
        this.buildDir = path.join(this.baseDir, this.buildTimestamp.getTime().toString());
      });

      it("creates the build directory", async function(this: CurrentThisContext) {
        expect(this.spy.mkdirSync!).toHaveBeenCalledWith(this.buildDir);
      });

      it("execute generatorExtension", async function(this: CurrentThisContext) {
        expect(this.generatorExtension.execute).toHaveBeenCalledWith(this.buildDir);
      });
    });
  });
});
