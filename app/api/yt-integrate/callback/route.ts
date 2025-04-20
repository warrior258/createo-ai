import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { db, user_youtube } from "@/app/utils/dbconnect";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { getCurrentUser } from "@/app/utils/auth";
import { eq } from "drizzle-orm";

const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.YT_REDIRECT_URI
);


export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.json({ success: false, error: "Missing authorization code" }, { status: 400 });
    }

    try {
        
        const currentUser = await getCurrentUser();

        if(!currentUser){
            throw new Error("Missing required tokens");
        }
        
        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        
        // Make sure we have the required tokens
        if (!tokens.access_token || !tokens.refresh_token) {
            throw new Error("Missing required tokens");
        }

        console.log(tokens)

        const existingUser = await db
        .select()
        .from(user_youtube)
        .where(eq(user_youtube.googleId, currentUser.userId))
        .limit(1);

        if (existingUser.length > 0) {
            await db.update(user_youtube)
                .set({
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                refresh_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                })
                .where(eq(user_youtube.googleId, currentUser.userId));
        
            console.log("User updated:", currentUser.userId);
        } else {
            await db.insert(user_youtube).values({
                googleId: currentUser.userId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                refresh_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            });

        }
        
        console.log("Tokens upserted to database.");
        
        
        // ✅ Redirect user to the /integrations page after successful authentication
        return NextResponse.redirect("http://localhost:3000/integrations");
    } catch (error) {
        console.error("Error in OAuth callback:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Failed to authenticate or store tokens" 
        }, { status: 500 });
    }
}