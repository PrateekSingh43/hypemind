"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
    Settings, Sun, Moon, Laptop, User, Bell, Link as LinkIcon,
    Globe, Users, Download, Sparkles, CreditCard, LogOut, ChevronDown, Monitor,
    PanelLeftClose, PanelLeft, Loader2, ChevronRight
} from "lucide-react";
import { clearAccessToken, clearWorkspaceId, api } from "../../../lib/api";

const SETTINGS_NAV = [
    {
        title: "Account",
        items: [
            { id: "profile", label: "My profile", icon: User },
            { id: "preferences", label: "Preferences", icon: Settings },
            { id: "shortcuts", label: "Shortcut keys", icon: Monitor },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "connections", label: "Connections", icon: LinkIcon },
        ]
    },
    {
        title: "Workspace",
        items: [
            { id: "general", label: "General", icon: Globe },
            { id: "people", label: "People", icon: Users },
            { id: "import", label: "Import", icon: Download },
        ]
    },
    {
        title: "Features",
        items: [
            { id: "ai", label: "HypeMind AI", icon: Sparkles },
        ]
    },
    {
        title: "Access & billing",
        items: [
            { id: "billing", label: "Billing", icon: CreditCard },
        ]
    }
];

interface AuthResponse {
    data?: {
        user?: { name: string; email: string };
        name?: string;
        email?: string;
    };
}

