import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigType } from "@nestjs/config";
import jwtConfig from "./config/jwt.config";
import { RefreshTokenUserData } from "./interface/refresh-token-user.interface";
import { AccessTokenUserData } from "./interface/access-token-user.interface";
import { Role } from "@prisma/client";
import { UsersService } from "../users/users.service";

@Injectable()
export class AuthenticationService {
    constructor(
        private jwtService: JwtService,
        @Inject(jwtConfig.KEY)
        private jwtConfiguration: ConfigType<typeof jwtConfig>,
        private usersService: UsersService
    ) {}

    async generateTokens(userId: string, userEmail: string, userRole: Role) {
        const [accessToken, refreshToken] = await Promise.all([
            this.signToken<Partial<AccessTokenUserData>>(
                userId,
                this.jwtConfiguration.accessTokenTtl,
                { email: userEmail, role: userRole.name }
            ),
            this.signToken<Partial<RefreshTokenUserData>>(
                userId,
                this.jwtConfiguration.refreshTokenTtl
            ),
        ]);
        return { accessToken, refreshToken };
    }

    async refreshTokens(_refreshToken: string) {
        try {
            const { id } = await this.verifyRefreshToken(_refreshToken);
            const user = await this.usersService.getUserById(id);
            const existingRefreshToken = user.refreshTokens.find(
                (token) => token.token === _refreshToken
            );
            if (!existingRefreshToken) {
                throw new UnauthorizedException();
            }
            const { accessToken, refreshToken } = await this.generateTokens(
                user.id,
                user.email,
                user.role
            );
            await this.usersService.updateRefreshToken(
                user.id,
                _refreshToken,
                refreshToken
            );
            return { accessToken, refreshToken };
        } catch (error) {
            throw new UnauthorizedException();
        }
    }

    private async signToken<T>(userId: string, expiresIn: number, payload?: T) {
        return await this.jwtService.signAsync(
            { id: userId, ...payload },
            {
                secret: this.jwtConfiguration.secret,
                issuer: this.jwtConfiguration.issuer,
                audience: this.jwtConfiguration.audience,
                expiresIn,
            }
        );
    }

    private async verifyRefreshToken(token: string) {
        return await this.jwtService.verifyAsync<RefreshTokenUserData>(token, {
            secret: this.jwtConfiguration.secret,
            audience: this.jwtConfiguration.audience,
            issuer: this.jwtConfiguration.issuer,
        });
    }
}
