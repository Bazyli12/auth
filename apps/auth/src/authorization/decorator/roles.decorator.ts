import { SetMetadata } from "@nestjs/common";
import { RoleName } from "@prisma/client";

export const ROLES_KEY = "RoleName";

export const Roles = (...appRoles: RoleName[]) =>
    SetMetadata(ROLES_KEY, appRoles);
