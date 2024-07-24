import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { Injectable } from "@nestjs/common";
import { AuthenticationService } from "../authentication.service";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
    Strategy,
    "jwt-refresh"
) {
    constructor(private authenticationService: AuthenticationService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: process.env.JWT_SECRET,
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: any) {
        const currentRefreshToken = req
            .get("Authorization")
            .replace("Bearer", "")
            .trim();
        const { accessToken, refreshToken } =
            await this.authenticationService.refreshTokens(currentRefreshToken);
        return { ...payload, accessToken, refreshToken };
    }
}
