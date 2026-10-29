import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Plus,
  Minus,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  History,
  Wallet,
  Sparkles,
  ArrowRightLeft,
  Droplets,
  Package,
  Calculator,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  ShoppingBag,
  Lock,
  Unlock,
  QrCode,
  Wifi,
  WifiOff,
  CloudUpload,
  ShieldCheck,
  Coins,
  LayoutGrid
} from 'lucide-react';

// --- DOMAIN TYPES & INTERFACES ---
export type TeamSide = 'A' | 'B';
export type ActiveTab = 'court' | 'ledger' | 'stock';
export type DesktopViewMode = 'split' | 'tabs';
export type PaymentMode =
  | 'CHANGE_GIVEN'
  | 'KEEP_CREDIT'
  | 'RETURN_CREDIT'
  | 'RECORD_AS_IS';
export type LedgerStatus =
  | 'IDLE'
  | 'BELUM_MAIN'
  | 'LUNAS'
  | 'LEBIH_BAYAR'
  | 'KURANG_BAYAR'
  | 'BELUM_BAYAR';

export interface PaymentLog {
  id: string;
  time: string;
  amount: number;
  note: string;
}

export interface Player {
  id: string;
  name: string;
  priorBalance: number;
  waterCount: number;
  paidTonight: number;
  isGuest: boolean;
  paymentLogs: PaymentLog[];
}

export interface MatchSet {
  id: string;
  setNumber: number;
  timestamp: string;
  teamA: [string, string];
  teamB: [string, string];
  winnerTeam: TeamSide;
  ballsUsed: number;
}

export interface StockLog {
  id: string;
  time: string;
  type: 'IN' | 'OUT';
  item: 'KOCK' | 'AIR';
  qty: number;
  cost: number;
  note: string;
}

export interface StockState {
  ballsRemaining: number;
  waterRemaining: number;
  cashBoxCapitalSpent: number;
  logs: StockLog[];
}

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrisNote: string;
}

export interface PlayerMatchLog {
  setId: string;
  setNumber: number;
  outcome: 'MENANG' | 'KALAH';
  balls: number;
  cost: number;
}

export interface PlayerLedgerItem extends Player {
  setsPlayed: number;
  setsWon: number;
  setsLost: number;
  ballsInvolved: number;
  shuttleCharge: number;
  waterCharge: number;
  matchLogs: PlayerMatchLog[];
  tonightBill: number;
  grossBill: number;
  netBalance: number;
  status: LedgerStatus;
}

export interface SwappingSlot {
  team: TeamSide;
  index: 0 | 1;
}

export interface RotationStat {
  setsPlayed: number;
  restedSets: number;
  neverPlayed: boolean;
}

// --- KONFIGURASI HARGA & SATUAN STOK ---
const BALL_COST = 18000;
const WINNER_COST_PER_BALL = 3000;
const LOSER_COST_PER_BALL = 6000;

const WATER_COST = 4000;
const BALLS_PER_SLOP = 12;
const DEFAULT_SLOP_PURCHASE = 10;
const DEFAULT_SLOP_COST = 1800000;
const BOTTLES_PER_BOX = 24;
const DEFAULT_BOX_COST = 48000;

const STORAGE_KEY = 'shuttletab_id_v4_ts';

const INITIAL_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: 'Budi',
    priorBalance: 0,
    waterCount: 1,
    paidTonight: 0,
    isGuest: false,
    paymentLogs: []
  },
  {
    id: 'p2',
    name: 'Andi',
    priorBalance: 0,
    waterCount: 2,
    paidTonight: 20000,
    isGuest: false,
    paymentLogs: [
      {
        id: 'pay-init-1',
        time: '20:15',
        amount: 20000,
        note: 'Cicil habis Set 1 (Kurang Rp 4.000)'
      }
    ]
  },
  {
    id: 'p3',
    name: 'Hendra',
    priorBalance: 0,
    waterCount: 0,
    paidTonight: 0,
    isGuest: false,
    paymentLogs: []
  },
  {
    id: 'p4',
    name: 'Kevin',
    priorBalance: 12000,
    waterCount: 1,
    paidTonight: 0,
    isGuest: false,
    paymentLogs: []
  },
  {
    id: 'p5',
    name: 'Rizky',
    priorBalance: -10000,
    waterCount: 1,
    paidTonight: 0,
    isGuest: false,
    paymentLogs: []
  },
  {
    id: 'p6',
    name: 'Deni',
    priorBalance: 0,
    waterCount: 0,
    paidTonight: 0,
    isGuest: false,
    paymentLogs: []
  }
];

const INITIAL_SETS: MatchSet[] = [
  {
    id: 's-demo-1',
    setNumber: 1,
    timestamp: '19:45',
    teamA: ['p1', 'p2'],
    teamB: ['p3', 'p4'],
    winnerTeam: 'A',
    ballsUsed: 3
  },
  {
    id: 's-demo-2',
    setNumber: 2,
    timestamp: '20:20',
    teamA: ['p1', 'p5'],
    teamB: ['p2', 'p6'],
    winnerTeam: 'B',
    ballsUsed: 2
  }
];

const INITIAL_STOCK: StockState = {
  ballsRemaining: 91,
  waterRemaining: 19,
  cashBoxCapitalSpent: 1848000,
  logs: [
    {
      id: 'st-1',
      time: 'Kemarin',
      type: 'IN',
      item: 'KOCK',
      qty: 120,
      cost: 1800000,
      note: 'Beli 10 Slop Kock (@12 pcs)'
    },
    {
      id: 'st-2',
      time: 'Kemarin',
      type: 'IN',
      item: 'AIR',
      qty: 24,
      cost: 48000,
      note: 'Beli 1 Dus Air Mineral (24 botol)'
    }
  ]
};

const INITIAL_BANK_INFO: BankInfo = {
  bankName: 'BCA',
  accountNumber: '1234567890',
  accountHolder: 'Budi Yanto',
  qrisNote: 'Scan QRIS Bendahara atau transfer ke BCA di atas'
};

const formatRp = (amount: number): string => {
  const absVal = Math.abs(amount);
  const formatted = 'Rp ' + absVal.toLocaleString('id-ID');
  return amount < 0 ? `- ${formatted}` : formatted;
};

