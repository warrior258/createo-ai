export interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    locale?: string;
}

export interface UserData {
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified: boolean;
}

export interface JWTPayload {
    userId: string;
    email: string;
}

export interface GoogleTokens {
    access_token: string;
    refresh_token?: string;
    scope: string;
    id_token?: string;
    token_type: string;
    expiry_date: number;
}

export interface StoredTokens {
    id: number;
    googleId: string;
    accessToken: string;
    refreshToken: string;
    refresh_expiry: Date;
}

export enum Platform {
    YouTube = "youtube",
    Facebook = "facebook",
    Instagram = "instagram",
}