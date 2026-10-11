import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TVFocusGuideView,
  View,
} from 'react-native';
import { CatalogCard } from '../components/CatalogCard';
import { TVFocusable } from '../components/TVFocusable';
import { CATALOG } from '../catalogData';
import {
  clearAllProgress,
  getCaptionsEnabled,
  getProgress,
  setCaptionsEnabled,
} from '../sessionStore';
import type { VideoItem, VideoProgress } from '../types';

interface CatalogScreenProps {
  onSelectVideo: (video: VideoItem) => void;
}

export function CatalogScreen({ onSelectVideo }: CatalogScreenProps) {
  const [, setRevision] = useState(0);
  const refresh = () => setRevision(r => r + 1);

  const captionsOn = getCaptionsEnabled();

  // Find any active progress across catalog items
  const progressByVideoId: Record<string, VideoProgress | null> = {};
  let continueWatchingVideo: VideoItem | null = null;
  let continueWatchingProgress: VideoProgress | null = null;

  for (const item of CATALOG) {
    const prog = getProgress(item.id);
    progressByVideoId[item.id] = prog;
    if (prog && prog.positionMs > 0 && !prog.completed && !continueWatchingVideo) {
      continueWatchingVideo = item;
      continueWatchingProgress = prog;
    }
  }

  const handleToggleCaptions = () => {
    setCaptionsEnabled(!captionsOn);
    refresh();
  };

  const handleResetProgress = () => {
    clearAllProgress();
    refresh();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.wordmark}>WatchMate AI</Text>
          <Text style={styles.subtitle}>Watch. Understand. Revisit. Remember.</Text>
        </View>
        <Text style={styles.badge}>PHASE 2 · CATALOG & PLAYBACK</Text>
      </View>

      {/* Continue Watching section if active progress exists */}
      {continueWatchingVideo && continueWatchingProgress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Watching</Text>
          <TVFocusGuideView autoFocus style={styles.cardRow}>
            <CatalogCard
              video={continueWatchingVideo}
              progress={continueWatchingProgress}
              onSelect={() => onSelectVideo(continueWatchingVideo!)}
              preferred
            />
          </TVFocusGuideView>
        </View>
      )}

      {/* Primary Catalog Library */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Curated Lessons</Text>
        <TVFocusGuideView
          autoFocus={!continueWatchingVideo}
          style={styles.cardRow}
        >
          {CATALOG.map((item, index) => (
            <CatalogCard
              key={item.id}
              video={item}
              progress={progressByVideoId[item.id]}
              onSelect={() => onSelectVideo(item)}
              preferred={!continueWatchingVideo && index === 0}
            />
          ))}
        </TVFocusGuideView>
      </View>

      {/* Preferences & Reset Row */}
      <View style={styles.settingsSection}>
        <Text style={styles.settingsTitle}>Preferences & Session</Text>
        <TVFocusGuideView style={styles.settingsRow}>
          <TVFocusable
            label={`Captions: ${captionsOn ? 'ON' : 'OFF'}`}
            onPress={handleToggleCaptions}
            style={styles.settingButton}
          />
          <TVFocusable
            label="Reset Progress"
            onPress={handleResetProgress}
            style={styles.settingButton}
          />
        </TVFocusGuideView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  content: {
    paddingHorizontal: 48,
    paddingTop: 36,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  wordmark: {
    color: '#65D6CB',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#B9C5D6',
    fontSize: 16,
    marginTop: 4,
  },
  badge: {
    color: '#FFD166',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    backgroundColor: '#162235',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    color: '#F4F7FB',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  settingsSection: {
    marginTop: 12,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#1d2d45',
  },
  settingsTitle: {
    color: '#B9C5D6',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  settingsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  settingButton: {
    backgroundColor: '#162235',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