export default function App() {
  // --- STATE UTAMA ---
  const [activeTab, setActiveTab] = useState<ActiveTab>('court');
  const [desktopViewMode, setDesktopViewMode] =
    useState<DesktopViewMode>('split');

  const [sessionDate, setSessionDate] = useState<string>(() => {
    const today = new Date();
    return today.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  });

  // Security & Offline State
  const [isAdmin, setIsAdmin] = useState<boolean>(true);
  const [adminPin, setAdminPin] = useState<string>('1234');
  const [pinModalOpen, setPinModalOpen] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [unsyncedChanges, setUnsyncedChanges] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('21:00');
  const [syncModalOpen, setSyncModalOpen] = useState<boolean>(false);
  const [qrisModalOpen, setQrisModalOpen] = useState<boolean>(false);
  const [bankInfo, setBankInfo] = useState<BankInfo>(INITIAL_BANK_INFO);

  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [sets, setSets] = useState<MatchSet[]>(INITIAL_SETS);
  const [stock, setStock] = useState<StockState>(INITIAL_STOCK);

  // State Lapangan Aktif
  const [courtTeamA, setCourtTeamA] = useState<[string, string]>(['p1', 'p3']);
  const [courtTeamB, setCourtTeamB] = useState<[string, string]>(['p4', 'p5']);
  const [currentBalls, setCurrentBalls] = useState<number>(2);
  const [swappingSlot, setSwappingSlot] = useState<SwappingSlot | null>(null);

  // State UI & Modals
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerIsGuest, setNewPlayerIsGuest] = useState<boolean>(false);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [copiedWA, setCopiedWA] = useState<boolean>(false);
  const [copiedRek, setCopiedRek] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Kasir Pembayaran & Kalkulator Kembalian
  const [paymentModalPlayerId, setPaymentModalPlayerId] = useState<
    string | null
  >(null);
  const [tenderedInput, setTenderedInput] = useState<string>('');
  const [paymentNoteInput, setPaymentNoteInput] = useState<string>('');

  // Modal Custom Restock
  const [customSlopCount, setCustomSlopCount] = useState<number>(10);
  const [customBoxCount, setCustomBoxCount] = useState<number>(1);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const markDirty = () => {
    setUnsyncedChanges((prev) => prev + 1);
  };

  // --- DETEKSI ONLINE / OFFLINE ---
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- LOCAL STORAGE LOAD & SAVE ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.players?.length) setPlayers(parsed.players);
        if (parsed.sets) setSets(parsed.sets);
        if (parsed.stock) setStock(parsed.stock);
        if (parsed.courtTeamA?.length === 2) setCourtTeamA(parsed.courtTeamA);
        if (parsed.courtTeamB?.length === 2) setCourtTeamB(parsed.courtTeamB);
        if (parsed.sessionDate) setSessionDate(parsed.sessionDate);
        if (parsed.adminPin) setAdminPin(parsed.adminPin);
        if (parsed.bankInfo) setBankInfo(parsed.bankInfo);
      }
    } catch (e) {
      console.error('Gagal memuat data sesi:', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          players,
          sets,
          stock,
          courtTeamA,
          courtTeamB,
          sessionDate,
          adminPin,
          bankInfo
        })
      );
    } catch (e) {
      console.error('Gagal menyimpan data sesi:', e);
    }
  }, [
    players,
    sets,
    stock,
    courtTeamA,
    courtTeamB,
    sessionDate,
    adminPin,
    bankInfo
  ]);

  // --- NEON CLOUD SYNC (PULL & PUSH) ---
  const fetchFromNeon = async () => {
    if (!navigator.onLine) return;
    try {
      const res = await fetch('/api/sync');
      if (!res.ok) return;
      const data = await res.json();

      if (data?.payload && Object.keys(data.payload).length > 0) {
        const p = data.payload;
        if (p.players) setPlayers(p.players);
        if (p.sets) setSets(p.sets);
        if (p.stock) setStock(p.stock);
        if (p.courtTeamA?.length === 2) setCourtTeamA(p.courtTeamA);
        if (p.courtTeamB?.length === 2) setCourtTeamB(p.courtTeamB);
        if (p.sessionDate) setSessionDate(p.sessionDate);
        if (p.bankInfo) setBankInfo(p.bankInfo);

        if (data.updated_at) {
          setLastSyncedAt(
            new Date(data.updated_at).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit'
            })
          );
        }
        showToast('☁️ Data terbaru dari Neon berhasil dimuat!');
      }
    } catch {
      // Abaikan jika endpoint /api/sync belum aktif di lokal
    }
  };

  useEffect(() => {
    if (unsyncedChanges === 0) {
      fetchFromNeon();
    }
  }, []);

  const handleRealCloudSync = async () => {
    if (!isAdmin) return;
    if (!navigator.onLine) {
      showToast(
        '⚠️ Sedang offline! Data aman di perangkat, sinkronkan saat online.'
      );
      return;
    }

    setIsSyncing(true);
    try {
      const payloadToSync = {
        players,
        sets,
        stock,
        courtTeamA,
        courtTeamB,
        sessionDate,
        bankInfo
      };

      const res = await fetch('/api/sync', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-pin': adminPin
        },
        body: JSON.stringify({ payload: payloadToSync })
      });

      if (res.status === 401) {
        showToast('❌ Gagal Sync: PIN Admin tidak cocok dengan server!');
        setIsSyncing(false);
        return;
      }

      if (!res.ok) throw new Error('Endpoint /api/sync belum aktif');

      const result = await res.json();
      const syncTime = result.updated_at
        ? new Date(result.updated_at).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })
        : new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          });

      setUnsyncedChanges(0);
      setLastSyncedAt(syncTime);
      setSyncModalOpen(false);
      showToast('☁️ Berhasil disimpan ke Neon! Link grup sudah terupdate.');
    } catch {
      const nowStr = new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setUnsyncedChanges(0);
      setLastSyncedAt(nowStr);
      setSyncModalOpen(false);
      showToast('💾 Tersimpan lokal (Deploy Worker untuk push ke Neon DB)');
    } finally {
      setIsSyncing(false);
    }
  };

  // --- KALKULASI ROTASI & ISTIRAHAT PEMAIN ---
  const playerRotationStats = useMemo<Record<string, RotationStat>>(() => {
    const stats: Record<string, RotationStat> = {};
    players.forEach((p) => {
      let setsPlayed = 0;
      let lastPlayedSetIndex = -1;
      sets.forEach((s, idx) => {
        if (s.teamA.includes(p.id) || s.teamB.includes(p.id)) {
          setsPlayed += 1;
          if (lastPlayedSetIndex === -1) {
            lastPlayedSetIndex = idx;
          }
        }
      });
      const restedSets =
        lastPlayedSetIndex === -1 ? sets.length : lastPlayedSetIndex;

      stats[p.id] = {
        setsPlayed,
        restedSets,
        neverPlayed: lastPlayedSetIndex === -1
      };
    });
    return stats;
  }, [players, sets]);

  // --- KALKULASI TAGIHAN, SALDO, DAN KEMBALIAN PER PEMAIN ---
  const playerLedger = useMemo<PlayerLedgerItem[]>(() => {
    const map: Record<
      string,
      Omit<PlayerLedgerItem, 'tonightBill' | 'grossBill' | 'netBalance' | 'status'>
    > = {};

    players.forEach((p) => {
      map[p.id] = {
        ...p,
        setsPlayed: 0,
        setsWon: 0,
        setsLost: 0,
        ballsInvolved: 0,
        shuttleCharge: 0,
        waterCharge: (p.waterCount || 0) * WATER_COST,
        matchLogs: []
      };
    });

    [...sets].reverse().forEach((s) => {
      const winners = s.winnerTeam === 'A' ? s.teamA : s.teamB;
      const losers = s.winnerTeam === 'A' ? s.teamB : s.teamA;

      winners.forEach((pid) => {
        if (map[pid]) {
          const charge = s.ballsUsed * WINNER_COST_PER_BALL;
          map[pid].setsPlayed += 1;
          map[pid].setsWon += 1;
          map[pid].ballsInvolved += s.ballsUsed;
          map[pid].shuttleCharge += charge;
          map[pid].matchLogs.push({
            setId: s.id,
            setNumber: s.setNumber,
            outcome: 'MENANG',
            balls: s.ballsUsed,
            cost: charge
          });
        }
      });

      losers.forEach((pid) => {
        if (map[pid]) {
          const charge = s.ballsUsed * LOSER_COST_PER_BALL;
          map[pid].setsPlayed += 1;
          map[pid].setsLost += 1;
          map[pid].ballsInvolved += s.ballsUsed;
          map[pid].shuttleCharge += charge;
          map[pid].matchLogs.push({
            setId: s.id,
            setNumber: s.setNumber,
            outcome: 'KALAH',
            balls: s.ballsUsed,
            cost: charge
          });
        }
      });
    });

    return Object.values(map).map((item) => {
      const tonightBill = item.shuttleCharge + item.waterCharge;
      const grossBill = item.priorBalance + tonightBill;
      const netBalance = grossBill - (item.paidTonight || 0);

      let status: LedgerStatus = 'IDLE';
      if (
        item.setsPlayed === 0 &&
        item.waterCount === 0 &&
        item.priorBalance === 0 &&
        item.paidTonight === 0
      ) {
        status = 'BELUM_MAIN';
      } else if (netBalance === 0) {
        status = 'LUNAS';
      } else if (netBalance < 0) {
        status = 'LEBIH_BAYAR';
      } else if (item.paidTonight > 0 && netBalance > 0) {
        status = 'KURANG_BAYAR';
      } else {
        status = 'BELUM_BAYAR';
      }

      return {
        ...item,
        tonightBill,
        grossBill,
        netBalance,
        status
      };
    });
  }, [players, sets]);

  // Ringkasan Total Malam Ini
  const summary = useMemo(() => {
    const totalBallsTonight = sets.reduce((acc, s) => acc + s.ballsUsed, 0);
    const totalShuttleCost = totalBallsTonight * BALL_COST;
    const totalWaterBottles = players.reduce(
      (acc, p) => acc + (p.waterCount || 0),
      0
    );
    const totalWaterRevenue = totalWaterBottles * WATER_COST;

    const totalCashIn = players.reduce(
      (acc, p) => acc + (p.paidTonight || 0),
      0
    );
    const totalStillOwedToUs = playerLedger.reduce(
      (acc, p) => acc + (p.netBalance > 0 ? p.netBalance : 0),
      0
    );
    const totalWeOwePlayers = playerLedger.reduce(
      (acc, p) => acc + (p.netBalance < 0 ? Math.abs(p.netBalance) : 0),
      0
    );

    const unpaidCount = playerLedger.filter((p) => p.netBalance > 0).length;
    const creditCount = playerLedger.filter((p) => p.netBalance < 0).length;

    return {
      totalBallsTonight,
      totalShuttleCost,
      totalWaterBottles,
      totalWaterRevenue,
      totalTonightRevenue: totalShuttleCost + totalWaterRevenue,
      totalCashIn,
      totalStillOwedToUs,
      totalWeOwePlayers,
      unpaidCount,
      creditCount
    };
  }, [sets, players, playerLedger]);

  const getPlayer = (id: string): PlayerLedgerItem =>
    playerLedger.find((p) => p.id === id) || {
      id,
      name: '?',
      priorBalance: 0,
      waterCount: 0,
      paidTonight: 0,
      isGuest: false,
      paymentLogs: [],
      setsPlayed: 0,
      setsWon: 0,
      setsLost: 0,
      ballsInvolved: 0,
      shuttleCharge: 0,
      waterCharge: 0,
      matchLogs: [],
      tonightBill: 0,
      grossBill: 0,
      netBalance: 0,
      status: 'BELUM_MAIN'
    };

  // --- ADMIN PIN HANDLERS ---
  const handleToggleAdminClick = () => {
    if (isAdmin) {
      setIsAdmin(false);
      setSwappingSlot(null);
      showToast('🔒 Beralih ke Mode Penonton (Read-Only)');
    } else {
      setPinInput('');
      setPinError(false);
      setPinModalOpen(true);
    }
  };

  const handleVerifyPin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pinInput === adminPin) {
      setIsAdmin(true);
      setPinModalOpen(false);
      showToast('🔓 Mode Admin Bendahara Aktif');
    } else {
      setPinError(true);
    }
  };

  // --- AKSI LAPANGAN & SET ---
  const handleRecordSet = (winnerTeam: TeamSide) => {
    if (!isAdmin) return;
    const allFour = [...courtTeamA, ...courtTeamB];
    if (new Set(allFour).size < 4) {
      showToast('⚠️ Pilih 4 pemain berbeda di lapangan!');
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const nextSetNum = sets.length + 1;
    const newSet: MatchSet = {
      id: 'set-' + Date.now(),
      setNumber: nextSetNum,
      timestamp: timeStr,
      teamA: [...courtTeamA] as [string, string],
      teamB: [...courtTeamB] as [string, string],
      winnerTeam,
      ballsUsed: currentBalls
    };

    setSets([newSet, ...sets]);

    setStock((prev) => ({
      ...prev,
      ballsRemaining: Math.max(0, prev.ballsRemaining - currentBalls),
      logs: [
        {
          id: 'st-' + Date.now(),
          time: timeStr,
          type: 'OUT',
          item: 'KOCK',
          qty: currentBalls,
          cost: 0,
          note: `Dipakai main Set #${nextSetNum}`
        },
        ...prev.logs.slice(0, 39)
      ]
    }));

    markDirty();
    showToast(
      `✅ Set #${nextSetNum} disimpan! Tim ${winnerTeam} menang (${currentBalls} kock)`
    );
  };

  const handleAdjustSetBalls = (setId: string, delta: number) => {
    if (!isAdmin) return;
    const target = sets.find((s) => s.id === setId);
    if (!target) return;
    const newBalls = target.ballsUsed + delta;
    if (newBalls < 1 || newBalls > 15) return;

    setSets((prev) =>
      prev.map((s) => (s.id === setId ? { ...s, ballsUsed: newBalls } : s))
    );

    setStock((prev) => ({
      ...prev,
      ballsRemaining: Math.max(0, prev.ballsRemaining - delta)
    }));

    markDirty();
    showToast(
      `✏️ Set #${target.setNumber} dikoreksi jadi ${newBalls} kock (Tagihan & Stok diupdate)`
    );
  };

  const handleDeleteSet = (setId: string) => {
    if (!isAdmin) return;
    const target = sets.find((s) => s.id === setId);
    if (!target) return;

    setSets(sets.filter((s) => s.id !== setId));
    setStock((prev) => ({
      ...prev,
      ballsRemaining: prev.ballsRemaining + target.ballsUsed
    }));
    markDirty();
    showToast(
      `🗑️ Set #${target.setNumber} dihapus & ${target.ballsUsed} kock dikembalikan ke stok`
    );
  };

  // --- AKSI AIR MINERAL ---
  const handleAddWater = (playerId: string, delta: number = 1) => {
    if (!isAdmin) return;
    const player = players.find((p) => p.id === playerId);
    if (!player) return;
    if (delta < 0 && (player.waterCount || 0) <= 0) return;

    const nowStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === playerId
          ? { ...p, waterCount: Math.max(0, (p.waterCount || 0) + delta) }
          : p
      )
    );

    setStock((prev) => ({
      ...prev,
      waterRemaining: Math.max(0, prev.waterRemaining - delta),
      logs:
        delta > 0
          ? [
              {
                id: 'st-w-' + Date.now(),
                time: nowStr,
                type: 'OUT',
                item: 'AIR',
                qty: delta,
                cost: 0,
                note: `Diambil ${player.name} (+${delta} btl)`
              },
              ...prev.logs.slice(0, 39)
            ]
          : prev.logs
    }));

    markDirty();
    if (delta > 0) {
      showToast(`💧 +1 Air Mineral untuk ${player.name} (Rp 4.000)`);
    } else {
      showToast(`💧 -1 Air Mineral dari ${player.name}`);
    }
  };

  // --- AKSI ROTASI PEMAIN DI LAPANGAN ---
  const handleSelectCourtPlayer = (playerId: string) => {
    if (!swappingSlot || !isAdmin) return;
    const { team, index } = swappingSlot;

    if (team === 'A') {
      const updated: [string, string] = [...courtTeamA] as [string, string];
      updated[index] = playerId;
      setCourtTeamA(updated);
    } else {
      const updated: [string, string] = [...courtTeamB] as [string, string];
      updated[index] = playerId;
      setCourtTeamB(updated);
    }
    setSwappingSlot(null);
  };

  const handleSmartRotate = () => {
    if (!isAdmin || players.length < 4) return;
    const sortedByRest = [...players].sort((a, b) => {
      const restA = playerRotationStats[a.id]?.restedSets ?? 99;
      const restB = playerRotationStats[b.id]?.restedSets ?? 99;
      if (restB !== restA) return restB - restA;
      return (
        (playerRotationStats[a.id]?.setsPlayed ?? 0) -
        (playerRotationStats[b.id]?.setsPlayed ?? 0)
      );
    });

    const chosen4 = sortedByRest.slice(0, 4).map((p) => p.id);
    setCourtTeamA([chosen4[0], chosen4[2]]);
    setCourtTeamB([chosen4[1], chosen4[3]]);
    showToast('🔄 Rotasi otomatis: Pemain yang lama istirahat masuk lapangan!');
  };

  // --- AKSI KASIR PEMBAYARAN & KALKULATOR KEMBALIAN ---
  const openPaymentModal = (playerId: string) => {
    if (!isAdmin) return;
    const item = getPlayer(playerId);
    setPaymentModalPlayerId(playerId);
    setTenderedInput(item.netBalance > 0 ? String(item.netBalance) : '');
    setPaymentNoteInput('');
  };

  const handleConfirmPayment = (mode: PaymentMode) => {
    if (!paymentModalPlayerId || !isAdmin) return;
    const item = getPlayer(paymentModalPlayerId);
    const cashGiven = parseInt(tenderedInput, 10) || 0;
    if (cashGiven <= 0 && mode !== 'RETURN_CREDIT') {
      showToast('⚠️ Masukkan nominal uang yang diterima');
      return;
    }

    const nowStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    let netRecordedPayment = cashGiven;
    let logNote = paymentNoteInput.trim();

    if (
      mode === 'CHANGE_GIVEN' &&
      item.netBalance > 0 &&
      cashGiven > item.netBalance
    ) {
      const changeAmount = cashGiven - item.netBalance;
      netRecordedPayment = item.netBalance;
      logNote =
        logNote ||
        `Bayar ${formatRp(cashGiven)}, dikasih kembalian ${formatRp(changeAmount)}`;
    } else if (
      mode === 'KEEP_CREDIT' &&
      item.netBalance > 0 &&
      cashGiven > item.netBalance
    ) {
      const overAmount = cashGiven - item.netBalance;
      netRecordedPayment = cashGiven;
      logNote =
        logNote ||
        `Bayar ${formatRp(cashGiven)} (Kembalian ${formatRp(overAmount)} disimpan jadi saldo)`;
    } else if (mode === 'RETURN_CREDIT' && item.netBalance < 0) {
      const refundAmount = Math.abs(item.netBalance);
      netRecordedPayment = -refundAmount;
      logNote =
        logNote ||
        `Kembalian/deposit ${formatRp(refundAmount)} diserahkan tunai`;
    } else {
      if (cashGiven < item.netBalance) {
        const shortAmount = item.netBalance - cashGiven;
        logNote =
          logNote ||
          `Cicil/Bayar sebagian (Masih kurang ${formatRp(shortAmount)})`;
      } else {
        logNote = logNote || 'Bayar tunai / QRIS pas';
      }
    }

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== paymentModalPlayerId) return p;
        return {
          ...p,
          paidTonight: (p.paidTonight || 0) + netRecordedPayment,
          paymentLogs: [
            {
              id: 'pay-' + Date.now(),
              time: nowStr,
              amount: netRecordedPayment,
              note: logNote
            },
            ...(p.paymentLogs || [])
          ]
        };
      })
    );

    markDirty();
    setPaymentModalPlayerId(null);
    showToast(`💸 Pembayaran ${item.name} tercatat!`);
  };

  // --- AKSI TAMBAH PEMAIN & STOK ---
  const handleAddPlayer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isAdmin) return;
    const trimmed = newPlayerName.trim();
    if (!trimmed) return;
    const newP: Player = {
      id: 'p-' + Date.now(),
      name: trimmed,
      priorBalance: 0,
      waterCount: 0,
      paidTonight: 0,
      isGuest: newPlayerIsGuest,
      paymentLogs: []
    };
    setPlayers([...players, newP]);
    setNewPlayerName('');
    setNewPlayerIsGuest(false);
    markDirty();
    showToast(
      `👋 ${trimmed} ditambahkan (${newPlayerIsGuest ? 'Pemain Tamu' : 'Member Rutin'})!`
    );
  };

  const handleRestockBalls = (slopCount: number) => {
    if (!isAdmin) return;
    const addedBalls = slopCount * BALLS_PER_SLOP;
    const addedCost = slopCount * (DEFAULT_SLOP_COST / DEFAULT_SLOP_PURCHASE);
    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    setStock((prev) => ({
      ...prev,
      ballsRemaining: prev.ballsRemaining + addedBalls,
      cashBoxCapitalSpent: (prev.cashBoxCapitalSpent || 0) + addedCost,
      logs: [
        {
          id: 'st-in-' + Date.now(),
          time: nowStr,
          type: 'IN',
          item: 'KOCK',
          qty: addedBalls,
          cost: addedCost,
          note: `Beli ${slopCount} Slop (${addedBalls} kock)`
        },
        ...prev.logs.slice(0, 39)
      ]
    }));
    markDirty();
    showToast(`🏸 Stok +${slopCount} Slop (${addedBalls} kock) ditambahkan!`);
  };

  const handleRestockWater = (boxCount: number) => {
    if (!isAdmin) return;
    const addedBottles = boxCount * BOTTLES_PER_BOX;
    const addedCost = boxCount * DEFAULT_BOX_COST;
    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    setStock((prev) => ({
      ...prev,
      waterRemaining: prev.waterRemaining + addedBottles,
      cashBoxCapitalSpent: (prev.cashBoxCapitalSpent || 0) + addedCost,
      logs: [
        {
          id: 'st-in-' + Date.now(),
          time: nowStr,
          type: 'IN',
          item: 'AIR',
          qty: addedBottles,
          cost: addedCost,
          note: `Beli ${boxCount} Dus Air (${addedBottles} botol)`
        },
        ...prev.logs.slice(0, 39)
      ]
    }));
    markDirty();
    showToast(`💧 Stok +${boxCount} Dus Air (${addedBottles} botol) ditambahkan!`);
  };

  const handleStartNewDaySession = () => {
    if (!isAdmin) return;
    const updatedPlayers: Player[] = playerLedger
      .filter((p) => !(p.isGuest && p.netBalance === 0))
      .map((p) => ({
        id: p.id,
        name: p.name,
        priorBalance: p.netBalance,
        waterCount: 0,
        paidTonight: 0,
        isGuest: p.isGuest || false,
        paymentLogs: []
      }));

    setPlayers(updatedPlayers);
    setSets([]);
    setCurrentBalls(2);
    markDirty();
    showToast(
      '✨ Sesi baru dimulai! Sisa bon/saldo otomatis dibawa & tamu lunas diarsipkan.'
    );
  };

  // --- GENERATE REKAPAN WHATSAPP ---
  const generateWhatsAppText = (): string => {
    const activeList = playerLedger.filter(
      (p) =>
        p.setsPlayed > 0 ||
        p.waterCount > 0 ||
        p.priorBalance !== 0 ||
        p.paidTonight > 0
    );

    const lines = [
      `🏸 *REKAP BADMINTON (${sessionDate})*`,
      `Total Main: ${sets.length} Set (${summary.totalBallsTonight} Kock)`,
      `Air Mineral Terjual: ${summary.totalWaterBottles} Botol`,
      `Sisa Stok: ${stock.ballsRemaining} Kock & ${stock.waterRemaining} Air`,
      `────────────────────`,
      `*STATUS KAS & BON PEMAIN:*`
    ];

    activeList.forEach((p) => {
      let icon = '❌';
      let statusNote = `*KURANG ${formatRp(p.netBalance)}*`;

      if (p.status === 'LUNAS') {
        icon = '✅';
        statusNote = 'LUNAS';
      } else if (p.status === 'LEBIH_BAYAR') {
        icon = '💰';
        statusNote = `*SALDO +${formatRp(Math.abs(p.netBalance))} (Kita Utang)*`;
      } else if (p.status === 'KURANG_BAYAR') {
        icon = '⚠️';
        statusNote = `*KURANG ${formatRp(p.netBalance)}* (Sudah masuk ${formatRp(p.paidTonight)})`;
      }

      const detailParts: string[] = [];
      if (p.setsPlayed > 0) detailParts.push(`${p.setsWon}M-${p.setsLost}K`);
      if (p.waterCount > 0) detailParts.push(`${p.waterCount} Air`);
      if (p.priorBalance > 0)
        detailParts.push(`Bon lama ${formatRp(p.priorBalance)}`);
      if (p.priorBalance < 0)
        detailParts.push(`Saldo lama +${formatRp(Math.abs(p.priorBalance))}`);

      lines.push(
        `${icon} *${p.name}*: Tagihan ${formatRp(p.grossBill)} (${detailParts.join(', ')}) ➔ ${statusNote}`
      );
    });

    lines.push(`────────────────────`);
    lines.push(`💵 Tunai Masuk Malam Ini: ${formatRp(summary.totalCashIn)}`);
    if (summary.totalStillOwedToUs > 0) {
      lines.push(`📌 Belum Terkumpul: ${formatRp(summary.totalStillOwedToUs)}`);
    }
    if (summary.totalWeOwePlayers > 0) {
      lines.push(
        `🔄 Kembalian Belum Dikasih: ${formatRp(summary.totalWeOwePlayers)}`
      );
    }
    lines.push(
      `💳 *Transfer:* ${bankInfo.bankName} ${bankInfo.accountNumber} a/n ${bankInfo.accountHolder}`
    );

    return lines.join('\n');
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppText();
    navigator.clipboard.writeText(text);
    setCopiedWA(true);
    showToast('📋 Rekapan siap ditempel ke grup WhatsApp!');
    setTimeout(() => setCopiedWA(false), 2500);
  };

  const handleCopyRekening = () => {
    navigator.clipboard.writeText(bankInfo.accountNumber);
    setCopiedRek(true);
    showToast('📋 Nomor rekening berhasil disalin!');
    setTimeout(() => setCopiedRek(false), 2000);
  };

  const activeModalPlayer = paymentModalPlayerId
    ? getPlayer(paymentModalPlayerId)
    : null;
  const parsedTendered = parseInt(tenderedInput, 10) || 0;
  const diffFromBill = activeModalPlayer
    ? parsedTendered - activeModalPlayer.netBalance
    : 0;

  const showCourtSection = activeTab === 'court';
  const showLedgerSection = activeTab === 'ledger';
  const showStockSection = activeTab === 'stock';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center selection:bg-emerald-500 selection:text-slate-950 font-sans">
      <div className="w-full max-w-md lg:max-w-7xl min-h-screen bg-slate-900 lg:bg-slate-950 flex flex-col border-x border-slate-800/80 lg:border-none relative pb-24 lg:pb-10">
        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-emerald-500 text-slate-950 font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-sm animate-bounce">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* TOP HEADER */}
        <header className="px-4 lg:px-8 pt-3.5 pb-3 bg-slate-900/95 backdrop-blur sticky top-0 z-30 border-b border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-xl shadow-inner">
                🏸
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base lg:text-lg tracking-tight text-white leading-none">
                    ShuttleTab
                  </h1>
                  <span className="hidden sm:inline-block text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                    {sessionDate}
                  </span>
                  <button
                    onClick={() => setSyncModalOpen(true)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 transition ${
                      unsyncedChanges > 0
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {isOnline ? (
                      <Wifi className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <WifiOff className="w-3 h-3 text-amber-400" />
                    )}
                    <span>
                      {unsyncedChanges > 0
                        ? `${unsyncedChanges} Belum Sync`
                        : 'Offline Siap'}
                    </span>
                  </button>
                </div>
                <p className="text-[11px] lg:text-xs text-slate-400 mt-1">
                  Patungan Kock Rp 18.000 (Menang 3rb / Kalah 6rb) • Air Mineral
                  Rp 4.000
                </p>
              </div>
            </div>

            {/* DESKTOP TOP NAVIGATION SWITCHER */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setDesktopViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  desktopViewMode === 'split'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Semua Panel (Split View)</span>
              </button>

              <button
                onClick={() => {
                  setDesktopViewMode('tabs');
                  setActiveTab('court');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  desktopViewMode === 'tabs' && activeTab === 'court'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Lapangan</span>
              </button>

              <button
                onClick={() => {
                  setDesktopViewMode('tabs');
                  setActiveTab('ledger');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  desktopViewMode === 'tabs' && activeTab === 'ledger'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Kas & Bon</span>
                {summary.unpaidCount > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 rounded-full">
                    {summary.unpaidCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setDesktopViewMode('tabs');
                  setActiveTab('stock');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                  desktopViewMode === 'tabs' && activeTab === 'stock'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Stok & Kas</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyWhatsApp}
                className="hidden sm:flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs px-3 py-1.5 rounded-xl transition"
              >
                {copiedWA ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Rekap Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Rekap WA</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setQrisModalOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1.5 rounded-xl border border-sky-500/30 transition"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QRIS</span>
              </button>

              <button
                onClick={handleToggleAdminClick}
                className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition ${
                  isAdmin
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {isAdmin ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Admin</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Penonton</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {!isAdmin && (
            <div className="mt-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] lg:text-xs text-amber-200">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  <strong>Mode Penonton (Read-Only):</strong> Cek bon & stok. Tap{' '}
                  <strong>Penonton</strong> (PIN: 1234) untuk buka kunci Admin.
                </span>
              </div>
              <button
                onClick={() => setQrisModalOpen(true)}
                className="shrink-0 bg-amber-400 text-slate-950 font-bold text-[10px] lg:text-xs px-2.5 py-1 rounded-lg"
              >
                Bayar QRIS
              </button>
            </div>
          )}

          {/* KPI STRIP */}
          <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 lg:gap-3 mt-3">
            <div
              onClick={() => setActiveTab('stock')}
              className="cursor-pointer bg-slate-800/80 hover:bg-slate-800 rounded-xl px-3 py-2 border border-slate-700/60 flex items-center justify-between transition"
            >
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Sisa Kock
                </span>
                <span
                  className={`text-sm lg:text-base font-bold ${
                    stock.ballsRemaining < 24 ? 'text-rose-400' : 'text-white'
                  }`}
                >
                  {stock.ballsRemaining}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    pcs
                  </span>
                </span>
              </div>
              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-300 border border-slate-700">
                {(stock.ballsRemaining / BALLS_PER_SLOP).toFixed(1)} slop
              </span>
            </div>

            <div
              onClick={() => setActiveTab('stock')}
              className="cursor-pointer bg-slate-800/80 hover:bg-slate-800 rounded-xl px-3 py-2 border border-slate-700/60 flex items-center justify-between transition"
            >
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Sisa Air Mineral
                </span>
                <span
                  className={`text-sm lg:text-base font-bold ${
                    stock.waterRemaining < 6 ? 'text-amber-400' : 'text-sky-400'
                  }`}
                >
                  {stock.waterRemaining}{' '}
                  <span className="text-[10px] font-normal text-slate-400">
                    btl
                  </span>
                </span>
              </div>
              <Droplets className="w-4 h-4 text-sky-400/70" />
            </div>

            <div
              onClick={() => setActiveTab('ledger')}
              className="cursor-pointer bg-slate-800/80 hover:bg-slate-800 rounded-xl px-3 py-2 border border-slate-700/60 flex flex-col justify-center transition"
            >
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                Belum Bayar ({summary.unpaidCount} org)
              </span>
              <span
                className={`text-sm lg:text-base font-bold truncate ${
                  summary.totalStillOwedToUs > 0
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {formatRp(summary.totalStillOwedToUs)}
              </span>
            </div>

            <div
              onClick={() => setActiveTab('ledger')}
              className="hidden lg:flex cursor-pointer bg-slate-800/80 hover:bg-slate-800 rounded-xl px-3 py-2 border border-slate-700/60 items-center justify-between transition"
            >
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                  Tunai/TF Masuk Malam Ini
                </span>
                <span className="text-base font-bold text-emerald-400">
                  {formatRp(summary.totalCashIn)}
                </span>
              </div>
              <Banknote className="w-5 h-5 text-emerald-400/70" />
            </div>
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 lg:p-8">
          <div
            className={
              desktopViewMode === 'split'
                ? 'space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start'
                : 'max-w-3xl mx-auto space-y-6'
            }
          >
            {/* KOLOM KIRI: LAPANGAN & RIWAYAT */}
            <div
              className={`${
                desktopViewMode === 'split'
                  ? `${showCourtSection ? 'block' : 'hidden'} lg:block lg:col-span-7 space-y-5`
                  : showCourtSection
                  ? 'block space-y-5'
                  : 'hidden'
              }`}
            >
              <section className="space-y-3 bg-slate-900/90 lg:border lg:border-slate-800 lg:p-5 lg:rounded-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <h2 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-slate-200">
                      Lapangan Aktif — Set #{sets.length + 1}
                    </h2>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={handleSmartRotate}
                      className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      Rotasi Adil Otomatis
                    </button>
                  )}
                </div>

                {/* VISUAL LAPANGAN BADMINTON */}
                <div className="relative rounded-2xl bg-gradient-to-b from-emerald-900/75 via-emerald-950/85 to-emerald-900/75 border-2 border-emerald-500/40 p-3.5 lg:p-5 shadow-xl overflow-hidden">
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/30 z-0" />
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 border-l border-white/15 z-0" />

                  {/* TIM A */}
                  <div className="relative z-10 mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-md border border-emerald-400/30">
                        Tim A
                      </span>
                      <span className="text-[11px] text-emerald-200/70">
                        {isAdmin
                          ? 'Klik nama buat ganti pemain • Klik +1 Air buat catat minum'
                          : 'Sedang bermain di lapangan'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {courtTeamA.map((pid, idx) => {
                        const slotIdx = idx as 0 | 1;
                        const p = getPlayer(pid);
                        const rot = playerRotationStats[pid] || {
                          setsPlayed: 0,
                          restedSets: 0
                        };
                        const isSelected =
                          swappingSlot?.team === 'A' &&
                          swappingSlot?.index === slotIdx;
                        return (
                          <div
                            key={`A-${slotIdx}`}
                            className={`rounded-xl p-3 border transition flex flex-col justify-between ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-400/30'
                                : 'bg-slate-900/90 border-white/15 text-white hover:border-emerald-400/50'
                            }`}
                          >
                            <button
                              disabled={!isAdmin}
                              onClick={() =>
                                setSwappingSlot(
                                  isSelected
                                    ? null
                                    : { team: 'A', index: slotIdx }
                                )
                              }
                              className="text-left w-full"
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[10px] font-bold uppercase ${
                                    isSelected
                                      ? 'text-slate-800'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  Posisi A{slotIdx + 1} • Main {rot.setsPlayed}x
                                </span>
                                {isAdmin && (
                                  <span className="text-[10px] underline opacity-75">
                                    {isSelected ? 'Batal' : 'Ganti'}
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-sm lg:text-base truncate mt-0.5">
                                {p.name}
                              </div>
                            </button>

                            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                              <span
                                className={`text-xs font-medium ${
                                  isSelected ? 'text-slate-900' : 'text-sky-300'
                                }`}
                              >
                                💧 {p.waterCount || 0} btl
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={() => handleAddWater(p.id, 1)}
                                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
                                    isSelected
                                      ? 'bg-slate-900 text-white'
                                      : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30'
                                  }`}
                                >
                                  +1 Air
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* GARIS NET */}
                  <div className="relative z-10 flex items-center justify-center my-1">
                    <span className="bg-slate-950/90 text-slate-300 text-[10px] font-bold uppercase tracking-widest px-4 py-0.5 rounded-full border border-white/20 shadow">
                      NET
                    </span>
                  </div>

                  {/* TIM B */}
                  <div className="relative z-10 mt-3">
                    <div className="grid grid-cols-2 gap-3">
                      {courtTeamB.map((pid, idx) => {
                        const slotIdx = idx as 0 | 1;
                        const p = getPlayer(pid);
                        const rot = playerRotationStats[pid] || {
                          setsPlayed: 0,
                          restedSets: 0
                        };
                        const isSelected =
                          swappingSlot?.team === 'B' &&
                          swappingSlot?.index === slotIdx;
                        return (
                          <div
                            key={`B-${slotIdx}`}
                            className={`rounded-xl p-3 border transition flex flex-col justify-between ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-400/30'
                                : 'bg-slate-900/90 border-white/15 text-white hover:border-sky-400/50'
                            }`}
                          >
                            <button
                              disabled={!isAdmin}
                              onClick={() =>
                                setSwappingSlot(
                                  isSelected
                                    ? null
                                    : { team: 'B', index: slotIdx }
                                )
                              }
                              className="text-left w-full"
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-[10px] font-bold uppercase ${
                                    isSelected
                                      ? 'text-slate-800'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  Posisi B{slotIdx + 1} • Main {rot.setsPlayed}x
                                </span>
                                {isAdmin && (
                                  <span className="text-[10px] underline opacity-75">
                                    {isSelected ? 'Batal' : 'Ganti'}
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-sm lg:text-base truncate mt-0.5">
                                {p.name}
                              </div>
                            </button>

                            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                              <span
                                className={`text-xs font-medium ${
                                  isSelected ? 'text-slate-900' : 'text-sky-300'
                                }`}
                              >
                                💧 {p.waterCount || 0} btl
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={() => handleAddWater(p.id, 1)}
                                  className={`text-xs font-bold px-2.5 py-1 rounded-lg transition ${
                                    isSelected
                                      ? 'bg-slate-900 text-white'
                                      : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/30'
                                  }`}
                                >
                                  +1 Air
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 px-2.5 py-0.5 rounded-md border border-sky-400/30">
                        Tim B
                      </span>
                    </div>
                  </div>
                </div>

                {/* DRAWER GANTI PEMAIN */}
                {swappingSlot && isAdmin && (
                  <div className="bg-slate-800 border-2 border-amber-400/60 rounded-2xl p-4 space-y-3 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs lg:text-sm font-bold text-amber-300">
                        Pilih pemain untuk Posisi {swappingSlot.team}
                        {swappingSlot.index + 1}:
                      </span>
                      <button
                        onClick={() => setSwappingSlot(null)}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Tutup
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {players.map((p) => {
                        const alreadyOnCourt = [
                          ...courtTeamA,
                          ...courtTeamB
                        ].includes(p.id);
                        const rot = playerRotationStats[p.id] || {
                          setsPlayed: 0,
                          restedSets: 0,
                          neverPlayed: true
                        };
                        return (
                          <button
                            key={p.id}
                            onClick={() => handleSelectCourtPlayer(p.id)}
                            className={`px-3 py-2.5 rounded-xl text-left border transition flex flex-col justify-between ${
                              alreadyOnCourt
                                ? 'bg-slate-900/50 border-slate-700 text-slate-400'
                                : rot.restedSets >= 2 || rot.neverPlayed
                                ? 'bg-emerald-950/60 border-emerald-500/50 text-white hover:border-emerald-400'
                                : 'bg-slate-900 border-slate-700 text-white hover:border-amber-400'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold truncate">
                                {p.name}
                              </span>
                              {alreadyOnCourt && (
                                <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                                  Di Lap
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[10px] mt-1 ${
                                rot.neverPlayed
                                  ? 'text-emerald-400 font-semibold'
                                  : rot.restedSets >= 2
                                  ? 'text-amber-300 font-semibold'
                                  : 'text-slate-400'
                              }`}
                            >
                              {rot.neverPlayed
                                ? '⭐ Belum main malam ini'
                                : rot.restedSets === 0
                                ? `Baru main (${rot.setsPlayed}x)`
                                : `Istirahat ${rot.restedSets} set (${rot.setsPlayed}x)`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* COUNTER KOCK & TOMBOL SELESAI SET */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 space-y-3 shadow-lg flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          Kock Terpakai Set Ini
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          Total Set: {formatRp(currentBalls * BALL_COST)}
                        </p>
                      </div>
                      <span className="text-xs bg-amber-400/15 text-amber-300 border border-amber-400/30 px-2.5 py-1 rounded-full font-bold">
                        Rp 18.000 / kock
                      </span>
                    </div>

                    {isAdmin ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            setCurrentBalls(Math.max(1, currentBalls - 1))
                          }
                          className="w-14 h-14 rounded-2xl bg-slate-900 hover:bg-slate-950 active:scale-95 border border-slate-700 flex items-center justify-center text-slate-200 transition"
                        >
                          <Minus className="w-6 h-6" />
                        </button>

                        <div className="flex-1 bg-slate-950/90 border border-slate-800 rounded-2xl py-2.5 px-4 text-center">
                          <div className="text-3xl font-extrabold text-amber-400 leading-none">
                            {currentBalls}
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-1">
                            Shuttlecock
                          </div>
                        </div>

                        <button
                          onClick={() => setCurrentBalls(currentBalls + 1)}
                          className="h-14 px-5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-extrabold flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
                        >
                          <Plus className="w-6 h-6 stroke-[2.5]" />
                          <span className="text-sm">1 Kock</span>
                        </button>
                      </div>
                    ) : (
                      <div className="bg-slate-950/90 border border-slate-800 rounded-2xl py-3 px-4 text-center">
                        <div className="text-2xl font-extrabold text-amber-400">
                          {currentBalls} Shuttlecock
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                            Menang
                          </span>
                          <span className="text-[11px] text-slate-300">
                            {currentBalls}×3rb
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-emerald-300">
                          {formatRp(currentBalls * WINNER_COST_PER_BALL)}
                        </span>
                      </div>

                      <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-rose-400 block">
                            Kalah
                          </span>
                          <span className="text-[11px] text-slate-300">
                            {currentBalls}×6rb
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-rose-300">
                          {formatRp(currentBalls * LOSER_COST_PER_BALL)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-lg">
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                          Set Selesai — Pilih Pemenang
                        </label>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Otomatis potong stok kock & masuk ke tagihan 4 pemain
                        </p>
                      </div>

                      <div className="grid grid-cols-2 xl:grid-cols-1 gap-2.5 flex-1">
                        <button
                          onClick={() => handleRecordSet('A')}
                          className="py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center gap-0.5 transition"
                        >
                          <div className="flex items-center gap-1.5">
                            <Trophy className="w-4 h-4" />
                            <span>Tim A Menang</span>
                          </div>
                          <span className="text-[11px] font-semibold opacity-80 truncate max-w-full">
                            {getPlayer(courtTeamA[0]).name} &{' '}
                            {getPlayer(courtTeamA[1]).name}
                          </span>
                        </button>

                        <button
                          onClick={() => handleRecordSet('B')}
                          className="py-3.5 px-4 rounded-2xl bg-sky-400 hover:bg-sky-300 active:scale-95 text-slate-950 font-extrabold text-sm shadow-lg shadow-sky-500/20 flex flex-col items-center justify-center gap-0.5 transition"
                        >
                          <div className="flex items-center gap-1.5">
                            <Trophy className="w-4 h-4" />
                            <span>Tim B Menang</span>
                          </div>
                          <span className="text-[11px] font-semibold opacity-80 truncate max-w-full">
                            {getPlayer(courtTeamB[0]).name} &{' '}
                            {getPlayer(courtTeamB[1]).name}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* RIWAYAT SET MALAM INI */}
              <section className="space-y-2.5 bg-slate-900/90 lg:border lg:border-slate-800 lg:p-5 lg:rounded-3xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs lg:text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-400" />
                    Riwayat Set Malam Ini ({sets.length})
                  </h3>
                  {isAdmin && sets.length > 0 && (
                    <span className="text-[11px] text-slate-400">
                      Salah input kock? Klik - / + untuk koreksi
                    </span>
                  )}
                </div>

                {sets.length === 0 ? (
                  <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl p-6 text-center text-xs text-slate-400">
                    Belum ada set tercatat malam ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2.5">
                    {sets.map((s) => {
                      const winners =
                        s.winnerTeam === 'A' ? s.teamA : s.teamB;
                      const losers =
                        s.winnerTeam === 'A' ? s.teamB : s.teamA;
                      return (
                        <div
                          key={s.id}
                          className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 flex items-center justify-between gap-2"
                        >
                          <div className="space-y-1 text-xs flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white bg-slate-700 px-2 py-0.5 rounded text-[11px]">
                                Set #{s.setNumber}
                              </span>
                              <span className="text-amber-300 font-semibold">
                                🏸 {s.ballsUsed} kock
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                {s.timestamp}
                              </span>
                            </div>
                            <div className="text-slate-300 truncate">
                              <span className="text-emerald-400 font-semibold">
                                M: {getPlayer(winners[0]).name} &{' '}
                                {getPlayer(winners[1]).name}
                              </span>{' '}
                              <span className="text-slate-500">
                                ({formatRp(s.ballsUsed * WINNER_COST_PER_BALL)})
                              </span>
                            </div>
                            <div className="text-slate-400 truncate">
                              <span className="text-rose-400 font-semibold">
                                K: {getPlayer(losers[0]).name} &{' '}
                                {getPlayer(losers[1]).name}
                              </span>{' '}
                              <span className="text-slate-500">
                                ({formatRp(s.ballsUsed * LOSER_COST_PER_BALL)})
                              </span>
                            </div>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1 shrink-0">
                              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                                <button
                                  onClick={() => handleAdjustSetBalls(s.id, -1)}
                                  className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-1.5 text-[11px] font-bold text-amber-400">
                                  {s.ballsUsed}
                                </span>
                                <button
                                  onClick={() => handleAdjustSetBalls(s.id, 1)}
                                  className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 rounded"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <button
                                onClick={() => handleDeleteSet(s.id)}
                                className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* KOLOM KANAN: KAS & BON + GUDANG STOK */}
            <div
              className={`${
                desktopViewMode === 'split'
                  ? `${
                      showLedgerSection || showStockSection ? 'block' : 'hidden'
                    } lg:block lg:col-span-5 space-y-6`
                  : showLedgerSection || showStockSection
                  ? 'block space-y-6'
                  : 'hidden'
              }`}
            >
              {/* PANEL KAS & BON */}
              <div
                className={`${
                  desktopViewMode === 'split'
                    ? `${showLedgerSection ? 'block' : 'hidden'} lg:block space-y-4 bg-slate-900/90 lg:border lg:border-slate-800 lg:p-5 lg:rounded-3xl`
                    : showLedgerSection
                    ? 'block space-y-4'
                    : 'hidden'
                }`}
              >
                <section className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                        Kasir & Rekapan Tagihan
                      </span>
                      <h2 className="text-base lg:text-lg font-extrabold text-white mt-0.5">
                        {isAdmin
                          ? 'Kas & Bon Pemain'
                          : 'Cek Tagihan & Status Bayar'}
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        {isAdmin
                          ? 'Bisa bayar cicil, bayar habis 1 set, atau hitung kembalian otomatis'
                          : 'Tap tombol QRIS di atas untuk transfer ke Bendahara'}
                      </p>
                    </div>
                    <button
                      onClick={handleCopyWhatsApp}
                      className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl shadow-md transition shrink-0"
                    >
                      {copiedWA ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Salin WA</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
                      <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Uang Masuk</span>
                      </div>
                      <div className="text-xs sm:text-sm font-extrabold text-white mt-0.5">
                        {formatRp(summary.totalCashIn)}
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 font-semibold">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        <span>Kurang Bayar</span>
                      </div>
                      <div className="text-xs sm:text-sm font-extrabold text-amber-300 mt-0.5">
                        {formatRp(summary.totalStillOwedToUs)}
                      </div>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5">
                      <div className="flex items-center gap-1 text-[10px] text-sky-400 font-semibold">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Kita Utang</span>
                      </div>
                      <div className="text-xs sm:text-sm font-extrabold text-sky-300 mt-0.5">
                        {formatRp(summary.totalWeOwePlayers)}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Daftar Pemain ({playerLedger.length})
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Klik nama untuk rincian
                    </span>
                  </div>

                  <div className="space-y-2">
                    {playerLedger.map((p) => {
                      const isExpanded = expandedPlayerId === p.id;

                      let badgeStyle =
                        'bg-slate-800 text-slate-400 border-slate-700';
                      let statusLabel = 'Belum Main';

                      if (p.status === 'LUNAS') {
                        badgeStyle =
                          'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                        statusLabel = 'LUNAS ✅';
                      } else if (p.status === 'LEBIH_BAYAR') {
                        badgeStyle =
                          'bg-sky-500/20 text-sky-300 border-sky-500/40';
                        statusLabel = `LEBIH BAYAR +${formatRp(Math.abs(p.netBalance))}`;
                      } else if (p.status === 'KURANG_BAYAR') {
                        badgeStyle =
                          'bg-amber-500/20 text-amber-300 border-amber-500/40';
                        statusLabel = `KURANG ${formatRp(p.netBalance)}`;
                      } else if (p.status === 'BELUM_BAYAR') {
                        badgeStyle =
                          'bg-rose-500/20 text-rose-300 border-rose-500/40';
                        statusLabel = `BELUM BAYAR ${formatRp(p.netBalance)}`;
                      }

                      return (
                        <div
                          key={p.id}
                          className={`rounded-2xl border transition overflow-hidden ${
                            p.status === 'LUNAS'
                              ? 'bg-emerald-950/15 border-emerald-500/30'
                              : p.status === 'LEBIH_BAYAR'
                              ? 'bg-sky-950/20 border-sky-500/40'
                              : 'bg-slate-800/90 border-slate-700'
                          }`}
                        >
                          <div className="p-3.5 flex items-center justify-between gap-2">
                            <button
                              onClick={() =>
                                setExpandedPlayerId(isExpanded ? null : p.id)
                              }
                              className="flex-1 text-left min-w-0"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-white">
                                  {p.name}
                                </span>
                                {p.isGuest && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    Tamu
                                  </span>
                                )}
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeStyle}`}
                                >
                                  {statusLabel}
                                </span>
                              </div>

                              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                                <span>
                                  🏸 {p.setsPlayed} set ({p.setsWon}M-
                                  {p.setsLost}K)
                                </span>
                                <span>💧 {p.waterCount} air</span>
                                {p.paidTonight > 0 && (
                                  <span className="text-emerald-400 font-medium">
                                    Masuk: {formatRp(p.paidTonight)}
                                  </span>
                                )}
                              </div>
                            </button>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isAdmin ? (
                                <>
                                  <button
                                    onClick={() => handleAddWater(p.id, 1)}
                                    className="px-2.5 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1 transition"
                                  >
                                    <Droplets className="w-3.5 h-3.5" />
                                    <span>+1</span>
                                  </button>

                                  <button
                                    onClick={() => openPaymentModal(p.id)}
                                    className={`px-3 py-2 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition shadow ${
                                      p.netBalance > 0
                                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                                        : p.netBalance < 0
                                        ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                    }`}
                                  >
                                    <Calculator className="w-3.5 h-3.5" />
                                    <span>
                                      {p.netBalance > 0
                                        ? 'BAYAR'
                                        : p.netBalance < 0
                                        ? 'KEMBALIAN'
                                        : 'KASIR'}
                                    </span>
                                  </button>
                                </>
                              ) : (
                                p.netBalance > 0 && (
                                  <button
                                    onClick={() => setQrisModalOpen(true)}
                                    className="px-3 py-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold text-xs flex items-center gap-1"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                    <span>Bayar</span>
                                  </button>
                                )
                              )}

                              <button
                                onClick={() =>
                                  setExpandedPlayerId(isExpanded ? null : p.id)
                                }
                                className="p-1.5 text-slate-400 hover:text-white"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="px-3.5 pb-3.5 pt-2 border-t border-slate-700/60 bg-slate-950/60 space-y-3 text-xs">
                              <div className="space-y-1 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                                <div className="flex justify-between text-slate-300">
                                  <span>
                                    Main Badminton ({p.setsPlayed} set,{' '}
                                    {p.ballsInvolved} kock):
                                  </span>
                                  <span className="font-semibold">
                                    {formatRp(p.shuttleCharge)}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center text-slate-300">
                                  <div className="flex items-center gap-2">
                                    <span>
                                      Air Mineral ({p.waterCount} × Rp 4.000):
                                    </span>
                                    {isAdmin && p.waterCount > 0 && (
                                      <button
                                        onClick={() => handleAddWater(p.id, -1)}
                                        className="text-[10px] bg-slate-800 hover:bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-slate-700"
                                      >
                                        -1 btl
                                      </button>
                                    )}
                                  </div>
                                  <span className="font-semibold">
                                    {formatRp(p.waterCharge)}
                                  </span>
                                </div>

                                {p.priorBalance !== 0 && (
                                  <div className="flex justify-between text-amber-300">
                                    <span>
                                      {p.priorBalance > 0
                                        ? 'Sisa Kurang Bayar Lalu:'
                                        : 'Saldo Lebih Bayar Lalu:'}
                                    </span>
                                    <span className="font-semibold">
                                      {formatRp(p.priorBalance)}
                                    </span>
                                  </div>
                                )}

                                <div className="border-t border-slate-800 my-1 pt-1 flex justify-between font-bold text-white">
                                  <span>Total Tagihan Kotor:</span>
                                  <span>{formatRp(p.grossBill)}</span>
                                </div>

                                <div className="flex justify-between text-emerald-400">
                                  <span>Sudah Dibayar Malam Ini:</span>
                                  <span className="font-bold">
                                    - {formatRp(p.paidTonight)}
                                  </span>
                                </div>

                                <div className="border-t border-slate-800 my-1 pt-1 flex justify-between font-extrabold text-sm">
                                  <span>
                                    {p.netBalance > 0
                                      ? 'Sisa Harus Dibayar:'
                                      : p.netBalance < 0
                                      ? 'Kita Utang Kembalian / Saldo:'
                                      : 'Status Akhir:'}
                                  </span>
                                  <span
                                    className={
                                      p.netBalance > 0
                                        ? 'text-amber-400'
                                        : p.netBalance < 0
                                        ? 'text-sky-400'
                                        : 'text-emerald-400'
                                    }
                                  >
                                    {p.netBalance === 0
                                      ? 'LUNAS (Rp 0)'
                                      : formatRp(Math.abs(p.netBalance))}
                                  </span>
                                </div>
                              </div>

                              {p.matchLogs.length > 0 && (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold uppercase text-slate-400">
                                    Rincian Set Dimainkan:
                                  </span>
                                  {p.matchLogs.map((log, i) => (
                                    <div
                                      key={i}
                                      className="flex justify-between text-slate-300"
                                    >
                                      <span>
                                        Set #{log.setNumber} •{' '}
                                        <strong
                                          className={
                                            log.outcome === 'MENANG'
                                              ? 'text-emerald-400'
                                              : 'text-rose-400'
                                          }
                                        >
                                          {log.outcome}
                                        </strong>{' '}
                                        ({log.balls} kock)
                                      </span>
                                      <span>{formatRp(log.cost)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {p.paymentLogs && p.paymentLogs.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <span className="text-[10px] font-bold uppercase text-emerald-400">
                                    Riwayat Pembayaran Malam Ini:
                                  </span>
                                  {p.paymentLogs.map((pl) => (
                                    <div
                                      key={pl.id}
                                      className="flex justify-between text-slate-300 bg-slate-900/60 px-2 py-1 rounded"
                                    >
                                      <span>
                                        [{pl.time}] {pl.note}
                                      </span>
                                      <span className="font-bold text-emerald-400">
                                        {formatRp(pl.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                {isAdmin && (
                  <section className="pt-3 border-t border-slate-800 space-y-3">
                    <form onSubmit={handleAddPlayer} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                          placeholder="Tambah pemain baru (misal: Hendro)..."
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Tambah</span>
                        </button>
                      </div>
                      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newPlayerIsGuest}
                          onChange={(e) =>
                            setNewPlayerIsGuest(e.target.checked)
                          }
                          className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                        />
                        <span>
                          Tandai sebagai <strong>Pemain Tamu (Cabutan)</strong>{' '}
                          — otomatis diarsipkan saat sesi baru jika lunas
                        </span>
                      </label>
                    </form>

                    <button
                      onClick={handleStartNewDaySession}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        Mulai Hari Baru (Simpan Bon/Saldo & Arsipkan Tamu Lunas)
                      </span>
                    </button>
                  </section>
                )}
              </div>

              {/* PANEL STOK BARANG & DOMPET BENDAHARA */}
              <div
                className={`${
                  desktopViewMode === 'split'
                    ? `${showStockSection ? 'block' : 'hidden'} lg:block space-y-4 bg-slate-900/90 lg:border lg:border-slate-800 lg:p-5 lg:rounded-3xl`
                    : showStockSection
                    ? 'block space-y-4'
                    : 'hidden'
                }`}
              >
                <section className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h2 className="text-sm font-extrabold text-white">
                        Dompet Kas & Gudang Stok
                      </h2>
                      <p className="text-[11px] text-slate-400">
                        Perbandingan pemakaian kock + air malam ini vs uang
                        masuk
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-400 block">
                        Nilai Kock + Air Malam Ini
                      </span>
                      <span className="text-sm font-extrabold text-white">
                        {formatRp(summary.totalTonightRevenue)}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        Kock {formatRp(summary.totalShuttleCost)} • Air{' '}
                        {formatRp(summary.totalWaterRevenue)}
                      </span>
                    </div>

                    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-400 block">
                        Uang Tunai/TF Diterima
                      </span>
                      <span className="text-sm font-extrabold text-emerald-400">
                        {formatRp(summary.totalCashIn)}
                      </span>
                      <span className="text-[10px] text-amber-400 block mt-0.5">
                        Piutang: {formatRp(summary.totalStillOwedToUs)}
                      </span>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                  <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-xl">
                          🏸
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">
                            Stok Shuttlecock
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            1 Slop = {BALLS_PER_SLOP} Kock
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-amber-400 leading-none">
                          {stock.ballsRemaining}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          ≈ {(stock.ballsRemaining / BALLS_PER_SLOP).toFixed(1)}{' '}
                          Slop
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="pt-2 border-t border-slate-700/70 space-y-2">
                        <button
                          onClick={() =>
                            handleRestockBalls(DEFAULT_SLOP_PURCHASE)
                          }
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>
                            + Beli {DEFAULT_SLOP_PURCHASE} Slop (
                            {DEFAULT_SLOP_PURCHASE * BALLS_PER_SLOP} Kock)
                          </span>
                        </button>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
                            <span className="text-xs text-slate-400 mr-2">
                              Slop Lain:
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={customSlopCount}
                              onChange={(e) =>
                                setCustomSlopCount(
                                  Math.max(1, parseInt(e.target.value, 10) || 1)
                                )
                              }
                              className="w-14 bg-transparent text-white font-bold text-xs focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => handleRestockBalls(customSlopCount)}
                            className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition"
                          >
                            + {customSlopCount} Slop
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-sky-400/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
                          <Droplets className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">
                            Stok Air Mineral
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            1 Dus = {BOTTLES_PER_BOX} Botol
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-extrabold text-sky-400 leading-none">
                          {stock.waterRemaining}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          ≈{' '}
                          {(stock.waterRemaining / BOTTLES_PER_BOX).toFixed(1)}{' '}
                          Dus
                        </div>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="pt-2 border-t border-slate-700/70 space-y-2">
                        <button
                          onClick={() => handleRestockWater(1)}
                          className="w-full py-2.5 px-4 rounded-xl bg-sky-400 hover:bg-sky-300 active:scale-95 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition"
                        >
                          <Package className="w-4 h-4" />
                          <span>
                            + Beli 1 Dus Air Mineral ({BOTTLES_PER_BOX} Botol)
                          </span>
                        </button>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
                            <span className="text-xs text-slate-400 mr-2">
                              Dus Lain:
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={customBoxCount}
                              onChange={(e) =>
                                setCustomBoxCount(
                                  Math.max(1, parseInt(e.target.value, 10) || 1)
                                )
                              }
                              className="w-14 bg-transparent text-white font-bold text-xs focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={() => handleRestockWater(customBoxCount)}
                            className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition"
                          >
                            + {customBoxCount} Dus
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <section className="space-y-2 pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    Riwayat Keluar / Masuk Barang
                  </h3>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {stock.logs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              log.type === 'IN'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {log.type === 'IN' ? 'MASUK' : 'KELUAR'}
                          </span>
                          <span className="text-slate-200 truncate">
                            {log.note}
                          </span>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <span
                            className={`font-bold ${
                              log.type === 'IN'
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {log.type === 'IN' ? `+${log.qty}` : `-${log.qty}`}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-1.5">
                            {log.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>

        {/* MODAL 1: KASIR & KALKULATOR KEMBALIAN */}
        {activeModalPlayer && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="w-full max-w-md bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Kasir & Hitung Kembalian
                  </span>
                  <h3 className="text-lg font-extrabold text-white">
                    Pembayaran: {activeModalPlayer.name}
                  </h3>
                </div>
                <button
                  onClick={() => setPaymentModalPlayerId(null)}
                  className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>
                    Main ({activeModalPlayer.setsPlayed} set) + Air (
                    {activeModalPlayer.waterCount} btl):
                  </span>
                  <span>{formatRp(activeModalPlayer.tonightBill)}</span>
                </div>
                {activeModalPlayer.priorBalance !== 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Bon / Saldo Sebelumnya:</span>
                    <span>{formatRp(activeModalPlayer.priorBalance)}</span>
                  </div>
                )}
                {activeModalPlayer.paidTonight > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Sudah Bayar Tadi:</span>
                    <span>- {formatRp(activeModalPlayer.paidTonight)}</span>
                  </div>
                )}
                <div className="border-t border-slate-800 pt-1.5 flex justify-between items-center">
                  <span className="font-bold text-slate-200 text-sm">
                    {activeModalPlayer.netBalance >= 0
                      ? 'Tagihan Saat Ini:'
                      : 'Kita Utang Kembalian:'}
                  </span>
                  <span
                    className={`text-lg font-extrabold ${
                      activeModalPlayer.netBalance > 0
                        ? 'text-amber-400'
                        : activeModalPlayer.netBalance < 0
                        ? 'text-sky-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {formatRp(Math.abs(activeModalPlayer.netBalance))}
                  </span>
                </div>
              </div>

              {activeModalPlayer.netBalance < 0 && (
                <div className="bg-sky-950/40 border border-sky-500/40 rounded-2xl p-3.5 space-y-2.5">
                  <p className="text-xs text-sky-200">
                    Kita masih pegang uang kembalian/deposit{' '}
                    <strong>{activeModalPlayer.name}</strong> sebesar{' '}
                    <strong>
                      {formatRp(Math.abs(activeModalPlayer.netBalance))}
                    </strong>
                    .
                  </p>
                  <button
                    onClick={() => handleConfirmPayment('RETURN_CREDIT')}
                    className="w-full py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold text-xs transition"
                  >
                    Serahkan Uang Kembalian Sekarang (Jadi Lunas Rp 0)
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  Uang Diterima dari {activeModalPlayer.name} (Rp):
                </label>
                <input
                  type="number"
                  value={tenderedInput}
                  onChange={(e) => setTenderedInput(e.target.value)}
                  placeholder="Ketik nominal uang..."
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-emerald-400 rounded-2xl px-4 py-3 text-xl font-extrabold text-white focus:outline-none"
                />

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activeModalPlayer.netBalance > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setTenderedInput(String(activeModalPlayer.netBalance))
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs"
                    >
                      Uang Pas ({formatRp(activeModalPlayer.netBalance)})
                    </button>
                  )}
                  {[10000, 20000, 50000, 100000].map((denom) => (
                    <button
                      key={denom}
                      type="button"
                      onClick={() => setTenderedInput(String(denom))}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs"
                    >
                      {formatRp(denom)}
                    </button>
                  ))}
                </div>
              </div>

              {parsedTendered > 0 && activeModalPlayer.netBalance > 0 && (
                <div
                  className={`rounded-2xl p-3.5 border ${
                    diffFromBill === 0
                      ? 'bg-emerald-950/40 border-emerald-500/40'
                      : diffFromBill > 0
                      ? 'bg-sky-950/40 border-sky-500/40'
                      : 'bg-amber-950/40 border-amber-500/40'
                  }`}
                >
                  {diffFromBill === 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">
                        ✅ Uang Pas! Tidak ada kembalian.
                      </span>
                      <span className="text-sm font-extrabold text-emerald-400">
                        Lunas
                      </span>
                    </div>
                  )}

                  {diffFromBill > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-300">
                          💵 Kembalian ke {activeModalPlayer.name}:
                        </span>
                        <span className="text-lg font-extrabold text-sky-300">
                          {formatRp(diffFromBill)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Pilih di bawah: kasih uang kembaliannya sekarang, atau
                        simpan jadi saldo dia kalau belum ada receh.
                      </p>
                    </div>
                  )}

                  {diffFromBill < 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">
                        ⚠️ Uang Kurang (Masih Bon):
                      </span>
                      <span className="text-base font-extrabold text-amber-400">
                        {formatRp(Math.abs(diffFromBill))}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 pt-1">
                {activeModalPlayer.netBalance > 0 && diffFromBill > 0 ? (
                  <>
                    <button
                      onClick={() => handleConfirmPayment('CHANGE_GIVEN')}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Kasih Kembalian {formatRp(diffFromBill)} (Jadi Lunas
                        Pas)
                      </span>
                    </button>
                    <button
                      onClick={() => handleConfirmPayment('KEEP_CREDIT')}
                      className="w-full py-3 px-4 rounded-2xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>
                        Nggak Ada Receh? Simpan {formatRp(diffFromBill)} Jadi
                        Saldo Dia
                      </span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConfirmPayment('RECORD_AS_IS')}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Simpan Pembayaran{' '}
                      {parsedTendered > 0 ? formatRp(parsedTendered) : ''}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: PIN ADMIN */}
        {pinModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-xs bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-extrabold text-white text-base">
                    Buka Kunci Admin
                  </h3>
                </div>
                <button
                  onClick={() => setPinModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Masukkan PIN Bendahara untuk mengedit set, stok, dan pembayaran.
                (Default demo: <strong>1234</strong>)
              </p>
              <form onSubmit={handleVerifyPin} className="space-y-3">
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  placeholder="PIN 4 Digit..."
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-emerald-400 rounded-2xl px-4 py-3 text-center text-xl tracking-widest font-extrabold text-white focus:outline-none"
                />
                {pinError && (
                  <p className="text-xs text-rose-400 text-center font-semibold">
                    ❌ PIN salah! Coba ketik 1234
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition"
                >
                  Masuk Mode Admin
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: QRIS & REKENING */}
        {qrisModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-sky-400" />
                  <h3 className="font-extrabold text-white text-base">
                    Info Pembayaran / QRIS
                  </h3>
                </div>
                <button
                  onClick={() => setQrisModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full">
                  Transfer Bank {bankInfo.bankName}
                </span>
                <div className="text-2xl font-extrabold text-white tracking-wider pt-1">
                  {bankInfo.accountNumber}
                </div>
                <div className="text-xs text-slate-400">
                  a/n{' '}
                  <strong className="text-slate-200">
                    {bankInfo.accountHolder}
                  </strong>
                </div>
                <button
                  onClick={handleCopyRekening}
                  className="mt-2 w-full py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition"
                >
                  {copiedRek ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Nomor Rekening Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Nomor Rekening</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white rounded-2xl p-4 text-slate-900 flex flex-col items-center space-y-2">
                <div className="w-40 h-40 border-4 border-slate-900 rounded-xl flex flex-col items-center justify-center p-2 bg-slate-100 text-center">
                  <QrCode className="w-24 h-24 text-slate-900 stroke-[1.5]" />
                  <span className="text-[10px] font-bold text-slate-600 mt-1">
                    QRIS GOR / BENDAHARA
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-600 text-center">
                  {bankInfo.qrisNote}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: SYNC NEON */}
        {syncModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudUpload className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-extrabold text-white text-base">
                    Offline Storage & Neon Sync
                  </h3>
                </div>
                <button
                  onClick={() => setSyncModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Penyimpanan Lokal:</span>
                  <span className="text-emerald-400 font-bold">
                    Aktif (LocalStorage)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Koneksi:</span>
                  <span
                    className={`font-bold ${
                      isOnline ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isOnline ? 'Online' : 'Offline (Mode Pesawat Aman)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Perubahan Belum Sync:</span>
                  <span className="text-amber-300 font-bold">
                    {unsyncedChanges} aksi
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Terakhir Sinkron Neon:</span>
                  <span className="text-slate-300">{lastSyncedAt}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Saat sinyal di GOR jelek/mati, semua perubahan tersimpan instan
                di perangkat ini. Begitu ada sinyal, klik tombol di bawah untuk
                push snapshot terbaru ke <strong>Neon PostgreSQL</strong>.
              </p>

              {isAdmin && (
                <button
                  disabled={isSyncing}
                  onClick={handleRealCloudSync}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>
                    {isSyncing
                      ? 'Menyinkronkan ke Neon...'
                      : 'Sinkronkan ke Neon Sekarang'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* MOBILE BOTTOM NAVIGATION */}
        <nav className="lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-slate-900/95 backdrop-blur border-t border-slate-800 px-3 py-2 flex items-center justify-around z-30">
          <button
            onClick={() => setActiveTab('court')}
            className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-1 font-bold text-xs transition ${
              activeTab === 'court'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Lapangan</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-1 font-bold text-xs transition relative ${
              activeTab === 'ledger'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Kas & Bon</span>
            {summary.unpaidCount > 0 && (
              <span className="absolute top-1 right-4 bg-amber-400 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                {summary.unpaidCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`flex-1 py-2 rounded-xl flex flex-col items-center gap-1 font-bold text-xs transition ${
              activeTab === 'stock'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Stok & Kas</span>
          </button>
        </nav>
      </div>
    </div>
  );
}