import {
    Body,
    Controller,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    Req,
    Res,
    UseGuards,
} from "@nestjs/common";
import { SignUpDto } from "./dto/sign-up-dto";
import { Request, Response } from "express";
import { LocalAuthGuard } from "./guard/local-auth.guard";
import { Public } from "./decorator/public.decorator";
import { RefreshTokenGuard } from "./guard/refresh-token.guard";
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from "@nestjs/swagger";
import { SignInDto } from "./dto/sign-in-dto";
import { UsersService } from "../users/users.service";
import { CurrentUser } from "./decorator/current-user.decorator";
import { AccessTokenUserData } from "./interface/access-token-user.interface";
import { ChangePasswordDto } from "./dto/change-password-dto";
import { ResetPasswordCodeDto } from "./dto/reset-password-code-dto";
import { TypedEventEmitter } from "../event-emitter/typed-event-emitter.class";
import { RedisService } from "../redis/redis.service";

@ApiBearerAuth()
@ApiTags("Auth")
@Controller("auth")
export class AuthenticationController {
    constructor(
        private usersService: UsersService,
        private redisService: RedisService,
        private readonly eventEmitter: TypedEventEmitter
    ) {}

    @UseGuards(LocalAuthGuard)
    @Public()
    @Post("sign-in")
    @ApiBody({ type: SignInDto })
    async signIn(@Req() req: Request, @Res() res: Response) {
        return res.status(HttpStatus.OK).json(req.user);
    }

    @Public()
    @ApiBody({ type: SignUpDto })
    @Post("sign-up")
    async signUp(@Body() signUpDto: SignUpDto, @Res() res: Response) {
        const verifyEmailCode = await this.usersService.createTempUser(
            signUpDto.email,
            signUpDto.password
        );
        this.eventEmitter.emit("user.verify-email", {
            name: signUpDto.email.split("@")[0],
            email: signUpDto.email,
            link: verifyEmailCode,
        });
        return res.status(HttpStatus.OK).json("success");
    }

    @Public()
    @ApiParam({ name: "code", required: true })
    @Get("/verify-email/:code")
    async verifyEmailWithCode(
        @Res() res: Response,
        @Param() params: { code: string }
    ) {
        const userEmail = await this.redisService.getVerifyEmailUserEmail(
            params.code
        );
        if (!userEmail) {
            return res.status(HttpStatus.NOT_FOUND).json("Code not found");
        }
        await this.usersService.createUser(params.code);
        await this.redisService.deleteVerifyEmailCode(params.code);
        await this.redisService.deleteTempUser(params.code);
        return res.status(HttpStatus.OK).json({});
    }

    @Public()
    @UseGuards(RefreshTokenGuard)
    @Post("refresh-tokens")
    async refreshToken(@Req() req: Request, @Res() res: Response) {
        return res.status(HttpStatus.OK).json(req.user);
    }

    @Public()
    @ApiParam({ name: "email", required: true })
    @Get("/reset-password/:email")
    async resetPasswordRequest(
        @Res() res: Response,
        @Param() params: { email: string }
    ) {
        const attempts =
            await this.redisService.getResetPasswordUserAttemptsNumber(
                params.email
            );
        if (attempts >= 5) {
            return res
                .status(HttpStatus.TOO_MANY_REQUESTS)
                .json("Too many requests in a short period of time");
        }

        const user = await this.usersService.getUserByEmail(params.email);
        const generatedOTP = await this.redisService.generateResetPasswordCode(
            user.id,
            params.email
        );
        this.eventEmitter.emit("user.reset-password", {
            name: params.email.split("@")[0],
            email: params.email,
            otp: generatedOTP,
        });
        console.log(attempts);

        return res
            .status(HttpStatus.OK)
            .json(`${params.email} | attempts: ${attempts + 1}`);
    }

    @Public()
    @ApiParam({ name: "code", required: true })
    @Patch("/reset-password/code/:code")
    async resetPasswordWithCode(
        @Res() res: Response,
        @Param() params: { code: string },
        @Body() resetPasswordCodeDto: ResetPasswordCodeDto
    ) {
        const userId = await this.redisService.getResetPasswordUserId(
            params.code
        );
        if (!userId) {
            return res.status(HttpStatus.NOT_FOUND).json("Code not found");
        }
        await this.usersService.updatePassword(
            userId,
            resetPasswordCodeDto.newPassword
        );
        await this.redisService.deleteResetPasswordCode(params.code);
        return res.status(HttpStatus.OK).json("Password updated");
    }

    @Patch("/change-password")
    async changePassword(
        @Body() changePasswordDto: ChangePasswordDto,
        @CurrentUser() user: AccessTokenUserData,
        @Res() res: Response
    ) {
        const newPassword = await this.usersService.changePassword(
            user.id,
            changePasswordDto
        );
        return res
            .status(HttpStatus.OK)
            .json("Password changed at " + newPassword.createdAt);
    }
}
