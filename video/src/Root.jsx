import React from 'react';
import { Composition } from 'remotion';
import { Lesson1 } from './Lesson1.jsx';
import { Alive } from './Alive.jsx';
import { Bazaar } from './Bazaar.jsx';

export const Root = () => {
  return (
    <>
      <Composition
        id="Lesson1"
        component={Lesson1}
        durationInFrames={2520}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="Alive"
        component={Alive}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Bazaar"
        component={Bazaar}
        durationInFrames={600}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
