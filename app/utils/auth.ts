import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { JWTPayload } from '../types';

export async function getCurrentUser(): Promise<JWTPayload | null> {
    const token = cookies().get('auth_token')?.value;
    
    if (!token) {
        return null;
    }
    
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const decoded = await jwtVerify(token, secret, {
            algorithms: ['HS256']
        });
        
        return decoded.payload as unknown as JWTPayload;
    } catch (error) {
        return null;
    }
}

export function signOut(): void {
    cookies().delete('auth_token');
}