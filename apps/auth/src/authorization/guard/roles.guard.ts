import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../decorator/roles.decorator";
import { RoleName } from "@prisma/client";
import { AccessTokenUserData } from "../../authentication/interface/access-token-user.interface";

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const contextRoles = this.reflector.getAllAndOverride<RoleName[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()]
        );
        if (!contextRoles) {
            return true;
        }
        const user: AccessTokenUserData = context.switchToHttp().getRequest()[
            "user"
        ];
        if (user.role === "ROOT") {
            return true;
        }
        return contextRoles.some((roleName) => user.role === roleName);
    }
}
