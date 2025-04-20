"use client";

import React, { createContext, useContext, useState } from "react";
import { staticFile } from "remotion";

// const testdata = [
//   {
//     image: 'https://image.pollinations.ai/prompt/The%20eerie%20ship%20Marrow%20Tide%20appears%20amidst%20a%20swirling%20fog%20on%20a%20moonlit%20sea%2C%20glowing%20faintly%2C%20shrouded%20in%20mystery.%20--style%3DGothic%20--mood%3DMysterious',
//     dialog: 'Every century, the ghostly ship Marrow Tide surfaces, draped in mist, beckoning adventurers to board.',
//     duration: 7
//   },
//   {
//     image: 'https://image.pollinations.ai/prompt/A%20determined%20young%20captain%20with%20a%20weathered%20hat%20and%20a%20curious%20crew%20gazing%20towards%20the%20ship%20from%20a%20sturdy%20fishing%20boat.%20--style%3DGothic%20--mood%3DAdventurous',
//     dialog: 'Curious sailors gather, captivated by tales of treasure and danger. A brave young captain decides to explore.',
//     duration: 8
//   },
//   {
//     image: 'https://image.pollinations.ai/prompt/The%20captain%20and%20crew%20step%20onto%20the%20ghostly%20deck%2C%20expressions%20of%20awe%20and%20fear%20as%20shadows%20swirl%20ominously%20around%20them.%20--style%3DGothic%20--mood%3DChilling',
//     dialog: 'As they board, an eerie chill envelops them. Strange whispers echo through the vessel, hinting at the nightmarish fate awaiting.',
//     duration: 9
//   },
//   {
//     image: 'https://image.pollinations.ai/prompt/The%20ship%20rocking%20violently%2C%20ghostly%20figures%20emerging%20from%20the%20walls%2C%20with%20the%20shocked%20crew%20backing%20away%20in%20terror.%20--style%3DGothic%20--mood%3DDramatic',
//     dialog: "Suddenly, the ship jolts. A storm brews, and ghostly figures appear, revealing the ship's tragic past of lost souls.",
//     duration: 9
//   },
//   {
//     image: 'https://image.pollinations.ai/prompt/The%20captain%20frantically%20searching%20the%20shadowy%20interior%2C%20a%20glint%20of%20the%20medallion%20visible%20in%20the%20ambient%20darkness.%20--style%3DGothic%20--mood%3DUrgent',
//     dialog: "Trying to escape, the captain realizes the only way off is through the cursed captain's medallion, hidden in the heart of the ship.",
//     duration: 11
//   },
//   {
//     image: 'https://image.pollinations.ai/prompt/The%20ship%20dissolving%20into%20the%20mist%20as%20the%20captain%20stands%20on%20the%20dock%2C%20a%20lone%20figure%20against%20a%20rising%20sun%2C%20looking%20back%20sadly.%20--style%3DGothic%20--mood%3DMelancholic',
//     dialog: 'As dawn breaks, the cursed ship vanishes, leaving behind echoes of the lost. Only the captain escapes, forever haunted.',
//     duration: 9
//   }
// ]

const testdata = [
  {
    image: staticFile('image1.jpeg'),
    dialog: 'Every century, the ghostly ship Marrow Tide surfaces, draped in mist, beckoning adventurers to board.',
    duration: 7
  },
  {
    image: staticFile('image2.jpeg'),
    dialog: 'Curious sailors gather, captivated by tales of treasure and danger. A brave young captain decides to explore.',
    duration: 8
  },
  {
    image: staticFile('image3.jpeg'),
    dialog: 'As they board, an eerie chill envelops them. Strange whispers echo through the vessel, hinting at the nightmarish fate awaiting.',
    duration: 9
  }
]


// Define the VideoScript type
interface VideoScript {
  image: string;
  dialog: string;
}

// Define the context type
interface VideoScriptContextType {
  data: VideoScript[];
  setData: React.Dispatch<React.SetStateAction<VideoScript[]>>;
}

// Create the context
const VideoScriptContext = createContext<VideoScriptContextType | undefined>(undefined);

// Provider Component
export const VideoScriptProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<VideoScript[]>([]);

  console.log(data.map((scene) => scene.dialog  ).join(" "))

  return (
    <VideoScriptContext.Provider value={{ data, setData }}>
      {children}
    </VideoScriptContext.Provider>
  );
};

export const useVideoContext = () => {
  const context = useContext(VideoScriptContext);
  if (!context) {
    throw new Error("useVideo must be used within a VideoProvider");
  }
  return context;
};
