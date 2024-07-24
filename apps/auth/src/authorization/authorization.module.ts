import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { RolesGuard } from "./guard/roles.guard";
import { PrismaService } from "../prisma.service";

@Module({
    imports: [],
    controllers: [],
    providers: [{ provide: APP_GUARD, useClass: RolesGuard }, PrismaService],
})
export class AuthorizationModule {}
