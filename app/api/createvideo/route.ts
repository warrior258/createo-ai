// sk_c25587ab46d1df0347d9a2001ebaa9ad5d099ee16835bcba
import { ElevenLabsClient } from "elevenlabs";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { Readable } from "stream";
import { execSync } from "child_process";
import { exec } from 'child_process';
import { v2 as cloudinary } from 'cloudinary';
import { db, user_videos } from "@/app/utils/dbconnect";
import { getCurrentUser } from "@/app/utils/auth";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface Scene {
    scene: number;
    script: string;
    image_prompt: string;
    style: string;
    mood: string;
}

interface VideoScript {
    image: string;
    dialog: string;
    duration?: number;
}

const userPromptSchema = z.object({
    prompt: z.string(),
});

// const testData = [
//     {
//         "image": "public/images/image1.jpeg",
//         "dialog": "Soldier Jake wakes up in a peaceful village, confused by the serene surroundings. He doesn't recognize anything.",
//     },
//     {
//         "image": "public/images/image2.jpeg",
//         "dialog": "He approaches a kind villager, asking about the war. The villager smiles, puzzled—war? What is that?",
//     },
//     {
//         "image": "public/images/image3.jpeg",
//         "dialog": "Desperately searching, Jake discovers an old photo of soldiers. He feels a sense of connection but can't explain it.",
//     }
// ]

type UserPromptDataType = z.infer<typeof userPromptSchema>;

