import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { AccessTokenUserData } from "../interface/access-token-user.interface";

export const CurrentUser = createParamDecorator(
    (field: keyof AccessTokenUserData | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user: AccessTokenUserData | undefined = request.user;
        return field ? user?.[field] : user;
    }
);
