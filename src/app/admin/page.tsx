"use client";

import { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useFirestore,
  useDoc,
  useUser,
  useCollection,
  useMemoFirebase,
  updateDocumentNonBlocking,
  useStorage,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
  addDocumentNonBlocking,
  errorEmitter,
  FirestorePermissionError,
} from "@/firebase";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  doc,
  increment,
  collection,
  query,
  orderBy,
  limit,
  serverTimestamp,
  addDoc,
  getDocs,
  where,
  writeBatch,
  arrayUnion,
  arrayRemove,
  setDoc,
  Timestamp,
  updateDoc,
  getDoc,
  deleteField,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Shield,
  Loader,
  Gift,
  UserCheck,
  Star,
  Zap,
  Heart,
  MessageSquare,
  BadgeCheck,
  Upload,
  Type,
  Image as ImageIcon,
  Gamepad2,
  Camera,
  Trash2,
  ShieldCheck,
  Store,
  Check,
  Mic2,
  Send,
  Megaphone,
  MessageSquareText,
  Palette,
  UserX,
  Gavel,
  History,
  Clock,
  Dices,
  Sparkles,
  Wand2,
  Database,
  BarChart3,
  Eye,
  Search,
  RefreshCcw,
  Users,
  CheckCircle2,
  Activity,
  Wallet,
  UserSearch,
  ClipboardList,
  ListTodo,
  Plus,
  Monitor,
  Trophy,
  Crown,
  Award,
  Smile,
  Home,
  X,
  Copy,
  Pin,
  PinOff,
  ShoppingBag,
  ShieldAlert,
  Waves,
  Cloud,
  ArrowLeft,
  Rocket,
  Video,
  ArrowLeftRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGameLogoUpload } from "@/hooks/use-game-logo-upload";
import { useGameBackgroundUpload } from "@/hooks/use-game-background-upload";
import { OfficialTag } from "@/components/official-tag";
import { GoldCoinIcon } from "@/components/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { format } from "date-fns";
import Image from "next/image";
import { AVATAR_FRAMES } from "@/constants/avatar-frames";

import { useSearchParams, useRouter } from "next/navigation";
import { VipManagementTab } from "@/components/admin/vip-management-tab";
import { CpManagementTab } from "@/components/admin/cp-management-tab";
import { FamilyManagementTab } from "@/components/admin/family-management-tab";
import { LeaderboardThemeAdmin } from "@/components/admin/leaderboard-theme-admin";

const CREATOR_ID = "901piBzTQ0VzCtAvlyyobwvAaTs1";

const ADMIN_STATIC_STORE_ITEMS = [
  { id: "heart-bubble", name: "Heart Bubble", type: "Bubble" },
  { id: "love-bubble", name: "Love Bubble", type: "Bubble" },
  { id: "royal-gold-bubble", name: "Royal Gold", type: "Bubble" },
  { id: "w-lovelyshine", name: "Lovely Shine", type: "Wave" },
  { id: "w-waveflew", name: "Waveflew", type: "Wave" },
  { id: "w-tonepink", name: "Tone Pink", type: "Wave" },
  { id: "w-vox", name: "Vox", type: "Wave" },
  { id: "w-reso", name: "Reso", type: "Wave" },
  { id: "w-echo", name: "Echo", type: "Wave" },
] as const;

const AUTHORITY_ROLES = [
  { id: "Super Admin", label: "Super Admin", icon: Zap, color: "text-red-500" },
  {
    id: "Admin Management",
    label: "Admin Management",
    icon: Shield,
    color: "text-blue-500",
  },
  {
    id: "App Manager",
    label: "App Manager",
    icon: Star,
    color: "text-purple-500",
  },
  {
    id: "Customer Service",
    label: "Customer Service",
    icon: MessageSquare,
    color: "text-cyan-500",
  },
  {
    id: "Coin Seller",
    label: "Coin Seller",
    icon: Heart,
    color: "text-pink-500",
  },
  {
    id: "Assistant",
    label: "Assistant",
    icon: UserCheck,
    color: "text-green-500",
  },
];

const ELITE_TAGS = [
  {
    id: "Official",
    label: "Official",
    color: "bg-green-500",
    icon: BadgeCheck,
  },
  {
    id: "CS Leader",
    label: "CS Leader",
    color: "bg-gradient-to-r from-blue-500 to-magenta-500",
    icon: Sparkles,
  },
  {
    id: "Customer Service",
    label: "Customer Service",
    color: "bg-blue-500",
    icon: MessageSquare,
  },
  { id: "Seller", label: "Seller", color: "bg-purple-500", icon: Heart },
  {
    id: "Official center",
    label: "Official center",
    color: "bg-indigo-500",
    icon: ShieldCheck,
  },
  {
    id: "Seller center",
    label: "Seller center",
    color: "bg-orange-500",
    icon: Store,
  },
];

const DISPATCH_ASSETS = {
  frames: [
    { id: "honor-2026", name: "Honor 2026" },
    { id: "ummy-cs", name: "Ummy CS Majestic" },
    { id: "f1", name: "Golden Official" },
    { id: "f5", name: "Golden wings" },
    { id: "f7", name: "Celestial Wings" },
    { id: "little-devil", name: "Little Devil" },
    { id: "i-love-india", name: "I Love India" },
  ],
};

const DEFAULT_SLIDES = [
  {
    id: 0,
    title: "Tribe Events",
    subtitle: "Global Frequency Sync",
    iconName: "Sparkles",
    color: "from-orange-500/40",
    imageUrl: "",
  },
  {
    id: 1,
    title: "Elite Rewards",
    subtitle: "Claim Your Daily Throne",
    iconName: "Trophy",
    color: "from-yellow-500/40",
    imageUrl: "",
  },
  {
    id: 2,
    title: "Game Zone",
    subtitle: "Enter the 3D Arena",
    iconName: "Gamepad2",
    color: "from-purple-500/40",
    imageUrl: "",
  },
];

const ACTIVE_GAME_FREQUENCIES = [
  {
    id: "roulette",
    title: "Roulette",
    slug: "roulette",
    imageHint: "roulette wheel",
  },
  {
    id: "ludo",
    title: "Ludo Masters",
    slug: "ludo",
    imageHint: "3d ludo board",
  },
  {
    id: "fruit-party",
    title: "Fruit Party",
    slug: "fruit-party",
    imageHint: "3d fruit icons",
  },
  {
    id: "forest-party",
    title: "Wild Party",
    slug: "forest-party",
    imageHint: "3d lion head",
  },
];

const SearchToggle = ({
  mode,
  setMode,
}: {
  mode: "id" | "name";
  setMode: (m: "id" | "name") => void;
}) => (
  <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
    <button
      onClick={() => setMode("id")}
      className={cn(
        "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
        mode === "id" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400",
      )}
    >
      By ID
    </button>
    <button
      onClick={() => setMode("name")}
      className={cn(
        "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all",
        mode === "name"
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-400",
      )}
    >
      By Name
    </button>
  </div>
);

