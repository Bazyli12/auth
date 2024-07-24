import { MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ResetPasswordCodeDto {
    @ApiProperty({ required: true })
    @MinLength(4)
    @MaxLength(32)
    newPassword: string;
}
