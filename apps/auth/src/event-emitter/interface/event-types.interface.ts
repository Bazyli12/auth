export interface EventPayloads {
    "user.reset-password": { name: string; email: string; otp: string };
    "user.verify-email": { name: string; email: string; link: string };
    "user.change-email": { name: string; email: string; otp: string };
    "user.contact-owner": { phone: string; message: string };
    "user.reservation-request": { phone: string; email: string };
    "user.reservation-cancellation": { phone: string; email: string };
}