const LogViewer = ({ firestore, isAuthorized }: { firestore: any, isAuthorized: boolean }) => {
  const logsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(collection(firestore, "coin_audit_logs"), orderBy("timestamp", "desc"), limit(100));
  }, [firestore, isAuthorized]);

  const { data: logs, isLoading } = useCollection(logsQuery);

  if (isLoading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-green-500" /></div>;

  return (
    <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl uppercase flex items-center gap-2 text-green-600">
          <History className="h-6 w-6" /> Financial Audit Ledger
        </CardTitle>
        <CardDescription>
          Real-time record of all administrative coin movements. These records are permanent.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-4">
          {!logs || logs.length === 0 ? (
            <div className="py-20 text-center opacity-20 font-bold uppercase text-xs">No Audit Logs Found</div>
          ) : (
            <div className="rounded-2xl border overflow-x-auto w-full max-w-full bg-slate-50/30">
              <table className="w-full text-left border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="px-2 py-3 sm:p-4 text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">Time</th>
                    <th className="px-2 py-3 sm:p-4 text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">Admin (Sender)</th>
                    <th className="px-2 py-3 sm:p-4 text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">Target (Receiver)</th>
                    <th className="px-2 py-3 sm:p-4 text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-2 py-3 sm:p-4 text-[9px] sm:text-[10px] font-bold whitespace-nowrap text-slate-500">
                        {log.timestamp?.toDate ? format(log.timestamp.toDate(), "MMM d, HH:mm") : "Pending..."}
                      </td>
                      <td className="px-2 py-3 sm:p-4">
                        <p className="text-[10px] sm:text-xs font-bold uppercase text-slate-900 leading-tight">{log.adminName}</p>
                        <p className="text-[8px] text-slate-400 truncate w-24 font-mono">{log.adminId}</p>
                      </td>
                      <td className="px-2 py-3 sm:p-4">
                        <p className="text-[10px] sm:text-xs font-bold uppercase text-blue-600 leading-tight">{log.targetName}</p>
                        <p className="text-[8px] text-slate-400 font-bold">UID: {log.targetAccount}</p>
                      </td>
                      <td className="px-2 py-3 sm:p-4 font-black text-green-600 text-xs sm:text-sm">
                        +{log.amount?.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ReportsManager = ({ firestore, isAuthorized }: { firestore: any, isAuthorized: boolean }) => {
  const { toast } = useToast();
  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(collection(firestore, "reports"), orderBy("timestamp", "desc"), limit(100));
  }, [firestore, isAuthorized]);

  const { data: reports, isLoading } = useCollection(reportsQuery);

  const handleDeletePost = async (report: any) => {
    if (!firestore || !isAuthorized) return;
    try {
      // Delete the actual moment
      await deleteDocumentNonBlocking(doc(firestore, "moments", report.targetId));
      // Delete the report record
      await deleteDocumentNonBlocking(doc(firestore, "reports", report.id));
      toast({ title: "Post Deleted Successfully" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Delete Failed", description: e.message });
    }
  };

  const handleDismissReport = async (reportId: string) => {
    if (!firestore || !isAuthorized) return;
    try {
      await deleteDocumentNonBlocking(doc(firestore, "reports", reportId));
      toast({ title: "Report Dismissed" });
    } catch (e: any) {
      toast({ variant: 'destructive', title: "Dismiss Failed", description: e.message });
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader className="animate-spin text-red-500" /></div>;

  return (
    <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8 overflow-hidden">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl uppercase flex items-center gap-2 text-red-600">
          <ShieldAlert className="h-6 w-6" /> Moderation Reports
        </CardTitle>
        <CardDescription>
          Review flagged content. Please investigate before taking action.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[70vh]">
          <div className="space-y-4">
            {!reports || reports.length === 0 ? (
              <div className="py-20 text-center opacity-20 font-bold uppercase text-xs">No Pending Reports</div>
            ) : (
              <div className="grid gap-4">
                {reports.map((report: any) => (
                  <div key={report.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-4 group transition-all hover:border-red-200">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Content Preview (Existing Moment Style) */}
                      {report.targetImageUrl && (
                        <div className="relative h-24 w-24 rounded-xl overflow-hidden bg-black shrink-0">
                          <Image src={report.targetImageUrl} alt="Reported" fill className="object-cover opacity-80" />
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-2">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <Badge variant={report.type === 'user_report' ? 'secondary' : 'destructive'} className="uppercase font-black text-[9px] px-2 py-0.5">
                               {report.type === 'user_report' ? 'User Report' : 'Post Report'}
                             </Badge>
                             <Badge variant="outline" className="uppercase font-black text-[9px] px-2 py-0.5 border-red-200 text-red-600">
                               {report.reason}
                             </Badge>
                           </div>
                           <span className="text-[10px] text-slate-400 font-bold uppercase">
                             {report.timestamp?.toDate ? format(report.timestamp.toDate(), "MMM d, HH:mm") : "Just now"}
                           </span>
                         </div>
                         
                         <p className="text-sm font-medium text-slate-700 italic">
                           "{report.targetContent || report.description || "No text content"}"
                         </p>

                         <div className="flex items-center gap-3 pt-1 border-t border-slate-200/50">
                           <div className="flex flex-col">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Accused/Author</p>
                             <p className="text-[10px] font-bold text-slate-900">{report.targetName || report.targetAuthorName} {report.targetAccount && <span className="text-slate-400 font-medium">(ID: {report.targetAccount})</span>}</p>
                           </div>
                           <div className="h-4 w-[1px] bg-slate-200" />
                           <div className="flex flex-col">
                             <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Reporter</p>
                             <p className="text-[10px] font-bold text-slate-900">{report.reporterName}</p>
                           </div>
                         </div>
                      </div>

                      <div className="flex sm:flex-col gap-2 shrink-0">
                        {report.type !== 'user_report' && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeletePost(report)}
                            className="h-9 px-4 rounded-xl font-black uppercase text-[10px] gap-2"
                          >
                            <Trash2 className="h-3 w-3" /> Delete Post
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDismissReport(report.id)}
                          className="h-9 px-4 rounded-xl font-black uppercase text-[10px] gap-2"
                        >
                          <Check className="h-3 w-3" /> Dismiss
                        </Button>
                      </div>
                    </div>

                    {/* Evidence Gallery (For User Reports) */}
                    {report.evidenceUrls && report.evidenceUrls.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <ImageIcon className="h-3 w-3" /> Evidence Proof ({report.evidenceUrls.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {report.evidenceUrls.map((url: string, idx: number) => {
                            const isVideo = url.includes('.mp4') || url.includes('.mov') || url.includes('.webm');
                            return (
                              <a 
                                key={idx} 
                                href={url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="relative h-20 w-20 rounded-xl overflow-hidden bg-slate-200 border border-slate-200 group active:scale-95 transition-all shadow-sm"
                              >
                                {isVideo ? (
                                  <div className="h-full w-full flex items-center justify-center bg-slate-900">
                                    <Video className="h-6 w-6 text-white" />
                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                ) : (
                                  <Image src={url} alt="Proof" fill className="object-cover group-hover:scale-110 transition-transform" />
                                )}
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

function AdminPageContent() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const { toast } = useToast();
  const { isUploading: isUploadingGameDP, uploadGameLogo } =
    useGameLogoUpload();
  const { isUploading: isUploadingGameBG, uploadGameBackground } =
    useGameBackgroundUpload();

  const { userProfile: currentUserProfile } = useUserProfile(user?.uid || undefined);
  const isCreator = user?.uid === CREATOR_ID;
  const isAdminDelegated = currentUserProfile?.isAdmin === true;
  const isAuthorized = isCreator || isAdminDelegated;

  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("app-data");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const [searchQuery, setSearchQuery] = useState("");
  const [foundUsers, setFoundUsers] = useState<any[]>([]);

  // Search Modes
  const [recordSearchMode, setRecordSearchMode] = useState<"id" | "name">("id");
  const [centerSearchMode, setCenterSearchMode] = useState<"id" | "name">("id");
  const [banSearchMode, setBanSearchMode] = useState<"id" | "name">("id");
  const [dmSearchMode, setDmSearchMode] = useState<"id" | "name">("id");
  const [tagSearchMode, setTagSearchMode] = useState<"id" | "name">("id");

  const [rewardSearchMode, setRewardSearchMode] = useState<"id" | "name">("id");

  const [centerSearchId, setCenterSearchId] = useState("");
  const [targetUserForCenter, setTargetUserForCenter] = useState<any>(null);
  const [isSearchingCenter, setIsSearchingCenter] = useState(false);

  const [tagSearchId, setTagSearchId] = useState("");
  const [targetUserForTags, setTargetUserForTags] = useState<any>(null);

  const [idSearchInput, setIdSearchInput] = useState("");
  const [newIdInput, setNewIdInput] = useState("");
  const [selectedColor, setSelectedColor] = useState<string | null>("red");
  const [targetUserForId, setTargetUserForId] = useState<any>(null);

  const [rewardSearchId, setRewardSearchId] = useState("");
  const [targetUserForRewards, setTargetUserForRewards] = useState<any>(null);
  const [coinDispatchAmount, setCoinDispatchAmount] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [grantAssetInput, setGrantAssetInput] = useState("");
  const [grantDaysInput, setGrantDaysInput] = useState("7");
  const [isGrantingAsset, setIsGrantingAsset] = useState(false);
  const [notForSaleCategory, setNotForSaleCategory] = useState("All");
  const [notForSaleSearch, setNotForSaleSearch] = useState("");
  const [manualNotForSaleId, setManualNotForSaleId] = useState("");

  const [recordSearchId, setRecordSearchId] = useState("");
  const [targetUserForRecord, setTargetUserForRecord] = useState<any>(null);
  const [isSearchingRecord, setIsSearchingRecord] = useState(false);
  const [isResettingWallet, setIsResettingWallet] = useState(false);

  const [broadcastTitle, setBroadcastTitle] = useState("Official Notice");
  const [broadcastContent, setBroadcastContent] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const [globalAnnouncementInput, setGlobalAnnouncementInput] = useState("");
  const [globalAnnouncement2Input, setGlobalAnnouncement2Input] = useState("");
  const [isUpdatingGlobalNotice, setIsUpdatingGlobalNotice] = useState(false);
  const [isUpdatingGlobalNotice2, setIsUpdatingGlobalNotice2] = useState(false);

  // Sovereign ID management
  const [sovereignSearchMode, setSovereignSearchMode] = useState<"id" | "name">("id");
  const [sovereignSearchId, setSovereignSearchId] = useState("");
  const [targetUserForSovereign, setTargetUserForSovereign] = useState<any>(null);
  const [isSearchingSovereign, setIsSearchingSovereign] = useState(false);
  const [newSovereignId, setNewSovereignId] = useState("");
  const [selectedIdColor, setSelectedIdColor] = useState<string>("none");
  const [isSovereignAdmin, setIsSovereignAdmin] = useState(false);
  const [isSovereignBudget, setIsSovereignBudget] = useState(false);
  const [isUpdatingSovereign, setIsUpdatingSovereign] = useState(false);

  const [dmSearchId, setDmSearchId] = useState("");
  const [targetUserForDm, setTargetUserForDm] = useState<any>(null);
  const [dmTitle, setDmTitle] = useState("Official System Notice");
  const [dmContent, setDmContent] = useState("");
  const [isSendingDm, setIsSendingDm] = useState(false);

  const [banSearchId, setBanSearchId] = useState("");
  const [targetUserForBan, setTargetUserForBan] = useState<any>(null);
  const [isSearchingBan, setIsSearchingBan] = useState(false);

  const [banDays, setBanDays] = useState("1");
  const [banHours, setBanHours] = useState("0");
  const [banMinutes, setBanMinutes] = useState("0");
  const [banSeconds, setBanSeconds] = useState("0");
  const [isPermanentBan, setIsPermanentBan] = useState(false);
  const [isBanning, setIsBanning] = useState(false);

  // Universal Store Engine State
  const [storeName, setStoreName] = useState("");
  const [storePrice, setStorePrice] = useState("0");
  const [storeDuration, setStoreDuration] = useState("7");
  const [storeCategory, setStoreCategory] = useState<
    "Frame" | "Bubble" | "Theme" | "Wave" | "Entry"
  >("Frame");
  const [isUploadingStore, setIsUploadingStore] = useState(false);
  const storeFileInputRef = useRef<HTMLInputElement>(null);
  const storeVideoFileInputRef = useRef<HTMLInputElement>(null);
  const [storeVideoFile, setStoreVideoFile] = useState<File | null>(null);
  const [storeVideoPreview, setStoreVideoPreview] = useState("");
  const [storeImageFile, setStoreImageFile] = useState<File | null>(null);
  const [storeImagePreview, setStoreImagePreview] = useState("");

  const [isUploadingLoginBG, setIsUploadingLoginBG] = useState(false);
  const loginBGFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingLoadingBG, setIsUploadingLoadingBG] = useState(false);
  const loadingBGFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingSplashBG, setIsUploadingSplashBG] = useState(false);
  const splashBGFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingTag, setIsSearchingTag] = useState(false);
  const [isSearchingRewards, setIsSearchingRewards] = useState(false);
  const [isSearchingDm, setIsSearchingDm] = useState(false);
  const [isSavingId, setIsSavingId] = useState(false);

  const [isUploadingBanner, setIsUploadingBanner] = useState<number | null>(
    null,
  );
  const bannerFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isUploadingRoomBanner, setIsUploadingRoomBanner] = useState<number | null>(
    null,
  );
  const roomBannerFileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const rankingBGFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingRankingKey, setUploadingRankingKey] = useState<string | null>(
    null,
  );

  const gameFileInputRef = useRef<HTMLInputElement>(null);
  const gameBGFileInputRef = useRef<HTMLInputElement>(null);
  const gameLoadingBGFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGameForSync, setSelectedGameForSync] = useState<any>(null);
  const [isUploadingGameLoadingBG, setIsUploadingGameLoadingBG] =
    useState(false);

  const [appStats, setAppStats] = useState({
    totalCoins: 0,
    totalDiamonds: 0,
    totalSpent: 0,
    totalUsers: 0,
  });
  const [isSyncingAppData, setIsSyncingAppData] = useState(false);
  const [isSyncingIDs, setIsSyncingIDs] = useState(false);
  const [isResettingEconomy, setIsResettingEconomy] = useState(false);
  const [isProcessingRechargeAction, setIsProcessingRechargeAction] = useState<
    string | null
  >(null);
  const [isUploadingPaymentQr, setIsUploadingPaymentQr] = useState(false);
  const paymentQrFileInputRef = useRef<HTMLInputElement>(null);

  const [tribalMembers, setTribalMembers] = useState<any[]>([]);
  const [isSyncingDirectory, setIsSyncingDirectory] = useState(false);

  // Room Pin State
  const [roomPinSearchId, setRoomPinSearchId] = useState("");
  const [targetRoomForPin, setTargetRoomForPin] = useState<any>(null);
  const [isSearchingRoomPin, setIsSearchingRoomPin] = useState(false);
  const [isPinningRoom, setIsPinningRoom] = useState(false);

  // Financial Audit State
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [isFinancialSyncing, setIsFinancialSyncing] = useState(false);

  // GIFT MANAGEMENT STATE
  const [giftName, setGiftName] = useState("");
  const [giftPrice, setGiftPrice] = useState("");
  const [giftCategory, setGiftCategory] = useState("Hot");
  const [giftAnimationId, setGiftAnimationId] = useState("");
  const [isUploadingGift, setIsUploadingGift] = useState(false);
  const [isAddingGift, setIsAddingGift] = useState(false);
  const [isProcessingCustomGift, setIsProcessingCustomGift] = useState<string | null>(null);
  
  const [giftThumbnail, setGiftThumbnail] = useState<File | null>(null);
  const [giftVideo, setGiftVideo] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  
  const giftFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  // LOOT MANAGEMENT STATE
  const [lootLevels, setLootLevels] = useState<any[]>([
    { id: "home", name: "Home", threshold: 1000, image: "", animation: "", videoUrl: "", voice: "घर खुलने वाला है! लूटने के लिए तैयार हो जाओ!" },
    { id: "bank", name: "Bank", threshold: 5000, image: "", animation: "", videoUrl: "", voice: "बैंक तैयार है! बड़ी लूट के लिए तैयार हो जाओ!" },
    { id: "car", name: "Car", threshold: 15000, image: "", animation: "", videoUrl: "", voice: "कार आ गई है! लूट शुरू करो!" },
    { id: "hotel", name: "Hotel", threshold: 30000, image: "", animation: "", videoUrl: "", voice: "होटल खुल गया है! जल्दी लूटो!" },
    { id: "bus", name: "Bus", threshold: 50000, image: "", animation: "", videoUrl: "", voice: "बस आ रही है! लूटने के लिए तैयार रहो!" },
    { id: "train", name: "Train", threshold: 100000, image: "", animation: "", videoUrl: "", voice: "ट्रेन तैयार है! लूट का माल बटोर लो!" },
    { id: "ship", name: "Ship", threshold: 250000, image: "", animation: "", videoUrl: "", voice: "जहाज तैयार है! बड़ी लूट के लिए तैयार रहो!" },
    { id: "aeroplane", name: "Aeroplane", threshold: 500000, image: "", animation: "", videoUrl: "", voice: "हवाई जहाज उड़ने वाला है! अंतिम लूट का मज़ा लो!" },
  ]);
  const [selectedLevel, setSelectedLevel] = useState<string>("home");
  const [lootRewards, setLootRewards] = useState<any[]>([
    { id: "coins-common", name: "Coins", type: "coins", rarity: "common", value: 100, icon: "" },
    { id: "frame-common", name: "Frame", type: "frame", rarity: "common", value: 1, icon: "" },
    { id: "badge-rare", name: "Badge", type: "badge", rarity: "rare", value: 1, icon: "" },
    { id: "special-legendary", name: "Special Item", type: "special", rarity: "legendary", value: 1, icon: "" },
    { id: "theme-epic", name: "Room Theme", type: "theme", rarity: "epic", value: 1, icon: "" },
  ]);
  const [lootConfig, setLootConfig] = useState({
    entryLimit: 20,
    duration: 30,
    gatePriority: "top_sender",
  });
  const [isSavingLoot, setIsSavingLoot] = useState(false);
  
  // LOOT VIDEO UPLOAD STATE
  const [uploadingLevelVideo, setUploadingLevelVideo] = useState<string | null>(null);
  const lootVideoInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  
  // LOOT IMAGE UPLOAD STATE
  const [uploadingLootImage, setUploadingLootImage] = useState<string | null>(null);
  const lootImageInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  // LEVEL MANAGEMENT STATE
  const [levelTab, setLevelTab] = useState("budget");
  const [levelName, setLevelName] = useState("");
  const [levelRange, setLevelRange] = useState("");
  const [levelBudget, setLevelBudget] = useState("");
  const [levelReward, setLevelReward] = useState("");
  const [levelFrameId, setLevelFrameId] = useState("");
  const [levelImageFile, setLevelImageFile] = useState<File | null>(null);
  const [levelImagePreview, setLevelImagePreview] = useState("");
  const [isUploadingLevel, setIsUploadingLevel] = useState(false);
  const budgetLevelImageInputRef = useRef<HTMLInputElement>(null);
  const rewardsLevelImageInputRef = useRef<HTMLInputElement>(null);
  const frameLevelImageInputRef = useRef<HTMLInputElement>(null);

  // MEDAL MANAGEMENT STATE
  const [medalTab, setMedalTab] = useState("achievement");
  const [medalId, setMedalId] = useState("");
  const [medalName, setMedalName] = useState("");
  const [medalDescription, setMedalDescription] = useState("");
  const [medalTier, setMedalTier] = useState<"common" | "rare" | "epic" | "legendary">("common");
  const [medalImageFile, setMedalImageFile] = useState<File | null>(null);
  const [medalImagePreview, setMedalImagePreview] = useState("");
  const [isUploadingMedal, setIsUploadingMedal] = useState(false);
  const achievementMedalImageInputRef = useRef<HTMLInputElement>(null);
  const giftMedalImageInputRef = useRef<HTMLInputElement>(null);
  const activityMedalImageInputRef = useRef<HTMLInputElement>(null);

  // MEDAL ASSIGNMENT STATE
  const [medalAssignSearchMode, setMedalAssignSearchMode] = useState<"id" | "name">("id");
  const [medalAssignSearchId, setMedalAssignSearchId] = useState("");
  const [targetUserForMedal, setTargetUserForMedal] = useState<any>(null);
  const [isSearchingMedal, setIsSearchingMedal] = useState(false);
  const [selectedMedalForAssign, setSelectedMedalForAssign] = useState("");
  const [isAssigningMedal, setIsAssigningMedal] = useState(false);
  const [userMedals, setUserMedals] = useState<string[]>([]);

  // EMOJI MANAGEMENT STATE
  const [emojiName, setEmojiName] = useState("");
  const [emojiDisplayTime, setEmojiDisplayTime] = useState("3");
  const [emojiImageFile, setEmojiImageFile] = useState<File | null>(null);
  const [emojiAnimationFile, setEmojiAnimationFile] = useState<File | null>(null);
  const [emojiImagePreview, setEmojiImagePreview] = useState("");
  const [emojiAnimationPreview, setEmojiAnimationPreview] = useState("");
  const [isUploadingEmoji, setIsUploadingEmoji] = useState(false);
  const emojiImageInputRef = useRef<HTMLInputElement>(null);
  const emojiAnimationInputRef = useRef<HTMLInputElement>(null);

  const levelsListQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(collection(firestore, "levels"), orderBy("updatedAt", "desc"));
  }, [firestore, isAuthorized]);
  const { data: levelsList, isLoading: isLoadingLevels } = useCollection(levelsListQuery);

  const medalsListQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(collection(firestore, "medals"), orderBy("updatedAt", "desc"));
  }, [firestore, isAuthorized]);
  const { data: medalsList, isLoading: isLoadingMedals } = useCollection(medalsListQuery);

  const emojisQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(collection(firestore, "customEmojis"), orderBy("createdAt", "desc"));
  }, [firestore, isAuthorized]);
  const { data: emojisList, isLoading: isLoadingEmojis } = useCollection(emojisQuery);

  const giftsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(collection(firestore, "giftList"), orderBy("createdAt", "desc"));
  }, [firestore, isAuthorized]);
  const { data: dbGifts, isLoading: isLoadingGifts } = useCollection(giftsQuery);

  const storeQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(collection(firestore, "storeItems"), orderBy("createdAt", "desc"));
  }, [firestore, isAuthorized]);
  const { data: dbStoreItems, isLoading: isLoadingStoreItems } = useCollection(storeQuery);

  const gamesQuery = useMemoFirebase(() => {
    if (!firestore || !isCreator) return null;
    return query(collection(firestore, "games"));
  }, [firestore, isCreator]);
  const { data: firestoreGames } = useCollection(gamesQuery);

  const themesQuery = useMemoFirebase(() => {
    if (!firestore || !isCreator) return null;
    return query(
      collection(firestore, "roomThemes"),
      orderBy("createdAt", "desc"),
    );
  }, [firestore, isCreator]);
  const { data: customThemes } = useCollection(themesQuery);

  const filteredLevelsList = useMemo(() => {
    if (!levelsList) return [];
    return levelsList.filter((level: any) => {
      if (level.type) return level.type === levelTab;
      if (levelTab === "budget") {
        return ("budget" in level) || (!("reward" in level) && !("frameId" in level));
      }
      if (levelTab === "rewards") {
        return ("reward" in level);
      }
      if (levelTab === "frame") {
        return ("frameId" in level);
      }
      return true;
    });
  }, [levelsList, levelTab]);

  const filteredMedalsList = useMemo(() => {
    if (!medalsList) return [];
    return medalsList.filter((medal: any) => medal.category === medalTab);
  }, [medalsList, medalTab]);

  // Reset level form state when subtab changes
  useEffect(() => {
    setLevelName("");
    setLevelRange("");
    setLevelBudget("");
    setLevelReward("");
    setLevelFrameId("");
    setLevelImageFile(null);
    setLevelImagePreview("");
  }, [levelTab]);

  // Reset medal form state when subtab changes
  useEffect(() => {
    setMedalId("");
    setMedalName("");
    setMedalDescription("");
    setMedalTier("common");
    setMedalImageFile(null);
    setMedalImagePreview("");
  }, [medalTab]);

  const gamesList = useMemo(() => {
    return ACTIVE_GAME_FREQUENCIES.map((base) => {
      const match = firestoreGames?.find((g) => g.slug === base.slug);
      return match ? { ...base, ...match } : base;
    });
  }, [firestoreGames]);

  const configRef = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return doc(firestore, "appConfig", "global");
  }, [firestore, isAuthorized]);
  const { data: config } = useDoc(configRef);
  const storeNotForSale = (config?.storeNotForSale || {}) as Record<string, boolean>;

  const storeCatalog = useMemo(() => {
    const items: any[] = [];

    (Object.values(AVATAR_FRAMES) as any[]).forEach((f) => {
      items.push({ id: f.id, name: f.name, type: "Frame" });
    });

    (customThemes || []).forEach((t: any) => {
      items.push({ id: t.id, name: t.name, type: "Theme" });
    });

    (dbStoreItems || []).forEach((i: any) => {
      items.push({ id: i.id, name: i.name, type: i.category || i.type || "Other" });
    });

    ADMIN_STATIC_STORE_ITEMS.forEach((i) => items.push(i));

    return items;
  }, [customThemes, dbStoreItems]);

  const rechargeQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(
      collection(firestore, "rechargeRequests"),
      where("status", "==", "pending"),
      // orderBy("createdAt", "desc"), // Temporarily disabled to rule out index issues
    );
  }, [firestore, isAuthorized]);
  const { data: pendingRecharges } = useCollection(rechargeQuery);

  const customGiftRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return query(collection(firestore, "customizedGiftRequests"));
  }, [firestore, isAuthorized]);
  const { data: customGiftRequests } = useCollection(customGiftRequestsQuery);

  const sortedCustomGiftRequests = useMemo(() => {
    if (!customGiftRequests) return [];
    return [...customGiftRequests].sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    });
  }, [customGiftRequests]);

  const bannerConfigRef = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return doc(firestore, "appConfig", "banners");
  }, [firestore, isAuthorized]);
  const { data: bannerConfig } = useDoc(bannerConfigRef);

  const rankingConfigRef = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return doc(firestore, "appConfig", "rankings");
  }, [firestore, isAuthorized]);
  const { data: rankingConfig } = useDoc(rankingConfigRef);

  const roomBannerConfigRef = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return doc(firestore, "appConfig", "roomBanners");
  }, [firestore, isAuthorized]);
  const { data: roomBannerConfig } = useDoc(roomBannerConfigRef);

  const lootConfigRef = useMemoFirebase(() => {
    if (!firestore || !isAuthorized) return null;
    return doc(firestore, "appConfig", "lootSettings");
  }, [firestore, isAuthorized]);
  const { data: lootConfigData } = useDoc(lootConfigRef);

  useEffect(() => {
    if (lootConfigData) {
      setLootLevels(lootConfigData.levels || lootLevels);
      setLootRewards(lootConfigData.rewards || lootRewards);
      setLootConfig({
        entryLimit: lootConfigData.entryLimit || 20,
        duration: lootConfigData.duration || 60,
        gatePriority: lootConfigData.gatePriority || "top_sender",
      });
    }
  }, [lootConfigData]);

  const handleUpdateGlobalNotice = () => {
    if (!firestore || !isAuthorized || !configRef) return;
    setIsUpdatingGlobalNotice(true);
    updateDoc(configRef, {
      globalAnnouncement: globalAnnouncementInput,
      updatedAt: serverTimestamp(),
    })
      .then(() => {
        toast({
          title: "Global Sync Complete",
          description: "Room Notice Row 1 updated across the tribe.",
        });
      })
      .catch((err) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({
            path: configRef.path,
            operation: "update",
            requestResourceData: {
              globalAnnouncement: globalAnnouncementInput,
            },
          }),
        );
      })
      .finally(() => setIsUpdatingGlobalNotice(false));
  };

  const handleUpdateGlobalNotice2 = () => {
    if (!firestore || !isAuthorized || !configRef) return;
    setIsUpdatingGlobalNotice2(true);
    updateDoc(configRef, {
      globalAnnouncement2: globalAnnouncement2Input,
      updatedAt: serverTimestamp(),
    })
      .then(() => {
        toast({
          title: "Global Sync Row 2 Complete",
          description: "Room Notice Row 2 updated across the tribe.",
        });
      })
      .catch((err) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({
            path: configRef.path,
            operation: "update",
            requestResourceData: {
              globalAnnouncement2: globalAnnouncement2Input,
            },
          }),
        );
      })
      .finally(() => setIsUpdatingGlobalNotice2(false));
  };

  const handleSyncAppData = async () => {
    if (!firestore || !isAuthorized) return;
    setIsSyncingAppData(true);
    try {
      const usersSnap = await getDocs(collection(firestore, "users"));
      let tc = 0,
        td = 0,
        ts = 0;
      usersSnap.docs.forEach((d) => {
        const w = d.data().wallet || {};
        tc += w.coins || 0;
        td += w.diamonds || 0;
        ts += w.totalSpent || 0;
      });
      setAppStats({
        totalCoins: tc,
        totalDiamonds: td,
        totalSpent: ts,
        totalUsers: usersSnap.docs.length,
      });
      toast({ title: "Economic Ledger Synchronized" });
    } catch (e) {
      errorEmitter.emit(
        "permission-error",
        new FirestorePermissionError({ path: "users", operation: "list" }),
      );
    } finally {
      setIsSyncingAppData(false);
    }
  };

  const handleSyncDirectory = async () => {
    if (!firestore || !isAuthorized) return;
    setIsSyncingDirectory(true);
    try {
      const snap = await getDocs(
        query(collection(firestore, "users"), limit(50)),
      );
      setTribalMembers(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      toast({ title: "Member Directory Synchronized" });
    } catch (e) {
      errorEmitter.emit(
        "permission-error",
        new FirestorePermissionError({ path: "users", operation: "list" }),
      );
    } finally {
      setIsSyncingDirectory(false);
    }
  };

  const handleGlobalEconomyReset = async () => {
    if (!firestore || !configRef) return;
    if (
      !confirm(
        "CRITICAL WARNING: This will RESET EVERY USER'S COINS TO ZERO and then re-credit only confirmed offline recharges. Proceed?",
      )
    )
      return;

    setIsResettingEconomy(true);
    try {
      // 1. Fetch all approved recharge requests
      // Note: We bypass the composite index requirement by filtering the date in memory
      const rechargeSnap = await getDocs(
        query(
          collection(firestore, "rechargeRequests"),
          where("status", "==", "approved"),
        ),
      );

      const launchDate = new Date("2026-03-25T00:00:00Z");
      const rechargeMap = new Map();

      rechargeSnap.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate?.() || new Date(0);

        if (createdAt >= launchDate) {
          const res = rechargeMap.get(data.uid) || 0;
          // Correctly sum base coins and bonus
          rechargeMap.set(data.uid, res + (data.coins || 0) + (data.bonus || 0));
        }
      });

      // 3. Process users in safe batches
      const usersSnap = await getDocs(collection(firestore, "users"));
      let batch = writeBatch(firestore);
      let operationsInBatch = 0;
      const batchesToWait = [];

      const processedUids = new Set<string>();

      const runUpdate = (uid: string) => {
        const validCoins = rechargeMap.get(uid) || 0;
        const userRef = doc(firestore!, "users", uid);
        const profileRef = doc(firestore!, "users", uid, "profile", uid);

        // Robust set with merge handles missing objects
        // We set coins to valid amount and RESET diamonds to 0
        const resetPayload = {
          "wallet.coins": validCoins,
          "wallet.diamonds": 0,
          updatedAt: serverTimestamp(),
        };

        batch.set(userRef, resetPayload, { merge: true });
        batch.set(profileRef, resetPayload, { merge: true });

        operationsInBatch += 2;
        processedUids.add(uid);

        if (operationsInBatch >= 400) {
          batchesToWait.push(batch.commit());
          batch = writeBatch(firestore!);
          operationsInBatch = 0;
        }
      };

      // Pass 1: Sync all users in the users collection
      usersSnap.forEach((u) => runUpdate(u.id));

      // Pass 2: Ensure any recharged users missing from users collection are also reset
      for (const uid of rechargeMap.keys()) {
        if (!processedUids.has(uid)) {
          runUpdate(uid);
        }
      }

      if (operationsInBatch > 0) {
        batchesToWait.push(batch.commit());
      }

      await Promise.all(batchesToWait);
      toast({
        title: "Economy Reset Successful",
        description: `Wiped & Re-synced ${processedUids.size} user accounts. Only approved manual recharges were credited back.`,
      });
    } catch (err: any) {
      console.error("Reset failed", err);
      alert(`ECONOMY RESET FAILED: ${err.message || "Unknown Error"}`);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "Check console or alert for details.",
      });
    } finally {
      setIsResettingEconomy(false);
    }
  };

  const handleGlobalDiamondReset = async () => {
    if (!firestore || !isCreator) return;
    if (
      !confirm(
        "DIAMOND PURGE: This will set EVERY user's diamond balance to 0. THIS ACTION IS IRREVERSIBLE. Proceed?",
      )
    )
      return;

    setIsResettingEconomy(true);
    try {
      const usersSnap = await getDocs(collection(firestore, "users"));
      let batch = writeBatch(firestore);
      let ops = 0;
      const batches = [];

      usersSnap.forEach((uDoc) => {
        batch.set(
          doc(firestore, "users", uDoc.id),
          { "wallet.diamonds": 0, updatedAt: serverTimestamp() },
          { merge: true },
        );
        batch.set(
          doc(firestore, "users", uDoc.id, "profile", uDoc.id),
          { "wallet.diamonds": 0, updatedAt: serverTimestamp() },
          { merge: true },
        );
        ops += 2;
        if (ops >= 400) {
          batches.push(batch.commit());
          batch = writeBatch(firestore);
          ops = 0;
        }
      });

      if (ops > 0) batches.push(batch.commit());
      await Promise.all(batches);
      toast({
        title: "Diamond Purge Complete",
        description: "All balances reset to 0.",
      });
    } catch (e: any) {
      console.error(e);
      alert(`DIAMOND PURGE FAILED: ${e.message}`);
    } finally {
      setIsResettingEconomy(false);
    }
  };

  const handleClearRechargeHistory = async () => {
    if (!firestore || !isCreator) return;
    if (
      !confirm(
        "WIPE HISTORY: This will delete ALL recharge records BEFORE today. Proceed?",
      )
    )
      return;

    setIsResettingEconomy(true);
    try {
      const snap = await getDocs(
        query(
          collection(firestore, "rechargeRequests"),
          where("createdAt", "<", Timestamp.fromDate(new Date("2026-03-25T00:00:00Z"))),
        ),
      );
      let batch = writeBatch(firestore);
      let ops = 0;
      const batches = [];

      snap.forEach((d) => {
        batch.delete(d.ref);
        ops++;
        if (ops >= 400) {
          batches.push(batch.commit());
          batch = writeBatch(firestore);
          ops = 0;
        }
      });

      if (ops > 0) batches.push(batch.commit());
      await Promise.all(batches);
      toast({ title: "Test History Wiped", description: `Removed ${snap.size} old records.` });
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsResettingEconomy(false);
    }
  };

  const handleGlobalIdentitySync = async () => {
    if (!firestore || !isCreator) return;
    setIsSyncingIDs(true);
    try {
      const counterRef = doc(firestore, "appConfig", "counters");
      const counterDoc = await getDoc(counterRef);
      let lastUserId = counterDoc.exists()
        ? counterDoc.data().lastUserId || 0
        : 0;
      let lastRoomId = counterDoc.exists()
        ? counterDoc.data().lastRoomId || 99
        : 99;
      
      // IDENTITY RESET SAFETY: If counter is erroneously high (>=1000), 
      // let's re-scan rooms to find the last valid 3-digit track.
      if (lastRoomId >= 1000) {
        lastRoomId = 115; // Set to known good state from user report
      }

      const usersSnap = await getDocs(collection(firestore, "users"));
      let batch = writeBatch(firestore);
      let totalOps = 0;
      let changedCount = 0;
      const batchesToWait = [];

      for (const d of usersSnap.docs) {
        const data = d.data();
        const isStrictlySixDigits = /^\d{6}$/.test(data.accountNumber || '');
        const needsSync =
          !data.accountNumber ||
          (!isStrictlySixDigits && !(d.id === CREATOR_ID && data.accountNumber === "0000")) ||
          (d.id === CREATOR_ID && data.accountNumber !== "0000");

        if (needsSync) {
          let paddedId;
          if (d.id === CREATOR_ID) {
            paddedId = "0000";
          } else {
            // Random 6-digit generator for Admin Sync
            paddedId = Math.floor(100000 + Math.random() * 900000).toString();
          }

          batch.update(doc(firestore, "users", d.id), {
            accountNumber: paddedId,
            updatedAt: serverTimestamp(),
          });
          batch.update(doc(firestore, "users", d.id, "profile", d.id), {
            accountNumber: paddedId,
            updatedAt: serverTimestamp(),
          });
          totalOps += 2;
          changedCount++;

          if (totalOps >= 400) {
            batchesToWait.push(batch.commit());
            batch = writeBatch(firestore);
            totalOps = 0;
          }
        }
      }

      const roomsSnap = await getDocs(collection(firestore, "chatRooms"));
      for (const d of roomsSnap.docs) {
        const data = d.data();
        const needsSync =
          !data.roomNumber ||
          parseInt(data.roomNumber) < 100 ||
          parseInt(data.roomNumber) >= 1000 ||
          (data.ownerId === CREATOR_ID && data.roomNumber !== "100");
        if (needsSync) {
          let newId;
          if (data.ownerId === CREATOR_ID) newId = 100;
          else {
            lastRoomId++;
            newId = lastRoomId;
          }
          batch.update(doc(firestore, "chatRooms", d.id), {
            roomNumber: newId.toString(),
            updatedAt: serverTimestamp(),
          });
          totalOps++;
          changedCount++;

          if (totalOps >= 400) {
            batchesToWait.push(batch.commit());
            batch = writeBatch(firestore);
            totalOps = 0;
          }
        }
      }

      if (changedCount > 0) {
        batch.set(counterRef, { lastUserId, lastRoomId }, { merge: true });
        batchesToWait.push(batch.commit());
        await Promise.all(batchesToWait);
        toast({
          title: "Global Identity Sync Complete",
          description: `${changedCount} records re-indexed successfully.`,
        });
      } else {
        toast({
          title: "System Already Synced",
          description: "All IDs follow the valid sequential format.",
        });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsSyncingIDs(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!firestore || !searchQuery) return;
    setIsSearching(true);
    try {
      const q = query(
        collection(firestore, "users"),
        where("username", ">=", searchQuery),
        where("username", "<=", searchQuery + "\uf8ff"),
        limit(10),
      );
      const snap = await getDocs(q);
      setFoundUsers(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenericSearch = async (
    mode: "id" | "name",
    value: string,
    setter: (u: any) => void,
    loadingSetter: (l: boolean) => void,
  ) => {
    if (!firestore || !value) return;
    loadingSetter(true);
    try {
      const inputVal = value.trim();
      let foundUser = null;
      if (mode === "id") {
        const qAcc = query(
          collection(firestore, "users"),
          where("accountNumber", "==", inputVal),
          limit(1),
        );
        const snapAcc = await getDocs(qAcc);
        if (!snapAcc.empty) {
          foundUser = { ...snapAcc.docs[0].data(), id: snapAcc.docs[0].id };
        }
      } else {
        const qName = query(
          collection(firestore, "users"),
          where("username", ">=", inputVal),
          where("username", "<=", inputVal + "\uf8ff"),
          limit(1),
        );
        const snapName = await getDocs(qName);
        if (!snapName.empty) {
          foundUser = { ...snapName.docs[0].data(), id: snapName.docs[0].id };
        }
      }
      if (foundUser) {
        // DEPTH SYNC: Fetch profile data to ensure isAdmin/isBudgetId are captured
        const profileRef = doc(firestore, "users", foundUser.id, "profile", foundUser.id);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          foundUser = { ...foundUser, ...profileSnap.data() };
        }
        setter(foundUser);
      } else {
        toast({ variant: "destructive", title: "Identity Not Found" });
      }
    } finally {
      loadingSetter(false);
    }
  };

  const handleRoomPinSearch = async () => {
    if (!firestore || !roomPinSearchId) return;
    setIsSearchingRoomPin(true);
    try {
      const q = query(
        collection(firestore, "chatRooms"),
        where("roomNumber", "==", roomPinSearchId.trim()),
        limit(1),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setTargetRoomForPin({ ...snap.docs[0].data(), id: snap.docs[0].id });
      } else {
        toast({ variant: "destructive", title: "Frequency Not Found" });
      }
    } finally {
      setIsSearchingRoomPin(false);
    }
  };

  const handleToggleRoomPin = () => {
    if (!firestore || !targetRoomForPin || !isCreator) return;
    setIsPinningRoom(true);
    const roomRef = doc(firestore, "chatRooms", targetRoomForPin.id);
    const newPinStatus = !targetRoomForPin.isPinned;
    updateDoc(roomRef, {
      isPinned: newPinStatus,
      pinnedAt: newPinStatus ? serverTimestamp() : null,
    })
      .then(() => {
        setTargetRoomForPin((prev: any) => ({
          ...prev,
          isPinned: newPinStatus,
        }));
        toast({
          title: newPinStatus ? "Frequency Pinned" : "Frequency Unpinned",
        });
      })
      .catch((err) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({
            path: roomRef.path,
            operation: "update",
          }),
        );
      })
      .finally(() => setIsPinningRoom(false));
  };

  const handleResetWallet = async () => {
    if (!firestore || !targetUserForRecord || !isCreator) return;
    if (
      !confirm("Are you sure you want to PERMANENTLY RESET this user's wallet?")
    )
      return;
    setIsResettingWallet(true);
    const uRef = doc(firestore, "users", targetUserForRecord.id);
    const pRef = doc(
      firestore,
      "users",
      targetUserForRecord.id,
      "profile",
      targetUserForRecord.id,
    );
    const resetData = {
      "wallet.coins": 0,
      "wallet.diamonds": 0,
      "wallet.totalSpent": 0,
      "wallet.dailySpent": 0,
      updatedAt: serverTimestamp(),
    };
    try {
      updateDocumentNonBlocking(uRef, resetData);
      updateDocumentNonBlocking(pRef, resetData);
      setTargetUserForRecord((prev: any) => ({
        ...prev,
        wallet: { coins: 0, diamonds: 0, totalSpent: 0, dailySpent: 0 },
      }));
      toast({ title: "Wallet Purged" });
    } finally {
      setIsResettingWallet(false);
    }
  };

  const handleSystemBroadcast = async () => {
    if (!firestore || !broadcastContent.trim() || !isCreator) return;
    setIsBroadcasting(true);
    try {
      const usersSnap = await getDocs(collection(firestore, "users"));
      const batches = [];
      let currentBatch = writeBatch(firestore);
      let count = 0;
      for (const userDoc of usersSnap.docs) {
        const notifRef = doc(
          collection(firestore, "users", userDoc.id, "notifications"),
        );
        currentBatch.set(notifRef, {
          title: broadcastTitle,
          content: broadcastContent,
          type: "system",
          timestamp: serverTimestamp(),
          isRead: false,
        });
        count++;
        if (count === 499) {
          batches.push(currentBatch.commit());
          currentBatch = writeBatch(firestore);
          count = 0;
        }
      }
      if (count > 0) batches.push(currentBatch.commit());
      await Promise.all(batches);
      toast({ title: "Broadcast Synchronized" });
      setBroadcastContent("");
    } catch (e) {
      errorEmitter.emit(
        "permission-error",
        new FirestorePermissionError({
          path: "users/notifications",
          operation: "write",
        }),
      );
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleDirectMessage = () => {
    if (!firestore || !targetUserForDm || !dmContent.trim() || !isCreator)
      return;
    setIsSendingDm(true);
    const notifRef = collection(
      firestore,
      "users",
      targetUserForDm.id,
      "notifications",
    );
    const msgData = {
      title: dmTitle,
      content: dmContent,
      type: "direct_system",
      timestamp: serverTimestamp(),
      isRead: false,
    };
    addDoc(notifRef, msgData)
      .then(() => {
        toast({ title: "Message Dispatched" });
        setDmContent("");
      })
      .catch((err) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({
            path: notifRef.path,
            operation: "create",
            requestResourceData: msgData,
          }),
        );
      })
      .finally(() => setIsSendingDm(false));
  };

  const handleDispatchCoins = async () => {
    if (!firestore || !targetUserForRewards || !coinDispatchAmount || !user) return;
    
    setIsDispatching(true);
    try {
      const amt = parseInt(coinDispatchAmount);
      const isSeller = currentUserProfile?.tags?.includes("Coin Seller");
      const isSelfDispatchByCreator = isCreator && targetUserForRewards.id === user.uid;

      // Check Seller Balance
      if (isSeller) {
        if (!currentUserProfile?.wallet?.coins || currentUserProfile.wallet.coins < amt) {
          toast({ 
            variant: 'destructive', 
            title: 'Insufficient Balance', 
            description: `You only have ${currentUserProfile?.wallet?.coins || 0} coins.` 
          });
          setIsDispatching(false);
          return;
        }
      }

      const uRef = doc(firestore, "users", targetUserForRewards.id);
      const pRef = doc(firestore, "users", targetUserForRewards.id, "profile", targetUserForRewards.id);
      const batch = writeBatch(firestore);

      // 1. Credit the target user (Using set + merge is safer)
      batch.set(uRef, { 
        wallet: { coins: increment(amt) }, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      
      batch.set(pRef, { 
        wallet: { coins: increment(amt) }, 
        updatedAt: serverTimestamp() 
      }, { merge: true });

      // 2. If Seller, decrement their own wallet
      if (isSeller) {
        const sellerRef = doc(firestore, "users", user.uid);
        const sellerProfileRef = doc(firestore, "users", user.uid, "profile", user.uid);
        batch.set(sellerRef, { wallet: { coins: increment(-amt) } }, { merge: true });
        batch.set(sellerProfileRef, { wallet: { coins: increment(-amt) } }, { merge: true });
      }

      // 3. Log ONLY IF not self-dispatch by creator
      if (!isSelfDispatchByCreator) {
        const logRef = doc(collection(firestore, "coin_audit_logs"));
        batch.set(logRef, {
          id: logRef.id,
          adminId: user.uid,
          adminName: currentUserProfile?.username || user.email || "Unknown Admin",
          adminRole: isCreator ? "Creator" : (isSeller ? "Seller" : "Admin"),
          targetId: targetUserForRewards.id,
          targetName: targetUserForRewards.username || "Unknown User",
          targetAccount: targetUserForRewards.accountNumber || "N/A",
          amount: amt,
          reason: "Manual Admin Dispatch",
          timestamp: serverTimestamp(),
          type: "manual_dispatch"
        });
      }

      await batch.commit();

      toast({ 
        title: isSelfDispatchByCreator ? "Wallet Updated" : "Transaction Successful", 
        description: `${amt.toLocaleString()} coins processed.` 
      });
      setCoinDispatchAmount("");
    } catch (e: any) {
      console.error("Dispatch Error:", e);
      toast({ 
        variant: 'destructive', 
        title: 'Dispatch Failed', 
        description: e.message?.includes('permission-denied') 
          ? "Permission Denied: Ensure firestore.rules are deployed." 
          : (e.message || "Unknown error occurred")
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDispatchItem = (
    itemId: string,
    type: "ownedItems" | "purchasedThemes",
  ) => {
    if (!firestore || !targetUserForRewards) return;
    const pRef = doc(
      firestore,
      "users",
      targetUserForRewards.id,
      "profile",
      targetUserForRewards.id,
    );
    updateDocumentNonBlocking(pRef, {
      [`inventory.${type}`]: arrayUnion(itemId),
    });
    toast({ title: "Asset Dispatched" });
  };

  const setNotForSaleFlag = (assetId: string, enabled: boolean) => {
    if (!firestore || !isAuthorized || !configRef) return;
    const updateData: any = { updatedAt: serverTimestamp() };
    updateData[`storeNotForSale.${assetId}`] = enabled ? true : deleteField();
    updateDoc(configRef, updateData).then(() => toast({ title: enabled ? "Not for sale enabled" : "Not for sale removed" }));
  };

  const handleGrantAssetToUser = async () => {
    if (!firestore || !targetUserForRewards || !grantAssetInput.trim() || isGrantingAsset) return;
    const days = parseInt(grantDaysInput) || 0;
    if (days <= 0) return;

    setIsGrantingAsset(true);
    try {
      const q = grantAssetInput.trim().toLowerCase();
      const match = storeCatalog.find((i: any) => (i.id || "").toLowerCase() === q) || storeCatalog.find((i: any) => (i.name || "").toLowerCase() === q);
      const assetId = (match?.id || grantAssetInput.trim()).toString();
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      const pRef = doc(firestore, "users", targetUserForRewards.id, "profile", targetUserForRewards.id);
      await updateDocumentNonBlocking(pRef, {
        "inventory.ownedItems": arrayUnion(assetId),
        [`inventory.expiries.${assetId}`]: Timestamp.fromDate(expiryDate),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Asset sent to bag" });
      setGrantAssetInput("");
      setGrantDaysInput("7");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e?.message || "Unknown error" });
    } finally {
      setIsGrantingAsset(false);
    }
  };

  const handleBanUser = () => {
    if (!firestore || !targetUserForBan || !isCreator) return;
    setIsBanning(true);
    const days = parseInt(banDays) || 0;
    const hours = parseInt(banHours) || 0;
    const mins = parseInt(banMinutes) || 0;
    const secs = parseInt(banSeconds) || 0;
    const totalMs =
      days * 24 * 60 * 60 * 1000 +
      hours * 60 * 60 * 1000 +
      mins * 60 * 1000 +
      secs * 1000;
    const bannedUntil = isPermanentBan
      ? null
      : Timestamp.fromDate(new Date(Date.now() + totalMs));
    const uRef = doc(firestore, "users", targetUserForBan.id);
    const pRef = doc(
      firestore,
      "users",
      targetUserForBan.id,
      "profile",
      targetUserForBan.id,
    );
    const banData = {
      banStatus: {
        isBanned: true,
        bannedAt: serverTimestamp(),
        bannedUntil: bannedUntil,
        reason: "Administrative Exclusion",
      },
    };
    setDoc(uRef, banData, { merge: true })
      .then(() => setDoc(pRef, banData, { merge: true }))
      .then(() => {
        setTargetUserForBan((prev: any) => ({
          ...prev,
          banStatus: banData.banStatus,
        }));
        toast({ title: "ID Banned" });
      })
      .catch((err) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({
            path: uRef.path,
            operation: "write",
            requestResourceData: banData,
          }),
        );
      })
      .finally(() => setIsBanning(false));
  };

  const handleUnbanUser = () => {
    if (!firestore || !targetUserForBan || !isCreator) return;
    setIsBanning(true);
    const uRef = doc(firestore, "users", targetUserForBan.id);
    const pRef = doc(
      firestore,
      "users",
      targetUserForBan.id,
      "profile",
      targetUserForBan.id,
    );
    const unbanData = {
      banStatus: {
        isBanned: false,
        bannedAt: null,
        bannedUntil: null,
        reason: null,
      },
    };
    setDoc(uRef, unbanData, { merge: true })
      .then(() => setDoc(pRef, unbanData, { merge: true }))
      .then(() => {
        setTargetUserForBan((prev: any) => ({
          ...prev,
          banStatus: unbanData.banStatus,
        }));
        toast({ title: "ID Unbanned" });
      })
      .catch((err) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({
            path: uRef.path,
            operation: "write",
            requestResourceData: unbanData,
          }),
        );
      })
      .finally(() => setIsBanning(false));
  };

  const adjustBalance = (
    targetUserId: string,
    type: "coins" | "diamonds",
    amount: number,
  ) => {
    if (!firestore) return;
    const userRef = doc(firestore, "users", targetUserId);
    const profileRef = doc(
      firestore,
      "users",
      targetUserId,
      "profile",
      targetUserId,
    );
    const updateData = {
      [`wallet.${type}`]: increment(amount),
      updatedAt: serverTimestamp(),
    };
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    toast({ title: "Balance Adjusted" });
  };

  const toggleUserRole = (
    targetUid: string,
    roleId: string,
    currentTags: string[] = [],
  ) => {
    if (!firestore) return;
    const hasRole = (currentTags || []).includes(roleId);
    const userRef = doc(firestore, "targetUserId", targetUid);
    const profileRef = doc(firestore, "users", targetUid, "profile", targetUid);
    const updateData = {
      tags: hasRole ? arrayRemove(roleId) : arrayUnion(roleId),
      updatedAt: serverTimestamp(),
    };
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    const updatedTags = hasRole
      ? (currentTags || []).filter((t: string) => t !== roleId)
      : [...(currentTags || []), roleId];
    if (targetUserForTags && targetUserForTags.id === targetUid)
      setTargetUserForTags((prev: any) => ({ ...prev, tags: updatedTags }));
    if (targetUserForCenter && targetUserForCenter.id === targetUid)
      setTargetUserForCenter((prev: any) => ({ ...prev, tags: updatedTags }));
    setFoundUsers((prev) =>
      prev.map((u) => (u.id === targetUid ? { ...u, tags: updatedTags } : u)),
    );
    toast({ title: "Authority Updated" });
  };

  const handleToggleSellerCenter = () => {
    if (!firestore || !targetUserForCenter) return;
    const tags = targetUserForCenter.tags || [];
    const sellerTags = ["Seller", "Seller center", "Coin Seller"];
    const isCurrentlyActive = tags.some((t: string) => sellerTags.includes(t));
    const userRef = doc(firestore, "users", targetUserForCenter.id);
    const profileRef = doc(
      firestore,
      "users",
      targetUserForCenter.id,
      "profile",
      targetUserForCenter.id,
    );
    let newTags;
    if (isCurrentlyActive) {
      newTags = tags.filter((t: string) => !sellerTags.includes(t));
    } else {
      newTags = [...tags, "Seller"];
    }
    const updateData = { tags: newTags, updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    setTargetUserForCenter((prev: any) => ({ ...prev, tags: newTags }));
    if (targetUserForTags?.id === targetUserForCenter.id)
      setTargetUserForTags((prev: any) => ({ ...prev, tags: newTags }));
    setFoundUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserForCenter.id ? { ...u, tags: newTags } : u,
      ),
    );
    toast({
      title: isCurrentlyActive
        ? "Seller Center Revoked"
        : "Seller Center Activated",
    });
  };

  const handleToggleOfficialCenter = () => {
    if (!firestore || !targetUserForCenter) return;
    const tags = targetUserForCenter.tags || [];
    const adminTags = ["Official center", "Admin"];
    const isCurrentlyActive = tags.some((t: string) => adminTags.includes(t));
    const userRef = doc(firestore, "users", targetUserForCenter.id);
    const profileRef = doc(
      firestore,
      "users",
      targetUserForCenter.id,
      "profile",
      targetUserForCenter.id,
    );
    let newTags;
    let newIsAdmin;
    if (isCurrentlyActive) {
      newTags = tags.filter((t: string) => !adminTags.includes(t));
      newIsAdmin = false;
    } else {
      newTags = [...tags, "Official center"];
      newIsAdmin = true;
    }
    const updateData = { 
      tags: newTags, 
      isAdmin: newIsAdmin,
      updatedAt: serverTimestamp() 
    };
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    setTargetUserForCenter((prev: any) => ({ ...prev, ...updateData }));
    if (targetUserForTags?.id === targetUserForCenter.id)
      setTargetUserForTags((prev: any) => ({ ...prev, tags: newTags }));
    setFoundUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserForCenter.id ? { ...u, tags: newTags } : u,
      ),
    );
    toast({
      title: isCurrentlyActive
        ? "Admin Portal Revoked"
        : "Admin Portal Activated",
    });
  };

  const handleRemoveAllTags = (targetUid: string) => {
    if (!firestore) return;
    const userRef = doc(firestore, "users", targetUid);
    const profileRef = doc(firestore, "users", targetUid, "profile", targetUid);
    const updateData = { tags: [], updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);
    if (targetUserForTags && targetUserForTags.id === targetUid)
      setTargetUserForTags((prev: any) => ({ ...prev, tags: [] }));
    if (targetUserForCenter && targetUserForCenter.id === targetUid)
      setTargetUserForCenter((prev: any) => ({ ...prev, tags: [] }));
    setFoundUsers((prev) =>
      prev.map((u) => (u.id === targetUid ? { ...u, tags: [] } : u)),
    );
    toast({ title: "Authority Purged" });
  };

  const handleSovereignSearch = () => {
    handleGenericSearch(
      sovereignSearchMode,
      sovereignSearchId,
      (u: any) => {
        setTargetUserForSovereign(u);
        if (u) {
          setNewSovereignId(u.accountNumber || "");
          setSelectedIdColor(u.idColor || "none");
          setIsSovereignAdmin(u.isAdmin || false);
          setIsSovereignBudget(u.isBudgetId || false);
        }
      },
      setIsSearchingSovereign,
    );
  };

  const handleUpdateSovereignIdentity = async () => {
    if (!firestore || !targetUserForSovereign || !isAuthorized) return;
    setIsUpdatingSovereign(true);
    try {
      const userRef = doc(firestore, "users", targetUserForSovereign.id);
      const profileRef = doc(
        firestore,
        "users",
        targetUserForSovereign.id,
        "profile",
        targetUserForSovereign.id,
      );

      const updateData: any = {
        updatedAt: serverTimestamp(),
        accountNumber: newSovereignId,
        idColor: selectedIdColor,
        isAdmin: isSovereignAdmin,
        isBudgetId: isSovereignBudget,
      };

      const batch = writeBatch(firestore);
      batch.update(userRef, updateData);
      batch.update(profileRef, updateData);
      await batch.commit();

      setTargetUserForSovereign((prev: any) => ({ ...prev, ...updateData }));
      setFoundUsers((prev) =>
        prev.map((u) =>
          u.id === targetUserForSovereign.id ? { ...u, ...updateData } : u,
        ),
      );
      toast({
        title: "Sovereign Identity Updated",
        description: "Permanent changes applied to user frequencies.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message,
      });
    } finally {
      setIsUpdatingSovereign(false);
    }
  };

  const handleSaveGift = async () => {
    if (!giftName || !giftPrice || !giftThumbnail) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Name, Price, and Icon Thumbnail are mandatory.",
      });
      return;
    }

    setIsUploadingGift(true);
    try {
      let imageUrl = "";
      let videoUrl = "";

      // 1. Upload Icon Thumbnail
      const tRef = ref(storage, `gifts/thumb_${Date.now()}_${giftThumbnail.name}`);
      const tRes = await uploadBytes(tRef, giftThumbnail, { cacheControl: 'public,max-age=31536000,immutable' });
      imageUrl = await getDownloadURL(tRes.ref);

      // 2. Upload Animation Video (Optional)
      if (giftVideo) {
        const vRef = ref(storage, `gifts/anim_${Date.now()}_${giftVideo.name}`);
        const vRes = await uploadBytes(vRef, giftVideo, { cacheControl: 'public,max-age=31536000,immutable' });
        videoUrl = await getDownloadURL(vRes.ref);
      }

      // 3. Save to Firestore
      await addDoc(collection(firestore!, "giftList"), {
        name: giftName,
        price: parseInt(giftPrice),
        category: giftCategory,
        imageUrl,
        videoUrl,
        animationId: giftAnimationId || (videoUrl ? "video_based" : ""),
        createdAt: serverTimestamp(),
      });

      // 4. Reset state
      setGiftName("");
      setGiftPrice("");
      setGiftAnimationId("");
      setGiftThumbnail(null);
      setGiftVideo(null);
      setThumbnailPreview("");
      setVideoPreview("");
      
      toast({
        title: "Gift Synchronized",
        description: `${giftName} is now live in the boutique.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: err.message,
      });
    } finally {
      setIsUploadingGift(false);
    }
  };

  const handleDeleteGift = async (id: string) => {
    if (!confirm("Are you sure you want to remove this gift?")) return;
    try {
      await deleteDocumentNonBlocking(doc(firestore, "giftList", id));
      toast({ title: "Gift Removed Successfully" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: err.message,
      });
    }
  };

  const handleApproveCustomGift = async (req: any) => {
    if (!firestore) return;
    setIsProcessingCustomGift(req.id);
    try {
      const docRef = doc(firestore, 'customizedGiftRequests', req.id);
      await updateDoc(docRef, {
        status: 'approved',
        updatedAt: serverTimestamp()
      });
      toast({
        title: "Customized Request Approved",
        description: `Request for ${req.username} is approved. Please create the customized gift using the Gift Management tab under the 'Customized' category.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Approval Failed",
        description: err.message,
      });
    } finally {
      setIsProcessingCustomGift(null);
    }
  };

  const handleRejectCustomGift = async (req: any) => {
    if (!firestore) return;
    if (!confirm(`Are you sure you want to reject this customized gift request? This will AUTOMATICALLY refund 50,000 coins to ${req.username}'s wallet!`)) return;
    setIsProcessingCustomGift(req.id);
    try {
      const userRef = doc(firestore, 'users', req.uid);
      const profileRef = doc(firestore, 'users', req.uid, 'profile', req.uid);
      const reqRef = doc(firestore, 'customizedGiftRequests', req.id);
      
      const batch = writeBatch(firestore);
      batch.update(userRef, { 'wallet.coins': increment(50000) });
      batch.update(profileRef, { 'wallet.coins': increment(50000) });
      batch.update(reqRef, { 
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      await batch.commit();

      toast({
        title: "Customized Request Rejected & Refunded",
        description: `50,000 coins successfully refunded to ${req.username}'s wallet.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Rejection Failed",
        description: err.message,
      });
    } finally {
      setIsProcessingCustomGift(null);
    }
  };

  const handleSaveLoot = async () => {
    if (!firestore || !lootConfigRef) return;
    setIsSavingLoot(true);
    try {
      await setDoc(lootConfigRef, {
        levels: lootLevels,
        rewards: lootRewards,
        entryLimit: lootConfig.entryLimit,
        duration: lootConfig.duration,
        gatePriority: lootConfig.gatePriority,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      toast({
        title: "Loot Management Synchronized",
        description: "All loot levels, rewards, and settings are now live.",
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: err.message,
      });
    } finally {
      setIsSavingLoot(false);
    }
  };

  const handleUpdateLevelThreshold = (levelId: string, newThreshold: number) => {
    setLootLevels(prev => prev.map(l => l.id === levelId ? { ...l, threshold: newThreshold } : l));
  };

  const handleUpdateLevelVoice = (levelId: string, newVoice: string) => {
    setLootLevels(prev => prev.map(l => l.id === levelId ? { ...l, voice: newVoice } : l));
  };

  const handleAddReward = () => {
    const newReward = {
      id: `reward-${Date.now()}`,
      name: "New Reward",
      type: "coins",
      rarity: "common",
      value: 100,
      icon: "",
    };
    setLootRewards(prev => [...prev, newReward]);
  };

  const handleUpdateReward = (rewardId: string, field: string, value: any) => {
    setLootRewards(prev => prev.map(r => r.id === rewardId ? { ...r, [field]: value } : r));
  };

  const handleRemoveReward = (rewardId: string) => {
    setLootRewards(prev => prev.filter(r => r.id !== rewardId));
  };

  const handleUploadLevelVideo = async (levelId: string, file: File) => {
    if (!storage) { toast({ variant: "destructive", title: "Storage Error", description: "Firebase Storage not initialized." }); return; }
    if (!isAuthorized) { toast({ variant: "destructive", title: "Unauthorized", description: "You do not have permission to upload." }); return; }
    if (!lootConfigRef) { toast({ variant: "destructive", title: "Config Error", description: "Loot config not loaded." }); return; }
    
    setUploadingLevelVideo(levelId);
    try {
      const videoRef = ref(storage, `loot/videos/${levelId}_${Date.now()}_${file.name}`);
      const uploadRes = await uploadBytes(videoRef, file, { cacheControl: 'public,max-age=31536000,immutable' });
      const videoUrl = await getDownloadURL(uploadRes.ref);
      
      const updatedLevels = lootLevels.map(l => l.id === levelId ? { ...l, videoUrl } : l);
      setLootLevels(updatedLevels);
      
      await setDoc(lootConfigRef, {
        levels: updatedLevels,
        rewards: lootRewards,
        entryLimit: lootConfig.entryLimit,
        duration: lootConfig.duration,
        gatePriority: lootConfig.gatePriority,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({ title: "Video Uploaded & Synced", description: `Video for ${levelId} level is now live in the room.` });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    } finally {
      setUploadingLevelVideo(null);
    }
  };

  const handleUploadLootLevelImage = async (levelId: string, file: File) => {
    if (!storage) { toast({ variant: "destructive", title: "Storage Error", description: "Firebase Storage not initialized." }); return; }
    if (!isAuthorized) { toast({ variant: "destructive", title: "Unauthorized", description: "You do not have permission to upload." }); return; }
    if (!lootConfigRef) { toast({ variant: "destructive", title: "Config Error", description: "Loot config not loaded." }); return; }
    
    setUploadingLootImage(levelId);
    try {
      const imageRef = ref(storage, `loot/images/${levelId}_${Date.now()}_${file.name}`);
      const uploadRes = await uploadBytes(imageRef, file, { cacheControl: 'public,max-age=31536000,immutable' });
      const imageUrl = await getDownloadURL(uploadRes.ref);
      
      const updatedLevels = lootLevels.map(l => l.id === levelId ? { ...l, image: imageUrl } : l);
      setLootLevels(updatedLevels);
      
      await setDoc(lootConfigRef, {
        levels: updatedLevels,
        rewards: lootRewards,
        entryLimit: lootConfig.entryLimit,
        duration: lootConfig.duration,
        gatePriority: lootConfig.gatePriority,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      toast({ title: "Image Uploaded & Synced", description: `Image for ${levelId} level is now live in the room.` });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Upload Failed", description: err.message });
    } finally {
      setUploadingLootImage(null);
    }
  };


  const handleLevelUpload = async () => {
    if (!firestore || !storage || !isAuthorized) return;
    if (!levelName.trim() || !levelRange.trim()) {
      toast({ variant: "destructive", title: "Missing Info", description: "Level name and range are required." });
      return;
    }
    setIsUploadingLevel(true);
    try {
      let imageUrl = "";
      if (levelImageFile) {
        const iRef = ref(storage, `levels/${Date.now()}_${levelImageFile.name}`);
        const iRes = await uploadBytes(iRef, levelImageFile, { cacheControl: 'public,max-age=31536000,immutable' });
        imageUrl = await getDownloadURL(iRes.ref);
      }
      const levelData: any = {
        name: levelName,
        range: levelRange,
        imageUrl,
        type: levelTab,
        updatedAt: serverTimestamp(),
      };
      if (levelTab === "budget") levelData.budget = levelBudget;
      if (levelTab === "rewards") levelData.reward = levelReward;
      if (levelTab === "frame") levelData.frameId = levelFrameId;

      const levelRef = doc(collection(firestore, "levels"));
      await setDoc(levelRef, levelData, { merge: true });

      setLevelName("");
      setLevelRange("");
      setLevelBudget("");
      setLevelReward("");
      setLevelFrameId("");
      setLevelImageFile(null);
      setLevelImagePreview("");
      toast({ title: "Level Synchronized", description: `Level "${levelName}" is now live.` });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
    } finally {
      setIsUploadingLevel(false);
    }
  };

  const handleMedalUpload = async () => {
    if (!firestore || !storage || !isAuthorized) return;
    if (!medalId.trim() || !medalName.trim()) {
      toast({ variant: "destructive", title: "Missing Info", description: "Medal ID and name are required." });
      return;
    }
    setIsUploadingMedal(true);
    try {
      let imageUrl = "";
      if (medalImageFile) {
        const iRef = ref(storage, `medals/${Date.now()}_${medalImageFile.name}`);
        const iRes = await uploadBytes(iRef, medalImageFile, { cacheControl: 'public,max-age=31536000,immutable' });
        imageUrl = await getDownloadURL(iRes.ref);
      }
      const medalData = {
        id: medalId,
        name: medalName,
        description: medalDescription,
        tier: medalTier,
        category: medalTab,
        imageUrl,
        updatedAt: serverTimestamp(),
      };
      const medalRef = doc(firestore, "medals", medalId);
      await setDoc(medalRef, medalData, { merge: true });

      setMedalId("");
      setMedalName("");
      setMedalDescription("");
      setMedalTier("common");
      setMedalImageFile(null);
      setMedalImagePreview("");
      toast({ title: "Medal Synchronized", description: `Medal "${medalName}" is now live.` });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
    } finally {
      setIsUploadingMedal(false);
    }
  };

  const handleDeleteLevel = async (levelId: string) => {
    if (!firestore || !isAuthorized) return;
    try {
      await deleteDocumentNonBlocking(doc(firestore, "levels", levelId));
      toast({ title: "Level Deleted", description: "Level has been removed." });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
  };

  const handleDeleteMedal = async (medalId: string) => {
    if (!firestore || !isAuthorized) return;
    try {
      await deleteDocumentNonBlocking(doc(firestore, "medals", medalId));
      toast({ title: "Medal Deleted", description: "Medal has been removed." });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
  };

  const handleEmojiUpload = async () => {
    if (!storage) { toast({ variant: "destructive", title: "Storage Error", description: "Firebase Storage not initialized." }); return; }
    if (!isAuthorized) { toast({ variant: "destructive", title: "Unauthorized", description: "You do not have permission to upload." }); return; }
    if (!emojiName.trim()) {
      toast({ variant: "destructive", title: "Missing Info", description: "Emoji name is required." });
      return;
    }
    if (!emojiImageFile && !emojiAnimationFile) {
      toast({ variant: "destructive", title: "Missing File", description: "Upload emoji image or animation." });
      return;
    }
    setIsUploadingEmoji(true);
    try {
      let imageUrl = "";
      let animationUrl = "";

      if (emojiImageFile) {
        const iRef = ref(storage, `emojis/${Date.now()}_${emojiImageFile.name}`);
        const iRes = await uploadBytes(iRef, emojiImageFile, { cacheControl: 'public,max-age=31536000,immutable' });
        imageUrl = await getDownloadURL(iRes.ref);
      }

      if (emojiAnimationFile) {
        const aRef = ref(storage, `emojis/anim_${Date.now()}_${emojiAnimationFile.name}`);
        const aRes = await uploadBytes(aRef, emojiAnimationFile, { cacheControl: 'public,max-age=31536000,immutable' });
        animationUrl = await getDownloadURL(aRes.ref);
      }

      const emojiData = {
        name: emojiName,
        imageUrl,
        animationUrl,
        displayTime: parseInt(emojiDisplayTime) || 3,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const emojiRef = doc(collection(firestore, "customEmojis"));
      await setDoc(emojiRef, emojiData, { merge: true });

      setEmojiName("");
      setEmojiDisplayTime("3");
      setEmojiImageFile(null);
      setEmojiAnimationFile(null);
      setEmojiImagePreview("");
      setEmojiAnimationPreview("");
      toast({ title: "Emoji Synchronized", description: `Emoji "${emojiName}" is now live.` });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
    } finally {
      setIsUploadingEmoji(false);
    }
  };

  const handleDeleteEmoji = async (emojiId: string) => {
    if (!firestore || !isAuthorized) return;
    try {
      await deleteDocumentNonBlocking(doc(firestore, "customEmojis", emojiId));
      toast({ title: "Emoji Deleted", description: "Emoji has been removed." });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
  };

  const handleMedalUserSearch = async () => {
    if (!firestore || !medalAssignSearchId.trim()) return;
    setIsSearchingMedal(true);
    try {
      let foundUser = null;
      if (medalAssignSearchMode === "id") {
        const qAcc = query(collection(firestore, "users"), where("accountNumber", "==", medalAssignSearchId.trim()), limit(1));
        const snapAcc = await getDocs(qAcc);
        if (!snapAcc.empty) foundUser = { ...snapAcc.docs[0].data(), id: snapAcc.docs[0].id };
      } else {
        const qName = query(collection(firestore, "users"), where("username", ">=", medalAssignSearchId.trim()), where("username", "<=", medalAssignSearchId.trim() + "\uf8ff"), limit(1));
        const snapName = await getDocs(qName);
        if (!snapName.empty) foundUser = { ...snapName.docs[0].data(), id: snapName.docs[0].id };
      }
      if (foundUser) {
        const profileRef = doc(firestore, "users", foundUser.id, "profile", foundUser.id);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          foundUser = { ...foundUser, ...profileSnap.data() };
        }
        setTargetUserForMedal(foundUser);
        setUserMedals((foundUser as any).medals || []);
      } else {
        toast({ variant: "destructive", title: "User Not Found" });
        setTargetUserForMedal(null);
        setUserMedals([]);
      }
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Search Failed", description: err.message });
    } finally {
      setIsSearchingMedal(false);
    }
  };

  const handleAssignMedalToUser = async () => {
    if (!firestore || !targetUserForMedal || !selectedMedalForAssign) return;
    setIsAssigningMedal(true);
    try {
      const profileRef = doc(firestore, "users", targetUserForMedal.id, "profile", targetUserForMedal.id);
      await updateDoc(profileRef, { medals: arrayUnion(selectedMedalForAssign) });
      setUserMedals(prev => prev.includes(selectedMedalForAssign) ? prev : [...prev, selectedMedalForAssign]);
      setSelectedMedalForAssign("");
      toast({ title: "Medal Assigned", description: `${selectedMedalForAssign} added to ${targetUserForMedal.username}` });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Assign Failed", description: err.message });
    } finally {
      setIsAssigningMedal(false);
    }
  };

  const handleRemoveMedalFromUser = async (medalId: string) => {
    if (!firestore || !targetUserForMedal) return;
    try {
      const profileRef = doc(firestore, "users", targetUserForMedal.id, "profile", targetUserForMedal.id);
      await updateDoc(profileRef, { medals: arrayRemove(medalId) });
      setUserMedals(prev => prev.filter(m => m !== medalId));
      toast({ title: "Medal Removed", description: `${medalId} removed from ${targetUserForMedal.username}` });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Remove Failed", description: err.message });
    }
  };


  const handleBulkRestoreGifts = async () => {
    if (!firestore || !isAuthorized) return;
    setIsAddingGift(true);
    try {
      const gifts = [
        {"name": "Red Rose", "price": 10, "emoji": "🌹", "category": "Hot", "animationId": "rose_anim", "imageUrl": "https://cdn-icons-png.flaticon.com/512/5903/5903501.png"},
        {"name": "Chocolate", "price": 99, "emoji": "🍫", "category": "Hot", "animationId": "chocolate_anim", "imageUrl": "https://cdn-icons-png.flaticon.com/512/2311/2311991.png"},
        {"name": "Teddy Bear", "price": 799, "emoji": "🧸", "category": "Hot", "animationId": "teddy_anim", "imageUrl": "https://cdn-icons-png.flaticon.com/512/3241/3241285.png"},
        {"name": "Sports Car", "price": 150000, "emoji": "🏎️", "category": "Luxury", "animationId": "car_anim", "imageUrl": "https://cdn-icons-png.flaticon.com/512/744/744465.png"},
        {"name": "Private Jet", "price": 500000, "emoji": "🛩️", "category": "Luxury", "animationId": "plane_anim", "imageUrl": "https://cdn-icons-png.flaticon.com/512/2830/2830312.png"},
        {"name": "Golden Crown", "price": 100000, "emoji": "👑", "category": "Luxury", "animationId": "crown_anim", "imageUrl": "https://cdn-icons-png.flaticon.com/512/6941/6941697.png"},
        {"name": "Diamond Ring", "price": 50000, "emoji": "💍", "category": "Luxury", "animationId": "ring_anim", "imageUrl": "https://cdn-icons-png.flaticon.com/512/2622/2622115.png"},
        {"name": "Space Rocket", "price": 2000000, "emoji": "🚀", "category": "Luxury", "animationId": "rocket_anim", "imageUrl": "https://cdn-icons-png.flaticon.com/512/1067/1067357.png"},
        {"name": "Lucky Apple", "price": 100, "emoji": "🍎", "category": "Lucky", "animationId": "apple_svga_3d", "imageUrl": "https://cdn-icons-png.flaticon.com/512/415/415682.png", "isLucky": true},
        {"name": "Golden Tree", "price": 30000, "emoji": "🌳", "category": "Event", "animationId": "tree_anim", "imageUrl": "https://cdn-icons-png.flaticon.com/512/2454/2454261.png"},
        {"name": "Fireworks", "price": 2500, "emoji": "🎆", "category": "Event", "animationId": "fireworks_anim", "imageUrl": "https://cdn-icons-png.flaticon.com/512/3421/3421696.png"}
      ];

      const batch = writeBatch(firestore);
      gifts.forEach(gift => {
        const newGiftRef = doc(collection(firestore, "giftList"));
        batch.set(newGiftRef, {
          ...gift,
          createdAt: serverTimestamp()
        });
      });
      await batch.commit();

      toast({
        title: "Bulk Gifts Restored",
        description: `${gifts.length} premium gifts added to your inventory.`,
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Bulk Add Failed",
        description: err.message,
      });
    } finally {
      setIsAddingGift(false);
    }
  };

  const handleBannerImageUpload = async (index: number, f: File) => {
    if (!storage || !bannerConfigRef) return;
    setIsUploadingBanner(index);
    try {
      const sRef = ref(storage, `banners/slide_${index}_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f, { cacheControl: 'public,max-age=31536000,immutable' });
      const url = await getDownloadURL(result.ref);
      const currentSlides = bannerConfig?.slides || DEFAULT_SLIDES;
      const newSlides = [...currentSlides];
      newSlides[index] = { ...newSlides[index], imageUrl: url };
      setDoc(bannerConfigRef, { slides: newSlides }, { merge: true })
        .then(() => toast({ title: "Banner Updated" }))
        .catch((err) => {
          errorEmitter.emit(
            "permission-error",
            new FirestorePermissionError({
              path: bannerConfigRef.path,
              operation: "write",
            }),
          );
        });
    } finally {
      setIsUploadingBanner(null);
    }
  };

  const handleRoomBannerImageUpload = async (index: number, f: File) => {
    if (!storage || !roomBannerConfigRef) return;
    setIsUploadingRoomBanner(index);
    try {
      const sRef = ref(storage, `roomBanners/slide_${index}_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f, { cacheControl: 'public,max-age=31536000,immutable' });
      const url = await getDownloadURL(result.ref);
      const currentSlides = roomBannerConfig?.slides || [
        { id: 'weekly-star', title: 'Weekly Star', imageUrl: '' },
        { id: 'aristocracy', title: 'Merge Aristocracy', imageUrl: '' },
        { id: 'room-support', title: 'Room Support', imageUrl: '' },
        { id: 'golden-chest', title: 'Golden Chest', imageUrl: '' },
        { id: 'lucky-spin', title: 'Lucky Spin', imageUrl: '' },
      ];
      const newSlides = [...currentSlides];
      newSlides[index] = { ...newSlides[index], imageUrl: url };
      setDoc(roomBannerConfigRef, { slides: newSlides }, { merge: true })
        .then(() => toast({ title: "Room Banner Updated" }))
        .catch((err) => {
          errorEmitter.emit(
            "permission-error",
            new FirestorePermissionError({
              path: roomBannerConfigRef.path,
              operation: "write",
            }),
          );
        });
    } finally {
      setIsUploadingRoomBanner(null);
    }
  };

  const handleRankingBGUpload = async (key: string, f: File) => {
    if (!storage || !rankingConfigRef) return;
    setUploadingRankingKey(key);
    try {
      const sRef = ref(storage, `rankings/bg_${key}_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f, { cacheControl: 'public,max-age=31536000,immutable' });
      const url = await getDownloadURL(result.ref);
      setDoc(rankingConfigRef, { [key]: url }, { merge: true })
        .then(() => toast({ title: `${key.toUpperCase()} Background Updated` }))
        .catch((err) => {
          errorEmitter.emit(
            "permission-error",
            new FirestorePermissionError({
              path: rankingConfigRef.path,
              operation: "write",
            }),
          );
        });
    } finally {
      setUploadingRankingKey(null);
    }
  };

  const handleAddBanner = () => {
    if (!firestore || !isCreator) return;
    const currentSlides = bannerConfig?.slides || DEFAULT_SLIDES;
    const newSlide = {
      title: "New Tribe Event",
      subtitle: "Join the Frequency",
      iconName: "Sparkles",
      color: "from-blue-500/40",
      imageUrl: "",
    };
    const newSlides = [...currentSlides, newSlide];
    setDoc(bannerConfigRef!, { slides: newSlides }, { merge: true }).catch(
      (err) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({
            path: bannerConfigRef!.path,
            operation: "write",
          }),
        );
      },
    );
  };

  const handleRemoveBanner = (index: number) => {
    if (!firestore || !isCreator) return;
    const currentSlides = bannerConfig?.slides || DEFAULT_SLIDES;
    const newSlides = currentSlides.filter((_: any, i: number) => i !== index);
    setDoc(bannerConfigRef!, { slides: newSlides }, { merge: true }).catch(
      (err) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({
            path: bannerConfigRef!.path,
            operation: "write",
          }),
        );
      },
    );
  };

  const handleUpdateBannerMeta = (index: number, f: string, value: string) => {
    if (!firestore || !isCreator) return;
    const currentSlides = [...(bannerConfig?.slides || DEFAULT_SLIDES)];
    currentSlides[index] = { ...currentSlides[index], [f]: value };
    setDoc(bannerConfigRef!, { slides: currentSlides }, { merge: true }).catch(
      (err) => {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({
            path: bannerConfigRef!.path,
            operation: "write",
          }),
        );
      },
    );
  };

  const handleStoreItemUpload = async () => {
    if (!storage || !firestore) return;
    const f = storeFileInputRef.current?.files?.[0];
    if (!f || !storeName.trim()) {
      toast({ variant: "destructive", title: "Missing Information", description: "Name and Image are mandatory." });
      return;
    }
    setIsUploadingStore(true);
    try {
      // 1. Upload Display Image
      const sRef = ref(storage, `store/item_${Date.now()}_${f.name}`);
      const result = await uploadBytes(sRef, f, { cacheControl: 'public,max-age=31536000,immutable' });
      const url = await getDownloadURL(result.ref);

      // 2. Upload Video Animation (Optional)
      let videoUrl = "";
      if (storeVideoFile) {
        const vRef = ref(storage, `store/anim_${Date.now()}_${storeVideoFile.name}`);
        const vResult = await uploadBytes(vRef, storeVideoFile, { cacheControl: 'public,max-age=31536000,immutable' });
        videoUrl = await getDownloadURL(vResult.ref);
      }

      const itemRef = doc(collection(firestore, "storeItems"));
      const itemData = {
        id: itemRef.id,
        name: storeName.trim(),
        url,
        videoUrl, // Save the video link
        price: parseInt(storePrice),
        duration: parseInt(storeDuration),
        category: storeCategory,
        createdAt: serverTimestamp(),
      };
      await setDoc(itemRef, itemData);
      
      // Reset
      setStoreName("");
      setStorePrice("0");
      setStoreVideoFile(null);
      setStoreVideoPreview("");
      if (storeFileInputRef.current) storeFileInputRef.current.value = "";
      if (storeVideoFileInputRef.current) storeVideoFileInputRef.current.value = "";

      toast({ title: "Boutique Synchronized" });
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
    } finally {
      setIsUploadingStore(false);
    }
  };

  const handleDeleteStoreItem = async (id: string) => {
    if (!confirm("Are you sure you want to remove this boutique asset?")) return;
    try {
      await deleteDocumentNonBlocking(doc(firestore, "storeItems", id));
      toast({ title: "Asset Removed" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Deletion Failed", description: err.message });
    }
  };

  const handleLoginBGUpload = async (f: File) => {
    if (!storage || !firestore || !configRef) return;
    setIsUploadingLoginBG(true);
    try {
      const sRef = ref(storage, `branding/login_bg_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f, { cacheControl: 'public,max-age=31536000,immutable' });
      const url = await getDownloadURL(result.ref);
      setDoc(configRef, { loginBackgroundUrl: url }, { merge: true })
        .then(() => toast({ title: "Login Background Synchronized" }))
        .catch((err) => {
          errorEmitter.emit(
            "permission-error",
            new FirestorePermissionError({
              path: configRef.path,
              operation: "write",
            }),
          );
        });
    } finally {
      setIsUploadingLoginBG(false);
    }
  };

  const handleLoadingBGUpload = async (f: File) => {
    if (!storage || !firestore || !configRef) return;
    setIsUploadingLoadingBG(true);
    try {
      const sRef = ref(storage, `branding/loading_bg_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f, { cacheControl: 'public,max-age=31536000,immutable' });
      const url = await getDownloadURL(result.ref);
      setDoc(configRef, { appLoadingBackgroundUrl: url }, { merge: true })
        .then(() => toast({ title: "App Loading Sync Complete" }))
        .catch((err) => {
          errorEmitter.emit(
            "permission-error",
            new FirestorePermissionError({
              path: configRef.path,
              operation: "write",
            }),
          );
        });
    } finally {
      setIsUploadingLoadingBG(false);
    }
  };

  const handleGameLoadingBGUpload = async (f: File) => {
    if (!storage || !firestore || !selectedGameForSync) return;
    setIsUploadingGameLoadingBG(true);
    try {
      const sRef = ref(
        storage,
        `games/${selectedGameForSync.slug}/loading_bg_${Date.now()}.jpg`,
      );
      const result = await uploadBytes(sRef, f, { cacheControl: 'public,max-age=31536000,immutable' });
      const url = await getDownloadURL(result.ref);
      const gameRef = doc(firestore, "games", selectedGameForSync.slug);
      updateDoc(gameRef, {
        loadingBackgroundUrl: url,
        updatedAt: serverTimestamp(),
      }).then(() =>
        toast({ title: `${selectedGameForSync.title} Loading Sync Complete` }),
      );
    } finally {
      setIsUploadingGameLoadingBG(false);
      setSelectedGameForSync(null);
    }
  };

  const handleSplashBGUpload = async (f: File) => {
    if (!storage || !firestore || !configRef) return;
    setIsUploadingSplashBG(true);
    try {
      const sRef = ref(storage, `branding/splash_bg_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f, { cacheControl: 'public,max-age=31536000,immutable' });
      const url = await getDownloadURL(result.ref);
      setDoc(configRef, { splashScreenUrl: url }, { merge: true })
        .then(() => toast({ title: "Splash Background Synchronized" }))
        .catch((err) => {
          errorEmitter.emit(
            "permission-error",
            new FirestorePermissionError({
              path: configRef.path,
              operation: "write",
            }),
          );
        });
    } finally {
      setIsUploadingSplashBG(false);
    }
  };

  const handleApproveRecharge = async (req: any) => {
    if (!firestore || !isAuthorized) return;
    setIsProcessingRechargeAction(req.id);
    try {
      const userRef = doc(firestore, "users", req.uid);
      const profileRef = doc(firestore, "users", req.uid, "profile", req.uid);
      const requestRef = doc(firestore, "rechargeRequests", req.id);
      const historyRef = collection(
        firestore,
        "users",
        req.uid,
        "diamondExchanges",
      );

      const totalGain = (req.coins || 0) + (req.bonus || 0);

      // Perform atomic updates
      const batch = writeBatch(firestore);
      batch.update(userRef, {
        "wallet.coins": increment(totalGain),
        updatedAt: serverTimestamp(),
      });
      batch.update(profileRef, {
        "wallet.coins": increment(totalGain),
        updatedAt: serverTimestamp(),
      });
      batch.update(requestRef, {
        status: "approved",
        processedAt: serverTimestamp(),
      });

      const historyDoc = doc(historyRef);
      batch.set(historyDoc, {
        type: "purchase",
        coinAmount: totalGain,
        packageAmount: req.amount,
        utrNumber: req.utrNumber,
        method: "offline_qr",
        timestamp: serverTimestamp(),
        status: "completed",
      });

      await batch.commit();
      toast({
        title: "Recharge Approved",
        description: `${totalGain.toLocaleString()} coins credited to ${req.username}.`,
      });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Approval Failed" });
    } finally {
      setIsProcessingRechargeAction(null);
    }
  };

  const handleRejectRecharge = async (requestId: string) => {
    if (!firestore || !isAuthorized) return;
    if (!confirm("Reject this recharge request?")) return;
    setIsProcessingRechargeAction(requestId);
    try {
      await updateDoc(doc(firestore, "rechargeRequests", requestId), {
        status: "rejected",
        processedAt: serverTimestamp(),
      });
      toast({ title: "Request Rejected" });
    } finally {
      setIsProcessingRechargeAction(null);
    }
  };

  const handlePaymentQrUpload = async (f: File) => {
    if (!storage || !firestore || !configRef) return;
    setIsUploadingPaymentQr(true);
    try {
      const sRef = ref(storage, `branding/payment_qr_${Date.now()}.jpg`);
      const result = await uploadBytes(sRef, f, { cacheControl: 'public,max-age=31536000,immutable' });
      const url = await getDownloadURL(result.ref);
      await updateDoc(configRef, {
        paymentQrUrl: url,
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Payment QR Synchronized" });
    } finally {
      setIsUploadingPaymentQr(false);
    }
  };

  const handleLogoUpload = async (f: File) => {
    if (!storage || !firestore || !configRef) return;
    setIsUploadingLogo(true);
    try {
      const sRef = ref(storage, `branding/logo_${Date.now()}.png`);
      const result = await uploadBytes(sRef, f, { cacheControl: 'public,max-age=31536000,immutable' });
      const url = await getDownloadURL(result.ref);
      setDoc(configRef, { customLogoUrl: url }, { merge: true })
        .then(() =>
          toast({
            title: "Logo Synchronized",
            description: "The new visual signature is live across the tribe.",
          }),
        )
        .catch((err) => {
          errorEmitter.emit(
            "permission-error",
            new FirestorePermissionError({
              path: configRef.path,
              operation: "write",
            }),
          );
        });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleGameDPUploadClick = (g: any) => {
    setSelectedGameForSync(g);
    gameFileInputRef.current?.click();
  };
  const handleGameBGUploadClick = (g: any) => {
    setSelectedGameForSync(g);
    gameBGFileInputRef.current?.click();
  };
  const handleGameDPFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file && selectedGameForSync) {
      await uploadGameLogo(selectedGameForSync, file);
      setSelectedGameForSync(null);
    }
  };
  const handleGameBGFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file && selectedGameForSync) {
      await uploadGameBackground(selectedGameForSync, file);
      setSelectedGameForSync(null);
    }
  };

  if (!isAuthorized)
    return (
      <AppLayout>
        <div className="flex h-[50vh] items-center justify-center text-destructive font-sans">
          <Shield className="h-12 w-12 mr-2" /> Portal Access Restricted
        </div>
      </AppLayout>
    );

  return (
    <AppLayout>
      <div className="space-y-2 max-w-7xl mx-auto px-4 pt-24 pb-4 animate-in fade-in duration-700 font-sans bg-white min-h-full relative">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="absolute left-4 top-6 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all z-[110] shadow-sm"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Button>
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-3">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight text-slate-900">
                Supreme Command
              </h1>
              <p className="text-muted-foreground">
                Supreme Authority Protocol Active.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
            <Badge className="bg-primary text-black font-bold uppercase px-4 py-1.5 h-10 rounded-xl shadow-sm border-none">
              {isCreator ? "Supreme Creator" : "Staff Administrator"}
            </Badge>
            <p className="text-[10px] font-mono text-slate-400 select-all px-1">
              ID: {user?.uid}
            </p>
          </div>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col lg:flex-row gap-10 items-start"
        >
          <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24 h-fit">
            <ScrollArea className="h-fit lg:h-[calc(100vh-200px)] pr-4">
              <TabsList className="flex flex-col h-fit w-full bg-slate-50 shadow-2xl rounded-3xl border border-slate-100 p-3 gap-2 overflow-visible">
                <TabsTrigger
                  value="recharge-requests"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-green-600 data-[state=active]:text-white shadow-lg animate-pulse"
                >
                  <Wallet className="h-4 w-4" /> Recharge Requests{" "}
                  {pendingRecharges && pendingRecharges.length > 0 && (
                    <Badge className="ml-auto bg-white text-green-600 font-bold">
                      {pendingRecharges.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="financial-audit"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <ClipboardList className="h-4 w-4" /> Financial Audit 💰
                </TabsTrigger>
                <TabsTrigger
                  value="financial-settings"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-green-600 data-[state=active]:text-white shadow-lg"
                >
                  <Wallet className="h-4 w-4" /> Financial Settings
                </TabsTrigger>
                <TabsTrigger
                  value="app-data"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Database className="h-4 w-4" /> App Ledger
                </TabsTrigger>
                <TabsTrigger
                  value="app-branding"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Palette className="h-4 w-4" /> App Branding
                </TabsTrigger>
                <TabsTrigger
                  value="pin-control"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Pin className="h-4 w-4" /> Pin Control
                </TabsTrigger>
                <TabsTrigger
                  value="authority"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Zap className="h-4 w-4" /> Authority Hub
                </TabsTrigger>
                <TabsTrigger
                  value="member-directory"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Users className="h-4 w-4" /> Member Directory
                </TabsTrigger>
                <TabsTrigger
                  value="ranking-themes"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Trophy className="h-4 w-4" /> Ranking Themes
                </TabsTrigger>
                <TabsTrigger
                  value="user-records"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <UserSearch className="h-4 w-4" /> User Ledger
                </TabsTrigger>
                <TabsTrigger
                  value="assign-center"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <ShieldCheck className="h-4 w-4" /> Assign Center
                </TabsTrigger>
                <TabsTrigger
                  value="id-ban"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Gavel className="h-4 w-4" /> ID Ban Control
                </TabsTrigger>
                <TabsTrigger
                  value="banners"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <ImageIcon className="h-4 w-4" /> Banners
                </TabsTrigger>
                <TabsTrigger
                  value="games"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Gamepad2 className="h-4 w-4" /> Game Sync
                </TabsTrigger>
                <TabsTrigger
                  value="broadcaster"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Megaphone className="h-4 w-4" /> Broadcaster
                </TabsTrigger>
                <TabsTrigger
                  value="direct-messenger"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <MessageSquareText className="h-4 w-4" /> Direct Messenger
                </TabsTrigger>
                <TabsTrigger
                  value="tags"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <BadgeCheck className="h-4 w-4" /> Assign Tags
                </TabsTrigger>

                <TabsTrigger
                  value="rewards"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Gift className="h-4 w-4" /> Rewards Center
                </TabsTrigger>

                <TabsTrigger
                  value="moderation-reports"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-red-600 data-[state=active]:text-white shadow-lg"
                >
                  <ShieldAlert className="h-4 w-4" /> Moderation Reports
                </TabsTrigger>
                <TabsTrigger
                  value="splash-screen"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Monitor className="h-4 w-4" /> Splash Screen
                </TabsTrigger>
                <TabsTrigger
                  value="boutique-hub"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <ShoppingBag className="h-4 w-4" /> Boutique Hub
                </TabsTrigger>
                <TabsTrigger
                  value="gift-management"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-orange-500 data-[state=active]:text-white shadow-lg"
                >
                  <Gift className="h-4 w-4" /> Gift Management
                </TabsTrigger>
                <TabsTrigger
                  value="custom-gifts"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-pink-600 data-[state=active]:text-white shadow-lg"
                >
                  <Sparkles className="h-4 w-4" /> Customized Gifts
                </TabsTrigger>
                <TabsTrigger
                  value="loot-management"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-purple-600 data-[state=active]:text-white shadow-lg"
                >
                  <Gift className="h-4 w-4" /> Loot Management
                </TabsTrigger>
                <TabsTrigger
                  value="loading-screen"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Loader className="h-4 w-4" /> Loading Screen Sync
                </TabsTrigger>
                <TabsTrigger
                  value="game-loading"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <Gamepad2 className="h-4 w-4" /> Game Loading Sync
                </TabsTrigger>
                <TabsTrigger
                  value="sovereign-ids"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-indigo-600 data-[state=active]:text-white shadow-lg"
                >
                  <Crown className="h-4 w-4" /> Sovereign IDs
                </TabsTrigger>
                <TabsTrigger
                  value="visual-identity"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-pink-500 data-[state=active]:text-white shadow-lg"
                >
                  <Palette className="h-4 w-4" /> Visual Identity 🎨
                </TabsTrigger>
                <TabsTrigger
                  value="system"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  <RefreshCcw className="h-4 w-4" /> System Control
                </TabsTrigger>
                <TabsTrigger
                  value="level-management"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-cyan-600 data-[state=active]:text-white shadow-lg"
                >
                  <Trophy className="h-4 w-4" /> Level Management
                </TabsTrigger>
                <TabsTrigger
                  value="medal-management"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-amber-500 data-[state=active]:text-white shadow-lg"
                >
                  <Award className="h-4 w-4" /> Medal Management
                </TabsTrigger>
                <TabsTrigger
                  value="emoji-management"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white shadow-lg"
                >
                  <Smile className="h-4 w-4" /> Emoji Management
                </TabsTrigger>
                <TabsTrigger
                  value="vip-management"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-yellow-500 data-[state=active]:text-white shadow-lg"
                >
                  <Crown className="h-4 w-4 text-yellow-500 fill-current animate-pulse" /> VIP Management
                </TabsTrigger>
                <TabsTrigger
                  value="cp-management"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-pink-500 data-[state=active]:text-white shadow-lg"
                >
                  <Heart className="h-4 w-4 text-pink-500 fill-current animate-pulse" /> CP Background
                </TabsTrigger>
                <TabsTrigger
                  value="family-management"
                  className="w-full justify-start h-14 rounded-2xl px-6 font-bold uppercase text-xs gap-3 text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white shadow-lg"
                >
                  <Users className="h-4 w-4 text-emerald-500 fill-current animate-pulse" /> Family Management
                </TabsTrigger>
              </TabsList>
            </ScrollArea>
          </div>
          <div className="flex-1 w-full min-w-0">
            <TabsContent value="vip-management" className="m-0 space-y-6">
              <VipManagementTab />
            </TabsContent>
            <TabsContent value="cp-management" className="m-0 space-y-6">
              <CpManagementTab />
            </TabsContent>
            <TabsContent value="family-management" className="m-0 space-y-6">
              <FamilyManagementTab />
            </TabsContent>
            <TabsContent value="loot-management" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-purple-600">
                    <Gift className="h-6 w-6" /> Loot Management
                  </CardTitle>
                  <CardDescription>
                    Configure loot box levels, rewards, thresholds, and Hindi voice announcements.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-8">
                  {/* GLOBAL SETTINGS */}
                  <div className="p-6 bg-purple-50 rounded-3xl border-2 border-purple-100 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-purple-600">Global Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-purple-400">Entry Limit (Fastest Clickers)</Label>
                        <Input 
                          type="number"
                          value={lootConfig.entryLimit} 
                          onChange={e => setLootConfig(prev => ({ ...prev, entryLimit: parseInt(e.target.value) || 20 }))} 
                          className="h-12 rounded-xl border-purple-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-purple-400">Looting Duration (Seconds)</Label>
                        <Input 
                          type="number"
                          value={lootConfig.duration} 
                          onChange={e => setLootConfig(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))} 
                          className="h-12 rounded-xl border-purple-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-purple-400">Gate Opener Priority</Label>
                        <Select value={lootConfig.gatePriority} onValueChange={(v) => setLootConfig(prev => ({ ...prev, gatePriority: v }))}>
                          <SelectTrigger className="h-12 rounded-xl border-purple-200 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top_sender">Top Sender → 2nd → 3rd → Owner</SelectItem>
                            <SelectItem value="owner_first">Owner → Top Sender → 2nd → 3rd</SelectItem>
                            <SelectItem value="random">Random Eligible User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                   {/* LEVEL CONFIGURATION */}
                  <div className="p-6 bg-indigo-50 rounded-3xl border-2 border-indigo-100 space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-600">Level Configuration</h3>
                    <div className="space-y-4">
                      {lootLevels.map((level) => (
                        <div key={level.id} className="p-4 bg-white rounded-2xl border border-indigo-100 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold uppercase text-indigo-700">{level.name}</h4>
                            <Badge variant="outline" className="border-indigo-300 text-indigo-600">Threshold: {level.threshold.toLocaleString()}</Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-indigo-400">Threshold (Coins)</Label>
                              <Input 
                                type="number"
                                value={level.threshold} 
                                onChange={e => handleUpdateLevelThreshold(level.id, parseInt(e.target.value) || 0)} 
                                className="h-10 rounded-xl border-indigo-200 bg-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-indigo-400">Hindi Voice Message</Label>
                              <Input 
                                value={level.voice} 
                                onChange={e => handleUpdateLevelVoice(level.id, e.target.value)} 
                                placeholder="e.g. Ghar khulne wala hai!"
                                className="h-10 rounded-xl border-indigo-200 bg-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-indigo-400">Level Image</Label>
                              <div className="flex gap-2">
                                <div className="relative flex-1 h-10">
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                    onChange={e => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadLootLevelImage(level.id, file);
                                    }}
                                    disabled={uploadingLootImage === level.id}
                                  />
                                  <Button 
                                    type="button"
                                    variant="outline"
                                    disabled={uploadingLootImage === level.id}
                                    className="h-10 rounded-xl w-full text-xs font-bold pointer-events-none flex items-center justify-center"
                                  >
                                    {uploadingLootImage === level.id ? (
                                      <Loader className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Upload Image"
                                    )}
                                  </Button>
                                </div>
                                {level.image && (
                                  <img src={level.image} className="h-10 w-10 rounded-lg object-cover" alt={level.name} />
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-indigo-400">Level Video</Label>
                              <div className="flex gap-2">
                                <div className="relative flex-1 h-10">
                                  <input 
                                    type="file" 
                                    accept="video/*" 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                    onChange={e => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadLevelVideo(level.id, file);
                                    }}
                                    disabled={uploadingLevelVideo === level.id}
                                  />
                                  <Button 
                                    type="button"
                                    variant="outline"
                                    disabled={uploadingLevelVideo === level.id}
                                    className="h-10 rounded-xl w-full text-xs font-bold pointer-events-none flex items-center justify-center"
                                  >
                                    {uploadingLevelVideo === level.id ? (
                                      <Loader className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Upload Video"
                                    )}
                                  </Button>
                                </div>
                                {level.videoUrl && (
                                  <video src={level.videoUrl} className="h-10 w-10 rounded-lg object-cover" muted loop autoPlay />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* REWARDS CONFIGURATION */}
                  <div className="p-6 bg-pink-50 rounded-3xl border-2 border-pink-100 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest text-pink-600">Rewards Pool</h3>
                      <Button onClick={handleAddReward} size="sm" className="rounded-xl bg-pink-600 hover:bg-pink-700">
                        <Plus className="h-4 w-4 mr-2" /> Add Reward
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {lootRewards.map((reward) => (
                        <div key={reward.id} className="p-4 bg-white rounded-2xl border border-pink-100 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-pink-400">Name</Label>
                              <Input 
                                value={reward.name} 
                                onChange={e => handleUpdateReward(reward.id, "name", e.target.value)} 
                                className="h-10 rounded-xl border-pink-200 bg-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-pink-400">Type</Label>
                              <Select value={reward.type} onValueChange={(v) => handleUpdateReward(reward.id, "type", v)}>
                                <SelectTrigger className="h-10 rounded-xl border-pink-200 bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="coins">Coins</SelectItem>
                                  <SelectItem value="frame">Frame</SelectItem>
                                  <SelectItem value="badge">Badge</SelectItem>
                                  <SelectItem value="special">Special Item</SelectItem>
                                  <SelectItem value="theme">Room Theme</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-pink-400">Rarity</Label>
                              <Select value={reward.rarity} onValueChange={(v) => handleUpdateReward(reward.id, "rarity", v)}>
                                <SelectTrigger className="h-10 rounded-xl border-pink-200 bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="common">Common</SelectItem>
                                  <SelectItem value="rare">Rare</SelectItem>
                                  <SelectItem value="epic">Epic</SelectItem>
                                  <SelectItem value="legendary">Legendary</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-pink-400">Value/Quantity</Label>
                              <Input 
                                type="number"
                                value={reward.value} 
                                onChange={e => handleUpdateReward(reward.id, "value", parseInt(e.target.value) || 0)} 
                                className="h-10 rounded-xl border-pink-200 bg-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-pink-400">Action</Label>
                              <Button 
                                onClick={() => handleRemoveReward(reward.id)} 
                                variant="destructive" 
                                size="sm"
                                className="h-10 rounded-xl w-full"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SAVE BUTTON */}
                  <Button
                    onClick={handleSaveLoot}
                    disabled={isSavingLoot}
                    className="h-16 rounded-[1.5rem] bg-purple-600 hover:bg-purple-700 text-white font-black uppercase text-lg shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
                  >
                    {isSavingLoot ? (
                      <div className="flex items-center gap-3">
                        <Loader className="animate-spin h-6 w-6" />
                        <span>Syncing Loot...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6" />
                        <span>Synchronize Loot Management</span>
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gift-management" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-orange-600">
                    <Gift className="h-6 w-6" /> Gift Management
                  </CardTitle>
                  <CardDescription>
                    Upload and manage the tribe's gift inventory.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-8">
                  {/* UPLOADER SECTION */}
                  <div className="p-6 bg-orange-50 rounded-3xl border-2 border-orange-100 flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-orange-400">Gift Name</Label>
                        <Input 
                          value={giftName} 
                          onChange={e => setGiftName(e.target.value)} 
                          placeholder="e.g. Diamond Ring" 
                          className="h-12 rounded-xl border-orange-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-orange-400">Price (Coins)</Label>
                        <Input 
                          type="number"
                          value={giftPrice} 
                          onChange={e => setGiftPrice(e.target.value)} 
                          placeholder="999" 
                          className="h-12 rounded-xl border-orange-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-orange-400">Category</Label>
                        <Select value={giftCategory} onValueChange={setGiftCategory}>
                          <SelectTrigger className="h-12 rounded-xl border-orange-200 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Hot">Hot</SelectItem>
                            <SelectItem value="Luxury">Luxury</SelectItem>
                            <SelectItem value="Event">Event</SelectItem>
                            <SelectItem value="Lucky">Lucky</SelectItem>
                            <SelectItem value="Customized">Customized</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-orange-400">Legacy Anim ID</Label>
                        <Input 
                          value={giftAnimationId} 
                          onChange={e => setGiftAnimationId(e.target.value)} 
                          placeholder="Optional" 
                          className="h-12 rounded-xl border-orange-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* THUMBNAIL UPLOAD */}
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-orange-500">1. Display Icon (Image)</Label>
                        <div 
                          className="aspect-video border-2 border-dashed border-orange-200 rounded-3xl flex flex-col items-center justify-center gap-3 bg-white hover:bg-orange-100/30 cursor-pointer transition-all overflow-hidden relative group"
                        >
                          {thumbnailPreview ? (
                            <Image src={thumbnailPreview} alt="Preview" fill className="object-contain p-4" unoptimized />
                          ) : (
                            <>
                              <ImageIcon className="h-8 w-8 text-orange-200" />
                              <span className="text-[10px] font-bold uppercase text-orange-300">Select Thumbnail</span>
                            </>
                          )}
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                            accept="image/*" 
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) {
                                setGiftThumbnail(f);
                                setThumbnailPreview(URL.createObjectURL(f));
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* VIDEO UPLOAD */}
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-500">2. Animation Video (MP4)</Label>
                        <div 
                          className="aspect-video border-2 border-dashed border-indigo-200 rounded-3xl flex flex-col items-center justify-center gap-3 bg-white hover:bg-indigo-50/50 cursor-pointer transition-all overflow-hidden relative"
                        >
                          {videoPreview ? (
                            <video src={videoPreview} autoPlay muted loop className="h-full w-full object-contain" />
                          ) : (
                            <>
                              <Video className="h-8 w-8 text-indigo-200" />
                              <span className="text-[10px] font-bold uppercase text-indigo-300">Select Animation Video</span>
                            </>
                          )}
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                            accept="video/*" 
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) {
                                setGiftVideo(f);
                                setVideoPreview(URL.createObjectURL(f));
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleSaveGift}
                      disabled={isUploadingGift}
                      className="h-16 rounded-[1.5rem] bg-orange-500 hover:bg-orange-600 text-white font-black uppercase text-lg shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                    >
                      {isUploadingGift ? (
                        <div className="flex items-center gap-3">
                          <Loader className="animate-spin h-6 w-6" />
                          <span>Uploading Frequencies...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6" />
                          <span>Synchronize Hybrid Gift</span>
                        </div>
                      )}
                    </Button>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={handleBulkRestoreGifts}
                      disabled={isAddingGift}
                      variant="outline"
                      className="w-full h-14 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-600 font-bold uppercase hover:bg-indigo-50 flex items-center justify-center gap-2"
                    >
                      <Zap className="h-5 w-5 fill-current" />
                      Bulk Restore Premium (100 Gifts)
                    </Button>
                  </div>

                  {/* INVENTORY SECTION */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase text-slate-400">Current Inventory</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
                      {isLoadingGifts ? (
                        <div className="col-span-full py-10 flex justify-center"><Loader className="animate-spin text-orange-500" /></div>
                      ) : dbGifts?.map((gift: any) => (
                        <div key={gift.id} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl flex flex-col gap-3 relative group">
                          <button 
                            onClick={() => handleDeleteGift(gift.id)}
                            className="absolute top-2 right-2 p-2 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-4">
                            <img src={gift.imageUrl} alt={gift.name} className="max-h-full object-contain" />
                            {gift.videoUrl && (
                              <div className="absolute top-2 left-2 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1 shadow-lg">
                                <Video className="h-2 w-2" /> Video
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="font-bold uppercase text-[10px] truncate">{gift.name}</p>
                            <div className="flex items-center justify-center gap-1 text-orange-500 font-black text-xs">
                              <GoldCoinIcon className="h-3 w-3" /> {gift.price}
                            </div>
                            <div className="flex flex-wrap justify-center gap-1 mt-1">
                              <Badge className="bg-slate-200 text-slate-600 text-[7px] font-bold uppercase">{gift.category}</Badge>
                              {gift.animationId && <Badge variant="outline" className="text-[7px] font-bold uppercase opacity-50">{gift.animationId}</Badge>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="custom-gifts" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-pink-600">
                    <Sparkles className="h-6 w-6" /> Customized Gift Requests
                  </CardTitle>
                  <CardDescription>
                    Review and moderate custom gift requests. Approving lets the user know to check, and rejecting will AUTOMATICALLY refund 50,000 coins directly to their wallet.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  {!sortedCustomGiftRequests || sortedCustomGiftRequests.length === 0 ? (
                    <div className="py-20 text-center opacity-20 font-bold uppercase text-xs tracking-widest leading-loose">
                      No Customized Requests Found
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">User Info</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Requested Date</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Coins Deducted</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Status</th>
                            <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedCustomGiftRequests.map((req: any) => (
                            <tr key={req.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm flex-shrink-0">
                                    <AvatarFallback className="bg-pink-100 text-pink-600 font-bold uppercase">
                                      {req.username?.[0] || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-bold text-slate-900 uppercase text-xs">
                                      {req.username}
                                    </p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                      UID: {req.uid}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-xs font-medium text-slate-500">
                                {req.createdAt ? format(req.createdAt.toDate?.() || new Date(req.createdAt), "HH:mm - MMM d, yyyy") : "N/A"}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1 text-orange-500 font-black text-xs">
                                  <GoldCoinIcon className="h-3.5 w-3.5" /> {(req.coinsPaid || 50000).toLocaleString()}
                                </div>
                              </td>
                              <td className="p-4">
                                {req.status === 'pending' && (
                                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full border border-amber-200 shadow-sm flex items-center gap-1 w-fit">
                                    <Clock className="h-2.5 w-2.5" /> Pending Review
                                  </Badge>
                                )}
                                {req.status === 'approved' && (
                                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full border border-emerald-200 shadow-sm flex items-center gap-1 w-fit">
                                    <Check className="h-2.5 w-2.5" /> Approved
                                  </Badge>
                                )}
                                {req.status === 'rejected' && (
                                  <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 font-bold uppercase text-[9px] px-2 py-0.5 rounded-full border border-rose-200 shadow-sm flex items-center gap-1 w-fit">
                                    <X className="h-2.5 w-2.5" /> Rejected (Refunded)
                                  </Badge>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                {req.status === 'pending' ? (
                                  <div className="flex items-center justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleApproveCustomGift(req)}
                                      disabled={isProcessingCustomGift !== null}
                                      className="h-8 px-3 text-[10px] font-bold uppercase rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                    >
                                      {isProcessingCustomGift === req.id ? "..." : "Approve"}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRejectCustomGift(req)}
                                      disabled={isProcessingCustomGift !== null}
                                      className="h-8 px-3 text-[10px] font-bold uppercase rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                                    >
                                      {isProcessingCustomGift === req.id ? "..." : "Reject & Refund"}
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="financial-audit" className="m-0 space-y-6">
              <LogViewer firestore={firestore} isAuthorized={isAuthorized} />
            </TabsContent>

            <TabsContent value="financial-settings" className="m-0 space-y-6">
               <Card className="rounded-3xl border-none shadow-xl bg-white p-8">
                 <CardHeader className="px-0">
                   <CardTitle className="text-2xl uppercase flex items-center gap-2 text-green-600">
                     <Wallet className="h-6 w-6" /> Financial & Payment Settings
                   </CardTitle>
                   <CardDescription>
                     Configure global payment gateways and offline recharge settings.
                   </CardDescription>
                 </CardHeader>
                 <CardContent className="px-0 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                       <Label className="text-[10px] font-black uppercase text-slate-400">1. Global Payment Mode</Label>
                       <Select 
                         value={config?.paymentMode || 'manual'} 
                         onValueChange={(val) => {
                           if (!configRef) return;
                           updateDoc(configRef, { paymentMode: val, updatedAt: serverTimestamp() })
                             .then(() => toast({ title: "Payment Mode Updated", description: `Switched to ${val} mode.` }));
                         }}
                       >
                         <SelectTrigger className="h-14 rounded-2xl border-none bg-white shadow-sm font-bold">
                           <SelectValue placeholder="Select Mode" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="manual">Manual (QR Scan + UTR)</SelectItem>
                           <SelectItem value="upi_intent">UPI Intent (Direct App + UTR)</SelectItem>
                           <SelectItem value="razorpay">Razorpay (Automatic - Needs GST)</SelectItem>
                           <SelectItem value="cashfree">Cashfree (Automatic - Needs GST)</SelectItem>
                         </SelectContent>
                       </Select>
                       <p className="text-[9px] font-medium text-slate-400 uppercase leading-relaxed">
                         {config?.paymentMode === 'manual' && "Users scan QR, pay manually, and submit UTR ID."}
                         {config?.paymentMode === 'upi_intent' && "Users click button to open PhonePe/GPay, then submit UTR ID."}
                         {config?.paymentMode === 'razorpay' && "Users pay via Razorpay modal. Coins added automatically."}
                         {config?.paymentMode === 'cashfree' && "Users pay via Cashfree modal. Coins added automatically."}
                       </p>
                     </div>

                     <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
                        <Label className="text-[10px] font-black uppercase text-slate-400">2. UPI Identity (For Manual/Intent)</Label>
                        <div className="space-y-3">
                           <div className="space-y-1">
                              <Label className="text-[8px] font-bold uppercase text-slate-400 ml-1">UPI ID / VPA</Label>
                              <Input 
                                defaultValue={config?.upiId || ''} 
                                onBlur={(e) => {
                                   if (!configRef || e.target.value === config?.upiId) return;
                                   updateDoc(configRef, { upiId: e.target.value, updatedAt: serverTimestamp() })
                                     .then(() => toast({ title: "UPI ID Saved" }));
                                }}
                                placeholder="e.g. 7209741932@ptyes" 
                                className="h-12 rounded-xl border-none bg-white shadow-sm font-mono"
                              />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[8px] font-bold uppercase text-slate-400 ml-1">Merchant/Business Name</Label>
                              <Input 
                                defaultValue={config?.upiName || ''} 
                                onBlur={(e) => {
                                   if (!configRef || e.target.value === config?.upiName) return;
                                   updateDoc(configRef, { upiName: e.target.value, updatedAt: serverTimestamp() })
                                     .then(() => toast({ title: "Merchant Name Saved" }));
                                }}
                                placeholder="e.g. Ummy Chat Official" 
                                className="h-12 rounded-xl border-none bg-white shadow-sm font-bold"
                              />
                           </div>
                        </div>
                     </div>
                   </div>

                   <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 space-y-6">
                      <div className="flex items-center justify-between">
                         <Label className="text-[10px] font-black uppercase text-slate-400">3. Offline Recharge QR Code</Label>
                         {config?.paymentQrUrl && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-[9px] font-bold text-red-500 uppercase h-7 px-3 border border-red-100 rounded-lg"
                              onClick={() => updateDoc(configRef!, { paymentQrUrl: null })}
                            >
                               Remove QR
                            </Button>
                         )}
                      </div>

                      <div className="flex flex-col md:flex-row items-center gap-10">
                         <div className="relative h-48 w-48 bg-white rounded-3xl border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                            {config?.paymentQrUrl ? (
                               <Image src={config.paymentQrUrl} alt="Payment QR" fill className="object-contain p-2" unoptimized />
                            ) : (
                               <div className="text-center opacity-20">
                                  <ImageIcon className="h-10 w-10 mx-auto mb-1" />
                                  <p className="text-[8px] font-black uppercase">No QR Active</p>
                               </div>
                            )}
                            {isUploadingPaymentQr && (
                               <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Loader className="animate-spin text-white" />
                               </div>
                            )}
                         </div>

                         <div className="flex-1 space-y-4">
                             <p className="text-xs font-medium text-slate-500 leading-relaxed uppercase">
                                Upload your UPI QR code image (PhonePe/GPay/Paytm Business QR). This will be displayed to users in Manual Recharge mode.
                             </p>
                             <div className="relative inline-block h-14">
                               <input 
                                 type="file" 
                                 className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" 
                                 accept="image/*" 
                                 onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file || !storage || !configRef) return;
                                    setIsUploadingPaymentQr(true);
                                    const path = `appConfig/payment_qr_${Date.now()}`;
                                    const sRef = ref(storage, path);
                                    uploadBytes(sRef, file, { cacheControl: 'public,max-age=31536000,immutable' })
                                       .then(snap => getDownloadURL(snap.ref))
                                       .then(url => updateDoc(configRef, { paymentQrUrl: url, updatedAt: serverTimestamp() }))
                                       .then(() => toast({ title: "QR Updated Successfully" }))
                                       .catch(err => toast({ variant: 'destructive', title: "Upload Failed", description: err.message }))
                                       .finally(() => setIsUploadingPaymentQr(false));
                                 }}
                                 disabled={isUploadingPaymentQr}
                               />
                               <Button 
                                 type="button"
                                 disabled={isUploadingPaymentQr}
                                 className="h-14 rounded-2xl bg-black text-white font-black uppercase px-8 shadow-xl shadow-black/10 flex gap-2 pointer-events-none items-center justify-center"
                               >
                                  {isUploadingPaymentQr ? <Loader className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
                                  Upload New QR Image
                               </Button>
                             </div>
                          </div>
                      </div>
                   </div>
                 </CardContent>
               </Card>
             </TabsContent>

            <TabsContent value="recharge-requests" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-green-600">
                    <Wallet className="h-6 w-6" /> Recharge Requests
                  </CardTitle>
                  <CardDescription className="flex items-center justify-between">
                    <span>Verify manual UPI payments and credit coins to users.</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleClearRechargeHistory}
                      className="text-[10px] font-bold text-red-500 uppercase h-8 px-4 border border-red-100 rounded-xl hover:bg-red-50"
                    >
                      Wipe Old Test Records
                    </Button>
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  {!pendingRecharges || pendingRecharges.length === 0 ? (
                    <div className="py-20 text-center opacity-20 font-bold uppercase text-xs tracking-widest leading-loose">
                      No Pending Requests
                      <br />
                      Frequency Clear
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingRecharges.map((req: any) => (
                        <div
                          key={req.id}
                          className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-2"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                              <AvatarFallback className="bg-green-100 text-green-600 font-bold">
                                {req.username?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-slate-900 uppercase">
                                {req.username}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                ID: {req.accountNumber} |{" "}
                                {format(
                                  req.createdAt?.toDate?.() || new Date(),
                                  "HH:mm - MMM d",
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-center md:items-start gap-1">
                            <p className="text-[10px] font-bold uppercase text-slate-400">
                              UTR / Ref Number
                            </p>
                            <code className="bg-white px-3 py-1 rounded-lg border border-slate-200 font-mono font-bold text-blue-600 select-all">
                              {req.utrNumber}
                            </code>
                          </div>

                          <div className="flex items-center gap-4 px-6 border-x border-slate-200">
                            <div className="text-center">
                              <p className="text-[10px] font-bold uppercase text-slate-400">
                                Amount
                              </p>
                              <p className="font-bold text-slate-900 uppercase italic tracking-tighter">
                                {req.amount}
                              </p>
                            </div>
                            <ArrowLeftRight
                              className="h-4 w-4 text-slate-300"
                              strokeWidth={3}
                            />
                            <div className="text-center">
                              <p className="text-[10px] font-bold uppercase text-slate-400">
                                Coins
                              </p>
                              <div className="flex items-center gap-1 font-bold text-green-600 uppercase tracking-tighter">
                                <GoldCoinIcon className="h-4 w-4" />
                                <span>
                                  {(req.coins + req.bonus).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              onClick={() => handleRejectRecharge(req.id)}
                              disabled={isProcessingRechargeAction === req.id}
                              className="rounded-xl text-red-500 hover:bg-red-50"
                            >
                              {isProcessingRechargeAction === req.id ? (
                                <Loader className="animate-spin" />
                              ) : (
                                <X className="h-5 w-5" />
                              )}
                            </Button>
                            <Button
                              onClick={() => handleApproveRecharge(req)}
                              disabled={isProcessingRechargeAction === req.id}
                              className="bg-green-600 hover:bg-green-700 text-white font-bold uppercase h-12 px-8 rounded-xl shadow-lg shadow-green-600/20 active:scale-95 transition-all"
                            >
                              {isProcessingRechargeAction === req.id ? (
                                <Loader className="animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-5 w-5 mr-2" />
                              )}
                              Approve
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="app-data" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-8">
                <CardHeader className="px-0 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl uppercase flex items-center gap-2 text-blue-600">
                      <BarChart3 className="h-6 w-6" /> App Economic Ledger
                    </CardTitle>
                    <CardDescription>
                      Global coin circulation and economic sync metrics.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleSyncAppData}
                    disabled={isSyncingAppData}
                    className="bg-blue-600 h-12 rounded-xl"
                  >
                    {isSyncingAppData ? (
                      <Loader className="animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}{" "}
                    Sync Ledger
                  </Button>
                </CardHeader>
                <CardContent className="px-0 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 flex flex-col gap-1">
                      <p className="text-[10px] font-bold uppercase text-blue-400 tracking-wider">
                        Total Coins in Tribe
                      </p>
                      <div className="flex items-center gap-2 text-2xl font-bold text-blue-900 ">
                        <GoldCoinIcon className="h-6 w-6" />
                        {appStats.totalCoins.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-6 bg-cyan-50 rounded-3xl border-2 border-cyan-100 flex flex-col gap-1">
                      <p className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
                        Total Diamonds Accumulated
                      </p>
                      <div className="flex items-center gap-2 text-2xl font-bold text-cyan-900 ">
                        <Sparkles className="h-6 w-6" />
                        {appStats.totalDiamonds.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-6 bg-purple-50 rounded-3xl border-2 border-purple-100 flex flex-col gap-1">
                      <p className="text-[10px] font-bold uppercase text-purple-400 tracking-wider">
                        Total Economic Output (Spent)
                      </p>
                      <div className="flex items-center gap-2 text-2xl font-bold text-purple-900 ">
                        <BarChart3 className="h-6 w-6" />
                        {appStats.totalSpent.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex flex-col gap-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Total Synchronized Users
                      </p>
                      <div className="flex items-center gap-2 text-2xl font-bold text-slate-900 ">
                        <Users className="h-6 w-6" />
                        {appStats.totalUsers.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="game-loading" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-purple-600">
                    <Gamepad2 className="h-6 w-6" /> Game Loading Sync
                  </CardTitle>
                  <CardDescription>
                    Upload custom backgrounds for specific game loading screens.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gamesList.map((game) => (
                      <Card
                        key={game.slug}
                        className="p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl flex flex-col gap-4"
                      >
                        <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-slate-900 border-2 border-white shadow-md flex items-center justify-center">
                          {(game as any).loadingBackgroundUrl ? (
                            <Image
                              src={(game as any).loadingBackgroundUrl}
                              fill
                              className="object-cover"
                              alt="Loading BG"
                              unoptimized
                            />
                          ) : (
                            <div className="text-center opacity-20">
                              <ImageIcon className="h-8 w-8 mx-auto mb-1" />
                              <span className="text-[8px] font-bold uppercase">
                                Standard Sync
                              </span>
                            </div>
                          )}
                          {isUploadingGameLoadingBG &&
                            selectedGameForSync?.slug === game.slug && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Loader className="animate-spin text-white" />
                              </div>
                            )}
                          <button
                            onClick={() => {
                              setSelectedGameForSync(game);
                              gameLoadingBGFileInputRef.current?.click();
                            }}
                            className="absolute bottom-3 right-3 bg-white p-2 rounded-full shadow-lg text-purple-600 active:scale-90 transition-transform"
                          >
                            <Camera className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="font-bold text-center uppercase text-sm">
                          {(game as any).title}
                        </p>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <input
                type="file"
                ref={gameLoadingBGFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleGameLoadingBGUpload(e.target.files[0])
                }
              />
            </TabsContent>

            <TabsContent value="loading-screen" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-indigo-600">
                    <Loader className="h-6 w-6" /> App Loading Sync
                  </CardTitle>
                  <CardDescription>
                    Manage the background image shown during app initialization
                    and dimension transitions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-10">
                  <div className="p-4 sm:p-6 bg-green-50 rounded-3xl border-2 border-green-100 space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-green-600" />
                        <span className="font-bold uppercase text-sm text-green-900">
                          Payment Collection QR (UPI)
                        </span>
                      </div>

                      <div className="flex flex-col xs:flex-row items-center gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-green-100 shadow-sm w-full lg:w-auto">
                        <div className="flex-1 text-center xs:text-left">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Payment Gateway Status
                          </p>
                          <p className="text-xs font-bold text-slate-900 uppercase">
                            {config?.paymentMode === "razorpay"
                              ? "Razorpay (Live)"
                              : config?.paymentMode === "cashfree"
                              ? "Cashfree (Live)"
                              : "Offline (Manual)"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-1 bg-slate-100 p-1 rounded-xl">
                          <Button
                            size="sm"
                            variant={
                              config?.paymentMode === "offline" ||
                              !config?.paymentMode
                                ? "default"
                                : "ghost"
                            }
                            onClick={() =>
                              updateDoc(configRef!, { paymentMode: "offline" })
                            }
                            className="text-[8px] font-bold uppercase px-3 h-8 rounded-lg"
                          >
                            Offline
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              config?.paymentMode === "razorpay"
                                ? "default"
                                : "ghost"
                            }
                            onClick={() =>
                              updateDoc(configRef!, { paymentMode: "razorpay" })
                            }
                            className="text-[8px] font-bold uppercase px-3 h-8 rounded-lg"
                          >
                            Razorpay
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              config?.paymentMode === "cashfree"
                                ? "default"
                                : "ghost"
                            }
                            onClick={() =>
                              updateDoc(configRef!, { paymentMode: "cashfree" })
                            }
                            className="text-[8px] font-bold uppercase px-3 h-8 rounded-lg"
                          >
                            Cashfree
                          </Button>
                        </div>
                      </div>

                      {config?.paymentQrUrl && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-[8px] font-bold uppercase h-10 px-6 rounded-xl w-full lg:w-auto"
                          onClick={() =>
                            updateDoc(configRef!, { paymentQrUrl: null })
                          }
                        >
                          Reset QR
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="relative h-48 w-48 rounded-[2rem] bg-white shadow-2xl border-8 border-white flex items-center justify-center overflow-hidden">
                        {config?.paymentQrUrl ? (
                          <Image
                            src={config.paymentQrUrl}
                            alt="UPI QR"
                            fill
                            className="object-contain p-4"
                            unoptimized
                          />
                        ) : (
                          <div className="text-center opacity-20">
                            <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-green-300" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              No QR Active
                            </span>
                          </div>
                        )}
                        {isUploadingPaymentQr && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader className="animate-spin text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-4">
                        <p className="text-[11px] font-bold text-green-700 leading-relaxed uppercase opacity-80">
                          This QR will be displayed to all users during
                          recharge. Ensure it is your correct Google Pay,
                          PhonePe, or BHIM UPI code.
                        </p>
                        
                        <div className="space-y-4">
                          <div className="space-y-1.5 px-1 pt-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400">Support / UPI ID Text</label>
                            <div className="flex gap-2">
                              <Input 
                                defaultValue={config?.upiId || ""} 
                                placeholder="e.g. 7209741932@ptyes"
                                className="h-12 bg-white rounded-xl border-2"
                                id="upi-id-input"
                              />
                              <Button 
                                size="sm" 
                                className="h-12 px-6 rounded-xl bg-slate-900 text-white font-bold uppercase"
                                onClick={() => {
                                  const val = (document.getElementById('upi-id-input') as HTMLInputElement).value;
                                  updateDoc(configRef!, { upiId: val, updatedAt: serverTimestamp() }).then(() => toast({ title: "UPI ID Synchronized" }));
                                }}
                              >
                                Save ID
                              </Button>
                            </div>
                          </div>

                          <Button
                            onClick={() => paymentQrFileInputRef.current?.click()}
                            disabled={isUploadingPaymentQr}
                            className="w-full h-14 px-8 rounded-2xl bg-green-600 text-white font-bold uppercase shadow-xl shadow-green-600/20 transition-all hover:bg-green-700 active:scale-95"
                          >
                            {isUploadingPaymentQr ? (
                              <Loader className="animate-spin mr-2" />
                            ) : (
                              <Camera className="h-5 w-5 mr-3" />
                            )}
                            Synchronize QR Code Image
                          </Button>
                        </div>
                        <input
                          type="file"
                          ref={paymentQrFileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            handlePaymentQrUpload(e.target.files[0])
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-indigo-600" />
                        <span className="font-bold uppercase text-sm text-slate-900">
                          Global Loading Background
                        </span>
                      </div>
                      {config?.appLoadingBackgroundUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[8px] font-bold uppercase text-red-500"
                          onClick={() =>
                            updateDoc(configRef!, {
                              appLoadingBackgroundUrl: null,
                            })
                          }
                        >
                          Reset to Default
                        </Button>
                      )}
                    </div>

                    <div className="relative aspect-[9/16] max-w-[300px] mx-auto rounded-3xl overflow-hidden bg-slate-900 border-2 border-white shadow-xl flex items-center justify-center">
                      {config?.appLoadingBackgroundUrl ? (
                        <Image
                          src={config.appLoadingBackgroundUrl}
                          fill
                          className="object-cover"
                          alt="Loading BG"
                          unoptimized
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-white/20">
                          <Loader className="h-10 w-10 animate-spin" />
                          <span className="uppercase font-bold text-[10px] tracking-wider">
                            Default Syncing
                          </span>
                        </div>
                      )}
                      {isUploadingLoadingBG && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader className="animate-spin text-white" />
                        </div>
                      )}
                      <button
                        onClick={() => loadingBGFileInputRef.current?.click()}
                        className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-xl text-indigo-600 active:scale-90 transition-transform"
                      >
                        <Camera className="h-6 w-6" />
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={loadingBGFileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleLoadingBGUpload(e.target.files[0])
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="boutique-hub" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-primary">
                    <ShoppingBag className="h-6 w-6" /> Boutique Sync
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Asset Identity</label>
                        <Input
                          placeholder="Enter Asset Name (e.g. Royal Dragon Frame)"
                          value={storeName}
                          onChange={(e) => setStoreName(e.target.value)}
                          className="bg-slate-50 border-2 border-slate-100 rounded-2xl h-14 focus:border-primary transition-all text-sm font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                            <GoldCoinIcon className="h-3 w-3" /> Price (Coins)
                          </label>
                          <Input
                            type="number"
                            placeholder="e.g. 500"
                            value={storePrice}
                            onChange={(e) => setStorePrice(e.target.value)}
                            className="bg-slate-50 border-2 border-slate-100 rounded-2xl h-14 focus:border-primary transition-all font-bold"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Duration (Days)
                          </label>
                          <Input
                            type="number"
                            placeholder="e.g. 7"
                            value={storeDuration}
                            onChange={(e) => setStoreDuration(e.target.value)}
                            className="bg-slate-50 border-2 border-slate-100 rounded-2xl h-14 focus:border-primary transition-all font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Store Category</label>
                        <Select
                          value={storeCategory}
                          onValueChange={(v: any) => setStoreCategory(v)}
                        >
                          <SelectTrigger className="bg-slate-50 border-2 border-slate-100 rounded-2xl h-14 font-bold">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-2">
                            <SelectItem value="Frame" className="font-bold">Avatar Frame</SelectItem>
                            <SelectItem value="Bubble" className="font-bold">Chat Bubble</SelectItem>
                            <SelectItem value="Theme" className="font-bold">Room Theme</SelectItem>
                            <SelectItem value="Wave" className="font-bold">Voice Wave</SelectItem>
                            <SelectItem value="Entry" className="font-bold">Room Entry (Video)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* IMAGE UPLOAD */}
                      <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-white p-6 group relative overflow-hidden aspect-video">
                        <button
                          onClick={() => storeFileInputRef.current?.click()}
                          className="flex flex-col items-center gap-3 w-full h-full justify-center"
                        >
                          {isUploadingStore ? (
                            <Loader className="animate-spin text-primary" />
                          ) : (
                            <Upload className="h-8 w-8 text-slate-400" />
                          )}
                          <span className="text-[10px] font-bold uppercase">
                            1. Upload Display Image
                          </span>
                        </button>
                        {storeImagePreview && (
                          <img src={storeImagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
                        )}
                        <input
                          type="file"
                          ref={storeFileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setStoreImageFile(f);
                              setStoreImagePreview(URL.createObjectURL(f));
                            }
                          }}
                        />
                      </div>

                      {/* VIDEO UPLOAD (Only for Frames & Entry) */}
                      <div className={cn(
                        "flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-white p-6 group relative overflow-hidden aspect-video",
                        storeCategory !== 'Frame' && storeCategory !== 'Entry' && "opacity-30 pointer-events-none"
                      )}>
                        <button
                          onClick={() => storeVideoFileInputRef.current?.click()}
                          className="flex flex-col items-center gap-3 w-full h-full justify-center"
                        >
                          {storeVideoPreview ? (
                             <video src={storeVideoPreview} autoPlay muted loop className="absolute inset-0 w-full h-full object-contain" />
                          ) : (
                            <Video className="h-8 w-8 text-indigo-400" />
                          )}
                          <span className="text-[10px] font-bold uppercase text-indigo-500">
                            2. Upload Animation (MP4)
                          </span>
                        </button>
                        <input
                          type="file"
                          ref={storeVideoFileInputRef}
                          className="hidden"
                          accept="video/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              setStoreVideoFile(f);
                              setStoreVideoPreview(URL.createObjectURL(f));
                            }
                          }}
                        />
                      </div>
                    </div>
                    
                    <Button 
                      className="h-16 rounded-2xl bg-black text-white font-bold uppercase shadow-xl active:scale-95 transition-all"
                      onClick={handleStoreItemUpload}
                      disabled={isUploadingStore}
                    >
                      {isUploadingStore ? <Loader className="animate-spin mr-2" /> : <Plus className="mr-2 h-5 w-5" />}
                      Sync Boutique Asset
                    </Button>
                  </div>

                  {/* BOUTIQUE INVENTORY */}
                  <div className="space-y-4 pt-8">
                    <h3 className="text-sm font-bold uppercase text-slate-400">Current Boutique Inventory</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {isLoadingStoreItems ? (
                        <div className="col-span-full py-10 flex justify-center"><Loader className="animate-spin text-primary" /></div>
                      ) : dbStoreItems?.map((item: any) => (
                        <div key={item.id} className="p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl flex flex-col gap-3 relative group">
                          <button 
                            onClick={() => handleDeleteStoreItem(item.id)}
                            className="absolute top-2 right-2 p-2 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity active:scale-90 z-10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center p-4">
                            <img src={item.url} alt={item.name} className="max-h-full object-contain" />
                            {item.videoUrl && (
                              <div className="absolute top-2 left-2 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1 shadow-lg">
                                <Video className="h-2 w-2" /> Animated
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="font-bold uppercase text-[10px] truncate">{item.name}</p>
                            <div className="flex items-center justify-center gap-1 text-primary font-black text-xs">
                              <GoldCoinIcon className="h-3 w-3" /> {item.price}
                            </div>
                            <div className="flex flex-wrap justify-center gap-1 mt-1">
                              <Badge className="bg-slate-200 text-slate-600 text-[7px] font-bold uppercase">{item.category}</Badge>
                              <Badge variant="outline" className="text-[7px] font-bold uppercase opacity-50">{item.duration} Days</Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-10">
                    <h3 className="text-sm font-bold uppercase text-slate-400">Not For Sale Control</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        placeholder="Search asset name or id..."
                        value={notForSaleSearch}
                        onChange={(e) => setNotForSaleSearch(e.target.value)}
                        className="h-14 rounded-2xl border-2"
                      />
                      <Select value={notForSaleCategory} onValueChange={setNotForSaleCategory}>
                        <SelectTrigger className="bg-slate-50 border-2 border-slate-100 rounded-2xl h-14 font-bold">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-2">
                          {["All", "Frame", "Theme", "Bubble", "Wave", "ID", "Entry", "Other"].map((c) => (
                            <SelectItem key={c} value={c} className="font-bold">
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      <Input
                        placeholder="Manual Asset ID..."
                        value={manualNotForSaleId}
                        onChange={(e) => setManualNotForSaleId(e.target.value)}
                        className="h-14 rounded-2xl border-2"
                      />
                      <Button
                        onClick={() => manualNotForSaleId.trim() && setNotForSaleFlag(manualNotForSaleId.trim(), true)}
                        className="h-14 rounded-2xl bg-black text-white font-bold uppercase"
                      >
                        Mark Not For Sale
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => manualNotForSaleId.trim() && setNotForSaleFlag(manualNotForSaleId.trim(), false)}
                        className="h-14 rounded-2xl font-bold uppercase"
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {storeCatalog
                        .filter((i: any) => (notForSaleCategory === "All" ? true : (i.type || "Other") === notForSaleCategory))
                        .filter((i: any) => {
                          const q = notForSaleSearch.trim().toLowerCase();
                          if (!q) return true;
                          return (i.name || "").toLowerCase().includes(q) || (i.id || "").toLowerCase().includes(q);
                        })
                        .slice(0, 60)
                        .map((i: any) => {
                          const isNfs = !!storeNotForSale[i.id];
                          return (
                            <div
                              key={i.id}
                              className="p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl flex items-center justify-between gap-4"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{i.name}</p>
                                <p className="text-[10px] font-bold uppercase text-slate-400 truncate">{i.type} • {i.id}</p>
                              </div>
                              <Button
                                variant={isNfs ? "default" : "outline"}
                                size="sm"
                                onClick={() => setNotForSaleFlag(i.id, !isNfs)}
                                className="text-[10px] font-black uppercase shrink-0"
                              >
                                {isNfs ? "Not For Sale" : "For Sale"}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pin-control" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl p-4 sm:p-8 bg-white">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-emerald-600">
                    <Pin className="h-6 w-6" /> Sovereign Frequency Pin
                  </CardTitle>
                </CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Enter Room Number (e.g. 1000021)"
                      value={roomPinSearchId}
                      onChange={(e) => setRoomPinSearchId(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleRoomPinSearch()
                      }
                      className="h-14 rounded-2xl border-2"
                    />
                    <Button
                      onClick={handleRoomPinSearch}
                      className="h-14 px-8 rounded-2xl bg-black text-white font-bold uppercase "
                      disabled={isSearchingRoomPin}
                    >
                      Find Frequency
                    </Button>
                  </div>
                </div>
                {targetRoomForPin && (
                  <div className="mt-10 p-8 border-2 rounded-3xl space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                    <div className="flex items-center justify-between border-b pb-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-xl rounded-xl">
                          <AvatarImage
                            src={targetRoomForPin.coverUrl || undefined}
                          />
                        </Avatar>
                        <div>
                          <p className="font-bold uppercase text-xl tracking-tight text-slate-900">
                            {targetRoomForPin.name || targetRoomForPin.title}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Room ID: {targetRoomForPin.roomNumber}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">
                          Pin Frequency
                        </p>
                        {targetRoomForPin.isPinned ? (
                          <Badge className="bg-emerald-500 text-white font-bold uppercase text-[10px] py-1 px-3">
                            PINNED ACTIVE
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-200 text-slate-400 font-bold uppercase text-[10px] py-1 px-3 shadow-none">
                            NOT PINNED
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={handleToggleRoomPin}
                      disabled={isPinningRoom}
                      className={cn(
                        "w-full h-16 rounded-xl font-bold uppercase text-xl shadow-xl transition-all",
                        targetRoomForPin.isPinned
                          ? "bg-red-50 text-red-600 border-2 border-red-100 hover:bg-red-100"
                          : "bg-emerald-600 text-white hover:bg-emerald-700",
                      )}
                    >
                      {isPinningRoom ? (
                        <Loader className="animate-spin mr-2 h-6 w-6" />
                      ) : targetRoomForPin.isPinned ? (
                        <>
                          <PinOff className="mr-2 h-6 w-6" /> Unpin Frequency
                        </>
                      ) : (
                        <>
                          <Pin className="mr-2 h-6 w-6" /> Pin to Top
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="visual-identity" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-pink-600">
                    <Palette className="h-6 w-6" /> Theme & Visual Synchronizer
                  </CardTitle>
                  <CardDescription>
                    Globally switch the application's design system between Classic and Modern styles.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Classic Option */}
                    <div 
                      onClick={() => {
                        if (!firestore || !configRef) return;
                        updateDoc(configRef, { appTheme: 'CLASSIC', updatedAt: serverTimestamp() })
                          .then(() => toast({ title: "Classic Theme Synchronized 🏛️" }));
                      }}
                      className={cn(
                        "group cursor-pointer p-6 rounded-3xl border-2 transition-all active:scale-95",
                        config?.appTheme === 'CLASSIC' || !config?.appTheme 
                          ? "border-blue-500 bg-blue-50 shadow-lg" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                          <Home className="h-5 w-5" />
                        </div>
                        {(config?.appTheme === 'CLASSIC' || !config?.appTheme) && (
                          <div className="bg-blue-600 text-white rounded-full p-1 shadow-md">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 uppercase">Classic System</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed mt-1">
                        Professional soft-light theme with slate accents and lavender highlights.
                      </p>
                    </div>

                    {/* Stellar Pink Option */}
                    <div 
                      onClick={() => {
                        if (!firestore || !configRef) return;
                        updateDoc(configRef, { appTheme: 'STELLAR_PINK', updatedAt: serverTimestamp() })
                          .then(() => toast({ title: "Stellar Pink Synchronized 💖" }));
                      }}
                      className={cn(
                        "group cursor-pointer p-6 rounded-3xl border-2 transition-all active:scale-95",
                        config?.appTheme === 'STELLAR_PINK' 
                          ? "border-pink-500 bg-pink-50 shadow-lg" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        {config?.appTheme === 'STELLAR_PINK' && (
                          <div className="bg-pink-600 text-white rounded-full p-1 shadow-md">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 uppercase">Stellar Pink System</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed mt-1">
                        Vibrant immersive theme with signature pink backgrounds and futuristic neon accents.
                      </p>
                    </div>

                    {/* Purple Majesty Option */}
                    <div 
                      onClick={() => {
                        if (!firestore || !configRef) return;
                        updateDoc(configRef, { appTheme: 'PURPLE_MAJESTY', updatedAt: serverTimestamp() })
                          .then(() => toast({ title: "Purple Majesty Synchronized 🏛️" }));
                      }}
                      className={cn(
                        "group cursor-pointer p-6 rounded-3xl border-2 transition-all active:scale-95",
                        config?.appTheme === 'PURPLE_MAJESTY'
                          ? "border-purple-500 bg-purple-50 shadow-lg" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                          <Crown className="h-5 w-5" />
                        </div>
                        {config?.appTheme === 'PURPLE_MAJESTY' && (
                          <div className="bg-purple-600 text-white rounded-full p-1 shadow-md">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 uppercase">Purple Majesty</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed mt-1">
                        Deep lavender tones and royal purple accents for a high-authority feel.
                      </p>
                    </div>

                    {/* Rose Glow Option */}
                    <div 
                      onClick={() => {
                        if (!firestore || !configRef) return;
                        updateDoc(configRef, { appTheme: 'ROSE_GLOW', updatedAt: serverTimestamp() })
                          .then(() => toast({ title: "Rose Glow Synchronized 🌸" }));
                      }}
                      className={cn(
                        "group cursor-pointer p-6 rounded-3xl border-2 transition-all active:scale-95",
                        config?.appTheme === 'ROSE_GLOW'
                          ? "border-rose-400 bg-rose-50 shadow-lg" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500">
                          <Heart className="h-5 w-5" />
                        </div>
                        {config?.appTheme === 'ROSE_GLOW' && (
                          <div className="bg-rose-500 text-white rounded-full p-1 shadow-md">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 uppercase">Rose Glow</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed mt-1">
                        Soft, romantic rose and white gradients with elegant pink highlights.
                      </p>
                    </div>

                    {/* Golden Hour Option */}
                    <div 
                      onClick={() => {
                        if (!firestore || !configRef) return;
                        updateDoc(configRef, { appTheme: 'GOLDEN_HOUR', updatedAt: serverTimestamp() })
                          .then(() => toast({ title: "Golden Hour Synchronized ☀️" }));
                      }}
                      className={cn(
                        "group cursor-pointer p-6 rounded-3xl border-2 transition-all active:scale-95",
                        config?.appTheme === 'GOLDEN_HOUR'
                          ? "border-amber-400 bg-amber-50 shadow-lg" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                          <Zap className="h-5 w-5" />
                        </div>
                        {config?.appTheme === 'GOLDEN_HOUR' && (
                          <div className="bg-amber-600 text-white rounded-full p-1 shadow-md">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 uppercase">Golden Hour</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed mt-1">
                        Warm sunset peach and soft orange glow for a vibrant, energetic vibe.
                      </p>
                    </div>

                    {/* Midnight Maroon Option */}
                    <div 
                      onClick={() => {
                        if (!firestore || !configRef) return;
                        updateDoc(configRef, { appTheme: 'MIDNIGHT_MAROON', updatedAt: serverTimestamp() })
                          .then(() => toast({ title: "Midnight Maroon Synchronized 🍷" }));
                      }}
                      className={cn(
                        "group cursor-pointer p-6 rounded-3xl border-2 transition-all active:scale-95",
                        config?.appTheme === 'MIDNIGHT_MAROON'
                          ? "border-rose-900 bg-rose-950 shadow-lg" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-rose-900 flex items-center justify-center text-rose-100">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        {config?.appTheme === 'MIDNIGHT_MAROON' && (
                          <div className="bg-rose-500 text-white rounded-full p-1 shadow-md">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <h3 className={cn("font-bold uppercase", config?.appTheme === 'MIDNIGHT_MAROON' ? "text-white" : "text-slate-900")}>Midnight Maroon</h3>
                      <p className={cn("text-[10px] font-bold uppercase leading-relaxed mt-1", config?.appTheme === 'MIDNIGHT_MAROON' ? "text-rose-300" : "text-slate-400")}>
                        High-luxury deep dark red/maroon theme for the ultimate noctural elite.
                      </p>
                    </div>

                    {/* Magenta Frenzy Option */}
                    <div 
                      onClick={() => {
                        if (!firestore || !configRef) return;
                        updateDoc(configRef, { appTheme: 'MAGENTA_FRENZY', updatedAt: serverTimestamp() })
                          .then(() => toast({ title: "Magenta Frenzy Synchronized 🎆" }));
                      }}
                      className={cn(
                        "group cursor-pointer p-6 rounded-3xl border-2 transition-all active:scale-95",
                        config?.appTheme === 'MAGENTA_FRENZY'
                          ? "border-fuchsia-500 bg-fuchsia-50 shadow-lg" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-fuchsia-100 flex items-center justify-center text-fuchsia-600">
                          <Wand2 className="h-5 w-5" />
                        </div>
                        {config?.appTheme === 'MAGENTA_FRENZY' && (
                          <div className="bg-fuchsia-600 text-white rounded-full p-1 shadow-md">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 uppercase">Magenta Frenzy</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed mt-1">
                        High-intensity neon pink and fuchsia gradients for maximum pop.
                      </p>
                    </div>

                    {/* Ocean Violet Option */}
                    <div 
                      onClick={() => {
                        if (!firestore || !configRef) return;
                        updateDoc(configRef, { appTheme: 'OCEAN_VIOLET', updatedAt: serverTimestamp() })
                          .then(() => toast({ title: "Ocean Violet Synchronized 🌊" }));
                      }}
                      className={cn(
                        "group cursor-pointer p-6 rounded-3xl border-2 transition-all active:scale-95",
                        config?.appTheme === 'OCEAN_VIOLET'
                          ? "border-indigo-500 bg-indigo-50 shadow-lg" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <Waves className="h-5 w-5" />
                        </div>
                        {config?.appTheme === 'OCEAN_VIOLET' && (
                          <div className="bg-indigo-600 text-white rounded-full p-1 shadow-md">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 uppercase">Ocean Violet</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed mt-1">
                        Deep indigo and violet tones with a clean, airy background layout.
                      </p>
                    </div>

                    {/* Sky Lavender Option */}
                    <div 
                      onClick={() => {
                        if (!firestore || !configRef) return;
                        updateDoc(configRef, { appTheme: 'SKY_LAVENDER', updatedAt: serverTimestamp() })
                          .then(() => toast({ title: "Sky Lavender Synchronized ☁️" }));
                      }}
                      className={cn(
                        "group cursor-pointer p-6 rounded-3xl border-2 transition-all active:scale-95",
                        config?.appTheme === 'SKY_LAVENDER'
                          ? "border-purple-300 bg-purple-50 shadow-lg" 
                          : "border-slate-100 bg-slate-50 hover:border-slate-200"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-400">
                          <Cloud className="h-5 w-5" />
                        </div>
                        {config?.appTheme === 'SKY_LAVENDER' && (
                          <div className="bg-purple-400 text-white rounded-full p-1 shadow-md">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 uppercase">Sky Lavender</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed mt-1">
                        Soft airy lavender and pink tones for a gentle, calming experience.
                      </p>
                    </div>

                    {/* Glossy Modern Option */}
                    <div 
                      onClick={() => {
                        if (!firestore || !configRef) return;
                        updateDoc(configRef, { appTheme: 'GLOSSY', updatedAt: serverTimestamp() })
                          .then(() => toast({ title: "Glossy White Synchronized 💎" }));
                      }}
                      className={cn(
                        "group cursor-pointer p-6 rounded-3xl border-2 transition-all active:scale-95",
                        config?.appTheme === 'GLOSSY'
                          ? "border-slate-900 bg-slate-900 shadow-xl shadow-slate-200" 
                          : "border-slate-100 bg-white hover:border-slate-300 shadow-sm"
                      )}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                          config?.appTheme === 'GLOSSY' ? "bg-white text-slate-900" : "bg-slate-100 text-slate-400"
                        )}>
                          <Monitor className="h-5 w-5" />
                        </div>
                        {config?.appTheme === 'GLOSSY' && (
                          <div className="bg-white text-slate-900 rounded-full p-1 shadow-md">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <h3 className={cn("font-bold uppercase transition-colors", config?.appTheme === 'GLOSSY' ? "text-white" : "text-slate-900")}>Glossy Modern</h3>
                      <p className={cn("text-[10px] font-bold uppercase leading-relaxed mt-1 transition-colors", config?.appTheme === 'GLOSSY' ? "text-slate-400" : "text-slate-400")}>
                        Ultra-premium white/slate design system with glassmorphic depth and modern typography.
                      </p>
                    </div>
                  </div>

                  <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-100 flex gap-4">
                    <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0" />
                    <p className="text-xs font-bold text-amber-700 leading-relaxed uppercase">
                      Changing this setting will affect ALL users currently inside the application in real-time. This is a global synchronization event.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="authority" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-primary">
                    <Zap className="h-6 w-6" /> Authority Hub
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  <div className="flex flex-col gap-4">
                    <SearchToggle
                      mode={tagSearchMode}
                      setMode={setTagSearchMode}
                    />
                    <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Asset Identity</label>
                      <Input
                        placeholder="Enter Asset Name (e.g. Royal Dragon Frame)"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="bg-slate-50 border-2 border-slate-100 rounded-2xl h-14 focus:border-primary transition-all text-sm font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                          <GoldCoinIcon className="h-3 w-3" /> Price (Coins)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g. 500"
                          value={storePrice}
                          onChange={(e) => setStorePrice(e.target.value)}
                          className="bg-slate-50 border-2 border-slate-100 rounded-2xl h-14 focus:border-primary transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Duration (Days)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g. 7"
                          value={storeDuration}
                          onChange={(e) => setStoreDuration(e.target.value)}
                          className="bg-slate-50 border-2 border-slate-100 rounded-2xl h-14 focus:border-primary transition-all font-bold"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Store Category</label>
                      <Select
                        value={storeCategory}
                        onValueChange={(v: any) => setStoreCategory(v)}
                      >
                        <SelectTrigger className="bg-slate-50 border-2 border-slate-100 rounded-2xl h-14 font-bold">
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-2">
                          <SelectItem value="Frame" className="font-bold">Avatar Frame</SelectItem>
                          <SelectItem value="Bubble" className="font-bold">Chat Bubble</SelectItem>
                          <SelectItem value="Theme" className="font-bold">Room Theme</SelectItem>
                          <SelectItem value="Wave" className="font-bold">Voice Wave</SelectItem>
                          <SelectItem value="Entry" className="font-bold">Room Entry (Video)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    </div>
                    <div className="flex gap-4">
                      <Input
                        placeholder="Enter member signature..."
                        className="h-14 rounded-2xl border-2"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSearchUsers()
                        }
                      />
                      <Button
                        onClick={handleSearchUsers}
                        className="h-14 px-8 rounded-2xl bg-black text-white"
                        disabled={isSearching}
                      >
                        {isSearching ? (
                          <Loader className="animate-spin" />
                        ) : (
                          "Find"
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {foundUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex flex-col gap-4 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                            <AvatarImage src={u.avatarUrl || undefined} />
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm uppercase text-slate-900 truncate">
                              {u.username}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">
                              ID: {u.accountNumber}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {AUTHORITY_ROLES.map((role) => (
                            <Button
                              key={role.id}
                              variant={
                                u.tags?.includes(role.id)
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                toggleUserRole(u.id, role.id, u.tags)
                              }
                              className="h-10 text-[8px] font-bold uppercase rounded-xl"
                            >
                              {role.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="member-directory" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl uppercase flex items-center gap-2 text-slate-900">
                      <Users className="h-6 w-6" /> Tribal Member Archive
                    </CardTitle>
                  </div>
                  <Button
                    onClick={handleSyncDirectory}
                    disabled={isSyncingDirectory}
                    className="bg-black h-12 rounded-xl"
                  >
                    {isSyncingDirectory ? (
                      <Loader className="animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}{" "}
                    Sync Directory
                  </Button>
                </CardHeader>
                <CardContent className="px-0">
                  <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-200">
                    {tribalMembers.length === 0 ? (
                      <div className="py-40 text-center opacity-20 ">
                        Awaiting Synchronized Directory...
                      </div>
                    ) : (
                      tribalMembers.map((member) => (
                        <div
                          key={member.id}
                          className="p-4 sm:p-6 flex flex-col xs:flex-row xs:items-center justify-between gap-4 hover:bg-slate-100/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                              <AvatarImage
                                src={member.avatarUrl || undefined}
                              />
                            </Avatar>
                            <div>
                              <p className="font-bold text-sm uppercase text-slate-900">
                                {member.username}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-slate-400">
                                  ID: {member.accountNumber}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1.5 justify-end text-blue-600 font-bold ">
                              <GoldCoinIcon className="h-4 w-4" />
                              {member.wallet?.coins.toLocaleString() || 0}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ranking-themes" className="m-0 space-y-6">
              <LeaderboardThemeAdmin />
            </TabsContent>

            <TabsContent value="user-records" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-rose-600">
                    <UserSearch className="h-6 w-6" /> User Ledger
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-8">
                  <div className="flex flex-col gap-4">
                    <SearchToggle
                      mode={recordSearchMode}
                      setMode={setRecordSearchMode}
                    />
                    <div className="flex gap-4">
                      <Input
                        placeholder={
                          recordSearchMode === "id"
                            ? "Enter ID..."
                            : "Enter Username..."
                        }
                        value={recordSearchId}
                        onChange={(e) => setRecordSearchId(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          handleGenericSearch(
                            recordSearchMode,
                            recordSearchId,
                            setTargetUserForRecord,
                            setIsSearchingRecord,
                          )
                        }
                        className="h-14 rounded-2xl border-2"
                      />
                      <Button
                        onClick={() =>
                          handleGenericSearch(
                            recordSearchMode,
                            recordSearchId,
                            setTargetUserForRecord,
                            setIsSearchingRecord,
                          )
                        }
                        className="h-14 px-8 rounded-2xl bg-black text-white font-bold uppercase "
                        disabled={isSearchingRecord}
                      >
                        Audit
                      </Button>
                    </div>
                  </div>
                  {targetUserForRecord && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
                      <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                            <AvatarImage
                              src={targetUserForRecord.avatarUrl || undefined}
                            />
                          </Avatar>
                          <div>
                            <h3 className="text-2xl font-bold uppercase text-slate-900">
                              {targetUserForRecord.username}
                            </h3>
                            <div className="flex flex-col gap-1 mt-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                Account: {targetUserForRecord.accountNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 bg-blue-50 rounded-3xl border-2 border-blue-100 space-y-2">
                          <div className="flex items-center gap-2 text-blue-600 mb-2">
                            <Wallet className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Wallet
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-2xl font-bold text-blue-900 ">
                            <GoldCoinIcon className="h-6 w-6" />
                            {targetUserForRecord.wallet?.coins.toLocaleString() ||
                              0}
                          </div>
                        </div>
                        <div className="p-6 bg-cyan-50 rounded-3xl border-2 border-cyan-100 space-y-2">
                          <div className="flex items-center gap-2 text-cyan-600 mb-2">
                            <Sparkles className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Diamonds
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-2xl font-bold text-cyan-900 ">
                            <Activity className="h-6 w-6" />
                            {targetUserForRecord.wallet?.diamonds.toLocaleString() ||
                              0}
                          </div>
                        </div>
                        <div className="p-6 bg-purple-50 rounded-3xl border-2 border-purple-100 space-y-2">
                          <div className="flex items-center gap-2 text-purple-600 mb-2">
                            <History className="h-4 w-4" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              Spend
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-2xl font-bold text-purple-900 ">
                            <BarChart3 className="h-6 w-6" />
                            {targetUserForRecord.wallet?.totalSpent.toLocaleString() ||
                              0}
                          </div>
                        </div>
                      </div>
                      <div className="p-8 bg-red-50 rounded-3xl border-2 border-red-100 flex flex-col items-center gap-6">
                        <h4 className="text-xl font-bold uppercase text-red-600">
                          Wallet Purge
                        </h4>
                        <Button
                          onClick={handleResetWallet}
                          disabled={isResettingWallet}
                          variant="destructive"
                          className="h-16 px-12 rounded-2xl font-bold uppercase text-lg shadow-xl shadow-red-500/20 active:scale-95 transition-all"
                        >
                          {isResettingWallet ? (
                            <Loader className="animate-spin mr-2" />
                          ) : (
                            <Trash2 className="h-6 w-6 mr-2" />
                          )}{" "}
                          Global Reset
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assign-center" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl p-4 sm:p-8 bg-white">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-slate-900">
                    <ShieldCheck className="h-6 w-6 text-indigo-500" /> Center
                    Management
                  </CardTitle>
                  <CardDescription>
                    Delegate Seller or Official Center authority to tribal
                    members.
                  </CardDescription>
                </CardHeader>
                <div className="flex flex-col gap-4">
                  <SearchToggle
                    mode={centerSearchMode}
                    setMode={setCenterSearchMode}
                  />
                  <div className="flex gap-4">
                    <Input
                      placeholder={
                        centerSearchMode === "id"
                          ? "Enter ID..."
                          : "Enter Username..."
                      }
                      value={centerSearchId}
                      onChange={(e) => setCenterSearchId(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        handleGenericSearch(
                          centerSearchMode,
                          centerSearchId,
                          setTargetUserForCenter,
                          setIsSearchingCenter,
                        )
                      }
                      className="h-14 rounded-2xl border-2"
                    />
                    <Button
                      onClick={() =>
                        handleGenericSearch(
                          centerSearchMode,
                          centerSearchId,
                          setTargetUserForCenter,
                          setIsSearchingCenter,
                        )
                      }
                      className="h-14 px-8 rounded-2xl bg-black text-white font-bold uppercase "
                      disabled={isSearchingCenter}
                    >
                      Find
                    </Button>
                  </div>
                </div>
                {targetUserForCenter && (
                  <div className="mt-10 p-8 border-2 rounded-3xl space-y-10 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-xl">
                          <AvatarImage
                            src={targetUserForCenter.avatarUrl || undefined}
                          />
                        </Avatar>
                        <div>
                          <p className="font-bold uppercase text-xl tracking-tight text-slate-900">
                            {targetUserForCenter.username}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Account: {targetUserForCenter.accountNumber}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {targetUserForCenter.tags?.some((t: string) =>
                          ["Seller", "Seller center", "Coin Seller"].includes(
                            t,
                          ),
                        ) && (
                          <Badge className="bg-orange-500 text-white font-bold uppercase text-[10px] py-1 px-3">
                            Seller
                          </Badge>
                        )}
                        {targetUserForCenter.tags?.some((t: string) =>
                          ["Official center", "Admin"].includes(t),
                        ) && (
                          <Badge className="bg-indigo-500 text-white font-bold uppercase text-[10px] py-1 px-3">
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-orange-500" />
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Seller Center
                          </h4>
                        </div>
                        <Button
                          onClick={handleToggleSellerCenter}
                          className={cn(
                            "w-full h-16 rounded-xl font-bold uppercase text-sm shadow-lg transition-all",
                            targetUserForCenter.tags?.some((t: string) =>
                              [
                                "Seller",
                                "Seller center",
                                "Coin Seller",
                              ].includes(t),
                            )
                              ? "bg-red-50 text-red-600 border-2 border-red-100"
                              : "bg-orange-500 text-white",
                          )}
                        >
                          {targetUserForCenter.tags?.some((t: string) =>
                            ["Seller", "Seller center", "Coin Seller"].includes(
                              t,
                            ),
                          ) ? (
                            <>
                              <UserX className="mr-2 h-5 w-5" /> Revoke Seller
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-5 w-5" /> Activate Seller
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-indigo-500" />
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Official Center (Admin)
                          </h4>
                        </div>
                        <Button
                          onClick={handleToggleOfficialCenter}
                          className={cn(
                            "w-full h-16 rounded-xl font-bold uppercase text-sm shadow-lg transition-all",
                            targetUserForCenter.tags?.some((t: string) =>
                              ["Official center", "Admin"].includes(t),
                            )
                              ? "bg-red-50 text-red-600 border-2 border-red-100"
                              : "bg-indigo-600 text-white",
                          )}
                        >
                          {targetUserForCenter.tags?.some((t: string) =>
                            ["Official center", "Admin"].includes(t),
                          ) ? (
                            <>
                              <Gavel className="mr-2 h-5 w-5" /> Revoke Admin
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="mr-2 h-5 w-5" /> Activate
                              Admin Portal
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="id-ban" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl p-4 sm:p-8 bg-white">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-red-600">
                    <Gavel className="h-6 w-6" /> ID Ban Protocol
                  </CardTitle>
                </CardHeader>
                <div className="flex flex-col gap-4">
                  <SearchToggle
                    mode={banSearchMode}
                    setMode={setBanSearchMode}
                  />
                  <div className="flex gap-4">
                    <Input
                      placeholder="Enter Target..."
                      value={banSearchId}
                      onChange={(e) => setBanSearchId(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        handleGenericSearch(
                          banSearchMode,
                          banSearchId,
                          setTargetUserForBan,
                          setIsSearchingBan,
                        )
                      }
                      className="h-14 rounded-2xl border-2"
                    />
                    <Button
                      onClick={() =>
                        handleGenericSearch(
                          banSearchMode,
                          banSearchId,
                          setTargetUserForBan,
                          setIsSearchingBan,
                        )
                      }
                      className="h-14 px-8 rounded-2xl bg-black text-white font-bold uppercase "
                      disabled={isSearchingBan}
                    >
                      Locate
                    </Button>
                  </div>
                </div>
                {targetUserForBan && (
                  <div className="mt-10 p-8 border-2 rounded-3xl space-y-8 animate-in slide-in-from-bottom-4 bg-slate-50/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-xl">
                          <AvatarImage
                            src={targetUserForBan.avatarUrl || undefined}
                          />
                        </Avatar>
                        <div>
                          <p className="font-bold uppercase text-xl tracking-tight text-slate-900">
                            {targetUserForBan.username}
                          </p>
                        </div>
                      </div>
                      <div>
                        {targetUserForBan.banStatus?.isBanned ? (
                          <Badge className="bg-red-600 text-white">
                            BANNED
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500 text-white">OK</Badge>
                        )}
                      </div>
                    </div>
                    {!targetUserForBan.banStatus?.isBanned ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-4 gap-4">
                          {[
                            { l: "Days", v: banDays, s: setBanDays },
                            { l: "Hrs", v: banHours, s: setBanHours },
                            { l: "Min", v: banMinutes, s: setBanMinutes },
                            { l: "Sec", v: banSeconds, s: setBanSeconds },
                          ].map((i) => (
                            <div key={i.l} className="space-y-1">
                              <p className="text-[8px] font-bold uppercase text-gray-400 text-center">
                                {i.l}
                              </p>
                              <Input
                                value={i.v}
                                onChange={(e) =>
                                  i.s(e.target.value.replace(/\D/g, ""))
                                }
                                className="h-12 rounded-xl text-center"
                              />
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={handleBanUser}
                          disabled={isBanning}
                          className="w-full h-16 rounded-xl bg-red-600 text-white font-bold uppercase text-xl shadow-xl"
                        >
                          Execute Ban
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={handleUnbanUser}
                        disabled={isBanning}
                        className="w-full h-16 rounded-xl bg-green-600 text-white font-bold uppercase text-xl shadow-xl"
                      >
                        Unban
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="banners" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl uppercase flex items-center gap-2 text-blue-600">
                      <ImageIcon className="h-6 w-6" /> Banners
                    </CardTitle>
                  </div>
                  <Button
                    onClick={handleAddBanner}
                    className="bg-primary text-black h-12 rounded-xl"
                  >
                    + Add Slot
                  </Button>
                </CardHeader>
                <CardContent className="px-0 space-y-8">
                  <div className="grid grid-cols-1 gap-8">
                    {(bannerConfig?.slides || DEFAULT_SLIDES).map(
                      (slide: any, idx: number) => (
                        <div
                          key={idx}
                          className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col md:flex-row gap-8"
                        >
                          <div className="w-72 h-40 relative rounded-2xl overflow-hidden bg-slate-200">
                            {slide.imageUrl && (
                              <Image
                                src={slide.imageUrl}
                                alt="Banner"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            )}
                            <button
                              onClick={() =>
                                bannerFileInputRefs.current[idx]?.click()
                              }
                              className="absolute bottom-3 right-3 bg-white p-2 rounded-full"
                            >
                              <Camera className="h-4 w-4" />
                            </button>
                            <input
                              type="file"
                              ref={(el) => {
                                bannerFileInputRefs.current[idx] = el;
                              }}
                              className="hidden"
                              onChange={(e) =>
                                e.target.files?.[0] &&
                                handleBannerImageUpload(idx, e.target.files[0])
                              }
                            />
                          </div>
                          <div className="flex-1 space-y-4">
                            <Input
                              value={slide.title}
                              onChange={(e) =>
                                handleUpdateBannerMeta(
                                  idx,
                                  "title",
                                  e.target.value,
                                )
                              }
                              className="h-12 rounded-xl"
                            />
                            <Input
                              placeholder="Redirect Link (e.g., /store or /rooms/abc)"
                              value={slide.link || ""}
                              onChange={(e) =>
                                handleUpdateBannerMeta(
                                  idx,
                                  "link",
                                  e.target.value,
                                )
                              }
                              className="h-12 rounded-xl"
                            />
                            <Button
                              variant="destructive"
                              onClick={() => handleRemoveBanner(idx)}
                              className="w-full"
                            >
                              Purge
                            </Button>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* ROOM BANNERS MANAGEMENT */}
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8 mt-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-indigo-600">
                    <Rocket className="h-6 w-6" /> Room Banners
                  </CardTitle>
                  <CardDescription>
                    Manage background images for vertical room features (Room Support, lucky spin, etc).
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(roomBannerConfig?.slides || [
                      { id: 'weekly-star', title: 'Weekly Star', imageUrl: '' },
                      { id: 'aristocracy', title: 'Merge Aristocracy', imageUrl: '' },
                      { id: 'room-support', title: 'Room Support', imageUrl: '' },
                      { id: 'golden-chest', title: 'Golden Chest', imageUrl: '' },
                      { id: 'lucky-spin', title: 'Lucky Spin', imageUrl: '' },
                    ]).map((slide: any, idx: number) => (
                      <div key={slide.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{slide.title}</span>
                          <Badge variant="outline" className="text-[8px] uppercase">{slide.id}</Badge>
                        </div>
                        <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-slate-200 border border-slate-200">
                          {slide.imageUrl ? (
                            <Image src={slide.imageUrl} alt={slide.title} fill className="object-cover" unoptimized />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                              <ImageIcon className="h-8 w-8" />
                            </div>
                          )}
                          {isUploadingRoomBanner === idx && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader className="animate-spin text-white h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={() => roomBannerFileInputRefs.current[idx]?.click()}
                          className="w-full bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 h-10 rounded-xl font-bold text-[10px] uppercase gap-2"
                        >
                          <Camera className="h-3.5 w-3.5" /> Change Background
                        </Button>
                        <input 
                          type="file" 
                          ref={el => { roomBannerFileInputRefs.current[idx] = el; }}
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleRoomBannerImageUpload(idx, e.target.files[0])}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="games" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-primary">
                    <Gamepad2 className="h-6 w-6" /> Game Sync
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {gamesList.map((game) => (
                    <Card
                      key={game.slug}
                      className="p-4 bg-slate-50 border-2 border-slate-100 rounded-3xl flex flex-col gap-4"
                    >
                      <div className="relative aspect-square rounded-2xl overflow-hidden">
                        {game.coverUrl && (
                          <Image
                            src={game.coverUrl}
                            alt={game.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                        <button
                          onClick={() => handleGameDPUploadClick(game)}
                          className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <Camera className="h-8 w-8 text-white" />
                        </button>
                      </div>
                      <p className="font-bold text-center uppercase text-sm">
                        {game.title}
                      </p>
                      <Button
                        onClick={() => handleGameBGUploadClick(game)}
                        size="sm"
                        className="rounded-xl"
                      >
                        Sync BG
                      </Button>
                    </Card>
                  ))}
                </CardContent>
              </Card>
              <input
                type="file"
                ref={gameFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleGameDPFileChange}
              />
              <input
                type="file"
                ref={gameBGFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleGameBGFileChange}
              />
            </TabsContent>

            <TabsContent value="broadcaster" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-slate-900">
                    <Megaphone className="h-6 w-6" /> Broadcaster
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  <div className="space-y-4">
                    <Input
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="h-14 rounded-2xl"
                    />
                    <Textarea
                      placeholder="Type broadcast..."
                      value={broadcastContent}
                      onChange={(e) => setBroadcastContent(e.target.value)}
                      className="h-40 rounded-3xl"
                    />
                  </div>
                  <Button
                    onClick={handleSystemBroadcast}
                    disabled={isBroadcasting || !broadcastContent.trim()}
                    className="w-full h-16 rounded-xl"
                  >
                    Synchronize Broadcast
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="direct-messenger" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl p-4 sm:p-8 bg-white">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-indigo-500">
                    <MessageSquareText className="h-6 w-6" /> Direct Messenger
                  </CardTitle>
                </CardHeader>
                <div className="flex flex-col gap-4">
                  <SearchToggle mode={dmSearchMode} setMode={setDmSearchMode} />
                  <div className="flex gap-4">
                    <Input
                      placeholder="Recipient..."
                      value={dmSearchId}
                      onChange={(e) => setDmSearchId(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        handleGenericSearch(
                          dmSearchMode,
                          dmSearchId,
                          setTargetUserForDm,
                          setIsSearchingDm,
                        )
                      }
                      className="h-14 rounded-2xl"
                    />
                    <Button
                      onClick={() =>
                        handleGenericSearch(
                          dmSearchMode,
                          dmSearchId,
                          setTargetUserForDm,
                          setIsSearchingDm,
                        )
                      }
                      className="h-14 px-8 rounded-2xl"
                      disabled={isSearchingDm}
                    >
                      Find
                    </Button>
                  </div>
                </div>
                {targetUserForDm && (
                  <div className="mt-10 p-8 border-2 rounded-3xl space-y-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={targetUserForDm.avatarUrl || undefined}
                        />
                      </Avatar>
                      <p className="font-bold uppercase text-xl">
                        {targetUserForDm.username}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <Input
                        value={dmTitle}
                        onChange={(e) => setDmTitle(e.target.value)}
                        className="h-14 rounded-2xl"
                      />
                      <Textarea
                        placeholder="Private msg..."
                        value={dmContent}
                        onChange={(e) => setDmContent(e.target.value)}
                        className="h-40 rounded-3xl"
                      />
                    </div>
                    <Button
                      onClick={handleDirectMessage}
                      disabled={isSendingDm || !dmContent.trim()}
                      className="w-full h-16 rounded-xl"
                    >
                      Send Sync
                    </Button>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="tags" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl p-4 sm:p-8 bg-white">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-slate-900">
                    <BadgeCheck className="h-6 w-6" /> Assign Tags
                  </CardTitle>
                </CardHeader>
                <div className="flex flex-col gap-4">
                  <SearchToggle
                    mode={tagSearchMode}
                    setMode={setTagSearchMode}
                  />
                  <div className="flex gap-4">
                    <Input
                      placeholder="Target..."
                      value={tagSearchId}
                      onChange={(e) => setTagSearchId(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        handleGenericSearch(
                          tagSearchMode,
                          tagSearchId,
                          setTargetUserForTags,
                          setIsSearchingTag,
                        )
                      }
                      className="h-14 rounded-2xl"
                    />
                    <Button
                      onClick={() =>
                        handleGenericSearch(
                          tagSearchMode,
                          tagSearchId,
                          setTargetUserForTags,
                          setIsSearchingTag,
                        )
                      }
                      className="h-14 px-8 rounded-2xl"
                      disabled={isSearchingTag}
                    >
                      Locate
                    </Button>
                  </div>
                </div>
                {targetUserForTags && (
                  <div className="mt-10 p-6 border-2 rounded-2xl flex flex-col gap-8">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={targetUserForTags.avatarUrl || undefined}
                        />
                      </Avatar>
                      <p className="font-bold text-xl">
                        {targetUserForTags.username}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {ELITE_TAGS.map((tag) => (
                        <Button
                          key={tag.id}
                          variant={
                            targetUserForTags.tags?.includes(tag.id)
                              ? "default"
                              : "outline"
                          }
                          className="h-12 rounded-xl"
                          onClick={() =>
                            toggleUserRole(
                              targetUserForTags.id,
                              tag.id,
                              targetUserForTags.tags,
                            )
                          }
                        >
                          {tag.label}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => handleRemoveAllTags(targetUserForTags.id)}
                      className="text-red-500 text-[10px]"
                    >
                      Purge All Tags
                    </Button>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="rewards" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl p-4 sm:p-8 bg-white">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-slate-900">
                    <Gift className="h-6 w-6" /> Rewards
                  </CardTitle>
                </CardHeader>
                <div className="flex flex-col gap-4">
                  <SearchToggle
                    mode={rewardSearchMode}
                    setMode={setRewardSearchMode}
                  />
                  <div className="flex gap-4">
                    <Input
                      placeholder="Recipient..."
                      value={rewardSearchId}
                      onChange={(e) => setRewardSearchId(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        handleGenericSearch(
                          rewardSearchMode,
                          rewardSearchId,
                          setTargetUserForRewards,
                          setIsSearchingRewards,
                        )
                      }
                      className="h-14 rounded-2xl"
                    />
                    <Button
                      onClick={() =>
                        handleGenericSearch(
                          rewardSearchMode,
                          rewardSearchId,
                          setTargetUserForRewards,
                          setIsSearchingRewards,
                        )
                      }
                      className="h-14 px-8 rounded-2xl"
                    >
                      Find
                    </Button>
                  </div>
                </div>
                {targetUserForRewards && (
                  <div className="mt-10 p-8 border-2 rounded-3xl space-y-10">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage
                          src={targetUserForRewards.avatarUrl || undefined}
                        />
                      </Avatar>
                      <p className="font-bold text-xl">
                        {targetUserForRewards.username}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <h4>Coin Dispatch</h4>
                        <div className="flex flex-col gap-4">
                          <Input
                            placeholder="Amount (e.g. 10000)"
                            value={coinDispatchAmount}
                            onChange={(e) =>
                              setCoinDispatchAmount(
                                e.target.value.replace(/\D/g, ""),
                              )
                            }
                            className="h-14"
                          />
                          <Button
                            onClick={handleDispatchCoins}
                            disabled={isDispatching}
                            className="h-14 w-full bg-primary text-black font-black uppercase"
                          >
                            {isDispatching ? <Loader className="animate-spin" /> : <><Send className="mr-2 h-4 w-4" /> Dispatch Coins</>}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4>Elite Assets</h4>
                        <div className="flex flex-wrap gap-2">
                          {DISPATCH_ASSETS.frames.map((frame) => (
                            <Button
                              key={frame.id}
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDispatchItem(frame.id, "ownedItems")
                              }
                              className="text-[8px]"
                            >
                              {frame.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4>Send Asset</h4>
                      <div className="flex flex-col gap-4">
                        <Input
                          placeholder="Asset name or id..."
                          value={grantAssetInput}
                          onChange={(e) => setGrantAssetInput(e.target.value)}
                          className="h-14"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          {[3, 7, 15, 30].map((d) => (
                            <Button
                              key={d}
                              type="button"
                              variant={grantDaysInput === String(d) ? "default" : "outline"}
                              size="sm"
                              onClick={() => setGrantDaysInput(String(d))}
                              className="text-[10px] font-bold uppercase"
                            >
                              {d} Days
                            </Button>
                          ))}
                          <Input
                            placeholder="Custom"
                            value={grantDaysInput}
                            onChange={(e) => setGrantDaysInput(e.target.value.replace(/\D/g, ""))}
                            className="h-10 w-24"
                          />
                        </div>
                        <Button
                          onClick={handleGrantAssetToUser}
                          disabled={isGrantingAsset}
                          className="h-14 w-full bg-black text-white font-black uppercase"
                        >
                          {isGrantingAsset ? <Loader className="animate-spin" /> : <>Send to Bag</>}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="splash-screen" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-primary">
                    <Monitor className="h-6 w-6" /> Splash Screen & Global Logo
                  </CardTitle>
                  <CardDescription>
                    Manage the app's first visual frequency and global brand
                    signature.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-10">
                  {/* Global Logo Sync Section */}
                  <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" />
                        <span className="font-bold uppercase text-sm text-slate-900">
                          Global Brand Signature (Logo)
                        </span>
                      </div>
                      {config?.customLogoUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[8px] font-bold uppercase text-red-500"
                          onClick={() =>
                            updateDoc(configRef!, { customLogoUrl: null })
                          }
                        >
                          Reset to Default
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-8">
                      <div className="relative h-24 w-32 rounded-3xl bg-white shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
                        <Image
                          src={
                            config?.customLogoUrl ||
                            "https://storage.googleapis.com/fetch-and-generate-images/ummy-logo-v3.png"
                          }
                          alt="Current Logo"
                          fill
                          className="object-contain p-2"
                          unoptimized
                        />
                        {isUploadingLogo && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader className="animate-spin text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-4 text-center md:text-left">
                        <p className="text-xs font-body text-slate-500">
                          Upload a high-fidelity PNG or JPG to synchronize the
                          brand identity across all application dimensions in
                          real-time.
                        </p>
                        <Button
                          onClick={() => logoFileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                          className="h-12 rounded-xl bg-primary text-black font-bold uppercase shadow-lg shadow-primary/20"
                        >
                          {isUploadingLogo ? (
                            <Loader className="animate-spin mr-2" />
                          ) : (
                            <Upload className="h-4 w-4 mr-2" />
                          )}
                          Upload Global Logo
                        </Button>
                        <input
                          type="file"
                          ref={logoFileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            handleLogoUpload(e.target.files[0])
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 space-y-4">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-primary" />
                      <span className="font-bold uppercase text-sm text-slate-900">
                        Splash Background Sync
                      </span>
                    </div>
                    <div className="relative aspect-[9/16] max-w-[300px] mx-auto rounded-3xl overflow-hidden bg-slate-900 border-2 border-white flex items-center justify-center">
                      {config?.splashScreenUrl ? (
                        <Image
                          src={config.splashScreenUrl}
                          fill
                          className="object-cover"
                          alt="Splash"
                          unoptimized
                        />
                      ) : (
                        <div className="text-white/20">Stars Active</div>
                      )}
                      {isUploadingSplashBG && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader className="animate-spin" />
                        </div>
                      )}
                      <button
                        onClick={() => splashBGFileInputRef.current?.click()}
                        className="absolute bottom-4 right-4 bg-white p-3 rounded-full shadow-xl text-primary"
                      >
                        <Camera className="h-6 w-6" />
                      </button>
                    </div>
                    <input
                      type="file"
                      ref={splashBGFileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleSplashBGUpload(e.target.files[0])
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="sovereign-ids" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl bg-white p-4 sm:p-8">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-indigo-600">
                    <Crown className="h-6 w-6" /> Sovereign ID Management
                  </CardTitle>
                </CardHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                    <Button
                      size="sm"
                      variant={sovereignSearchMode === "id" ? "default" : "ghost"}
                      onClick={() => setSovereignSearchMode("id")}
                      className="text-[10px] font-bold uppercase px-6 h-10 rounded-xl"
                    >
                      Search ID
                    </Button>
                    <Button
                      size="sm"
                      variant={sovereignSearchMode === "name" ? "default" : "ghost"}
                      onClick={() => setSovereignSearchMode("name")}
                      className="text-[10px] font-bold uppercase px-6 h-10 rounded-xl"
                    >
                      Search Name
                    </Button>
                  </div>
                  <div className="flex gap-4">
                    <Input
                      placeholder={
                        sovereignSearchMode === "id"
                          ? "Enter Account Number (e.g. 1001)"
                          : "Enter Username..."
                      }
                      value={sovereignSearchId}
                      onChange={(e) => setSovereignSearchId(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSovereignSearch()
                      }
                      className="h-14 rounded-2xl border-2"
                    />
                    <Button
                      onClick={handleSovereignSearch}
                      className="h-14 px-8 rounded-2xl bg-black text-white font-bold uppercase "
                      disabled={isSearchingSovereign}
                    >
                      Find
                    </Button>
                  </div>
                </div>

                {targetUserForSovereign && (
                  <div className="mt-10 p-10 border-2 border-indigo-100 rounded-[2.5rem] space-y-10 animate-in slide-in-from-bottom-4 bg-indigo-50/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-100 gap-4 pb-8">
                      <div className="flex items-center gap-5">
                        <Avatar className="h-20 w-20 border-4 border-white shadow-2xl">
                          <AvatarImage
                            src={targetUserForSovereign.avatarUrl || undefined}
                          />
                        </Avatar>
                        <div>
                          <p className="font-black uppercase text-2xl tracking-tighter text-slate-900">
                            {targetUserForSovereign.username}
                          </p>
                          <div className="flex gap-2">
                            <Badge className="bg-slate-200 text-slate-500 font-bold uppercase text-[9px]">
                              Current ID: {targetUserForSovereign.accountNumber}
                            </Badge>
                            {targetUserForSovereign.isAdmin && (
                              <Badge className="bg-indigo-600 text-white font-bold uppercase text-[9px]">
                                Administrator
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">
                            New Sovereign Number
                          </label>
                          <Input
                            placeholder="Enter Permanent ID (e.g. 007)"
                            value={newSovereignId}
                            onChange={(e) => setNewSovereignId(e.target.value)}
                            className="h-14 rounded-2xl border-2 border-indigo-50 bg-white focus:border-indigo-400 font-bold text-lg"
                          />
                          <p className="text-[8px] font-bold text-slate-400 uppercase ml-1">
                            Warning: This override is permanent.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">
                            Identity Color Signature
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                               { id: "none", label: "None (Silver)", color: "bg-slate-100 text-slate-400" },
                               { id: "gold", label: "Gold", color: "bg-amber-400 text-white" },
                               { id: "rose", label: "Rose (Red)", color: "bg-rose-500 text-white" },
                               { id: "diamond", label: "Diamond (Blue)", color: "bg-cyan-500 text-white" },
                               { id: "purple", label: "Purple", color: "bg-purple-600 text-white" },
                               { id: "emerald", label: "Emerald (Green)", color: "bg-emerald-500 text-white" },
                            ].map((c) => (
                              <button
                                key={c.id}
                                onClick={() => setSelectedIdColor(c.id as any)}
                                className={cn(
                                  "h-12 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm",
                                  c.color,
                                  selectedIdColor === c.id
                                    ? "ring-2 ring-indigo-500 ring-offset-2 scale-105"
                                    : "opacity-60 hover:opacity-100",
                                )}
                              >
                                {c.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border-2 border-indigo-50 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-bold uppercase text-xs text-slate-800">
                                Delegation of Authority
                              </p>
                              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">
                                Grant administrative portal access
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={isSovereignAdmin ? "default" : "outline"}
                              onClick={() => setIsSovereignAdmin((prev) => !prev)}
                              className={cn(
                                "h-10 px-6 rounded-xl font-bold uppercase text-[9px]",
                                isSovereignAdmin ? "bg-indigo-600 text-white shadow-md border-none" : "text-slate-400 bg-white",
                              )}
                            >
                              {isSovereignAdmin ? "Active" : "Disabled"}
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="font-bold uppercase text-xs text-slate-800">
                                Special Budget ID
                              </p>
                              <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight">
                                Visual badge for official budget accounts
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={isSovereignBudget ? "default" : "outline"}
                              onClick={() => setIsSovereignBudget((prev) => !prev)}
                              className={cn(
                                "h-10 px-6 rounded-xl font-bold uppercase text-[9px] transition-all",
                                isSovereignBudget ? "bg-amber-500 hover:bg-amber-600 border-none text-white shadow-lg" : "text-slate-400 bg-white",
                              )}
                            >
                              {isSovereignBudget ? "Active" : "Disabled"}
                            </Button>
                          </div>
                        </div>

                        <Button
                          onClick={handleUpdateSovereignIdentity}
                          disabled={isUpdatingSovereign}
                          className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-lg shadow-xl shadow-indigo-200 transition-all active:scale-95 flex gap-3"
                        >
                          {isUpdatingSovereign ? (
                            <Loader className="animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-6 w-6" /> Save Sovereign Profile
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent
              value="system"
            className="mt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2"
          >
            <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white/95">
              <CardHeader className="p-8 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
                      <RefreshCcw className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl uppercase tracking-tighter text-slate-900">
                        Global Identity Sync
                      </CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Re-index all User and Room IDs sequentially
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={handleGlobalIdentitySync}
                    disabled={isSyncingIDs}
                    className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-slate-900/20"
                  >
                    {isSyncingIDs ? (
                      <Loader className="animate-spin h-5 w-5" />
                    ) : (
                      "Start Global Sync"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="bg-amber-50 rounded-2xl p-4 sm:p-6 border border-amber-100 flex flex-col xs:flex-row gap-4">
                  <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase text-amber-900 tracking-tight">
                      Warning: Irreversible Action
                    </p>
                    <p className="text-[10px] font-bold text-amber-700 leading-relaxed uppercase opacity-80">
                      This will re-allot IDs for EVERY user and room that does
                      not follow the new 4-digit/100+ standard. Ensure the
                      counters are correctly initialized before starting.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white/95">
              <CardHeader className="p-8 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-red-600 flex items-center justify-center text-white shadow-lg">
                      <GoldCoinIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl uppercase tracking-tighter text-slate-900">
                        Economy Purge & Sync
                      </CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Wipe all coins and re-credit from manual recharges
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={handleGlobalEconomyReset}
                    disabled={isResettingEconomy}
                    variant="destructive"
                    className="h-14 px-8 rounded-2xl font-bold uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-red-900/20"
                  >
                    {isResettingEconomy ? (
                      <Loader className="animate-spin h-5 w-5" />
                    ) : (
                      "Execute Economy Reset"
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <div className="bg-red-50 rounded-2xl p-4 sm:p-6 border border-red-100 flex flex-col xs:flex-row gap-4">
                  <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[11px] font-black uppercase text-red-900 tracking-tight">
                      Financial Reset Protocol
                    </p>
                    <p className="text-[10px] font-bold text-red-700 leading-relaxed uppercase opacity-80">
                      This will reset EVERY user's current coin balance to 0,
                      then scan the "Recharge Requests" database and give back
                      coins (plus bonuses) ONLY for APPROVED manual recharges
                      made from today (March 25, 2026) onwards.
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={handleGlobalDiamondReset}
                    disabled={isResettingEconomy}
                    variant="destructive"
                    className="h-14 rounded-2xl font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-900/20"
                  >
                    {isResettingEconomy ? (
                      <Loader className="animate-spin h-5 w-5" />
                    ) : (
                      "Execute Diamond Purge"
                    )}
                  </Button>
                  <Button
                    onClick={handleClearRechargeHistory}
                    disabled={isResettingEconomy}
                    variant="outline"
                    className="h-14 rounded-2xl font-bold uppercase tracking-widest border-2 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Wipe Test Records
                  </Button>
                </div>
              </CardContent>
            </Card>
            </TabsContent>
            <TabsContent value="moderation-reports">
               <ReportsManager firestore={firestore} isAuthorized={isAuthorized} />
            </TabsContent>

            {/* LEVEL MANAGEMENT TAB */}
            <TabsContent value="level-management" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl p-4 sm:p-8 bg-white">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-cyan-600">
                    <Trophy className="h-6 w-6" /> Level Management
                  </CardTitle>
                  <CardDescription>Configure level budgets, rewards, and frames with custom images.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  <Tabs value={levelTab} onValueChange={setLevelTab}>
                    <TabsList className="grid w-full grid-cols-3 h-12 rounded-2xl">
                      <TabsTrigger value="budget" className="rounded-xl font-bold uppercase text-xs">Budget</TabsTrigger>
                      <TabsTrigger value="rewards" className="rounded-xl font-bold uppercase text-xs">Rewards</TabsTrigger>
                      <TabsTrigger value="frame" className="rounded-xl font-bold uppercase text-xs">Frame</TabsTrigger>
                    </TabsList>

                    <TabsContent value="budget" className="mt-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-cyan-400">Level Name</Label>
                          <Input value={levelName} onChange={e => setLevelName(e.target.value)} placeholder="e.g. Bronze Tier" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-cyan-400">Level Range</Label>
                          <Input value={levelRange} onChange={e => setLevelRange(e.target.value)} placeholder="e.g. Lv.0 - Lv.10" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-cyan-400">Budget Value</Label>
                          <Input value={levelBudget} onChange={e => setLevelBudget(e.target.value)} placeholder="e.g. 5000" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Level Badge Image</Label>
                          <div className="flex items-center gap-4">
                            <input type="file" accept="image/*" ref={budgetLevelImageInputRef} className="hidden" onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) { setLevelImageFile(f); setLevelImagePreview(URL.createObjectURL(f)); }
                            }} />
                            <Button type="button" variant="outline" onClick={() => budgetLevelImageInputRef.current?.click()} className="h-12 rounded-xl">Select Image</Button>
                            {levelImagePreview && <img src={levelImagePreview} alt="Preview" className="h-12 w-12 rounded-xl object-cover border-2 border-cyan-200" />}
                          </div>
                        </div>
                      </div>
                      <Button onClick={handleLevelUpload} disabled={isUploadingLevel || !levelName.trim() || !levelRange.trim()} className="w-full h-14 rounded-xl font-bold uppercase tracking-widest bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-900/20">
                        {isUploadingLevel ? <Loader className="animate-spin h-5 w-5" /> : "Synchronize Level Budget"}
                      </Button>
                    </TabsContent>
 
                    <TabsContent value="rewards" className="mt-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-cyan-400">Level Name</Label>
                          <Input value={levelName} onChange={e => setLevelName(e.target.value)} placeholder="e.g. Gold Tier" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-cyan-400">Level Range</Label>
                          <Input value={levelRange} onChange={e => setLevelRange(e.target.value)} placeholder="e.g. Lv.20 - Lv.35" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-cyan-400">Reward Description</Label>
                          <Input value={levelReward} onChange={e => setLevelReward(e.target.value)} placeholder="e.g. 2x EXP Boost" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Reward Icon</Label>
                          <div className="flex items-center gap-4">
                            <input type="file" accept="image/*" ref={rewardsLevelImageInputRef} className="hidden" onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) { setLevelImageFile(f); setLevelImagePreview(URL.createObjectURL(f)); }
                            }} />
                            <Button type="button" variant="outline" onClick={() => rewardsLevelImageInputRef.current?.click()} className="h-12 rounded-xl">Select Image</Button>
                            {levelImagePreview && <img src={levelImagePreview} alt="Preview" className="h-12 w-12 rounded-xl object-cover border-2 border-cyan-200" />}
                          </div>
                        </div>
                      </div>
                      <Button onClick={handleLevelUpload} disabled={isUploadingLevel || !levelName.trim() || !levelRange.trim()} className="w-full h-14 rounded-xl font-bold uppercase tracking-widest bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-900/20">
                        {isUploadingLevel ? <Loader className="animate-spin h-5 w-5" /> : "Synchronize Level Reward"}
                      </Button>
                    </TabsContent>
 
                    <TabsContent value="frame" className="mt-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-cyan-400">Level Name</Label>
                          <Input value={levelName} onChange={e => setLevelName(e.target.value)} placeholder="e.g. Platinum Frame" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-cyan-400">Level Range</Label>
                          <Input value={levelRange} onChange={e => setLevelRange(e.target.value)} placeholder="e.g. Lv.50 - Lv.75" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-cyan-400">Frame ID</Label>
                          <Input value={levelFrameId} onChange={e => setLevelFrameId(e.target.value)} placeholder="e.g. frame_platinum" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Frame Preview</Label>
                          <div className="flex items-center gap-4">
                            <input type="file" accept="image/*" ref={frameLevelImageInputRef} className="hidden" onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) { setLevelImageFile(f); setLevelImagePreview(URL.createObjectURL(f)); }
                            }} />
                            <Button type="button" variant="outline" onClick={() => frameLevelImageInputRef.current?.click()} className="h-12 rounded-xl">Select Image</Button>
                            {levelImagePreview && <img src={levelImagePreview} alt="Preview" className="h-12 w-12 rounded-xl object-cover border-2 border-cyan-200" />}
                          </div>
                        </div>
                      </div>
                      <Button onClick={handleLevelUpload} disabled={isUploadingLevel || !levelName.trim() || !levelRange.trim()} className="w-full h-14 rounded-xl font-bold uppercase tracking-widest bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-900/20">
                        {isUploadingLevel ? <Loader className="animate-spin h-5 w-5" /> : "Synchronize Level Frame"}
                      </Button>
                    </TabsContent>
                  </Tabs>

                  {/* Existing Levels List */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Existing Levels</h3>
                    {isLoadingLevels ? (
                      <div className="flex justify-center py-8"><Loader className="h-6 w-6 animate-spin text-cyan-600" /></div>
                    ) : filteredLevelsList && filteredLevelsList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredLevelsList.map((level: any) => (
                          <div key={level.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            {level.imageUrl ? (
                              <img src={level.imageUrl} alt={level.name} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center"><Trophy className="h-5 w-5 text-cyan-600" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{level.name}</p>
                              <p className="text-[10px] text-slate-500">{level.range || ""}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteLevel(level.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">No levels added yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* MEDAL MANAGEMENT TAB */}
            <TabsContent value="medal-management" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl p-4 sm:p-8 bg-white">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-amber-500">
                    <Award className="h-6 w-6" /> Medal Management
                  </CardTitle>
                  <CardDescription>Configure achievement, gift, and activity medals with custom images.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  <Tabs value={medalTab} onValueChange={setMedalTab}>
                    <TabsList className="grid w-full grid-cols-3 h-12 rounded-2xl">
                      <TabsTrigger value="achievement" className="rounded-xl font-bold uppercase text-xs">Achievement</TabsTrigger>
                      <TabsTrigger value="gift" className="rounded-xl font-bold uppercase text-xs">Gift</TabsTrigger>
                      <TabsTrigger value="activity" className="rounded-xl font-bold uppercase text-xs">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="achievement" className="mt-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-amber-400">Medal ID</Label>
                          <Input value={medalId} onChange={e => setMedalId(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="e.g. top-contributor" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-amber-400">Medal Name</Label>
                          <Input value={medalName} onChange={e => setMedalName(e.target.value)} placeholder="e.g. Top Contributor" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-[10px] font-bold uppercase text-amber-400">Description</Label>
                          <Textarea value={medalDescription} onChange={e => setMedalDescription(e.target.value)} placeholder="Awarded for outstanding contributions" className="h-24 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-amber-400">Tier</Label>
                          <Select value={medalTier} onValueChange={v => setMedalTier(v as any)}>
                            <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="common">Common</SelectItem>
                              <SelectItem value="rare">Rare</SelectItem>
                              <SelectItem value="epic">Epic</SelectItem>
                              <SelectItem value="legendary">Legendary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-amber-500">Medal Image</Label>
                          <div className="flex items-center gap-4">
                            <input type="file" accept="image/*" ref={achievementMedalImageInputRef} className="hidden" onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) { setMedalImageFile(f); setMedalImagePreview(URL.createObjectURL(f)); }
                            }} />
                            <Button type="button" variant="outline" onClick={() => achievementMedalImageInputRef.current?.click()} className="h-12 rounded-xl">Select Image</Button>
                            {medalImagePreview && <img src={medalImagePreview} alt="Preview" className="h-12 w-12 rounded-xl object-cover border-2 border-amber-200" />}
                          </div>
                        </div>
                      </div>
                      <Button onClick={handleMedalUpload} disabled={isUploadingMedal || !medalId.trim() || !medalName.trim()} className="w-full h-14 rounded-xl font-bold uppercase tracking-widest bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-900/20">
                        {isUploadingMedal ? <Loader className="animate-spin h-5 w-5" /> : "Synchronize Achievement Medal"}
                      </Button>
                    </TabsContent>
 
                    <TabsContent value="gift" className="mt-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-amber-400">Medal ID</Label>
                          <Input value={medalId} onChange={e => setMedalId(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="e.g. generous-giver" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-amber-400">Medal Name</Label>
                          <Input value={medalName} onChange={e => setMedalName(e.target.value)} placeholder="e.g. Generous Giver" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-[10px] font-bold uppercase text-amber-400">Description</Label>
                          <Textarea value={medalDescription} onChange={e => setMedalDescription(e.target.value)} placeholder="Awarded for top gifters" className="h-24 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-amber-400">Tier</Label>
                          <Select value={medalTier} onValueChange={v => setMedalTier(v as any)}>
                            <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="common">Common</SelectItem>
                              <SelectItem value="rare">Rare</SelectItem>
                              <SelectItem value="epic">Epic</SelectItem>
                              <SelectItem value="legendary">Legendary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-amber-500">Medal Image</Label>
                          <div className="flex items-center gap-4">
                            <input type="file" accept="image/*" ref={giftMedalImageInputRef} className="hidden" onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) { setMedalImageFile(f); setMedalImagePreview(URL.createObjectURL(f)); }
                            }} />
                            <Button type="button" variant="outline" onClick={() => giftMedalImageInputRef.current?.click()} className="h-12 rounded-xl">Select Image</Button>
                            {medalImagePreview && <img src={medalImagePreview} alt="Preview" className="h-12 w-12 rounded-xl object-cover border-2 border-amber-200" />}
                          </div>
                        </div>
                      </div>
                      <Button onClick={handleMedalUpload} disabled={isUploadingMedal || !medalId.trim() || !medalName.trim()} className="w-full h-14 rounded-xl font-bold uppercase tracking-widest bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-900/20">
                        {isUploadingMedal ? <Loader className="animate-spin h-5 w-5" /> : "Synchronize Gift Medal"}
                      </Button>
                    </TabsContent>
 
                    <TabsContent value="activity" className="mt-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-amber-400">Medal ID</Label>
                          <Input value={medalId} onChange={e => setMedalId(e.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="e.g. event-champion" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-amber-400">Medal Name</Label>
                          <Input value={medalName} onChange={e => setMedalName(e.target.value)} placeholder="e.g. Event Champion" className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-[10px] font-bold uppercase text-amber-400">Description</Label>
                          <Textarea value={medalDescription} onChange={e => setMedalDescription(e.target.value)} placeholder="Awarded for event participation" className="h-24 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase text-amber-400">Tier</Label>
                          <Select value={medalTier} onValueChange={v => setMedalTier(v as any)}>
                            <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="common">Common</SelectItem>
                              <SelectItem value="rare">Rare</SelectItem>
                              <SelectItem value="epic">Epic</SelectItem>
                              <SelectItem value="legendary">Legendary</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-amber-500">Medal Image</Label>
                          <div className="flex items-center gap-4">
                            <input type="file" accept="image/*" ref={activityMedalImageInputRef} className="hidden" onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) { setMedalImageFile(f); setMedalImagePreview(URL.createObjectURL(f)); }
                            }} />
                            <Button type="button" variant="outline" onClick={() => activityMedalImageInputRef.current?.click()} className="h-12 rounded-xl">Select Image</Button>
                            {medalImagePreview && <img src={medalImagePreview} alt="Preview" className="h-12 w-12 rounded-xl object-cover border-2 border-amber-200" />}
                          </div>
                        </div>
                      </div>
                      <Button onClick={handleMedalUpload} disabled={isUploadingMedal || !medalId.trim() || !medalName.trim()} className="w-full h-14 rounded-xl font-bold uppercase tracking-widest bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-900/20">
                        {isUploadingMedal ? <Loader className="animate-spin h-5 w-5" /> : "Synchronize Activity Medal"}
                      </Button>
                    </TabsContent>
                  </Tabs>

                  {/* Existing Medals List */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Existing Medals</h3>
                    {isLoadingMedals ? (
                      <div className="flex justify-center py-8"><Loader className="h-6 w-6 animate-spin text-amber-500" /></div>
                    ) : filteredMedalsList && filteredMedalsList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredMedalsList.map((medal: any) => (
                          <div key={medal.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            {medal.imageUrl ? (
                              <img src={medal.imageUrl} alt={medal.name} className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center"><Award className="h-5 w-5 text-amber-600" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{medal.name}</p>
                              <p className="text-[10px] text-slate-500 capitalize">{medal.category || ""} • {medal.tier || ""}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteMedal(medal.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">No medals added yet.</p>
                    )}
                  </div>

                  {/* Assign Medal to User */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Assign Medal to User</h3>
                    <div className="flex flex-col gap-4">
                      <SearchToggle mode={medalAssignSearchMode} setMode={setMedalAssignSearchMode} />
                      <div className="flex gap-4">
                        <Input
                          placeholder="Search user..."
                          value={medalAssignSearchId}
                          onChange={e => setMedalAssignSearchId(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleMedalUserSearch()}
                          className="h-12 rounded-xl"
                        />
                        <Button onClick={handleMedalUserSearch} disabled={isSearchingMedal} className="h-12 px-8 rounded-xl">
                          {isSearchingMedal ? <Loader className="animate-spin h-5 w-5" /> : "Find"}
                        </Button>
                      </div>

                      {targetUserForMedal && (
                        <div className="mt-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-6">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-14 w-14">
                              <AvatarImage src={targetUserForMedal.photoURL || targetUserForMedal.avatarUrl || undefined} />
                              <AvatarFallback>{targetUserForMedal.username?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-slate-800">{targetUserForMedal.username}</p>
                              <p className="text-xs text-slate-500">ID: {targetUserForMedal.accountNumber || targetUserForMedal.id}</p>
                            </div>
                          </div>

                          {/* Current Medals */}
                          <div>
                            <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Current Medals</p>
                            {userMedals.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {userMedals.map(mId => (
                                  <span key={mId} className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
                                    {mId}
                                    <button onClick={() => handleRemoveMedalFromUser(mId)} className="ml-1 text-amber-600 hover:text-red-600 transition-colors">
                                      <X className="h-3 w-3" />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400">No medals assigned.</p>
                            )}
                          </div>

                          {/* Assign New Medal */}
                          <div className="flex flex-col sm:flex-row gap-4">
                            <Select value={selectedMedalForAssign} onValueChange={setSelectedMedalForAssign}>
                              <SelectTrigger className="h-12 rounded-xl flex-1">
                                <SelectValue placeholder="Select a medal to assign" />
                              </SelectTrigger>
                              <SelectContent>
                                {medalsList?.map((m: any) => (
                                  <SelectItem key={m.id} value={m.id}>{m.name} ({m.category})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              onClick={handleAssignMedalToUser}
                              disabled={isAssigningMedal || !selectedMedalForAssign}
                              className="h-12 px-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wider"
                            >
                              {isAssigningMedal ? <Loader className="animate-spin h-5 w-5" /> : "Assign Medal"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emoji-management" className="m-0 space-y-6">
              <Card className="rounded-3xl border-none shadow-xl p-4 sm:p-8 bg-white">
                <CardHeader className="px-0">
                  <CardTitle className="text-2xl uppercase flex items-center gap-2 text-emerald-600">
                    <Smile className="h-6 w-6" /> Emoji Management
                  </CardTitle>
                  <CardDescription>Upload custom emojis with images, animations, and display time settings.</CardDescription>
                </CardHeader>
                <CardContent className="px-0 space-y-6">
                  {/* Upload Section */}
                  <div className="p-6 bg-emerald-50 rounded-3xl border-2 border-emerald-100 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-emerald-400">Emoji Name</Label>
                        <Input 
                          value={emojiName} 
                          onChange={e => setEmojiName(e.target.value)} 
                          placeholder="e.g. Heart Eyes" 
                          className="h-12 rounded-xl border-emerald-200 bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase text-emerald-400">Display Time (Seconds)</Label>
                        <Input 
                          type="number"
                          value={emojiDisplayTime} 
                          onChange={e => setEmojiDisplayTime(e.target.value)} 
                          placeholder="3" 
                          className="h-12 rounded-xl border-emerald-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Emoji Image (Static)</Label>
                        <div 
                          onClick={() => emojiImageInputRef.current?.click()}
                          role="button"
                          className="aspect-square border-2 border-dashed border-emerald-200 rounded-3xl flex flex-col items-center justify-center gap-3 bg-white hover:bg-emerald-100/30 cursor-pointer transition-all overflow-hidden relative block"
                        >
                          {emojiImagePreview ? (
                            <img src={emojiImagePreview} alt="Preview" className="h-full w-full object-contain p-4" />
                          ) : (
                            <>
                              <ImageIcon className="h-8 w-8 text-emerald-200" />
                              <span className="text-[10px] font-bold uppercase text-emerald-300">Select Image</span>
                            </>
                          )}
                          <input 
                            type="file" 
                            ref={emojiImageInputRef}
                            className="hidden"
                            accept="image/*" 
                            onClick={(e) => e.stopPropagation()}
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) {
                                setEmojiImageFile(f);
                                setEmojiImagePreview(URL.createObjectURL(f));
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Emoji Animation (Optional)</Label>
                        <div 
                          onClick={() => emojiAnimationInputRef.current?.click()}
                          role="button"
                          className="aspect-square border-2 border-dashed border-indigo-200 rounded-3xl flex flex-col items-center justify-center gap-3 bg-white hover:bg-indigo-50/50 cursor-pointer transition-all overflow-hidden relative block"
                        >
                          {emojiAnimationPreview ? (
                            <video src={emojiAnimationPreview} autoPlay muted loop className="h-full w-full object-contain" />
                          ) : (
                            <>
                              <Video className="h-8 w-8 text-indigo-200" />
                              <span className="text-[10px] font-bold uppercase text-indigo-300">Select Animation</span>
                            </>
                          )}
                          <input 
                            type="file" 
                            ref={emojiAnimationInputRef}
                            className="hidden"
                            accept="video/*,.gif" 
                            onClick={(e) => e.stopPropagation()}
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) {
                                setEmojiAnimationFile(f);
                                setEmojiAnimationPreview(URL.createObjectURL(f));
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleEmojiUpload}
                      disabled={isUploadingEmoji || !emojiName.trim() || (!emojiImageFile && !emojiAnimationFile)}
                      className="h-16 rounded-[1.5rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-lg shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                    >
                      {isUploadingEmoji ? (
                        <div className="flex items-center gap-3">
                          <Loader className="animate-spin h-6 w-6" />
                          <span>Syncing Emoji...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6" />
                          <span>Synchronize Emoji</span>
                        </div>
                      )}
                    </Button>
                  </div>

                  {/* Existing Emojis List */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Existing Emojis</h3>
                    {isLoadingEmojis ? (
                      <div className="flex justify-center py-8"><Loader className="h-6 w-6 animate-spin text-emerald-500" /></div>
                    ) : emojisList && emojisList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {emojisList.map((emoji: any) => (
                          <div key={emoji.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                            {emoji.imageUrl ? (
                              <img src={emoji.imageUrl} alt={emoji.name} className="h-10 w-10 rounded-lg object-cover" />
                            ) : emoji.animationUrl ? (
                              <video src={emoji.animationUrl} autoPlay muted loop className="h-10 w-10 rounded-lg object-cover" />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center"><Smile className="h-5 w-5 text-emerald-600" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{emoji.name}</p>
                              <p className="text-[10px] text-slate-500">{emoji.displayTime || 3}s display</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteEmoji(emoji.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">No emojis added yet.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppLayout>
  );
}
export default function AdminPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    }>
      <AdminPageContent />
    </Suspense>
  );
}
