import { injectable, multiInject, optional } from "inversify";
import { Observable, Observer, Subject } from "rxjs";
import { componentInterfaces } from "./private-interfaces";
import { AssistantJSEvent, EventBus, EventHandler } from "./public-interfaces";

@injectable()
export class EventBusHandler implements EventBus {
  private subjects: { [eventName: string /* | symbol, see https://github.com/Microsoft/TypeScript/issues/1863 */]: Subject<AssistantJSEvent> } = {};

  constructor(
    @optional()
    @multiInject(componentInterfaces.eventHandler)
    private eventHandler: EventHandler[]
  ) {}

  public getObservable(eventName: string | symbol): Observable<AssistantJSEvent> {
    this.initializeSubject(eventName);
    return this.subjects[eventName].asObservable();
  }

  public publish(event: AssistantJSEvent): void {
    this.initializeSubject(event.name);
    this.subjects[event.name].next(event);
  }

  public subscribe(eventName: string | symbol, observer: Observer<AssistantJSEvent>): void {
    this.getObservable(eventName).subscribe(observer);
  }

  /** Asks all extensions if they want to subscribe to this event = subject */
  private initializeSubject(eventName: string | symbol) {
    if (!this.subjects[eventName]) {
      this.subjects[eventName] = new Subject<AssistantJSEvent>();

      this.eventHandler.forEach(handler => {
        const subscriber = handler.getSubscriber(eventName);
        if (subscriber) {
          this.subscribe(eventName, subscriber);
        }
      });
    }
  }
}
