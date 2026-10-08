import React from 'react';
import {View} from 'react-native';
import LottieView from 'lottie-react-native';

// Exact user-selected "Book Loader (2).json", with only stroke colours
// converted into Archivist's existing dark/light UI palette.
// This intentionally replaces spinners in place; it is not an onboarding redesign.
const darkBook = require('./assets/animations/book-loader-dark.json');
const lightBook = require('./assets/animations/book-loader-light.json');

export type BookLoaderProps = {
  dark: boolean;
  reduceMotion?: boolean;
  size?: number;
  accessibilityLabel?: string;
};

export default function BookLoader({
  dark, reduceMotion=false, size=30, accessibilityLabel='Loading',
}: BookLoaderProps) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      style={{width:size,height:size,alignItems:'center',justifyContent:'center'}}
    >
      <LottieView
        source={dark ? darkBook : lightBook}
        autoPlay={!reduceMotion}
        loop={!reduceMotion}
        progress={reduceMotion ? 0.26 : undefined}
        resizeMode="contain"
        style={{width:size,height:size}}
      />
    </View>
  );
}
