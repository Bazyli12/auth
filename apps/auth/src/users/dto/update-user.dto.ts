import { IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserDto {
    @IsString()
    @IsOptional()
    @MaxLength(32)
    firstname?: string;

    @IsString()
    @IsOptional()
    @MaxLength(32)
    surname?: string;
}
