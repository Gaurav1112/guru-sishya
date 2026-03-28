"use client";
import { useStore } from "@/lib/store";
import { ApiKeyInput } from "@/components/api-key-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/db";

export default function SettingsPage() {
  const { soundEnabled, setSoundEnabled, dailyGoal, setDailyGoal, showOnLeaderboard, setShowOnLeaderboard, weeklyDigestEnabled, setWeeklyDigestEnabled } = useStore();
  async function handleExport() {
    const data = {
      version: 1, exportedAt: new Date().toISOString(),
      topics: await db.topics.toArray(), learningPlans: await db.learningPlans.toArray(),
      quizAttempts: await db.quizAttempts.toArray(), flashcards: await db.flashcards.toArray(),
      chatSessions: await db.chatSessions.toArray(), chatMessages: await db.chatMessages.toArray(),
      cheatSheets: await db.cheatSheets.toArray(), resources: await db.resources.toArray(),
      badges: await db.badges.toArray(), streakHistory: await db.streakHistory.toArray(),
      coinTransactions: await db.coinTransactions.toArray(), inventory: await db.inventory.toArray(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `guru-sishya-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
  }
  return (
    <div className="max-w-2xl">
      <h1 className="font-heading text-2xl font-bold mb-6">Settings</h1>
      <div className="space-y-6">
        <Card className="bg-surface border-border/50"><CardHeader><CardTitle className="text-lg">API Key</CardTitle></CardHeader><CardContent><ApiKeyInput /></CardContent></Card>
        <Card className="bg-surface border-border/50"><CardHeader><CardTitle className="text-lg">Preferences</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="flex items-center justify-between"><Label>Sound Effects</Label><Button variant="outline" size="sm" onClick={() => setSoundEnabled(!soundEnabled)}>{soundEnabled ? "On" : "Off"}</Button></div>
          <Separator />
          <div className="flex items-center justify-between"><div><Label>Show me on Leaderboard</Label><p className="text-xs text-muted-foreground">Appear in weekly XP rankings</p></div><Button variant="outline" size="sm" onClick={() => setShowOnLeaderboard(!showOnLeaderboard)}>{showOnLeaderboard ? "On" : "Off"}</Button></div>
          <Separator />
          <div className="flex items-center justify-between">
            <div><Label>Onboarding Tour</Label><p className="text-xs text-muted-foreground">Replay the guided tour (starts on the Dashboard)</p></div>
            <Button variant="outline" size="sm" onClick={() => { useStore.getState().setOnboardingCompleted(false); window.location.href = "/app/dashboard"; }}>Replay</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between"><div><Label>Daily Goal</Label><p className="text-xs text-muted-foreground">Minutes per day</p></div>
            <div className="flex gap-2">{[5, 10, 15, 20, 30].map((m) => (<Button key={m} variant={dailyGoal === m ? "default" : "outline"} size="sm" onClick={() => setDailyGoal(m)} className={dailyGoal === m ? "bg-saffron" : ""}>{m}</Button>))}</div>
          </div>
          <Separator />
          <div className="flex items-center justify-between"><div><Label>Weekly Digest</Label><p className="text-xs text-muted-foreground">Receive a weekly summary of your progress</p></div><Button variant="outline" size="sm" onClick={() => setWeeklyDigestEnabled(!weeklyDigestEnabled)} className={weeklyDigestEnabled ? "border-saffron/50 text-saffron" : ""}>{weeklyDigestEnabled ? "On" : "Off"}</Button></div>
        </CardContent></Card>
        <Card className="bg-surface border-border/50"><CardHeader><CardTitle className="text-lg">Data</CardTitle></CardHeader><CardContent className="space-y-3">
          <Button variant="outline" onClick={handleExport}>Export All Data</Button>
          <p className="text-xs text-muted-foreground">Download all your data as a JSON file.</p>
        </CardContent></Card>
        <Card className="bg-surface border-red-500/20">
          <CardHeader>
            <CardTitle className="text-lg text-red-400">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              onClick={async () => {
                if (!confirm("Are you sure? This will permanently delete all your data. This action cannot be undone.")) return;
                if (!confirm("Last chance. Are you absolutely sure you want to delete everything?")) return;

                try {
                  // Try server-side deletion first (only matters if signed in)
                  try {
                    await fetch("/api/user/delete-account", { method: "DELETE" });
                  } catch {
                    // Server deletion is best-effort — local wipe is the primary action
                  }

                  // Always clear local data regardless of API result
                  localStorage.clear();
                  indexedDB.deleteDatabase("GuruSishya");
                  alert("All local data deleted. You will be redirected to the home page.");
                  window.location.href = "/";
                } catch {
                  alert("Failed to delete data. Please try again.");
                }
              }}
            >
              Delete My Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
