import React, { forwardRef, useImperativeHandle } from 'react';
import { View, Text } from 'react-native';

const MapView = forwardRef(({ children, style }: any, ref) => {
  useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
    animateCamera: () => {},
    fitToElements: () => {},
    fitToCoordinates: () => {},
  }));

  return (
    <View style={[style, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ color: '#fff' }}>Map is not supported on Web</Text>
      <Text style={{ color: '#aaa', fontSize: 12 }}>Please use an Android or iOS emulator</Text>
      <View style={{ display: 'none' }}>{children}</View>
    </View>
  );
});

const Marker = ({ children }: any) => <>{children}</>;
const Callout = ({ children }: any) => <>{children}</>;

export default MapView;
export { Marker, Callout };
