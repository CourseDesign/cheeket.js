import EventEmitter from "events";

import Resolver from "./resolver";
import Register from "./register";
import Token from "./token";
import Provider from "./provider";
import ProviderStorage from "./provider-storage";
import ResolveChain from "./resolve-chain";

import InternalTokens from "./internal-tokens";
import InternalEvents from "./internal-events";

class Container implements Resolver, Register {
  private readonly storage: ProviderStorage;

  private readonly eventEmitter: EventEmitter;

  private readonly resolveChain: ResolveChain;

  private readonly parent: Container | undefined;

  constructor(parent?: Container) {
    this.storage = new ProviderStorage();
    this.eventEmitter = new EventEmitter();
    this.resolveChain = new ResolveChain(this.storage, parent?.resolveChain);
    this.parent = parent;

    this.eventEmitter.setMaxListeners(Infinity);
    this.storage.set(InternalTokens.EventEmitter, async (context) => {
      context.response = this.eventEmitter;
    });
  }

  register<T>(token: Token<T>, provider: Provider<T>): this {
    this.storage.set(token, provider);
    return this;
  }

  resolve<T>(token: Token<T>): Promise<T | undefined> {
    return this.resolveChain.resolve(token);
  }

  clear(): void {
    const internalTokens = new Set<Token<unknown>>(
      Object.values(InternalTokens)
    );

    this.storage.keys().forEach((key) => {
      if (!internalTokens.has(key)) {
        this.storage.delete(key);
      }
    });

    this.eventEmitter.emit(InternalEvents.Clear);
  }
}

export default Container;
