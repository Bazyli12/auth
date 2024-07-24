import { Module } from "@nestjs/common";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { PrismaService } from "../prisma.service";
import { RedisModule } from "../redis/redis.module";

@Module({
    imports: [RedisModule],
    providers: [UsersService, PrismaService],
    controllers: [UsersController],
})
export class UsersModule {}
