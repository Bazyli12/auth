import { FactoryProvider, Logger } from "@nestjs/common";
import { Redis } from "ioredis";

export const redisClientFactory: FactoryProvider<Redis> = {
    provide: "RedisClient",
    useFactory: () => {
        const redisInstance = new Redis(process.env.REDIS_PATH);

        redisInstance.on("error", (e) => {
            Logger.error("Redis connection failed", "RedisClient");
            throw new Error(`Redis connection failed: ${e}`);
        });

        redisInstance.on("connect", () => {
            Logger.log("Redis successfully connected", "RedisClient");
        });

        return redisInstance;
    },
    inject: [],
};
