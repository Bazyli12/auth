import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { compare } from "bcrypt";
import { AuthenticationService } from "../authentication.service";
import { Request } from "express";
import { UsersService } from "../../users/users.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, "local") {
    constructor(
        private authenticationService: AuthenticationService,
        private usersService: UsersService
    ) {
        super({
            passReqToCallback: true,
            usernameField: "email",
            passwordField: "password",
        });
    }

    async validate(req: Request, email: string, password: string) {
        const user = await this.usersService.getUserByEmail(email);
        if (!user) {
            throw new UnauthorizedException("Invalid credentials");
        }

        const isPasswordValid = await compare(password, user.password.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException("Invalid credentials");
        }

        console.log(`[AuthService] Logged in user ${user.email} (${user.id})`);

        const { accessToken, refreshToken } =
            await this.authenticationService.generateTokens(
                user.id,
                user.email,
                user.role
            );

        await this.usersService.createRefreshToken(user.id, refreshToken);

        return { accessToken, refreshToken };
    }
}
