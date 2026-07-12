import { type Schedule } from '@rlc/engine';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, tabular, useTheme, type Theme } from '../theme';

/** Compact LKR for table cells: 12.4M, 850K. */
function short(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

/** Yearly amortization, collapsed by default. Monthly view lands in M2. */
export function ScheduleSection(props: { schedule: Schedule }) {
  const t = useTheme();
  const s = styles(t);
  const [open, setOpen] = useState(false);
  const rows = props.schedule.years;
  if (rows.length === 0) return null;

  return (
    <View style={s.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          Haptics.selectionAsync();
          setOpen((o) => !o);
        }}
        style={s.header}
      >
        <Text style={s.title}>Amortization by year</Text>
        <Text style={s.chevron}>{open ? '−' : '+'}</Text>
      </Pressable>

      {open && (
        <View accessibilityLabel="Yearly amortization table">
          <View style={s.rowHead}>
            <Text style={[s.cellHead, s.cYear]}>Yr</Text>
            <Text style={[s.cellHead, s.cNum]}>Principal</Text>
            <Text style={[s.cellHead, s.cNum]}>Interest</Text>
            <Text style={[s.cellHead, s.cNum]}>Balance</Text>
          </View>
          {rows.map((r) => (
            <View key={r.year} style={s.row}>
              <Text style={[s.cell, s.cYear]}>{r.year}</Text>
              <Text style={[s.cell, s.cNum]}>{short(r.principalPaid)}</Text>
              <Text style={[s.cell, s.cNum, { color: t.negative }]}>{short(r.interestPaid)}</Text>
              <Text style={[s.cell, s.cNum, { fontWeight: '600' }]}>{short(r.closingBalance)}</Text>
            </View>
          ))}
          <Text style={s.footnote}>Amounts in LKR. Final year absorbs rounding.</Text>
        </View>
      )}
    </View>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.surface,
      borderRadius: radius.m,
      borderWidth: 1,
      borderColor: t.line,
      paddingHorizontal: 18,
      paddingVertical: 6,
      marginTop: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    title: { fontFamily: fonts.ui, fontSize: 15, fontWeight: '700', color: t.ink900 },
    chevron: { fontFamily: fonts.ui, fontSize: 20, color: t.ceylon700, fontWeight: '600' },
    rowHead: {
      flexDirection: 'row',
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: t.line,
    },
    row: {
      flexDirection: 'row',
      paddingVertical: 7,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.line,
    },
    cellHead: {
      fontFamily: fonts.ui,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      color: t.ink500,
      textTransform: 'uppercase',
    },
    cell: { fontFamily: fonts.ui, fontSize: 13, color: t.ink900, ...tabular },
    cYear: { width: 34 },
    cNum: { flex: 1, textAlign: 'right' },
    footnote: { fontFamily: fonts.ui, fontSize: 11, color: t.ink500, paddingVertical: 10 },
  });
