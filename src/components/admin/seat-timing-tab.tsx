"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Clock, CalendarDays, History } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function SeatTimingTab() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchedUser, setSearchedUser] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !firestore) return;

    setIsLoading(true);
    setError(null);
    setSearchedUser(null);

    try {
      let userData = null;

      // Try searching by exact document ID first
      const userDocRef = doc(firestore, "users", searchQuery.trim());
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        userData = { id: userDocSnap.id, ...userDocSnap.data() };
      } else {
        // Try searching by accountNumber
        const usersRef = collection(firestore, "users");
        const accountQ = query(usersRef, where("accountNumber", "==", searchQuery.trim()));
        const accountSnapshot = await getDocs(accountQ);

        if (!accountSnapshot.empty) {
          const docSnap = accountSnapshot.docs[0];
          userData = { id: docSnap.id, ...docSnap.data() };
        } else {
          // Try searching by exact Username
          const usernameQ = query(usersRef, where("username", "==", searchQuery.trim()));
          const usernameSnapshot = await getDocs(usernameQ);

          if (!usernameSnapshot.empty) {
            const docSnap = usernameSnapshot.docs[0];
            userData = { id: docSnap.id, ...docSnap.data() };
          }
        }
      }

      if (userData) {
        setSearchedUser(userData);
      } else {
        setError("User not found. Please check the ID or Username.");
      }
    } catch (err: any) {
      console.error("Error searching user:", err);
      setError("An error occurred while searching.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatMinutes = (mins: number) => {
    if (!mins) return "0 mins";
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${remainingMins}m`;
  };

  // Sort dates from newest to oldest
  const seatTimeEntries = searchedUser?.seatTime 
    ? Object.entries(searchedUser.seatTime).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-white mb-1">Seat Timing Tracker</h3>
        <p className="text-sm text-gray-400">Search for a user to see how much time they have spent on room seats.</p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 max-w-lg">
        <Input
          placeholder="Enter User ID or Exact Username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="bg-slate-900/50 border-white/10 text-white"
        />
        <Button 
          onClick={handleSearch} 
          disabled={isLoading || !searchQuery.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Search
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Results Display */}
      {searchedUser && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Profile Card */}
          <Card className="bg-slate-900/50 border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-base">User Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center space-y-4">
              <Avatar className="w-24 h-24 border-4 border-indigo-500/30">
                <AvatarImage src={searchedUser.avatarUrl} />
                <AvatarFallback className="bg-slate-800 text-2xl text-white">
                  {(searchedUser.username || "U")[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="text-xl font-bold text-white">{searchedUser.username || "Unknown User"}</h4>
                <p className="text-xs text-gray-400 font-mono mt-1">ID: {searchedUser.id}</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Time Stats */}
          <Card className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-indigo-100 flex items-center gap-2 text-base">
                <Clock className="w-5 h-5 text-indigo-400" />
                Total Seat Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1 mt-4">
                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  {formatMinutes(searchedUser.totalSeatTime || 0)}
                </span>
                <span className="text-sm text-indigo-200/70">Lifetime duration on mic</span>
              </div>
            </CardContent>
          </Card>

          {/* Daily Breakdown */}
          <Card className="bg-slate-900/50 border-white/10 md:col-span-2 lg:col-span-1 flex flex-col">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <CalendarDays className="w-5 h-5 text-gray-400" />
                Daily Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar p-4 space-y-2">
                {seatTimeEntries.length > 0 ? (
                  seatTimeEntries.map(([date, minutes]: [string, any]) => (
                    <div key={date} className="flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="bg-indigo-500/20 p-2 rounded-md">
                          <History className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="text-sm font-medium text-gray-200">{date}</span>
                      </div>
                      <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-full">
                        {formatMinutes(minutes)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-gray-500">
                    <Clock className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">No seat time recorded yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
