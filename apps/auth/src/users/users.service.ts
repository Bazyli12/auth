import {
    ConflictException,
    Injectable,
    NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma.service";
import { compare, genSalt, hash } from "bcrypt";
import { RoleName } from "@prisma/client";
import { ChangePasswordDto } from "../authentication/dto/change-password-dto";
import { RedisService } from "../redis/redis.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AccessTokenUserData } from "src/authentication/interface/access-token-user.interface";

@Injectable()
export class UsersService {
    constructor(
        private prismaService: PrismaService,
        private redisService: RedisService
    ) {}

    async getUserById(id: string) {
        const user = await this.prismaService.user.findUnique({
            where: { id },
            include: { role: true, refreshTokens: true },
        });
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }

    async getUserByEmail(email: string) {
        const user = await this.prismaService.user.findUnique({
            where: { email },
            include: { role: true, refreshTokens: true, password: true },
        });
        if (!user) {
            throw new NotFoundException(`User with email ${email} not found`);
        }
        return user;
    }

    async createUser(verifyEmailCode: string) {
        const tempUser = await this.redisService.getTempUser(verifyEmailCode);
        const user = await this.prismaService.$transaction(async (tx) => {
            const user = await tx.user.findFirst({
                where: {
                    email: tempUser.email,
                },
            });

            if (user) {
                if (user.email === tempUser.email) {
                    throw new ConflictException(
                        "User with this email already exists"
                    );
                }
            }

            return tx.user.create({
                data: {
                    email: tempUser.email,
                    password: {
                        create: {
                            password: tempUser.password,
                        },
                    },
                    role: {
                        create: {
                            name: RoleName.USER,
                        },
                    },
                    isVerified: true,
                },
            });
        });
        return {
            user: user,
        };
    }

    async updateUserDetails(
        updateUserDto: UpdateUserDto,
        user: AccessTokenUserData
    ) {
        return this.prismaService.user.update({
            where: { id: user.id },
            data: updateUserDto,
        });
    }

    async createTempUser(email: string, password: string) {
        const user = await this.prismaService.user.findFirst({
            where: {
                email: email,
            },
        });

        if (user) {
            if (user.email === email) {
                throw new ConflictException(
                    "User with this email already exists"
                );
            }
        }

        const hashSalt = await genSalt();
        const hashedPassword = await hash(password, hashSalt);

        return await this.redisService.createTempUser({
            email,
            password: hashedPassword,
        });
    }

    async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
        return this.prismaService.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id: userId },
                include: { password: true },
            });
            if (!user) {
                throw new NotFoundException(`User with id ${userId} not found`);
            }

            const isPasswordCorrect = await compare(
                changePasswordDto.oldPassword,
                user.password.password
            );
            if (!isPasswordCorrect) {
                throw new ConflictException("Old password is incorrect");
            }

            const isNewPasswordSameAsOldPassword = await compare(
                changePasswordDto.newPassword,
                user.password.password
            );
            if (isNewPasswordSameAsOldPassword) {
                throw new ConflictException(
                    "New password cannot be the same as the old password"
                );
            }

            const hashSalt = await genSalt();
            const hashedPassword = await hash(
                changePasswordDto.newPassword,
                hashSalt
            );

            return tx.userPassword.update({
                where: { userId },
                data: {
                    password: hashedPassword,
                },
            });
        });
    }

    async createRefreshToken(userId: string, refreshToken: string) {
        return this.prismaService.user.update({
            where: { id: userId },
            include: { refreshTokens: true },
            data: {
                refreshTokens: {
                    create: {
                        token: refreshToken,
                    },
                },
            },
        });
    }

    async updateRefreshToken(
        userId: string,
        oldRefreshToken: string,
        newRefreshToken: string
    ) {
        return this.prismaService.user.update({
            where: { id: userId },
            data: {
                refreshTokens: {
                    updateMany: {
                        where: { token: oldRefreshToken },
                        data: {
                            token: newRefreshToken,
                        },
                    },
                },
            },
        });
    }

    async updatePassword(userId: string, password: string) {
        const hashSalt = await genSalt();
        const hashedPassword = await hash(password, hashSalt);
        return this.prismaService.user.update({
            where: { id: userId },
            include: { password: true },
            data: {
                password: {
                    update: {
                        password: hashedPassword,
                    },
                },
            },
        });
    }

    async deleteUser(id: string) {
        return this.prismaService.$transaction(async (tx) => {
            const user = await tx.user.findUnique({
                where: { id },
            });
            if (!user) {
                throw new NotFoundException(`User with id ${id} not found`);
            }
            return tx.user.delete({
                where: { id },
            });
        });
    }

    async changeEmail(userId: string, newEmail: string) {
        return this.prismaService.user.update({
            where: { id: userId },
            data: {
                email: newEmail,
            },
        });
    }
}
