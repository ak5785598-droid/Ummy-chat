import { AppLayout } from '@/components/layout/app-layout';
import { Crown, HelpCircle, User, Volume2, X } from 'lucide-react';

const playerSlots = [
  { id: 'p1', name: 'Akash', avatar: 'A', active: true, badge: true },
  { id: 'p2', name: 'Rohan', avatar: 'R', active: true, badge: false },
  { id: 'p3', name: 'Waiting', avatar: '', active: false, badge: false },
  { id: 'p4', name: 'Waiting', avatar: '', active: false, badge: false },
];

const ringLayout = [
  { x: '50%', y: '50%', color: 'bg-red-500' },
  { x: '50%', y: '36%', color: 'bg-stone-900' },
  { x: '62%', y: '40%', color: 'bg-stone-100' },
  { x: '66%', y: '52%', color: 'bg-stone-900' },
  { x: '60%', y: '63%', color: 'bg-stone-100' },
  { x: '48%', y: '66%', color: 'bg-stone-900' },
  { x: '38%', y: '60%', color: 'bg-stone-100' },
  { x: '34%', y: '48%', color: 'bg-stone-900' },
  { x: '40%', y: '38%', color: 'bg-stone-100' },
  { x: '50%', y: '28%', color: 'bg-stone-900' },
  { x: '71%', y: '43%', color: 'bg-stone-900' },
  { x: '73%', y: '57%', color: 'bg-stone-100' },
  { x: '63%', y: '71%', color: 'bg-stone-900' },
  { x: '49%', y: '74%', color: 'bg-stone-100' },
  { x: '36%', y: '68%', color: 'bg-stone-900' },
  { x: '26%', y: '56%', color: 'bg-stone-100' },
  { x: '27%', y: '42%', color: 'bg-stone-900' },
  { x: '37%', y: '30%', color: 'bg-stone-100' },
  { x: '63%', y: '30%', color: 'bg-stone-900' },
];

const HeaderButtons = () => (
  <div className="mb-4 flex items-center justify-between text-white">
    <div className="flex items-center gap-2">
      <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
        <Crown className="h-4 w-4" />
      </button>
      <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
        <HelpCircle className="h-4 w-4" />
      </button>
      <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
        <Volume2 className="h-4 w-4" />
      </button>
    </div>
    <p className="text-2xl font-extrabold tracking-wide">Carrom</p>
    <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
      <X className="h-4 w-4" />
    </button>
  </div>
);

function LobbyPreview() {
  return (
    <section className="rounded-[2rem] border-4 border-amber-100/80 bg-gradient-to-b from-cyan-500/40 to-emerald-900/60 p-5 shadow-2xl">
      <p className="text-center text-3xl font-bold text-white">Carrom</p>
      <div className="mt-8 grid grid-cols-4 gap-4">
        {playerSlots.map((slot) => (
          <div key={slot.id} className="flex flex-col items-center gap-2 text-white">
            <div
              className={`relative flex h-14 w-14 items-center justify-center rounded-full border-2 ${
                slot.active ? 'border-white/70 bg-zinc-800' : 'border-white/30 bg-white/10'
              }`}
            >
              {slot.active ? <span className="text-xl font-bold">{slot.avatar}</span> : <User className="h-6 w-6 text-white/60" />}
              {slot.badge ? (
                <span className="absolute -top-2 -right-1 rounded-full bg-fuchsia-500 p-1">
                  <Crown className="h-3 w-3" />
                </span>
              ) : null}
            </div>
            <p className="max-w-16 truncate text-xs text-white/85">{slot.name}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-lg text-white/80">
        Start Preparing: <span className="text-3xl font-black text-white">25s</span>
      </p>

      <button className="mx-auto mt-8 block rounded-full border-4 border-amber-100 bg-gradient-to-b from-amber-300 via-amber-400 to-orange-500 px-10 py-2 text-2xl font-black tracking-wider text-white shadow-lg">
        LEAVE
      </button>
    </section>
  );
}

function CarromBoardPreview() {
  return (
    <section className="rounded-[2rem] border-4 border-amber-200/70 bg-gradient-to-b from-cyan-500/40 to-emerald-900/60 p-5 shadow-2xl">
      <div className="mx-auto aspect-square w-full max-w-[420px] rounded-3xl border-[10px] border-yellow-400 bg-amber-700 p-4 shadow-inner">
        <div className="relative h-full w-full rounded-2xl bg-[#ebb170] p-6 shadow-inner">
          {[
            'left-0 top-0',
            'right-0 top-0',
            'left-0 bottom-0',
            'right-0 bottom-0',
          ].map((corner) => (
            <span
              key={corner}
              className={`absolute ${corner} h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900 ${
                corner.includes('right') ? 'translate-x-1/2' : ''
              } ${corner.includes('bottom') ? 'translate-y-1/2' : ''}`}
            />
          ))}

          <div className="absolute inset-0 m-auto h-36 w-36 rounded-full border-2 border-amber-700/50" />

          {ringLayout.map((coin, index) => (
            <span
              key={`${coin.x}-${coin.y}-${index}`}
              className={`absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-500/40 ${coin.color}`}
              style={{ left: coin.x, top: coin.y }}
            />
          ))}
        </div>
      </div>

      <div className="mx-auto mt-6 w-full max-w-xs rounded-full bg-amber-600/60 p-2">
        <div className="h-3 w-20 rounded-full bg-zinc-100 shadow-md" />
      </div>

      <div className="mt-4 flex items-center justify-between px-2 text-white">
        <div className="text-sm font-semibold">⚫ 10 &nbsp; ⚪ 20 &nbsp; 🔴 50</div>
        <div className="text-xs text-white/70">v1.0.18</div>
      </div>
    </section>
  );
}

export default function CarromPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-b from-cyan-500 to-teal-900 p-4 sm:p-6">
        <div className="mx-auto w-full max-w-5xl">
          <HeaderButtons />

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-white/80">Before joining game</p>
              <LobbyPreview />
            </div>
            <div>
              <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-white/80">After joining (Carrom board)</p>
              <CarromBoardPreview />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
