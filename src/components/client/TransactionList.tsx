import { motion } from 'framer-motion';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShoppingBag, 
  GraduationCap, 
  Wallet,
  CreditCard,
  Coffee,
  Music,
  Car,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  subtitle: string;
  amount: number;
  icon: string;
  iconColor: string;
}

const iconMap: Record<string, typeof ShoppingBag> = {
  apple: ShoppingBag,
  spotify: Music,
  coffee: Coffee,
  car: Car,
  phone: Smartphone,
  shopping: ShoppingBag,
  course: GraduationCap,
  wallet: Wallet,
  card: CreditCard,
};

const colorMap: Record<string, string> = {
  apple: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  spotify: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  coffee: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  car: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  phone: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  shopping: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  course: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  wallet: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  card: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
};

interface TransactionItemProps {
  transaction: Transaction;
  index?: number;
}

export function TransactionItem({ transaction, index = 0 }: TransactionItemProps) {
  const Icon = iconMap[transaction.icon] || ShoppingBag;
  const isIncome = transaction.type === 'income';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors cursor-pointer"
    >
      {/* Icon */}
      <div className={cn(
        'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0',
        colorMap[transaction.icon] || 'bg-gray-100 text-gray-600'
      )}>
        <Icon className="w-5 h-5" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{transaction.title}</p>
        <p className="text-xs text-muted-foreground">{transaction.subtitle}</p>
      </div>
      
      {/* Amount */}
      <div className="text-right">
        <p className={cn(
          'font-bold text-sm',
          isIncome ? 'text-emerald-500' : 'text-rose-500'
        )}>
          {isIncome ? '+' : '-'}₲ {transaction.amount.toLocaleString()}
        </p>
      </div>
    </motion.div>
  );
}

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
  showViewAll?: boolean;
  className?: string;
}

export function TransactionList({ 
  transactions, 
  title = 'Transaction',
  showViewAll = true,
  className 
}: TransactionListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-2">
        <h3 className="font-semibold">{title}</h3>
        {showViewAll && (
          <button className="text-sm text-primary font-medium hover:underline">
            Sell All
          </button>
        )}
      </div>
      
      {/* List */}
      <div className="space-y-1">
        {transactions.map((transaction, index) => (
          <TransactionItem 
            key={transaction.id} 
            transaction={transaction} 
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

// Mock transactions data
export const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'expense',
    title: 'Apple Store',
    subtitle: 'Entertainment',
    amount: 599000,
    icon: 'apple',
    iconColor: 'gray',
  },
  {
    id: '2',
    type: 'expense',
    title: 'Spotify',
    subtitle: 'Music',
    amount: 12990,
    icon: 'spotify',
    iconColor: 'green',
  },
  {
    id: '3',
    type: 'income',
    title: 'Money Transfer',
    subtitle: 'Transaction',
    amount: 129900,
    icon: 'wallet',
    iconColor: 'cyan',
  },
  {
    id: '4',
    type: 'expense',
    title: 'Grocery',
    subtitle: 'Shopping',
    amount: 300000,
    icon: 'shopping',
    iconColor: 'pink',
  },
];
