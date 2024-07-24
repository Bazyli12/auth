import { Global, Inject, Module } from "@nestjs/common";

import { redisClientFactory } from "./redis.client.factory";
import { RedisRepository } from "./redis.repository";
import { PrismaService } from "../prisma.service";
import { RedisService } from "./redis.service";

@Module({
    imports: [],
    controllers: [],
    providers: [
        redisClientFactory,
        RedisRepository,
        RedisService,
        PrismaService,
    ],
    exports: [RedisService],
})
export class RedisModule {}
