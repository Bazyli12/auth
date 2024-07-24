import { Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { UsersModule } from "./users/users.module";
import { AuthenticationModule } from "./authentication/authentication.module";
import { AuthorizationModule } from "./authorization/authorization.module";
import { RedisModule } from "./redis/redis.module";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { TypedEventEmitterModule } from "./event-emitter/typed-event-emitter.module";
@Module({
    imports: [
        UsersModule,
        AuthenticationModule,
        AuthorizationModule,
        RedisModule,
        EventEmitterModule.forRoot(),
        TypedEventEmitterModule,
    ],
    providers: [PrismaService],
})
export class AppModule {}
