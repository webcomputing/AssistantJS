import * as fs from "fs";
import * as path from "path";
import { CLIDeploymentExtension } from "../../../src/assistant-source";
import { DeploymentApplication } from "../../../src/components/root/app-deployment";
import { componentInterfaces } from "../../../src/components/root/private-interfaces";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  /**
   * Spy object for the CLIDeploymentExtension execute method. Injected by componentInterfaces.deployments
   */
  deploymentSpy: jasmine.Spy;

  /**
   * Current instance of the DeploymentApplication
   */
  deploymentApplication: DeploymentApplication;

  /**
   * A global mock timestamp
   */
  buildTimeStamp: number;
}

const { existsSync } = fs;

describe("DeploymentApplication", function() {
  beforeEach(async function(this: CurrentThisContext) {
    this.deploymentSpy = jasmine.createSpy("execute");

    this.inversify.bind<CLIDeploymentExtension>(componentInterfaces.deployments).toDynamicValue(() => {
      return {
        execute: this.deploymentSpy,
      };
    });
  });

  describe("with non existing buildDir", function() {
    describe("execute", function() {
      it("executes all bound platform deployments", async function(this: CurrentThisContext) {
        try {
          this.deploymentApplication = new DeploymentApplication("tmp");
          fail("Should throw a missing build directory exception");
        } catch (e) {
          expect(e.message).toContain("Missing build directory");
        }
      });
    });
  });

  describe("with existing buildDir", function() {
    beforeEach(async function(this: CurrentThisContext) {
      (fs as any).existsSync = jasmine.createSpy("existsSync").and.returnValue(true);
    });

    afterEach(function() {
      (fs as any).existsSync = existsSync;
    });
    describe("execute", function() {
      beforeEach(async function(this: CurrentThisContext) {
        this.buildTimeStamp = Date.now();
        this.deploymentApplication = new DeploymentApplication("root", this.buildTimeStamp);
        this.deploymentApplication.execute(this.assistantJs.container);
      });

      it("executes all bound platform deployments", async function(this: CurrentThisContext) {
        expect(this.deploymentSpy).toHaveBeenCalledTimes(1);
      });

      it("transmit the build directory", async function(this: CurrentThisContext) {
        expect(this.deploymentSpy).toHaveBeenCalledWith(path.join("root", this.buildTimeStamp.toString()));
      });
    });
  });
});
