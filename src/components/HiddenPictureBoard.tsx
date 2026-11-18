// src/components/HiddenPictureBoard.tsx
// 숨은그림 카드 (배경 #E6EEDF, radius 22)
// - 서버에서 받은 그림을 띄우고, 사물 위치마다 투명한 터치 영역을 둔다.
//   (탭 좌표를 계산하지 않아 웹 / iOS / Android 모두 같은 방식으로 동작)
// - 찾은 사물은 반투명 흰 원 + 블루 테두리 + 이모지로 표시

import { Image } from "expo-image";
import React, { useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import type { Picture } from "../api/pictureApi";
import { COLORS } from "../constants/colors";
import { scale } from "../utils/responsive";

const DESIGN_WIDTH = 338;
const MARKER_SIZE = 48;

interface HiddenPictureBoardProps {
  picture: Picture;
  foundIds: string[];
  onFind: (targetId: string) => void;
}

export default function HiddenPictureBoard({ picture, foundIds, onFind }: HiddenPictureBoardProps) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  const markerSize = (size.width / DESIGN_WIDTH) * MARKER_SIZE;

  return (
    <View style={[styles.board, { aspectRatio: picture.aspectRatio }]} onLayout={handleLayout}>
      <Image
        source={picture.image}
        style={StyleSheet.absoluteFill}
        contentFit="fill"
        transition={200}
        accessibilityLabel="숨은그림 장면"
      />

      {size.width > 0 &&
        picture.targets.map((target) => {
          const found = foundIds.includes(target.targetId);
          const centerX = target.x * size.width;
          const centerY = target.y * size.height;

          if (found) {
            return (
              <View
                key={target.targetId}
                pointerEvents="none"
                accessibilityLabel={`${target.label} 찾음`}
                style={[
                  styles.marker,
                  {
                    width: markerSize,
                    height: markerSize,
                    borderRadius: markerSize / 2,
                    left: centerX - markerSize / 2,
                    top: centerY - markerSize / 2,
                  },
                ]}
              >
                <Text style={{ fontSize: markerSize * 0.52 }}>{target.emoji}</Text>
              </View>
            );
          }

          // 정답 인정 영역 (보이지 않음)
          const hitSize = target.radius * size.width * 2;
          return (
            <Pressable
              key={target.targetId}
              onPress={() => onFind(target.targetId)}
              accessibilityRole="button"
              accessibilityLabel={`숨어 있는 ${target.label}`}
              style={[
                styles.hitArea,
                {
                  width: hitSize,
                  height: hitSize,
                  borderRadius: hitSize / 2,
                  left: centerX - hitSize / 2,
                  top: centerY - hitSize / 2,
                },
              ]}
            />
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    width: "100%",
    borderRadius: scale(22),
    overflow: "hidden",
    backgroundColor: COLORS.sceneBg,
  },
  hitArea: { position: "absolute" },
  marker: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.markerBg,
  },
});
