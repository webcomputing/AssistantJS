import { injectable } from "inversify";
import { Subscriber } from "rxjs";
import { EventBusHandler } from "../../../src/components/root/event-bus";
import { componentInterfaces } from "../../../src/components/root/private-interfaces";
import { AssistantJSEvent, EventHandler } from "../../../src/components/root/public-interfaces";
import { injectionNames } from "../../../src/injection-names";
import { ThisContext } from "../../this-context";

const mySymbol = Symbol();
const myString = "myEvent";

interface CurrentThisContext extends ThisContext {
  handlerA: EventHandlerA;
  handlerB: EventHandlerB;
  eventBus: EventBusHandler;
}

/** Splits up subscribed events into two different queues */
@injectable()
class EventHandlerA implements EventHandler {
  public symbolEvents: AssistantJSEvent[] = [];
  public stringEvents: AssistantJSEvent[] = [];

  public getSubscriber(eventName: string | symbol) {
    if (eventName === mySymbol) {
      return Subscriber.create<AssistantJSEvent>(event => {
        if (event) this.symbolEvents.push(event);
      });
    }

    if (eventName === myString) {
      return Subscriber.create<AssistantJSEvent>(event => {
        if (event) this.stringEvents.push(event);
      });
    }
  }
}

/** Puts everything into "events" queue */
// tslint:disable-next-line:max-classes-per-file
@injectable()
class EventHandlerB implements EventHandler {
  public events: AssistantJSEvent[] = [];

  public getSubscriber() {
    return Subscriber.create<AssistantJSEvent>(event => {
      if (event) this.events.push(event);
    });
  }
}

describe("EventBus", function() {
  beforeEach(function(this: CurrentThisContext) {
    this.specHelper.prepareSpec(this.defaultSpecOptions);
    // Bind some event handlers
    this.inversify
      .bind(componentInterfaces.eventHandler)
      .to(EventHandlerA)
      .inSingletonScope();
    this.inversify
      .bind(componentInterfaces.eventHandler)
      .to(EventHandlerB)
      .inSingletonScope();

    // Get event handler instances
    const allHandlers: [EventHandlerA, EventHandlerB] = this.inversify.getAll(componentInterfaces.eventHandler) as any;
    this.handlerA = allHandlers[0];
    this.handlerB = allHandlers[1];

    this.eventBus = this.inversify.get(injectionNames.eventBus);
  });

  it("is injectable", function() {
    expect(typeof this.eventBus.publish).toEqual("function");
  });

  describe("publish/subscribe", function() {
    describe("when using symbols", function() {
      beforeEach(function() {
        this.event = { name: mySymbol };
        this.eventBus.publish(this.event);
      });

      it("puts event in general queue", function() {
        expect(this.handlerB.events).toEqual([this.event]);
      });

      it("puts event in symbol queue", function() {
        expect(this.handlerA.symbolEvents).toEqual([this.event]);
      });

      it("does not put event in string queue", function() {
        expect(this.handlerA.stringEvents).toEqual([]);
      });
    });

    describe("when using strings", function() {
      beforeEach(function() {
        this.event = { name: myString, data: { a: "b" } };
        this.eventBus.publish(this.event);
      });

      it("puts event in general queue", function() {
        expect(this.handlerB.events).toEqual([this.event]);
      });

      it("does not put event in symbol queue", function() {
        expect(this.handlerA.symbolEvents).toEqual([]);
      });

      it("puts event in string queue", function() {
        expect(this.handlerA.stringEvents).toEqual([this.event]);
      });
    });
  });
});
