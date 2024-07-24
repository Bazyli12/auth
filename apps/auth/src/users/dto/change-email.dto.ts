import { IsEmail, MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ChangeEmailDto {
    @ApiProperty({ required: true })
    @IsEmail()
    newEmail: string;
}
