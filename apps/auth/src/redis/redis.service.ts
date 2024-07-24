import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { RedisRepository } from "./redis.repository";
import { SignUpDto } from "../authentication/dto/sign-up-dto";

@Injectable()
export class RedisService {
    constructor(
        @Inject(RedisRepository)
        private readonly redisRepository: RedisRepository
    ) {}

    async generateChangeEmailCode(
        userId: string,
        newEmail: string
    ): Promise<string> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redisRepository.setWithExpiry(
            "CHANGE_EMAIL",
            code,
            JSON.stringify({ userId, newEmail }),
            300
        );
        return code;
    }

    async getChangeEmailData(
        code: string
    ): Promise<{ userId: string; newEmail: string } | null> {
        const data = await this.redisRepository.get("CHANGE_EMAIL", code);
        return data ? JSON.parse(data) : null;
    }

    async generateResetPasswordCode(
        userId: string,
        userEmail: string
    ): Promise<string> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redisRepository.setWithExpiry(
            "RESET_PASSWORD",
            code,
            userId,
            300
        );

        await this.addResetPasswordUserAttempt(userEmail);
        return code;
    }

    async getResetPasswordUserId(code: string): Promise<string | null> {
        return await this.redisRepository.get("RESET_PASSWORD", code);
    }

    async addResetPasswordUserAttempt(userEmail: string): Promise<void> {
        const attempts = JSON.parse(
            await this.getResetPasswordUserAttempts(userEmail)
        );
        await this.redisRepository.setWithExpiry(
            "RESET_PASSWORD_ATTEMPTS",
            userEmail,
            attempts
                ? JSON.stringify([
                      {
                          date: new Date(),
                      },
                      ...attempts,
                  ])
                : JSON.stringify([
                      {
                          date: new Date(),
                      },
                  ]),
            1800
        );
    }

    async getResetPasswordUserAttempts(
        userEmail: string
    ): Promise<string | null> {
        return await this.redisRepository.get(
            "RESET_PASSWORD_ATTEMPTS",
            userEmail
        );
    }

    async getResetPasswordUserAttemptsNumber(
        userEmail: string
    ): Promise<number | null> {
        const attempts = JSON.parse(
            await this.redisRepository.get("RESET_PASSWORD_ATTEMPTS", userEmail)
        );
        return attempts ? attempts.length : 0;
    }

    async deleteResetPasswordCode(code: string): Promise<void> {
        await this.redisRepository.delete("RESET_PASSWORD", code);
    }

    async createTempUser(signUpDto: SignUpDto): Promise<string> {
        const code = await this.generateVerifyEmailCode(signUpDto.email);
        await this.redisRepository.setWithExpiry(
            "TEMP_USER",
            code,
            JSON.stringify(signUpDto),
            300
        );
        return code;
    }

    async getTempUser(verifyEmailCode: string): Promise<SignUpDto | null> {
        const user = await this.redisRepository.get(
            "TEMP_USER",
            verifyEmailCode
        );
        return user ? JSON.parse(user) : null;
    }

    private async generateVerifyEmailCode(userEmail: string): Promise<string> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        await this.redisRepository.setWithExpiry(
            "VERIFY_EMAIL",
            code,
            userEmail,
            300
        );
        return code;
    }

    async getVerifyEmailUserEmail(code: string): Promise<string | null> {
        return await this.redisRepository.get("VERIFY_EMAIL", code);
    }

    async deleteVerifyEmailCode(code: string): Promise<void> {
        await this.redisRepository.delete("VERIFY_EMAIL", code);
    }

    async deleteTempUser(code: string): Promise<void> {
        await this.redisRepository.delete("TEMP_USER", code);
    }

    private generateRandomCode(length: number) {
        let code = "";
        const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            code += characters[randomIndex];
        }

        return code;
    }
}
