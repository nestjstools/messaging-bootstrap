<p align="center">
  <img src="nestjstools-logo.png" width="400" alt="NestJS Tools Logo" />
</p>

# @nestjstools/messaging-bootstrap

A lightweight NestJS wrapper around [`@nestjstools/messaging`](https://www.npmjs.com/package/@nestjstools/messaging), designed to simplify bootstrapping messaging-based applications.

Instead of manually configuring messaging in your `AppModule`, this package lets you quickly set up:

- An **HTTP server** with messaging support
- A **dedicated worker** (microservice) that runs only messaging consumers

---

## Features

- 🧵 Microservice/worker mode for consumers only
- 🌐 HTTP server with integrated messaging
- 🚀 Clean `main.ts` bootstrapping
- 🔌 Compatible with `@nestjstools/messaging` and RabbitMQ extension

---

## Documentation

📘 https://nestjstools.gitbook.io/nestjstools-messaging-docs

---

## Example Project (RabbitMQ)

🔗 https://github.com/nestjstools/messaging-rabbitmq-example

---

## Installation

```bash
npm install @nestjstools/messaging-bootstrap
# or
yarn add @nestjstools/messaging-bootstrap
````

## Peer Dependencies
You must also install the following packages (if not already present in your project):
```bash
npm install @nestjs/microservices @nestjstools/messaging
# or
yarn add @nestjs/microservices @nestjstools/messaging
````

---

## ⚠️ Warning

Do **not** call `MessagingModule.forRoot()` in your `AppModule` (or in any other module) when using this library.  
This method should be invoked **only once**, and it is already <br>handled internally by `@nestjstools/messaging-bootstrap`.

Including it manually will lead to duplicate initialization and unexpected behavior.

---
## Getting Started

### 🚀 HTTP Server with Messaging

```ts
// main.ts
import { AppModule } from './app.module';
import { AmqpChannelConfig, ExchangeType } from '@nestjstools/messaging';
import { MessagingRabbitmqExtensionModule } from '@nestjstools/messaging-rabbitmq-extension';
import { MessagingBootstrap } from '@nestjstools/messaging-bootstrap';

async function bootstrap() {
  const app = await MessagingBootstrap.createNestApplicationWithMessaging(
    AppModule,
    {
      messaging: {
        // Load your messaging extensions here (e.g., RabbitMQ, Redis, Amazon SQS, etc.)
        // You can also load it in AppModule
        extensions: [MessagingRabbitmqExtensionModule],

        // Define global message buses
        buses: [{ channels: ['async-command'], name: 'command.bus' }],

        // Configure messaging channels
        channels: [
          new AmqpChannelConfig({
            name: 'async-command',
            connectionUri: 'amqp://guest:guest@localhost:5672/',
            exchangeName: 'my_app_command.exchange',
            bindingKeys: ['my_app_command.#'],
            exchangeType: ExchangeType.TOPIC,
            queue: 'my_app.command',
            avoidErrorsForNotExistedHandlers: false,
            deadLetterQueueFeature: true,
            autoCreate: true,
            // If true, consumers will run in the server app.
            // Set to false when running in HTTP server mode only (no consumers).
            enableConsumer: false,
          }),
        ],
      },

      // Optional: configure NestJS application options here
      nestApplicationOptions: {
        logger: new ConsoleLogger({ json: true }),
      },
    }
  );

  await app.init();
  app.listen(3000);
}

bootstrap();
```

---

### 🧵 Microservice / Worker Mode

```ts
// main.ts
import { AppModule } from './app.module';
import { AmqpChannelConfig, ExchangeType } from '@nestjstools/messaging';
import { MessagingRabbitmqExtensionModule } from '@nestjstools/messaging-rabbitmq-extension';
import { MessagingBootstrap } from './bootstrap';

async function bootstrap() {
  const app = await MessagingBootstrap.createNestMicroserviceWithMessagingConsumer(
    AppModule,
    {
      messaging: {
        // Register messaging extensions (e.g., RabbitMQ, Redis, etc.)
        // You can also load it in AppModule
        extensions: [MessagingRabbitmqExtensionModule],

        // Define global buses and the channels they use
        buses: [{ channels: ['async-command'], name: 'command.bus' }],

        // Configure individual messaging channels
        channels: [
          new AmqpChannelConfig({
            name: 'async-command',
            connectionUri: 'amqp://guest:guest@localhost:5672/',
            exchangeName: 'my_app_command.exchange',
            bindingKeys: ['my_app_command.#'],
            exchangeType: ExchangeType.TOPIC,
            queue: 'my_app.command',
            avoidErrorsForNotExistedHandlers: false,
            deadLetterQueueFeature: true,
            autoCreate: true,

            // Consumers are always enabled in worker mode
            // (i.e., when using createNestMicroserviceWithMessagingConsumer)
          }),
        ],
      },

      // Optional: provide NestJS microservice options here
      nestMicroserviceOptions: {
        logger: new ConsoleLogger({ json: true }),
      },
    }
  );

  await app.init();
  app.listen(3000);
}

bootstrap();
```
