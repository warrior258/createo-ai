"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Player } from '@remotion/player';
import { MyComposition } from "@/remotion/Composition";
import { useVideoContext } from "@/context/VideoScriptContext";
import { toast } from "sonner";

export default function CreateVideo() {
    const [loading, setLoading] = useState<boolean>(false);
    const [prompt, setPrompt] = useState<string | null>(null);
    const { data, setData } = useVideoContext();

    const [status, setStatus] = useState("Waiting...");
    const [isGenerating, setIsGenerating] = useState<boolean>(false);


    const getScenes = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/createvideo", {
                method: "POST",
                body: JSON.stringify({prompt: prompt})
            });

            if(res.ok){
                const data = await res.json();
                setData(data.data);
            }


            // await fetch("/api/render-video", {
            //     method: "POST"
            // });

        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    const startGenration = async () => {
        setIsGenerating(true);
        const eventSource = new EventSource(`/api/createvideo?prompt=${prompt}`);

        eventSource.onmessage = (event) => {
            console.log(event)
            setStatus(event.data);
            if (event.data === "completed") {
                eventSource.close();
                setTimeout(() => {
                    setIsGenerating(false);
                }, 6000)
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
            setStatus("Error");
            setIsGenerating(false);
            toast.error("Generation failed!", {
                description: "The video could not be created. Please try again.",
            });
        };
    }
    

    const handleDownload = async () => {
        try {
        const response = await fetch('/api/render-video', {
            method: 'POST',
        });
        const data = await response.json();
        console.log(data);
        } catch (error) {
        console.error('Error:', error);
        }
    };

    return (
        <section className="w-full p-4">
            <h1 className="text-xl font-bold mb-4">Latest Video Creation</h1>
            {isGenerating ? (
                <div className="flex flex-col items-center">
                    {status === "Genrating script" && <iframe width={300} height={300} src="https://lottie.host/embed/8c3afd67-fed3-4ca4-97c1-b9f25bff5d08/IpIyW5Tnpi.lottie"></iframe>}
                    {status === "Genrating images" && <iframe width={300} height={300} src="https://lottie.host/embed/8c67e25a-4235-42af-8fdc-adc4c3bdf4cd/LB0i3WEHpp.lottie"></iframe>}
                    {status === "Gernating Audio" && <iframe width={300} height={300} src="https://lottie.host/embed/20e0340f-15c5-40af-971d-9130407fe4d8/KwuaPIpltu.lottie"></iframe>}
                    {status === "Gernating Video" && <iframe width={300} height={300} src="https://lottie.host/embed/c5d7e140-c3a9-41fa-aee2-2313bf63c772/Dky5UKwIGH.lottie"></iframe>}
                    {status === "completed" && <iframe width={300} height={300} src="https://lottie.host/embed/cd119f19-7459-42b8-96e8-f7707f155796/jLhMzkEji0.lottie"></iframe>}
                    {status === "Error" && <iframe width={300} height={300} src="https://lottie.host/embed/305db622-0726-4240-978a-d39143ffd816/e6f3yzGVCf.lottie"></iframe>}
                    <p>{status}</p>
                </div>
            ) : (
                <>
                    <div className="mt-10">
                        <Label htmlFor="prompt">Enter Prompt</Label>
                        <Textarea placeholder="Create a story of farmer boy..." id="prompt" onChange={(e) => setPrompt(e.target.value)}/>

                        <div className="flex justify-end">
                            <Button disabled={loading} className="mt-4" onClick={startGenration}>
                                {loading && <Loader2 className="animate-spin" />}
                                Create
                            </Button>
                        </div>
                    </div>

                    {data.length > 0 && 
                        <Player
                            component={MyComposition}
                            durationInFrames={48 * 30} // Adjust dynamically based on content
                            fps={30}
                            compositionWidth={300}
                            compositionHeight={533}
                            inputProps={{ videoScript: data }}
                            controls
                            autoPlay // ✅ Starts playing automatically
                            loop={false} // Optional: set to true for looping
                            style={{
                                objectFit: "cover",
                                borderRadius: 10,
                            }}
                        />
                    }

                    {data.length > 0 && <Button className="mt-4" onClick={handleDownload}>
                        Download
                    </Button>}
                </>
            )}
            
        </section>
    );
}

