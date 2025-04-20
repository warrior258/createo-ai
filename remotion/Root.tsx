import React from 'react';
import { Composition } from 'remotion';
import { MyComposition } from './Composition';
import { VideoScriptProvider } from '../context/VideoScriptContext';
 
export const RemotionRoot: React.FC = () => {
  return (
    <VideoScriptProvider>
      <Composition
        id="Empty"
        component={MyComposition}
        durationInFrames={48*30} // Total duration
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ videoScript: [] }} 
      />
    </VideoScriptProvider>
  );
};