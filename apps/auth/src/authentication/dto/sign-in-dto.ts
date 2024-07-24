import { MaxLength, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SignInDto {
    @ApiProperty({ required: true })
    @MinLength(4)
    @MaxLength(32)
    email: string;

    @ApiProperty({ required: true })
    @MinLength(6)
    @MaxLength(32)
    password: string;
}
