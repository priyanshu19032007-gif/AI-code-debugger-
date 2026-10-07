export interface SampleSnippet {
  id: string;
  title: string;
  bugType: 'off-by-one' | 'null-reference' | 'wrong-operator';
  language: string;
  description: string;
  code: string;
  errorMessage?: string;
  expectedBehavior?: string;
}

export const SAMPLE_SNIPPETS: SampleSnippet[] = [
  {
    id: 'off-by-one',
    title: 'Off-By-One Loop Boundary',
    bugType: 'off-by-one',
    language: 'python',
    description: 'Moving average calculation loop stops one index too early, omitting the final window.',
    code: `def calculate_moving_averages(data, window_size):
    """Calculates moving averages for a list of numbers."""
    if not data or window_size <= 0 or window_size > len(data):
        return []
    
    averages = []
    # BUG: Off-by-one error in range upper bound.
    # Should be len(data) - window_size + 1 to include the last complete window.
    for i in range(0, len(data) - window_size):
        window = data[i : i + window_size]
        avg = sum(window) / window_size
        averages.append(avg)
        
    return averages

# Test case: 5 numbers with window 3 should yield 3 averages
numbers = [10, 20, 30, 40, 50]
# Expected: [20.0, 30.0, 40.0]
# Actual output with bug: [20.0, 30.0] (omits [30, 40, 50])
print(calculate_moving_averages(numbers, 3))
`,
    errorMessage: 'Output missing final data point [40.0]: expected 3 items, got 2 items.',
    expectedBehavior: 'Calculate moving averages across all full windows up to and including the last element [30, 40, 50].',
  },
  {
    id: 'null-reference',
    title: 'Unchecked Null / Undefined Reference',
    bugType: 'null-reference',
    language: 'typescript',
    description: 'Deep nested property access without null safety causes unhandled TypeError runtime crash.',
    code: `interface NotificationSettings {
  email?: boolean;
  sms?: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  preferences?: {
    theme?: string;
    notifications?: NotificationSettings;
  };
}

function getUserEmailSetting(user: UserProfile | null): string {
  // BUG: Direct property access without null/undefined checks.
  // Throws TypeError if user is null or preferences/notifications is undefined.
  const isEmailEnabled = user.preferences.notifications.email;

  if (isEmailEnabled) {
    return "User has email notifications enabled";
  }
  return "Email notifications are disabled";
}

// Test call with user having partial preferences
const guestUser: UserProfile = {
  id: "usr_1029",
  name: "Morgan",
  preferences: {
    theme: "dark"
    // notifications is undefined!
  }
};

console.log(getUserEmailSetting(guestUser));
`,
    errorMessage: `TypeError: Cannot read properties of undefined (reading 'email')
    at getUserEmailSetting (index.ts:16:43)
    at Object.<anonymous> (index.ts:31:13)`,
    expectedBehavior: 'Safely handle null or missing optional properties using optional chaining or nullish fallbacks.',
  },
  {
    id: 'wrong-operator',
    title: 'Wrong Operator (Assignment in Condition & Bitwise AND)',
    bugType: 'wrong-operator',
    language: 'javascript',
    description: 'Accidental assignment (= instead of ===) in VIP check and bitwise & instead of logical &&.',
    code: `function processPayment(cartTotal, userBalance, isVipMember) {
  let finalPrice = cartTotal;

  // BUG 1: Assignment operator (=) used inside conditional statement.
  // This overwrites isVipMember to true for every user!
  if (isVipMember = true) {
    finalPrice = cartTotal * 0.85; // 15% VIP discount applied to everyone
  }

  // BUG 2: Bitwise AND (&) used instead of logical AND (&&).
  // BUG 3: Strict greater-than (>) instead of greater-than-or-equal (>=).
  // A user with exactly 85 balance for an 85 price will be wrongly declined.
  if (userBalance > finalPrice & finalPrice > 0) {
    return {
      status: "approved",
      charged: finalPrice,
      remainingBalance: userBalance - finalPrice
    };
  }

  return {
    status: "declined",
    reason: "Insufficient funds"
  };
}

// Test case: Regular user with exact balance
const order = processPayment(100, 85, false);
console.log(order);
`,
    errorMessage: 'Regular user receives unintended 15% VIP discount, and transaction with exact funds is rejected.',
    expectedBehavior: 'Regular users should pay full cartTotal ($100), VIP check must use comparison (===), and userBalance >= finalPrice with logical &&.',
  },
];
