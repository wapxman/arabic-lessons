import React from 'react';
import { Composition } from 'remotion';
import { Lesson1 } from './Lesson1.jsx';

export const Root = () => {
  return (
    <Composition
      id="Lesson1"
      component={Lesson1}
      durationInFrames={2520}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
