import * as fs from "fs";
import { CLIDeploymentExtension } from "../../../src/assistant-source";
import { DeploymentApplication } from "../../../src/components/root/app-deployment";
import { componentInterfaces } from "../../../src/components/root/private-interfaces";
import { ThisContext } from "../../this-context";

interface CurrentThisContext extends ThisContext {
  deploymentSpy: jasmine.Spy;
  deploymentApplication: DeploymentApplication;
}

const { existsSync } = fs;

describe("DeploymentApplication", function() {
  beforeEach(async function(this: CurrentThisContext) {
    this.deploymentSpy = jasmine.createSpy("execute");

    this.container.inversifyInstance.bind<CLIDeploymentExtension>(componentInterfaces.deployments).toDynamicValue(() => {
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
        this.deploymentApplication = new DeploymentApplication("root");
        this.deploymentApplication.execute(this.container);
      });

      it("executes all bound platform deployments", async function(this: CurrentThisContext) {
        expect(this.deploymentSpy).toHaveBeenCalledTimes(1);
      });

      it("transmit the build directory", async function(this: CurrentThisContext) {
        expect(this.deploymentSpy).toHaveBeenCalledWith("root");
      });
    });
  });
});
