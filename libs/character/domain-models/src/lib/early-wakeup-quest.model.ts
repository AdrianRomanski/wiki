export type EarlyWakeupTimeSlot = '05:00' | '05:30' | '06:00' | '06:30' | '07:00' | 'EXPIRED' | 'TOO_EARLY';

export interface EarlyWakeupQuestSlot {
  slot: EarlyWakeupTimeSlot;
  label: string;
  xpReward: number;
  tierName: string;
}

export interface EarlyWakeupEvaluation {
  slot: EarlyWakeupTimeSlot;
  xpAmount: number;
  tierName: string;
  canClaim: boolean;
  message: string;
}

export const EARLY_WAKEUP_SLOTS: Record<Exclude<EarlyWakeupTimeSlot, 'EXPIRED' | 'TOO_EARLY'>, EarlyWakeupQuestSlot> = {
  '05:00': { slot: '05:00', label: '05:00 AM', xpReward: 100, tierName: 'Prime Early Bird' },
  '05:30': { slot: '05:30', label: '05:30 AM', xpReward: 80, tierName: 'High Early Bird' },
  '06:00': { slot: '06:00', label: '06:00 AM', xpReward: 60, tierName: 'Moderate Early Bird' },
  '06:30': { slot: '06:30', label: '06:30 AM', xpReward: 40, tierName: 'Standard Early Riser' },
  '07:00': { slot: '07:00', label: '07:00 AM', xpReward: 20, tierName: 'Final Morning Window' },
};

export function evaluateEarlyWakeupQuest(date: Date = new Date()): EarlyWakeupEvaluation {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  if (totalMinutes < 300) {
    return {
      slot: 'TOO_EARLY',
      xpAmount: 0,
      tierName: 'Too Early',
      canClaim: false,
      message: 'Quest opens at 05:00 AM. Sleep well!',
    };
  }

  if (totalMinutes >= 300 && totalMinutes < 330) {
    const slot = EARLY_WAKEUP_SLOTS['05:00'];
    return {
      slot: '05:00',
      xpAmount: slot.xpReward,
      tierName: slot.tierName,
      canClaim: true,
      message: `🌅 ${slot.tierName}! Claim +${slot.xpReward} DIS XP`,
    };
  }

  if (totalMinutes >= 330 && totalMinutes < 360) {
    const slot = EARLY_WAKEUP_SLOTS['05:30'];
    return {
      slot: '05:30',
      xpAmount: slot.xpReward,
      tierName: slot.tierName,
      canClaim: true,
      message: `🌅 ${slot.tierName}! Claim +${slot.xpReward} DIS XP`,
    };
  }

  if (totalMinutes >= 360 && totalMinutes < 390) {
    const slot = EARLY_WAKEUP_SLOTS['06:00'];
    return {
      slot: '06:00',
      xpAmount: slot.xpReward,
      tierName: slot.tierName,
      canClaim: true,
      message: `⏰ ${slot.tierName}! Claim +${slot.xpReward} DIS XP`,
    };
  }

  if (totalMinutes >= 390 && totalMinutes < 420) {
    const slot = EARLY_WAKEUP_SLOTS['06:30'];
    return {
      slot: '06:30',
      xpAmount: slot.xpReward,
      tierName: slot.tierName,
      canClaim: true,
      message: `⏰ ${slot.tierName}! Claim +${slot.xpReward} DIS XP`,
    };
  }

  if (totalMinutes >= 420 && totalMinutes < 450) {
    const slot = EARLY_WAKEUP_SLOTS['07:00'];
    return {
      slot: '07:00',
      xpAmount: slot.xpReward,
      tierName: slot.tierName,
      canClaim: true,
      message: `☕ ${slot.tierName}! Claim +${slot.xpReward} DIS XP`,
    };
  }

  return {
    slot: 'EXPIRED',
    xpAmount: 0,
    tierName: 'Expired',
    canClaim: false,
    message: '⏳ Window closed for today. Wake up before 07:30 AM tomorrow for XP!',
  };
}
