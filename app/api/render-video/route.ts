// // import { NextResponse } from 'next/server';
// // import { execSync } from "child_process";

// import { NextResponse } from "next/server";


// // export async function POST() {
// //   try {
    
// //     execSync(`npx remotion render Empty output.mp4 --concurrency=8 --codec=h264 --disable-web-security 
// //     --disable-composition-caching=false`);

// //     // Return the local video path to the client
// //     return NextResponse.json({ success: true, videoPath: '/output.mp4' });
// //   } catch (error) {
// //     console.error('Error rendering video:', error);
// //     return NextResponse.json({ success: false, error: 'Failed to render video' }, { status: 500 });
// //   }
// // }

// import { bundle } from '@remotion/bundler';
// import {renderMedia, selectComposition} from '@remotion/renderer';
// import path from 'path';

// export async function POST() {

// //   // The composition you want to render
//   const compositionId = 'Empty';

//   console.log(compositionId)
  
//   console.log('Current working directory:', process.cwd());
//   const entryPointPath = path.resolve(process.cwd(), 'remotion/index.ts');
//   console.log('Resolved entry point path:', entryPointPath);

//   const bundleLocation = await bundle({
//     entryPoint: path.resolve(process.cwd(), 'remotion/index.ts'),
//     // webpackOverride: (config) => {
//     //   return {
//     //     ...config,
//     //     resolve: {
//     //       ...config.resolve,
//     //       extensions: [...(config.resolve?.extensions || []), '.ts', '.tsx']
//     //     },
//     //   };
//     // },
//   });
  

// //   console.log(bundleLocation)
  
// //   // Parametrize the video by passing props to your component.
  const inputProps = {
    "status": "success",
    "data": [
        {
            "image": "https://image.pollinations.ai/prompt/Soldier%20Jake%20in%20a%20worn%20uniform%2C%20looking%20bewildered%2C%20waking%20up%20in%20a%20sunlit%20village%20with%20lush%20greenery%20and%20happy%20villagers.%20--style%3DRealistic%20--mood%3DMystical",
            "dialog": "Soldier Jake wakes up in a peaceful village, confused by the serene surroundings. He doesn't recognize anything.",
        },
        {
            "image": "https://image.pollinations.ai/prompt/Jake%20asking%20a%20smiling%20villager%20in%20casual%20clothes%2C%20with%20buildings%20and%20children%20playing%20in%20the%20background%2C%20all%20looking%20carefree.%20--style%3DRealistic%20--mood%3DCurious",
            "dialog": "He approaches a kind villager, asking about the war. The villager smiles, puzzled—war? What is that?",
        },
        {
            "image": "https://image.pollinations.ai/prompt/Jake%20holding%20an%20old%2C%20faded%20photograph%20of%20soldiers%20in%20uniform%2C%20looking%20puzzled%20and%20nostalgic%2C%20in%20a%20cozy%20room%20filled%20with%20flowers.%20--style%3DRealistic%20--mood%3DNostalgic",
            "dialog": "Desperately searching, Jake discovers an old photo of soldiers. He feels a sense of connection but can't explain it.",
        },
        {
            "image": "https://image.pollinations.ai/prompt/Jake%20with%20a%20pained%20expression%2C%20eyes%20closed%2C%20surrounded%20by%20visions%20of%20battle%20and%20comrades%2C%20fading%20away%20into%20bright%20light.%20--style%3DRealistic%20--mood%3DSomber",
            "dialog": "Jake's memories flicker: camaraderie, loss, conflict. He realizes he’s alone in his experiences—no one else remembers.",
        },
        {
            "image": "https://image.pollinations.ai/prompt/Jake%20helping%20villagers%20with%20farming%2C%20wearing%20their%20clothes%2C%20smiling%20as%20he%20plants%20seeds%20with%20children%20around%20him.%20--style%3DRealistic%20--mood%3DHopeful",
            "dialog": "He finds solace in helping villagers. Gradually, he learns to embrace this new life while honoring his forgotten past.",
        },
        {
            "image": "https://image.pollinations.ai/prompt/Jake%20as%20an%20older%2C%20wise%20figure%20with%20warm%20smile%2C%20surrounded%20by%20grateful%20villagers%20at%20a%20celebration%20under%20a%20bright%20sky.%20--style%3DRealistic%20--mood%3DCelebratory",
            "dialog": "In two years, Jake becomes a beloved elder. Although his past is lost, he creates a future full of joy and peace.",
        }
    ]
};
  
