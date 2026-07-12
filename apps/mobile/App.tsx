import {
  amountInWords,
  buildSchedule,
  computeLoan,
  DEFAULT_APP_INPUTS,
  formatLKR,
  formatPercent,
  LIMITS,
  propertyAffordability,
  statusFor,
  type AppInputs,
} from '@rlc/engine';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NoteCard } from './src/components/NoteCard';
import { ResultsSection } from './src/components/ResultsSection';
import { ScheduleSection } from './src/components/ScheduleSection';
import { ChipRow, MoneyField, SliderField, SwitchRow } from './src/components/controls';
import { fonts, useTheme, type Theme } from './src/theme';

const DSR_PRESETS = [30, 40, 50, 60];

export default function App() {
  const t = useTheme();
  const s = styles(t);
  const [inputs, setInputs] = useState<AppInputs>(DEFAULT_APP_INPUTS);
  const [refreshing, setRefreshing] = useState(false);
  const patch = (p: Partial<AppInputs>) => setInputs((prev) => ({ ...prev, ...p }));

  const status = statusFor(inputs);
  const result = useMemo(() => computeLoan(inputs), [inputs]);
  const property = useMemo(
    () => propertyAffordability(result.maxLoan, inputs.downPaymentPercent),
    [result.maxLoan, inputs.downPaymentPercent],
  );
  const schedule = useMemo(
    () =>
      buildSchedule(
        result.maxLoan,
        result.monthlyInstallment,
        inputs.annualRatePercent / 100 / 12,
        result.totalPayments,
      ),
    [result, inputs.annualRatePercent],
  );

  const termLabel =
    inputs.months > 0 ? `${inputs.years} yr ${inputs.months} mo` : `${inputs.years} yr`;

  const onShare = () => {
    const lines = [
      `Reverse Loan Calculator (Sri Lanka)`,
      `Salary ${formatLKR(inputs.monthlySalary)}/mo · DSR ${inputs.dsrPercent}% · ${termLabel} @ ${formatPercent(inputs.annualRatePercent)}`,
      `Maximum loan: ${formatLKR(result.maxLoan)} (${amountInWords(result.maxLoan)})`,
      inputs.propertyMode
        ? `Max property price at ${inputs.downPaymentPercent}% down: ${formatLKR(property.maxPropertyPrice)}`
        : '',
      `Installment ${formatLKR(result.monthlyInstallment)}/mo · Total interest ${formatLKR(result.totalInterest)}`,
      `Estimates only — not financial advice.`,
    ].filter(Boolean);
    Share.share({ message: lines.join('\n') });
  };

  const onReset = () => {
    setRefreshing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setInputs(DEFAULT_APP_INPUTS);
    setTimeout(() => setRefreshing(false), 400);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <View style={s.container}>
        <View style={s.topBar}>
          <Text style={s.appTitle}>Reverse Loan</Text>
          {status === 'ok' && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share result"
              onPress={onShare}
              hitSlop={8}
            >
              <Text style={s.shareLink}>Share</Text>
            </Pressable>
          )}
        </View>

        <NoteCard
          status={status}
          result={result}
          property={{
            on: inputs.propertyMode,
            maxPropertyPrice: property.maxPropertyPrice,
            downPaymentAmount: property.downPaymentAmount,
            downPct: inputs.downPaymentPercent,
          }}
          termLabel={termLabel}
          ratePercent={inputs.annualRatePercent}
        />

        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onReset} tintColor={t.ceylon700} />
          }
        >
          <Text style={s.sectionTitle}>Income</Text>
          <MoneyField
            label="Net monthly salary (LKR)"
            value={inputs.monthlySalary}
            max={LIMITS.salary.max}
            onChange={(v) => patch({ monthlySalary: v })}
          />
          <SliderField
            label="Debt service ratio"
            value={inputs.dsrPercent}
            min={LIMITS.dsr.min}
            max={LIMITS.dsr.max}
            step={1}
            display={formatPercent(inputs.dsrPercent, 0)}
            onChange={(v) => patch({ dsrPercent: v })}
          />
          <View style={{ marginTop: -12, marginBottom: 20 }}>
            <ChipRow
              options={DSR_PRESETS}
              value={inputs.dsrPercent}
              format={(v) => `${v}%`}
              onChange={(v) => patch({ dsrPercent: v })}
            />
          </View>
          <MoneyField
            label="Existing monthly commitments (LKR)"
            value={inputs.existingCommitments}
            max={LIMITS.commitments.max}
            onChange={(v) => patch({ existingCommitments: v })}
          />

          <Text style={s.sectionTitle}>Loan terms</Text>
          <SliderField
            label="Repayment period"
            value={inputs.years}
            min={LIMITS.years.min}
            max={LIMITS.years.max}
            step={1}
            display={termLabel}
            onChange={(v) => patch({ years: v })}
          />
          <SliderField
            label="Extra months"
            value={inputs.months}
            min={LIMITS.months.min}
            max={LIMITS.months.max}
            step={1}
            display={`${inputs.months} mo`}
            onChange={(v) => patch({ months: v })}
          />
          <SliderField
            label="Annual interest rate"
            value={inputs.annualRatePercent}
            min={LIMITS.rate.min}
            max={LIMITS.rate.max}
            step={0.25}
            display={formatPercent(inputs.annualRatePercent)}
            onChange={(v) => patch({ annualRatePercent: v })}
          />

          <Text style={s.sectionTitle}>Property purchase</Text>
          <SwitchRow
            label="I'm buying a property"
            hint="Shows the maximum property price your loan supports"
            value={inputs.propertyMode}
            onChange={(v) => patch({ propertyMode: v })}
          />
          {inputs.propertyMode && (
            <SliderField
              label="Down payment"
              value={inputs.downPaymentPercent}
              min={LIMITS.downPayment.min}
              max={LIMITS.downPayment.max}
              step={5}
              display={formatPercent(inputs.downPaymentPercent, 0)}
              onChange={(v) => patch({ downPaymentPercent: v })}
            />
          )}

          {status === 'ok' && (
            <>
              <ResultsSection inputs={inputs} result={result} />
              <ScheduleSection schedule={schedule} />
            </>
          )}

          <Text style={s.disclaimer}>
            Estimates only, based on a standard reducing-balance formula — not financial advice.
            Banks apply their own criteria. Everything runs on your device; no data leaves it. Pull
            down to reset.
          </Text>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = (t: Theme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: t.paper,
      paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
    },
    container: { flex: 1, paddingHorizontal: 16 },
    topBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingVertical: 10,
    },
    appTitle: { fontFamily: fonts.display, fontSize: 22, fontWeight: '600', color: t.ink900 },
    shareLink: { fontFamily: fonts.ui, fontSize: 15, fontWeight: '600', color: t.ceylon700 },
    scroll: { flex: 1, marginTop: 16 },
    scrollContent: { paddingBottom: 32 },
    sectionTitle: {
      fontFamily: fonts.ui,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: t.ink500,
      marginBottom: 12,
      marginTop: 8,
    },
    disclaimer: {
      fontFamily: fonts.ui,
      fontSize: 11.5,
      lineHeight: 17,
      color: t.ink500,
      marginTop: 24,
    },
  });
