import type * as Prisma from "@prisma/client";

export interface AccessTokenUserData {
    id: string;
    email: string;
    role: Prisma.RoleName;
}
