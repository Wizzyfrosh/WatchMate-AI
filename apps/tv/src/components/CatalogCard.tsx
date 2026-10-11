import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { VideoItem, VideoProgress } from '../types';
import { formatMs } from '../playback';

interface CatalogCardProps {
  video: VideoItem;
  progress: VideoProgress | null;
  onSelect: () => void;
  preferred?: boolean;
}

export function CatalogCard({
  video,
  progress,
  onSelect,
  preferred = false,
}: CatalogCardProps) {
  const [focused, setFocused] = useState(false);
  const hasProgress = progress && progress.positionMs > 0 && !progress.completed;
  const progressPct = hasProgress
    ? Math.min(100, Math.round((progress.positionMs / video.durationMs) * 100))
    : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${video.title}, ${formatMs(video.durationMs)}`}
      hasTVPreferredFocus={preferred}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onSelect}
      style={[styles.card, focused && styles.cardFocused]}
    >
      {/* Thumbnail placeholder — actual thumbnails come with media assets */}
      <View style={styles.thumbnailArea}>
        <Text style={styles.thumbnailText}>{video.title.charAt(0)}</Text>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatMs(video.durationMs)}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {video.description}
        </Text>

        {hasProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              {formatMs(progress.positionMs)} watched
            </Text>
          </View>
        )}

        {progress?.completed && (
          <Text style={styles.completedLabel}>✓ Completed</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 340,
    backgroundColor: '#162235',
    borderRadius: 14,
    borderWidth: 3,
    borderColor: '#162235',
    overflow: 'hidden',
    marginRight: 20,
  },
  cardFocused: {
    borderColor: '#FFD166',
    transform: [{ scale: 1.05 }],
    backgroundColor: '#1d2d45',
  },
  thumbnailArea: {
    height: 190,
    backgroundColor: '#0d1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailText: {
    color: '#65D6CB',
    fontSize: 60,
    fontWeight: '700',
    opacity: 0.3,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: '#F4F7FB',
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  info: {
    padding: 14,
  },
  title: {
    color: '#F4F7FB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    color: '#B9C5D6',
    fontSize: 13,
    lineHeight: 18,
  },
  progressContainer: {
    marginTop: 10,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#0d1a2e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#65D6CB',
    borderRadius: 2,
  },
  progressLabel: {
    color: '#B9C5D6',
    fontSize: 11,
    marginTop: 4,
  },
  completedLabel: {
    color: '#65D6CB',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
});
