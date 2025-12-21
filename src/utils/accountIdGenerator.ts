import { AccountTier } from '../hooks/useLocalAzureAccounts';

// 用于生成账号 ID 的接口（避免循环依赖）
interface AccountWithIdAndTier {
  accountId?: string;
  tier?: AccountTier;
}

/**
 * 生成账号 ID
 * 根据账号类别（premium/standard）生成带前缀的唯一 ID
 * Premium 账号: A001, A002, A003, ...
 * Standard 账号: B001, B002, B003, ...
 *
 * @param accounts 现有账号列表
 * @param tier 账号类别
 * @returns 格式化的账号 ID (例如 "A001", "B003")
 */
export function generateAccountId(
  accounts: AccountWithIdAndTier[],
  tier: AccountTier
): string {
  const prefix = tier === 'premium' ? 'A' : 'B';

  // 找出所有相同类别的账号
  const sameTierAccounts = accounts.filter(a => a.tier === tier);

  // 提取现有 ID 的数字部分
  const existingNumbers = sameTierAccounts
    .map(a => a.accountId)
    .filter((id): id is string => !!id && id.startsWith(prefix))
    .map(id => parseInt(id.slice(1), 10))
    .filter(n => !isNaN(n));

  // 找到下一个可用的数字（从 1 开始，填补空缺）
  let nextNumber = 1;
  while (existingNumbers.includes(nextNumber)) {
    nextNumber++;
  }

  // 格式化为 3 位数字，前导零填充
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

/**
 * 重新生成账号 ID（当类别改变时）
 *
 * @param accounts 所有账号列表
 * @param currentAccountId 当前账号的 ID
 * @param newTier 新的类别
 * @returns 新的账号 ID
 */
export function regenerateAccountId(
  accounts: AccountWithIdAndTier[],
  currentAccountId: string,
  newTier: AccountTier
): string {
  // 过滤掉当前账号，避免与自己冲突
  const otherAccounts = accounts.filter(a => a.accountId !== currentAccountId);
  return generateAccountId(otherAccounts, newTier);
}

/**
 * 根据账号在数组中的位置生成 ID（用于重新编号）
 * 不考虑空缺，直接按顺序分配 ID
 * Premium 账号: A001, A002, A003, ...
 * Standard 账号: B001, B002, B003, ...
 *
 * @param accounts 所有账号列表（已排序）
 * @returns 重新编号后的账号列表
 */
export function renumberAccountsByPosition(
  accounts: AccountWithIdAndTier[]
): AccountWithIdAndTier[] {
  // 分离高级和普通账号
  const premiumAccounts: AccountWithIdAndTier[] = [];
  const standardAccounts: AccountWithIdAndTier[] = [];

  accounts.forEach(acct => {
    if (acct.tier === 'premium') {
      premiumAccounts.push(acct);
    } else {
      standardAccounts.push(acct);
    }
  });

  // 按位置重新编号
  const renumberedPremium = premiumAccounts.map((acct, idx) => ({
    ...acct,
    accountId: `A${String(idx + 1).padStart(3, '0')}`
  }));

  const renumberedStandard = standardAccounts.map((acct, idx) => ({
    ...acct,
    accountId: `B${String(idx + 1).padStart(3, '0')}`
  }));

  // 合并并保持原始顺序
  const result: AccountWithIdAndTier[] = [];
  let premiumIdx = 0;
  let standardIdx = 0;

  accounts.forEach(acct => {
    if (acct.tier === 'premium') {
      result.push(renumberedPremium[premiumIdx++]);
    } else {
      result.push(renumberedStandard[standardIdx++]);
    }
  });

  return result;
}
