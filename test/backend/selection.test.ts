import { MmrMap } from '../../backend/core/category';
import {
  HasTastedFunction,
  HighMmrFunction,
  SimilarMmrFunction,
} from '../../backend/core/selection';
import { Judge } from '../../backend/selection_utility';

function GetJudge(): Judge {
  return {
    userId: 'test-user',
    tasted: {
      'food-a': 0,
      'food-b': 0,
      'food-c': 10,
      'food-d': 10,
    },
  };
}

function GetMmrMap(): MmrMap {
  return {
    'food-a': 1000,
    'food-b': 1000,
    'food-c': 1500,
    'food-d': 500,
    'food-e': 1500,
  };
}

describe('SelectionTests', () => {
  test('Check has tasted function', async () => {
    const judge = GetJudge();
    const not_tasted_score = HasTastedFunction('food-a', judge);
    const over_tasted_score = HasTastedFunction('food-c', judge);
    expect(not_tasted_score).toBe(3);
    expect(over_tasted_score).toBe(0);
  });

  test('Check similar MMR function', async () => {
    const mmrs = GetMmrMap();
    const fair_mmr_score = SimilarMmrFunction('food-a', 'food-b', mmrs);
    const another_fair_mmr_score = SimilarMmrFunction('food-c', 'food-e', mmrs);
    const unfair_mmr_score = SimilarMmrFunction('food-c', 'food-d', mmrs);
    const somewhat_fair_mmr_score = SimilarMmrFunction(
      'food-a',
      'food-c',
      mmrs,
    );
    expect(fair_mmr_score).toBe(1);
    expect(unfair_mmr_score).toBeCloseTo(0, 1);
    expect(somewhat_fair_mmr_score).toBeGreaterThan(unfair_mmr_score);
    expect(somewhat_fair_mmr_score).toBeLessThan(fair_mmr_score);
    expect(another_fair_mmr_score).toBe(1);
  });

  test('Check high MMR function', async () => {
    const mmrs = GetMmrMap();
    const low_mmr_score = HighMmrFunction('food-a', 'food-d', mmrs);
    const high_mmr_score = HighMmrFunction('food-c', 'food-e', mmrs);
  });
});
