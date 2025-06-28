import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import {
  DynamicModule,
  ForwardReference, INestApplication,
  INestMicroservice,
  Module, NestApplicationOptions,
  Type,
} from '@nestjs/common';
import { MessagingModuleOptions } from '@nestjstools/messaging/lib/config';
import { MessagingModule } from '@nestjstools/messaging';

type IEntryNestModule = Type<any> | DynamicModule | ForwardReference | Promise<IEntryNestModule>;

const MESSAGING_IOC_CONFIG = 'messenger_CHANNELS';

type Config = Omit<MessagingModuleOptions, 'global'>

type MessagingModuleConfig = Config & { extensions?: IEntryNestModule[] };

export interface MessagingOptions {
  messaging?: MessagingModuleConfig;
}

export interface MicroserviceMessagingOptions extends MessagingOptions {
  nestMicroserviceOptions?: MicroserviceOptions;
}

export interface MessagingNestServerOptions extends MessagingOptions {
  nestApplicationOptions?: NestApplicationOptions;
}

@Module({})
class AppWrapperModule {
  static init(module: any, messagingModuleOptions?: MessagingModuleConfig): DynamicModule {
    const modules = [module];

    if (messagingModuleOptions?.extensions) {
      modules.push(...messagingModuleOptions.extensions);
    }

    if (messagingModuleOptions) {
      const { extensions, ...cleanConfig } = messagingModuleOptions;
      modules.push(
        MessagingModule.forRoot(cleanConfig)
      );
    }

    return {
      module: AppWrapperModule,
      imports: modules,
    };
  }
}

export class MessagingBootstrap {
  static async createNestMicroserviceWithMessagingConsumer(module: IEntryNestModule, options?: MicroserviceMessagingOptions): Promise<INestMicroservice> {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppWrapperModule.init(module, options?.messaging),
      options?.nestMicroserviceOptions,
    );

    const messagingConfig = await app.get(MESSAGING_IOC_CONFIG);
    messagingConfig.map(v => {
      v.config.enableConsumer = true;
      return v;
    });

    return app;
  }

  static async createNestApplicationWithMessaging(module: IEntryNestModule, options?: MessagingNestServerOptions): Promise<INestApplication> {
    return NestFactory.create(
      AppWrapperModule.init(module, options?.messaging),
      options?.nestApplicationOptions,
    );
  }
}
