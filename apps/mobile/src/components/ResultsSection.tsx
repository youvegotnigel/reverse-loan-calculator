import { formatLKR, formatPercent, stressTest, type AppInputs, type LoanResult } from '@rlc/engine';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, radius, tabular, useTheme, type Theme } from '../theme';

const STRESS_BUMP = 2;

export function ResultsSection(props: { inputs: AppInputs; result: LoanResult }) {
  const t = useTheme();
  const s = styles(t);
  const { result } = props;
  const stressed = stressTest(props.inputs, STRESS_BUMP);

  return (
    <View style={s.card}>
      <Text style={s.title}>Over the life of the loan</Text>

      <Row label="Total repaid" value={formatLKR(result.totalRepaid)} theme={t} />
      <Row label="Principal" value={formatLKR(result.maxLoan)} theme={t} />
      <Row label="Interest" value={formatLKR(result.totalInterest)} color={t.negative} theme={t} />

      <View
        style={s.shareBar}
        accessible
        accessibilityLabel={`Principal ${formatPercent(result.principalSharePercent, 0)}, interest ${formatPercent(result.interestSharePercent, 0)} of total repaid`}
      >
        <View
          style={{ flex: Math.max(result.principalSharePercent, 1), backgroundColor: t.ceylon700 }}
        />
        <View
          style={{ flex: Math.max(result.interestSharePercent, 1), backgroundColor: t.saffron }}
        />
      </View>
      <View style={s.legendRow}>
        <Text style={s.legend}>
          <Text style={{ color: t.ceylon700 }}>●</Text> Principal{' '}
          {formatPercent(result.principalSharePercent, 0)}
        </Text>
        <Text style={s.legend}>
          <Text style={{ color: t.saffron }}>●</Text> Interest{' '}
          {formatPercent(result.interestSharePercent, 0)}
        </Text>
      </View>

      <View style={s.stress}>
        <Text style={s.stressText}>
          If rates rise by {STRESS_BUMP}%, your maximum loan falls to{' '}
          <Text style={s.stressStrong}>{formatLKR(stressed.maxLoan)}</Text> (−
          {formatLKR(stressed.drop)}).
        </Text>
      </View>
    </View>
  );
}

function Row(props: { label: string; value: string; color?: string; theme: Theme }) {
  const s = styles(props.theme);
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{props.label}</Text>
      <Text style={[s.rowValue, props.color ? { color: props.color } : null]}>{props.value}</Text>
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
      padding: 18,
      marginTop: 24,
    },
    title: {
      fontFamily: fonts.ui,
      fontSize: 15,
      fontWeight: '700',
      color: t.ink900,
      marginBottom: 12,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
    rowLabel: { fontFamily: fonts.ui, fontSize: 14, color: t.ink500 },
    rowValue: {
      fontFamily: fonts.ui,
      fontSize: 14,
      fontWeight: '600',
      color: t.ink900,
      ...tabular,
    },
    shareBar: {
      flexDirection: 'row',
      height: 10,
      borderRadius: 5,
      overflow: 'hidden',
      marginTop: 12,
    },
    legendRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
    legend: { fontFamily: fonts.ui, fontSize: 12, color: t.ink500, ...tabular },
    stress: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.line,
    },
    stressText: {
      fontFamily: fonts.ui,
      fontSize: 12.5,
      lineHeight: 18,
      color: t.ink500,
      ...tabular,
    },
    stressStrong: { fontWeight: '700', color: t.ink900 },
  });
