"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Eye, Loader2, Plus, Settings, User, Video, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Channel {
    id: string;
    title: string;
    thumbnail: string;
    subscribers: string;
    views: string;
}

export default function Integrations() {
    const [loading, setLoading] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [channelData, setChannelData] = useState<Channel | null>(null);

    const connectYoutube = async () => {
        setAuthLoading(true);
        try {
            const res = await fetch("/api/yt-integrate/auth");
            const data = await res.json();

            if (data.success) {
                window.location.href = data.url; // Redirect user to Google OAuth
            } else {
                console.error("OAuth error:", data.error);
            }
        } catch (error) {
            console.error("Request failed:", error);
        } finally {
            setAuthLoading(false);
        }
    };

    const disconnectYoutube = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/yt-integrate/revoke", {method: "POST"});
            if(res.ok){
                getIntegration();
            }
        } catch (error) {
            console.error("Request failed:", error);
        } finally {
            setLoading(true);
        }
    }

    const getIntegration = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/yt-integrate");

            const data = await res.json();

            if(res.ok){
                setChannelData(data.channel);
                setIsConnected(true);
            }else{
                setChannelData(null);
                setIsConnected(false);
            }


        } catch (error) {
            console.error("Request failed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getIntegration()
    }, [])

    if(loading) {
        return <p>Loading...</p>
    }

    return (
        <section className="w-full p-4">
            <div className="mb-10">
                <h1 className="text-2xl font-bold">Integrations</h1>
                <p className="text-sm text-muted-foreground">
                    Connect your YouTube account to manage your channel
                </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-red-500/10">
                    <Youtube className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                    <h3 className="font-medium">YouTube</h3>
                    <p className="text-sm text-muted-foreground">
                        {isConnected 
                        ? "Connected to your YouTube channel" 
                        : "Connect to manage your content"}
                    </p>
                    </div>
                </div>
                
                <Button
                    size="sm"
                    variant={isConnected ? "outline" : "default"}
                    className={cn("flex items-center gap-2", 
                    isConnected ? "border-green-500 text-green-600 hover:bg-green-50" : ""
                    )}
                    onClick={isConnected ? disconnectYoutube : connectYoutube}
                    disabled={authLoading}
                >
                    {authLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Connecting...
                        </>
                    ) : (
                    <>
                        {isConnected ? (
                        <>
                            <Check className="h-4 w-4" />
                            Connected
                        </>
                        ) : (
                        <>
                            Connect
                        </>
                        )}
                    </>
                    )}
                </Button>
                </div>

            {isConnected && channelData !== null && (
                <Card className="w-full max-w-md overflow-hidden shadow-lg hover:shadow-xl transition-shadow mt-10">
                    <CardHeader className="p-0 relative">
                    <div className="relative h-40 bg-gradient-to-r from-red-500 to-red-700">
                        <Avatar className="absolute -bottom-12 left-4 w-24 h-24 border-4 border-background">
                        <AvatarImage src={channelData.thumbnail} alt={channelData.title} />
                        <AvatarFallback className="bg-red-500 text-white">
                            {channelData.title.charAt(0)}
                        </AvatarFallback>
                        </Avatar>
                    </div>
                    </CardHeader>
                    <CardContent className="pt-16 pb-6 px-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                        <h3 className="text-lg font-bold line-clamp-1">{channelData.title}</h3>
                        <p className="text-sm text-muted-foreground">@{channelData.id}</p>
                        </div>
                        <Button variant="destructive" size="sm">
                        <Youtube className="mr-2 h-4 w-4" />
                        YouTube
                        </Button>
                    </div>
            
                    <div className="flex justify-between text-sm">
                        <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{parseInt(channelData.subscribers).toLocaleString()} subscribers</span>
                        </div>
                        <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{parseInt(channelData.views).toLocaleString()} views</span>
                        </div>
                    </div>
                    </CardContent>
              </Card>
            )}
        </section>
    );
}