export async function GET(request: Request) {

    const { searchParams } = new URL(request.url);
    const prompt = searchParams.get("prompt");

    if (!prompt) {
        return new Response("Missing prompt parameter", { status: 400 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser?.userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // const promptData: UserPromptDataType = await request.json();
                // const parsedData = userPromptSchema.parse(promptData);

                controller.enqueue(encoder.encode("data: Genrating script\n\n"));
                const scenes = await GenerateScript(prompt);

                controller.enqueue(encoder.encode("data: Genrating images\n\n"));
                const videoScript = await CreateImages(scenes);

                console.log(videoScript)
                
                const videoText = scenes.map((scene) => scene.script).join(" ");

                controller.enqueue(encoder.encode("data: Gernating Audio\n\n"));
                await GenerateAudio(videoText);
                // await new Promise((resolve) => setTimeout(resolve, 5000));

                const videoImagesDir = path.join(process.cwd(), 'remotion');
                // Ensure the directory exists, create if not
                if (!fs.existsSync(videoImagesDir)) {
                    fs.mkdirSync(videoImagesDir, { recursive: true });
                }

                const jsonFilePath = path.join(videoImagesDir, 'videoScriptData.json');
                fs.writeFileSync(jsonFilePath, JSON.stringify(videoScript, null, 2));


                controller.enqueue(encoder.encode("data: Gernating Video\n\n"));
                await CreateVideo(currentUser.userId);

                controller.enqueue(encoder.encode("data: completed\n\n"));


                controller.close(); // Close the connection
            } catch (error) {
                controller.enqueue(encoder.encode(`data: Error: ${error}\n\n`));
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}


// export async function POST(request: Request) {
//     try {
//         const promptData: UserPromptDataType = await request.json();
//         const parsedData = userPromptSchema.parse(promptData);

//         const data = await GenerateScript(parsedData.prompt);
//         // await CreateVideo(testData);

//         const videoImagesDir = path.join(process.cwd(), 'remotion');
    
//         // Ensure the directory exists, create if not
//         if (!fs.existsSync(videoImagesDir)) {
//             fs.mkdirSync(videoImagesDir, { recursive: true });
//         }
        
//         // Define the file path where the JSON file will be saved
//         const jsonFilePath = path.join(videoImagesDir, 'videoScriptData.json');
        
//         // Write the data to a JSON file
//         fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2));
        
//         return NextResponse.json({
//             status: "success",
//             data: data,
//         });

//     } catch (error) {
//         if (error instanceof z.ZodError) {
//             return NextResponse.json(
//                 {
//                     status: "error",
//                     message: "Validation failed",
//                     errors: error.errors,
//                 },
//                 { status: 400 }
//             );
//         }

//         return NextResponse.json(
//             {
//                 status: "error",
//                 message: error instanceof Error ? error.message : "Unknown error",
//             },
//             { status: 500 }
//         );
//     }
// }

async function GenerateScript(prompt: string): Promise<Scene[]> {
    
    try {
        // const sceneGenerationPrompt = `
        //     Role: Generate concise scripts and aligned image prompts based on user input.

        //     Workflow
        //     1. Receive User Prompt
        //     Input: Text prompt (e.g., "A shy inventor builds a robot friend").
        //     Action: Identify core elements (theme, characters, setting).

        //     2. Generate Concise Script
        //     Requirements:
        //     Length: 30-second video (5-6 scenes).
        //     Character Limit: STRICT 500-600 characters total across all scenes combined.

        //     Structure:
        //     {
        //     "scenes": [
        //         {
        //         "scene": 1,
        //         "script": "[Brief intro text]",
        //         "image_prompt": "[Scene description with character details]",
        //         "style": "[Art style]",
        //         "mood": "[Color/mood]"
        //         },
        //         // Additional scenes (5-6 total)
        //     ],
        //     "total_character_count": 0 // Will be calculated
        //     }

        //     Rules:
        //     - Maintain consistent character appearance across all scenes
        //     - Each script must be concise (80-120 characters per scene)
        //     - Link image prompts directly to script lines
        //     - Count and verify total script character count before returning (500-600 total)

        //     3. Create Image Prompts
        //     Each image_prompt must include:
        //     - Scene action from the script
        //     - Character's appearance (consistent descriptors)
        //     - Visual style and mood

        //     4. Quality Standards
        //     - Consistency: Same character attributes in all scenes
        //     - Alignment: Image prompt directly matches script action
        //     - Storytelling: Create a complete narrative arc across 5-6 scenes
        //     - Style: Maintain consistent art style across all images

        //     Example Execution (500-600 characters total):
        //     User Prompt: "story of a boy rajesh who twerk aggressively"

        //     Output:
        //     {
        //     "scenes": [
        //         {
        //         "scene": 1,
        //         "script": "Shy Rajesh, a college freshman, harbors a secret talent—he's an extraordinary twerker with moves that defy physics.",
        //         "image_prompt": "Indian college student Rajesh in blue hoodie and jeans, looking nervous but with hidden confidence, standing in a dorm room",
        //         "style": "Cartoonish",
        //         "mood": "Playful"
        //         },
        //         {
        //         "scene": 2,
        //         "script": "During the campus talent show auditions, his friends dare him to showcase his skills. Rajesh hesitates, then agrees.",
        //         "image_prompt": "Rajesh in same blue hoodie looking anxious as friends encourage him, standing near a stage with audition sign",
        //         "style": "Cartoonish",
        //         "mood": "Tense"
        //         },
        //         {
        //         "scene": 3,
        //         "script": "The music drops. Rajesh transforms, unleashing a twerk-storm that makes the cafeteria tables vibrate. Students gasp.",
        //         "image_prompt": "Rajesh in mid-twerk, same blue hoodie, on cafeteria table with amazed students recording on phones",
        //         "style": "Cartoonish",
        //         "mood": "Energetic"
        //         },
        //         {
        //         "scene": 4,
        //         "script": "His aggressive moves literally shake the building. Ceiling tiles fall. A stern-faced Professor Kumar enters the chaos.",
        //         "image_prompt": "Rajesh in aggressive twerk pose, same outfit, with ceiling tiles falling and shocked Professor Kumar at doorway",
        //         "style": "Cartoonish",
        //         "mood": "Dramatic"
        //         },
        //         {
        //         "scene": 5,
        //         "script": "Just when everyone expects trouble, Kumar breaks into applause—turns out he was a breakdance champion in the '90s!",
        //         "image_prompt": "Professor Kumar clapping enthusiastically, Rajesh in same blue hoodie looking surprised with mouth open",
        //         "style": "Cartoonish",
        //         "mood": "Surprising"
        //         },
        //         {
        //         "scene": 6,
        //         "script": "One month later: Rajesh leads the university's first twerk club, with Professor Kumar as faculty advisor.",
        //         "image_prompt": "Rajesh in same blue hoodie leading a group of students twerking, Professor Kumar nodding approvingly in background",
        //         "style": "Cartoonish",
        //         "mood": "Celebratory"
        //         }
        //     ],
        //     "total_character_count": 578
        //     }

        //     Key Improvements:
        //     1. Expanded Character Count - Scripts now total 500-600 characters (example: 578)
        //     2. Increased Scene Count - Now featuring 5-6 scenes for fuller storytelling
        //     3. Complete Narrative Arc - Introduction, conflict, climax, and resolution
        //     4. Specific Character Details - Consistent clothing/appearance across all scenes
        //     5. Maintained Character Counter - For verification of 500-600 character limit

        //     Here is the prompt create story for it - ${prompt}
        // `;


        const sceneGenerationPrompt = `
            Role: Generate concise scripts and aligned image prompts based on user input.

            Workflow
            1. Receive User Prompt
            Input: Text prompt (e.g., "A shy inventor builds a robot friend").
            Action: Identify core elements (theme, characters, setting).

            2. Generate Concise Script
            Requirements:
            Length: 30-second video (5-6 scenes).
            Character Limit: STRICT 500-600 characters total across all scenes combined.

            Structure:
            {
            "scenes": [
                {
                "scene": 1,
                "script": "[Brief intro text]",
                "image_prompt": "[Scene description with character details]",
                "style": "[Art style]",
                "mood": "[Color/mood]"
                },
                // Additional scenes (5-6 total)
            ],
            "total_character_count": 0 // Will be calculated
            }

            Rules:
            - Maintain consistent character appearance across all scenes
            - Each script must be concise (80-120 characters per scene)
            - Link image prompts directly to script lines
            - Count and verify total script character count before returning (500-600 total)

            3. Create Image Prompts
            Each image_prompt must include:
            - Scene action from the script
            - Character's appearance (consistent descriptors)
            - Visual style and mood

            4. Quality Standards
            - Consistency: Same character attributes in all scenes
            - Alignment: Image prompt directly matches script action
            - Storytelling: Create a complete narrative arc across 5-6 scenes
            - Style: Maintain consistent art style across all images

            5. Output Format
            - Return ONLY the JSON object without any introductory text
            - Do not include phrases like "here is your script" or any other wrapper text
            - The JSON must be properly formatted and ready for parsing

            Example Execution (500-600 characters total):
            User Prompt: "story of a boy rajesh who twerk aggressively"

            Output:
            {
            "scenes": [
                {
                "scene": 1,
                "script": "Shy Rajesh, a college freshman, harbors a secret talent—he's an extraordinary twerker with moves that defy physics.",
                "image_prompt": "Indian college student Rajesh in blue hoodie and jeans, looking nervous but with hidden confidence, standing in a dorm room",
                "style": "Cartoonish",
                "mood": "Playful"
                },
                {
                "scene": 2,
                "script": "During the campus talent show auditions, his friends dare him to showcase his skills. Rajesh hesitates, then agrees.",
                "image_prompt": "Rajesh in same blue hoodie looking anxious as friends encourage him, standing near a stage with audition sign",
                "style": "Cartoonish",
                "mood": "Tense"
                },
                {
                "scene": 3,
                "script": "The music drops. Rajesh transforms, unleashing a twerk-storm that makes the cafeteria tables vibrate. Students gasp.",
                "image_prompt": "Rajesh in mid-twerk, same blue hoodie, on cafeteria table with amazed students recording on phones",
                "style": "Cartoonish",
                "mood": "Energetic"
                },
                {
                "scene": 4,
                "script": "His aggressive moves literally shake the building. Ceiling tiles fall. A stern-faced Professor Kumar enters the chaos.",
                "image_prompt": "Rajesh in aggressive twerk pose, same outfit, with ceiling tiles falling and shocked Professor Kumar at doorway",
                "style": "Cartoonish",
                "mood": "Dramatic"
                },
                {
                "scene": 5,
                "script": "Just when everyone expects trouble, Kumar breaks into applause—turns out he was a breakdance champion in the '90s!",
                "image_prompt": "Professor Kumar clapping enthusiastically, Rajesh in same blue hoodie looking surprised with mouth open",
                "style": "Cartoonish",
                "mood": "Surprising"
                },
                {
                "scene": 6,
                "script": "One month later: Rajesh leads the university's first twerk club, with Professor Kumar as faculty advisor.",
                "image_prompt": "Rajesh in same blue hoodie leading a group of students twerking, Professor Kumar nodding approvingly in background",
                "style": "Cartoonish",
                "mood": "Celebratory"
                }
            ],
            "total_character_count": 578
            }

            Here is the prompt create story for it - ${prompt}
            `;
        console.log("Generation Scenes....");
        const url = `https://text.pollinations.ai/${encodeURIComponent(sceneGenerationPrompt)}`;
        const res = await fetch(url, { cache: "no-store" });

        if (!res.ok) {
            throw new Error("Failed to fetch script");
        }

        const data = await res.text();
        const cleanedData = data.trim().replace(/^```json|```$/g, ""); // Ensure valid JSON
        const parsedData = JSON.parse(cleanedData);
        const scenes: Scene[] = parsedData.scenes;

        console.log("Scenes", scenes);

        return scenes;
        
    } catch (error) {
        console.error("Error generating script:", error);
        throw new Error("Failed to generate script");
    }
}

async function CreateImages(scenes: Scene[]): Promise<VideoScript[]> {
    const videoScript: VideoScript[] = [];
    
    const videoImagesDir = path.join(process.cwd(), 'public');
        

    try {

        for (let i = 0; i < scenes.length; i++) {

            let img = "";
            const scene = scenes[i];
            const words = scene.script.split(/\s+/).length;

            const query = `${scene.image_prompt} --style=${scene.style} --mood=${scene.mood}`;
            const res = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(query)}`, { cache: "no-store" });

            if (!res.ok) {
                console.log(`Failed to fetch image with status code - ${res.status}`);
                img = "";
            }

            const contentType = res.headers.get('Content-Type');
            if (!contentType || !contentType.startsWith('image/')) {
                console.error("Response is not an image. Content-Type:", contentType);
                img = "";
            }

            console.log("Image Generated");

            if (!fs.existsSync(videoImagesDir)) {
                fs.mkdirSync(videoImagesDir, { recursive: true });
            }
    
            // 5. Generate a unique filename for the image
            const filename = `image-${Date.now()}.png`;
            const imagePath = path.join(videoImagesDir, filename);
    
            // 6. Check if res.body is not null and read the response as a binary array buffer
            const buffer = await res.arrayBuffer(); // Read the entire binary data into an array buffer
    
            // 7. Create a write stream to save the binary data to the file system
            fs.writeFileSync(imagePath, Buffer.from(buffer));

            img = filename;

            videoScript.push({image: img, dialog: scene.script});

            // const dialog = scene.script;
            // const image = await CreateImages(scene);


            // videoScript.push({image: image, dialog: dialog, duration: estimatedDuration})
        }

        return videoScript;

        
        // if (fs.existsSync(videoImagesDir)) {
        //     const files = fs.readdirSync(videoImagesDir);
        //     for (const file of files) {
        //         const filePath = path.join(videoImagesDir, file);
        //         if (fs.lstatSync(filePath).isFile()) {
        //             fs.unlinkSync(filePath);  // Delete the file
        //         }
        //     }
        //     console.log("All old images have been deleted from 'public/video-images'.");
        // }

        // 2. Generate the query to fetch the image
        // const query = `${scene.image_prompt} --style=${scene.style} --mood=${scene.mood}`;
        // const res = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(query)}`, { cache: "no-store" });

        // if (!res.ok) {
        //     console.log(`Failed to fetch image with status code - ${res.status}`);
        //     return "";
        // }

        // // 3. Validate that the response is an image
        // const contentType = res.headers.get('Content-Type');
        // if (!contentType || !contentType.startsWith('image/')) {
        //     console.error("Response is not an image. Content-Type:", contentType);
        //     return "";
        // }

        // console.log("Image Generated");

        // // 4. Ensure the video-images directory exists
        // if (!fs.existsSync(videoImagesDir)) {
        //     fs.mkdirSync(videoImagesDir, { recursive: true });
        // }

        // // 5. Generate a unique filename for the image
        // const filename = `image-${Date.now()}.png`;
        // const imagePath = path.join(videoImagesDir, filename);

        // // 6. Check if res.body is not null and read the response as a binary array buffer
        // const buffer = await res.arrayBuffer(); // Read the entire binary data into an array buffer

        // // 7. Create a write stream to save the binary data to the file system
        // fs.writeFileSync(imagePath, Buffer.from(buffer)); // Convert the array buffer to a Buffer and write to file

        // // 8. After the image is saved, return the relative path
        // return filename;

    } catch (error) {
        console.error("Failed to fetch or save the image:", error);
        throw new Error("Failed to fetch image");
    }
}

async function GenerateAudio(text: string) {
    try {
        const client = new ElevenLabsClient({
            // apiKey: "sk_c25587ab46d1df0347d9a2001ebaa9ad5d099ee16835bcba"
            apiKey: process.env.ELEVEN_LAB_API_KEY
        });        
        const audioStream = await client.textToSpeech.convert(
            "pFZP5JQG7iQjIQuC4Bku",
            {
                output_format: "mp3_44100_128",
                text: text,
                model_id: "eleven_multilingual_v2"
            }
        );

        const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            return Buffer.concat(chunks);
        };

        const audioBuffer = await streamToBuffer(audioStream);

        const fileName = "speech.mp3";
        const filePath = path.join(process.cwd(), "public", fileName);

        // Save file to `public/`
        fs.writeFileSync(filePath, audioBuffer);

        console.log("speech created");
    } catch (error) {
        console.log(error);
    }
}

// Constants
const TOTAL_AUDIO_DURATION = 47 * 30; // 1410 frames (47s * 30fps)
const FPS = 30;
const WORDS_PER_SECOND = 2.5;
const MIN_DURATION = 60; // Minimum frames per scene
const MAX_DURATION = 240; // Maximum frames per scene

const getRawDuration = (text: string) => {
    const wordCount = text.split(" ").length;
    const estimatedSeconds = wordCount / WORDS_PER_SECOND;
    return Math.min(Math.max(Math.round(estimatedSeconds * FPS), MIN_DURATION), MAX_DURATION);
};

async function CreateVideo(userId: string): Promise<boolean> {
    try {
        const videoPath = path.join(process.cwd(), 'out', 'Empty.mp4');
        const command = `npx remotion render Empty --concurrency=8 --codec=h264 --disable-web-security --disable-composition-caching=false`;

        console.log("Rendering video...");
        await runRenderCommand(command); // ✅ Wait for the video to finish

        const cloudinaryResponse = await cloudinary.uploader.upload(videoPath, {
            resource_type: 'video',
            folder: 'remotion-videos', // Optional: Specify a folder in Cloudinary
        });

        console.log(cloudinaryResponse);

        await db.insert(user_videos)
            .values({
                cloudinaryPublicId: cloudinaryResponse.public_id,
                cloudinaryUrl: cloudinaryResponse.secure_url,
                duration: cloudinaryResponse.duration,
                width: cloudinaryResponse.width,
                height: cloudinaryResponse.height,
                format: cloudinaryResponse.format,
                bytes: cloudinaryResponse.bytes,
                googleId: userId
            });

        cleanPublicDir();

        return true;
    
    } catch (error) {
        console.error("Error occurred:", error);
        return false;
    }

}

function runRenderCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error rendering video: ${stderr}`);
        reject(new Error("Failed to render video"));
      } else {
        console.log(`Video rendered: ${stdout}`);
        resolve(stdout);
      }
    });
  });
}

function cleanPublicDir() {
  const publicDir = path.join(process.cwd(), "public");

  if (!fs.existsSync(publicDir)) return;

  fs.readdirSync(publicDir).forEach((file) => {
      if (file !== "404.jpg" && file !== "speech.mp3") {
          const filePath = path.join(publicDir, file);
          fs.rmSync(filePath, { recursive: true, force: true }); // Delete file or folder
      }
  });

  console.log("✅ Cleaned public directory, keeping only 404.jpg and speech.mp3");
}