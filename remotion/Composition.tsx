import { useVideoContext } from '../context/VideoScriptContext';
import { AbsoluteFill, Audio, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import data from "./videoScriptData.json"


// const testdata = {
//     "status": "success",
//     "data": [
//         {
//             "image": "image-1741936064139.png",
//             "dialog": "Soldier Jake wakes up in a peaceful village, confused by the serene surroundings. He doesn't recognize anything.",
//         },
//         {
//             "image": "image-1741936064139.png",
//             "dialog": "Soldier Jake wakes up in a peaceful village, confused by the serene surroundings. He doesn't recognize anything.",
//         }
//     ]
// }

// Constants
const TOTAL_AUDIO_DURATION = 48 * 30; // 1410 frames (47s * 30fps)
const FPS = 30;
const WORDS_PER_SECOND = 2.5;
const MIN_DURATION = 60; // Minimum frames per scene
const MAX_DURATION = 240; // Maximum frames per scene

// Function to estimate raw frame duration based on text length
const getRawDuration = (text: string) => {
    const wordCount = text.split(" ").length;
    const estimatedSeconds = wordCount / WORDS_PER_SECOND;
    return Math.min(Math.max(Math.round(estimatedSeconds * FPS), MIN_DURATION), MAX_DURATION);
};

interface VideoScript {
    image: string;
    dialog: string;
}

interface MyCompositionProps {
    videoScript: VideoScript[];
}

// export const MyComposition = ({ videoScript }: MyCompositionProps) => {
export const MyComposition = () => {

    // const { data: videoScript } = useVideoContext();

    // console.log("videoScript", videoScript);

    const videoScript = data;
    
    let startFrame = 0;

    // Step 1: Compute raw durations
    const rawDurations = videoScript.map((item: VideoScript) => getRawDuration(item.dialog));
    const totalRawDuration = rawDurations.reduce((sum, d) => sum + d, 0);

    // Step 2: Scale durations to fit within TOTAL_AUDIO_DURATION (1410 frames)
    const scaleFactor = TOTAL_AUDIO_DURATION / totalRawDuration;
    const finalDurations = rawDurations.map(d => Math.round(d * scaleFactor));
    

    return (
        <AbsoluteFill>
            <Audio src={staticFile("/speech.mp3")} volume={1} />

            {videoScript.map((item: VideoScript, index) => {
                const durationInFrames = finalDurations[index];
                const sceneStart = startFrame;
                startFrame += durationInFrames;

                return (
                    <Sequence key={index} from={sceneStart} durationInFrames={durationInFrames}>
                        <ImageWithTransition src={staticFile(item.image)} />
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};

const ImageWithTransition = ({ src }: { src: string }) => {
    const frame = useCurrentFrame();

    // Smooth Zoom-in Effect
    const scale = interpolate(frame, [0, 240], [1, 1.1], { extrapolateRight: "clamp" });

    return (
        <AbsoluteFill style={{ transform: `scale(${scale})` }}>
            <Img
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                src={src === "" ? staticFile("/404.jpg") : src}
            />
        </AbsoluteFill>
    );
};
