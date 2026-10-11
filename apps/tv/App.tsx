import React, { useEffect, useState } from 'react';
import { BackHandler, StatusBar, StyleSheet, View } from 'react-native';
import { CatalogScreen } from './src/screens/CatalogScreen';
import { PlayerScreen } from './src/screens/PlayerScreen';
import type { VideoItem } from './src/types';

export default function App() {
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

  // App-level hardware Back handler:
  // When in player, return to catalog screen. When in catalog, let system handle exit.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeVideo !== null) {
        setActiveVideo(null);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [activeVideo]);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      {activeVideo ? (
        <PlayerScreen
          video={activeVideo}
          onBack={() => setActiveVideo(null)}
        />
      ) : (
        <CatalogScreen onSelectVideo={video => setActiveVideo(video)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
});
