import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { fonts, radius, tabular, useTheme, type Theme } from '../theme';

function fieldStyles(t: Theme) {
  return StyleSheet.create({
    field: { marginBottom: 20 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    label: { fontFamily: fonts.ui, fontSize: 13, fontWeight: '600', color: t.ink500 },
    value: { fontFamily: fonts.ui, fontSize: 13, fontWeight: '700', color: t.ink900, ...tabular },
  });
}

export function LabeledField(props: { label: string; value?: string; children: React.ReactNode }) {
  const s = fieldStyles(useTheme());
  return (
    <View style={s.field}>
      <View style={s.labelRow}>
        <Text style={s.label}>{props.label}</Text>
        {props.value !== undefined && <Text style={s.value}>{props.value}</Text>}
      </View>
      {props.children}
    </View>
  );
}

/** LKR amount input with live thousands separators. */
export function MoneyField(props: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <LabeledField label={props.label}>
      <TextInput
        accessibilityLabel={props.label}
        keyboardType="number-pad"
        value={props.value === 0 && focused ? '' : props.value.toLocaleString('en-US')}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChangeText={(text) => {
          const n = Number(text.replace(/[^0-9]/g, ''));
          props.onChange(Math.min(props.max, Number.isNaN(n) ? 0 : n));
        }}
        style={{
          fontFamily: fonts.ui,
          fontSize: 17,
          fontWeight: '600',
          color: t.ink900,
          backgroundColor: t.surface,
          borderColor: focused ? t.ceylon700 : t.line,
          borderWidth: focused ? 2 : 1,
          borderRadius: radius.s,
          paddingHorizontal: 14,
          paddingVertical: 12,
          ...tabular,
        }}
      />
    </LabeledField>
  );
}

/** Slider with a haptic tick on each detent. */
export function SliderField(props: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  const t = useTheme();
  const last = useRef(props.value);
  return (
    <LabeledField label={props.label} value={props.display}>
      <Slider
        accessibilityLabel={props.label}
        minimumValue={props.min}
        maximumValue={props.max}
        step={props.step}
        value={props.value}
        onValueChange={(v) => {
          if (v !== last.current) {
            last.current = v;
            Haptics.selectionAsync();
            props.onChange(v);
          }
        }}
        minimumTrackTintColor={t.ceylon700}
        maximumTrackTintColor={t.line}
        thumbTintColor={t.ceylon700}
        style={{ height: 36, marginHorizontal: -4 }}
      />
    </LabeledField>
  );
}

/** Preset chips (e.g. DSR percentages). */
export function ChipRow(props: {
  options: number[];
  value: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
      {props.options.map((opt) => {
        const active = opt === props.value;
        return (
          <Pressable
            key={opt}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={props.format(opt)}
            onPress={() => {
              Haptics.selectionAsync();
              props.onChange(opt);
            }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              backgroundColor: active ? t.ceylon700 : t.surface,
              borderWidth: 1,
              borderColor: active ? t.ceylon700 : t.line,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.ui,
                fontSize: 13,
                fontWeight: '600',
                color: active ? '#FFFFFF' : t.ink500,
                ...tabular,
              }}
            >
              {props.format(opt)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SwitchRow(props: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ fontFamily: fonts.ui, fontSize: 15, fontWeight: '600', color: t.ink900 }}>
          {props.label}
        </Text>
        {props.hint && (
          <Text style={{ fontFamily: fonts.ui, fontSize: 12, color: t.ink500, marginTop: 2 }}>
            {props.hint}
          </Text>
        )}
      </View>
      <Switch
        accessibilityLabel={props.label}
        value={props.value}
        onValueChange={(v) => {
          Haptics.selectionAsync();
          props.onChange(v);
        }}
        trackColor={{ true: t.ceylon700, false: t.line }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
