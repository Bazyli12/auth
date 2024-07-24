import { MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ChangePasswordDto {
    @ApiProperty({ required: true })
    @MinLength(4)
    @MaxLength(32)
    oldPassword: string;

    @ApiProperty({ required: true })
    @MinLength(4)
    @MaxLength(32)
    newPassword: string;
}
