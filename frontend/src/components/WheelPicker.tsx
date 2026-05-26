import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const ITEM_HEIGHT = 40;

export function WheelPicker({ items, selectedValue, onValueChange, width = 60 }: { items: {label: string, value: any}[], selectedValue: any, onValueChange: (val: any) => void, width?: number }) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [internalValue, setInternalValue] = useState(selectedValue);
  
  const selectedIndex = items.findIndex(i => i.value === selectedValue);
  const initialIndex = selectedIndex >= 0 ? selectedIndex : 0;

  useEffect(() => {
    if (scrollViewRef.current && initialIndex >= 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: initialIndex * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, []);

  const handleScrollEnd = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    let idx = Math.round(y / ITEM_HEIGHT);
    if (idx < 0) idx = 0;
    if (idx >= items.length) idx = items.length - 1;
    
    // Snap scroll to correct position if the user stopped slightly off
    scrollViewRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: true });
    
    setInternalValue(items[idx].value);
    onValueChange(items[idx].value);
  };

  const handleMomentumScrollEnd = (e: any) => {
    handleScrollEnd(e);
  };

  const handleScrollEndDrag = (e: any) => {
    // only trigger if there's no momentum
    if (e.nativeEvent.velocity.y === 0) {
      handleScrollEnd(e);
    }
  };

  return (
    <View style={{ height: ITEM_HEIGHT * 3, width, overflow: 'hidden', backgroundColor: 'transparent' }}>
      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center' }]} pointerEvents="none">
        <View style={{ height: ITEM_HEIGHT, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#444' }} />
      </View>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        nestedScrollEnabled={true}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleScrollEndDrag}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
      >
        {items.map((item, idx) => (
          <View key={idx} style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: internalValue === item.value ? '700' : '400', color: internalValue === item.value ? '#111' : '#888' }}>
              {item.label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