// //   // Get the composition you want to render. Pass `inputProps` if you
// //   // want to customize the duration or other metadata.
// //   const composition = await selectComposition({
// //     serveUrl: bundleLocation,
// //     id: compositionId,
// //     inputProps: {videoScript: inputProps.data},
// //   });
  
// //   // Render the video. Pass the same `inputProps` again
// //   // if your video is parametrized with data.
// //   await renderMedia({
// //     composition,
// //     serveUrl: bundleLocation,
// //     codec: 'h264',
// //     outputLocation: `out/${compositionId}.mp4`,
// //     inputProps,
// //   });
  
//   console.log('Render done!');

//   return NextResponse.json({
//       status: "success",
//       data: [],
//   });

// }


// import { NextResponse } from "next/server";
// import { bundle } from "@remotion/bundler";
// import { getCompositions, renderMedia } from "@remotion/renderer";
// import path from "path";
// import os from "os";

// export async function POST(req: Request) {
//   try {
//     const { imageUrl, prompt } = await req.json();

//     // Create a temporary directory for rendering
//     const tmpDir = await os.tmpdir();
//     const compositionId = "Empty";
//     const outputLocation = path.join(tmpDir, "video.mp4");

//     // Bundle the video
//     const bundled = await bundle({
//       entryPoint: path.join(process.cwd(), "remotion", "Composition.tsx"),
//       webpackOverride: (config: any) => config,
//     });

//     // Get the compositions (just one in our case)
//     const compositions = await getCompositions(bundled);
//     const composition = compositions.find((c) => c.id === compositionId);

//     if (!composition) {
//       throw new Error(`No composition found with ID ${compositionId}`);
//     }

//     // Render the video
//     await renderMedia({
//       composition,
//       serveUrl: bundled,
//       codec: "h264",
//       outputLocation,
//       inputProps: {
//         imageUrl,
//         prompt,
//       },
//     });

//     // Read the rendered video file
//     const videoBuffer = await require("fs").promises.readFile(outputLocation);

//     // Clean up the temporary file
//     await require("fs").promises.unlink(outputLocation);

//     // Return the video file
//     return new NextResponse(videoBuffer, {
//       headers: {
//         "Content-Type": "video/mp4",
//         "Content-Disposition": `attachment; filename="video.mp4"`,
//       },
//     });
//   } catch (error) {
//     console.error("Error rendering video:", error);
//     return NextResponse.json({ error: "Failed to render video" }, { status: 500 });
//   }
// }

import os from "os"
import fs from "fs"
import path from "path"

import { exec } from 'child_process';
import { NextResponse } from "next/server";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



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

export async function POST() {
  try {
    const videoPath = path.join(process.cwd(), 'out', 'Empty.mp4');

    // const command = `npx remotion render Empty --concurrency=8 --codec=h264 --disable-web-security --disable-composition-caching=false`;

    // console.log("Rendering video...");
    // await runRenderCommand(command); // ✅ Wait for the video to finish

    // const cloudinaryResponse = await cloudinary.uploader.upload(videoPath, {
    //   resource_type: 'video',
    //   folder: 'remotion-videos', // Optional: Specify a folder in Cloudinary
    // });

    // console.log(cloudinaryResponse);

    // cleanPublicDir();

    console.log("Video generated successfully");

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error rendering video:", error);
    return NextResponse.json({ error: "Failed to render video" }, { status: 500 });
  }
}