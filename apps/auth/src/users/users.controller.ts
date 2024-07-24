import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Post,
    Put,
    Res,
} from "@nestjs/common";
import { ApiBearerAuth, ApiParam, ApiTags } from "@nestjs/swagger";
import { ChangeEmailDto } from "./dto/change-email.dto";
import { CurrentUser } from "../authentication/decorator/current-user.decorator";
import { AccessTokenUserData } from "../authentication/interface/access-token-user.interface";
import { UsersService } from "./users.service";
import { RedisService } from "../redis/redis.service";
import { TypedEventEmitter } from "../event-emitter/typed-event-emitter.class";
import { Response } from "express";
import { Public } from "../authentication/decorator/public.decorator";
import { UpdateUserDto } from "./dto/update-user.dto";

@ApiBearerAuth()
@ApiTags("Users")
@Controller("users")
export class UsersController {
    constructor(
        private usersService: UsersService,
        private redisService: RedisService,
        private readonly eventEmitter: TypedEventEmitter
    ) {}

    @Get("me")
    async getMe(@CurrentUser() currentUser: AccessTokenUserData) {
        return this.usersService.getUserById(currentUser.id);
    }

    @Put()
    updateUserDetails(
        @CurrentUser() currentUser: AccessTokenUserData,
        @Body() updateUserDto: UpdateUserDto
    ) {
        return this.usersService.updateUserDetails(updateUserDto, currentUser);
    }

    @Post("/email/change")
    async changeEmail(
        @Body() changeEmailDto: ChangeEmailDto,
        @CurrentUser() user: AccessTokenUserData,
        @Res() res: Response
    ) {
        const existingUser = await this.usersService.getUserByEmail(
            changeEmailDto.newEmail
        );
        if (existingUser) {
            return res
                .status(HttpStatus.CONFLICT)
                .json("User with this email already exists");
        }

        const code = await this.redisService.generateChangeEmailCode(
            user.id,
            changeEmailDto.newEmail
        );
        this.eventEmitter.emit("user.change-email", {
            name: user.email.split("@")[0],
            email: changeEmailDto.newEmail,
            otp: code,
        });
        return res
            .status(HttpStatus.OK)
            .json(`${changeEmailDto.newEmail} verification code sent`);
    }

    @Public()
    @ApiParam({ name: "code", required: true })
    @Get("/email/change/:code")
    async verifyEmailChange(@Res() res: Response, @Param("code") code: string) {
        const data = await this.redisService.getChangeEmailData(code);
        if (!data) {
            return res.status(HttpStatus.BAD_REQUEST).json("Invalid code");
        }
        await this.usersService.changeEmail(data.userId, data.newEmail);
        return res.status(HttpStatus.OK).json("Email updated");
    }

    @Delete("/delete")
    async removeAccount(@CurrentUser() user: AccessTokenUserData) {
        return await this.usersService.deleteUser(user.id);
    }
}
