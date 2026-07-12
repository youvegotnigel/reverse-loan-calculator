import {
  amountInWords,
  formatLKR,
  formatPercent,
  type InputStatus,
  type LoanResult,
} from '@rlc/engine';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, radius, tabular } from '../theme';

const EMPTY_MESSAGES: Record<Exclude<InputStatus, 'ok'>, string> = {
  'no-salary': 'Enter your monthly salary to see what you could borrow.',
  'no-term': 'Set a repayment period of at least one month.',
  'no-capacity': 'Existing commitments use up your whole repayment capacity.',
};

/**
 * The hero "Note" plate — pinned above the inputs so the figure stays
 * visible while sliders move. Deliberately stays on ceylon-950 in both
 * color schemes, like a banknote.
 */
export function NoteCard(props: {
  status: InputStatus;
  result: LoanResult;
  property: { on: boolean; maxPropertyPrice: number; downPaymentAmount: number; downPct: number };
  termLabel: string;
  ratePercent: number;
}) {
  const { status, result, property } = props;
  const heroAmount = property.on ? property.maxPropertyPrice : result.maxLoan;

  return (
    <View style={s.plate} accessible accessibilityLiveRegion="polite">
      <View style={s.inner}>
        {status !== 'ok' ? (
          <Text style={s.empty}>{EMPTY_MESSAGES[status]}</Text>
        ) : (
          <>
            <Text style={s.kicker}>
              {property.on ? 'MAXIMUM PROPERTY PRICE' : 'MAXIMUM LOAN AMOUNT'}
            </Text>
            <Text style={s.hero} adjustsFontSizeToFit numberOfLines={1}>
              {formatLKR(heroAmount)}
            </Text>
            <Text style={s.words}>{amountInWords(heroAmount)}</Text>

            {property.on && (
              <View style={s.splitRow}>
                <Text style={s.splitText}>
                  Loan {formatLKR(result.maxLoan)} · Down payment ({property.downPct}%){' '}
                  {formatLKR(property.downPaymentAmount)}
                </Text>
              </View>
            )}

            <View style={s.metaRow}>
              <Meta
                flex={1.5}
                label="Installment"
                value={`${formatLKR(result.monthlyInstallment)}/mo`}
              />
              <Meta flex={0.9} label="Term" value={props.termLabel} />
              <Meta flex={0.7} label="Rate" value={formatPercent(props.ratePercent)} />
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function Meta(props: { label: string; value: string; flex: number }) {
  return (
    <View style={{ flex: props.flex }}>
      <Text style={s.metaLabel} numberOfLines={1}>
        {props.label}
      </Text>
      <Text style={s.metaValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {props.value}
      </Text>
    </View>
  );
}

const SAFFRON = '#E5B75C';

const s = StyleSheet.create({
  plate: {
    backgroundColor: '#0A2E2C',
    borderRadius: radius.l,
    padding: 8,
    shadowColor: '#0A2E2C',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  inner: {
    borderWidth: 1,
    borderColor: 'rgba(229, 183, 92, 0.35)',
    borderRadius: radius.l - 6,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  kicker: {
    fontFamily: fonts.ui,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: 'rgba(233, 239, 236, 0.75)',
  },
  hero: {
    fontFamily: fonts.display,
    fontSize: 40,
    fontWeight: '600',
    color: SAFFRON,
    marginTop: 6,
    ...tabular,
  },
  words: {
    fontFamily: fonts.ui,
    fontSize: 12,
    fontStyle: 'italic',
    color: 'rgba(229, 183, 92, 0.8)',
    marginTop: 4,
  },
  splitRow: { marginTop: 10 },
  splitText: {
    fontFamily: fonts.ui,
    fontSize: 12.5,
    color: 'rgba(233, 239, 236, 0.85)',
    ...tabular,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(229, 183, 92, 0.3)',
  },
  metaLabel: {
    fontFamily: fonts.ui,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: 'rgba(233, 239, 236, 0.6)',
  },
  metaValue: {
    fontFamily: fonts.ui,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#E9EFEC',
    marginTop: 2,
    ...tabular,
  },
  empty: {
    fontFamily: fonts.ui,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(233, 239, 236, 0.85)',
    paddingVertical: 18,
    textAlign: 'center',
  },
});
