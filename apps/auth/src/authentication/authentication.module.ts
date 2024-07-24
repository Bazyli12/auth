import { Module } from "@nestjs/common";
import { AuthenticationController } from "./authentication.controller";
import { AuthenticationService } from "./authentication.service";
import jwtConfig from "./config/jwt.config";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { AccessTokenGuard } from "./guard/access-token.guard";
import { PrismaService } from "../prisma.service";
import { LocalStrategy } from "./strategies/local.strategy";
import { PassportModule } from "@nestjs/passport";
import { AccessTokenStrategy } from "./strategies/access-token.strategy";
import { RefreshTokenStrategy } from "./strategies/refresh-token.strategy";
import { UsersService } from "../users/users.service";
import { RedisModule } from "../redis/redis.module";

@Module({
    imports: [
        ConfigModule.forFeature(jwtConfig),
        JwtModule.registerAsync(jwtConfig.asProvider()),
        PassportModule,
        RedisModule,
    ],
    controllers: [AuthenticationController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: AccessTokenGuard,
        },
        LocalStrategy,
        RefreshTokenStrategy,
        AccessTokenStrategy,
        AccessTokenGuard,
        PrismaService,
        AuthenticationService,
        UsersService,
    ],
})
export class AuthenticationModule {}