export default function SettingsPage() {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    
    // Feature UI states
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [useEnterToSubmit, setUseEnterToSubmit] = useState(true);
    
    // User database pull state
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    useEffect(() => {
        setMounted(true);
        
        const fetchUser = async () => {
            try {
                const res = await api.get("/auth/me") as AuthResponse; 
                if (res.data?.user) {
                    setUser({ name: res.data.user.name || "", email: res.data.user.email || "" });
                } else if (res.data) {
                    setUser({ name: res.data.name || "", email: res.data.email || "" });
                }
            } catch (e) {
                console.error("Failed to fetch user from DB", e);
                setUser({ name: "Prateek Singh", email: "prateek@hypemind.com" });
            } finally {
                setIsLoadingUser(false);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await api.post("/auth/logout", {});
        } catch (e) {
            console.error("Logout failed", e);
        } finally {
            clearAccessToken();
            clearWorkspaceId();
            window.location.href = "/login";
        }
    };

    const renderContent = () => {
        if (activeTab === "preferences") {
            return (
                <div className="max-w-3xl animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-[20px] font-semibold text-foreground">Preferences</h1>
                    </div>
                    <p className="text-[13px] text-muted-foreground mb-8">Choose how you want HypeMind to look and behave</p>

                    <div className="mb-10">
                        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Appearance</h2>
                        
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <h3 className="text-[14px] text-foreground font-medium">Theme</h3>
                                <p className="text-[12px] text-muted-foreground">Choose a theme for HypeMind on this device</p>
                            </div>
                            <div className="relative">
                                <select 
                                    value={mounted ? theme : "system"} 
                                    onChange={(e) => setTheme(e.target.value)}
                                    className="appearance-none bg-surface border border-border text-foreground text-[13px] rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-primary cursor-pointer hover:bg-muted transition-colors"
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="system">Use system setting</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Input options</h2>
                        
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <h3 className="text-[14px] text-foreground font-medium">Use Enter to add a new line</h3>
                                <p className="text-[12px] text-muted-foreground">Applies to chat, comments, and other input fields. Press <kbd className="bg-surface border border-border px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono text-foreground">Cmd/Ctrl + Enter</kbd> to send.</p>
                            </div>
                            <button 
                                onClick={() => setUseEnterToSubmit(!useEnterToSubmit)}
                                className={`w-9 h-5 rounded-full relative transition-colors ${useEnterToSubmit ? 'bg-primary' : 'bg-muted-foreground/30'}`} 
                                aria-pressed={useEnterToSubmit}
                            >
                                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${useEnterToSubmit ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Language & time</h2>
                        
                        <div className="flex items-center justify-between py-2 mb-2">
                            <div>
                                <h3 className="text-[14px] text-foreground font-medium">Language</h3>
                                <p className="text-[12px] text-muted-foreground">Choose the language you want to use HypeMind in</p>
                            </div>
                            <div className="relative">
                                <select className="appearance-none bg-surface border border-border text-foreground text-[13px] rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-primary cursor-pointer hover:bg-muted transition-colors">
                                    <option>English (US)</option>
                                    <option>English (UK)</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-2 mb-2">
                            <div>
                                <h3 className="text-[14px] text-foreground font-medium">Number format</h3>
                                <p className="text-[12px] text-muted-foreground">Choose how numbers and currencies are formatted.</p>
                            </div>
                            <div className="relative">
                                <select className="appearance-none bg-surface border border-border text-foreground text-[13px] rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-primary cursor-pointer hover:bg-muted transition-colors">
                                    <option>Default</option>
                                    <option>1,000,000.00</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === "profile") {
             const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";
             return (
                <div className="max-w-3xl animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-[20px] font-semibold text-foreground">My profile</h1>
                    </div>
                    <p className="text-[13px] text-muted-foreground mb-8">Manage your personal information and security.</p>
                    
                    {isLoadingUser ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading securely from database...</span>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-start gap-4 mb-10 pb-8 border-b border-border/50">
                                <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center text-[24px] text-foreground font-medium shrink-0">
                                    {userInitial}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[12px] text-muted-foreground mb-1.5">Preferred name</label>
                                    <input 
                                        type="text" 
                                        defaultValue={user?.name || ""} 
                                        className="w-full max-w-md bg-transparent border border-border rounded-md px-3 py-1.5 text-[14px] text-foreground focus:outline-none focus:border-primary transition-colors hover:bg-muted/50" 
                                    />
                                    <p className="text-[12px] text-muted-foreground mt-2">
                                        <button className="text-primary hover:underline">Add a photo</button> or <button className="text-primary hover:underline">create a custom self-portrait</button> with HypeMind Faces
                                    </p>
                                </div>
                            </div>

                            <div className="mb-10">
                                <h2 className="text-[14px] font-semibold text-foreground mb-4">Account security</h2>
                                
                                <div className="flex items-center justify-between py-4 border-b border-border/50">
                                    <div>
                                        <h3 className="text-[14px] text-foreground font-medium mb-0.5">Email</h3>
                                        <p className="text-[12px] text-muted-foreground">{user?.email}</p>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-md border border-border text-[13px] font-medium text-foreground hover:bg-muted transition-colors">
                                        Manage emails
                                    </button>
                                </div>

                                <div className="flex items-center justify-between py-4 border-b border-border/50">
                                    <div className="pr-8">
                                        <h3 className="text-[14px] text-foreground font-medium mb-0.5">Password</h3>
                                        <p className="text-[12px] text-muted-foreground">If you lose access to your email address, you'll be able to log in using your password.</p>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-md border border-border text-[13px] font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap">
                                        Change password
                                    </button>
                                </div>

                                <div className="flex items-center justify-between py-4 border-b border-border/50">
                                    <div className="pr-8">
                                        <h3 className="text-[14px] text-foreground font-medium mb-0.5">Two-step verification</h3>
                                        <p className="text-[12px] text-muted-foreground">You have two-step verification enabled</p>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-md border border-border text-[13px] font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap">
                                        Manage verification methods
                                    </button>
                                </div>

                                <div className="flex items-center justify-between py-4">
                                    <div className="pr-8">
                                        <h3 className="text-[14px] text-foreground font-medium mb-0.5">Passkeys</h3>
                                        <p className="text-[12px] text-muted-foreground">Sign in with on-device biometric authentication</p>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-md border border-border text-[13px] font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap">
                                        Add passkey
                                    </button>
                                </div>
                            </div>

                            <div className="mb-10">
                                <h2 className="text-[14px] font-semibold text-foreground mb-4">Support</h2>
                                
                                <div className="flex items-center justify-between py-4 border-b border-border/50">
                                    <div className="pr-8">
                                        <h3 className="text-[14px] text-foreground font-medium mb-0.5">Support access</h3>
                                        <p className="text-[12px] text-muted-foreground">Grant HypeMind's support team temporary access to your account to help troubleshoot problems or recover content on your behalf. You can revoke access anytime.</p>
                                    </div>
                                    <button className="w-9 h-5 rounded-full bg-muted-foreground/30 relative transition-colors shrink-0">
                                        <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform shadow-sm" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between py-4">
                                    <div className="pr-8">
                                        <h3 className="text-[14px] text-foreground font-medium mb-0.5">Delete my account</h3>
                                        <p className="text-[12px] text-muted-foreground">Permanently delete your account. You'll no longer be able to access your pages or any of the workspaces you belong to.</p>
                                    </div>
                                    <button className="px-3 py-1.5 rounded-md border border-destructive/20 text-[13px] font-medium text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap">
                                        Delete my account
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            );
        }

        if (activeTab === "shortcuts") {
            return (
                <div className="max-w-3xl animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-[20px] font-semibold text-foreground">Shortcut keys</h1>
                    </div>
                    <p className="text-[13px] text-muted-foreground mb-8">Keyboard shortcuts to help you navigate and work faster.</p>

                    <div className="mb-10">
                        <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-4 border-b border-border pb-2">Global shortcuts</h2>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between py-2 border-b border-border/30">
                                <h3 className="text-[13px] text-foreground font-medium">Quick Create Modal</h3>
                                <kbd className="bg-surface border border-border px-2 py-1 rounded-md text-[11px] font-mono text-foreground font-semibold shadow-sm">Cmd/Ctrl + N</kbd>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border/30">
                                <h3 className="text-[13px] text-foreground font-medium">Toggle Theme</h3>
                                <kbd className="bg-surface border border-border px-2 py-1 rounded-md text-[11px] font-mono text-foreground font-semibold shadow-sm">Cmd/Ctrl + Alt + T</kbd>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <h3 className="text-[13px] text-foreground font-medium">Toggle Left Sidebar</h3>
                                <kbd className="bg-surface border border-border px-2 py-1 rounded-md text-[11px] font-mono text-foreground font-semibold shadow-sm">Cmd/Ctrl + \</kbd>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-300 mt-20">
                <div className="w-12 h-12 rounded-full border border-border flex items-center justify-center text-muted-foreground mb-4">
                    <Settings className="w-5 h-5" />
                </div>
                <h2 className="text-[15px] font-medium text-foreground mb-1">Coming Soon</h2>
                <p className="text-[13px] text-muted-foreground max-w-sm">The {activeTab} settings panel is currently under development.</p>
            </div>
        );
    };

    return (
        <div className="flex h-full w-full bg-background font-sans antialiased overflow-hidden">
            <div 
                className="shrink-0 bg-surface border-r border-border flex flex-col h-full py-4 overflow-y-auto scrollbar-hide transition-all duration-300 ease-in-out"
                style={{ width: isSidebarOpen ? 240 : 0, opacity: isSidebarOpen ? 1 : 0 }}
            >
                <div className="px-4 mb-4 flex items-center justify-between whitespace-nowrap overflow-hidden">
                    <h2 className="text-sm font-semibold text-foreground">Settings</h2>
                    <button 
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Collapse settings navigation"
                    >
                        <PanelLeftClose className="w-4 h-4" />
                    </button>
                </div>

                {SETTINGS_NAV.map((group, index) => (
                    <div key={group.title} className={`${index > 0 ? "mt-6" : ""} min-w-60`}>
                        <h3 className="px-4 mb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {group.title}
                        </h3>
                        <div className="space-y-px px-2">
                            {group.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors duration-75 ${
                                        activeTab === item.id 
                                        ? "bg-muted text-foreground font-medium" 
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    }`}
                                >
                                    <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-foreground" : "text-muted-foreground"}`} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="mt-auto px-2 pt-6 min-w-60">
                     <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-destructive hover:bg-destructive/10 transition-colors duration-75 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? "Logging out..." : "Log out"}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full min-w-0 bg-background transition-colors duration-300">
                <div className="h-12 border-b border-border flex items-center px-6 shrink-0">
                    <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1"
                                title="Expand settings navigation"
                            >
                                <PanelLeft className="w-4 h-4" />
                            </button>
                        )}
                        <span>Settings</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-foreground capitalize">{SETTINGS_NAV.flatMap(g => g.items).find(i => i.id === activeTab)?.label || activeTab}</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 md:p-12">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}