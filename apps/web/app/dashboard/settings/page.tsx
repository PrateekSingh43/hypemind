"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
    Settings, Sun, Moon, Laptop, User, Bell, Link as LinkIcon,
    Globe, Users, Download, Sparkles, CreditCard, LogOut, ChevronDown, Monitor
} from "lucide-react";
import { clearAccessToken, clearWorkspaceId, api } from "../../../lib/api";

const SETTINGS_NAV = [
    {
        title: "Account",
        items: [
            { id: "profile", label: "My profile", icon: User },
            { id: "preferences", label: "Preferences", icon: Settings },
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

export default function SettingsPage() {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState("preferences");
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        setMounted(true);
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
            // force a hard reload to clear all states and trigger middleware redirect
            window.location.href = "/login";
        }
    };

    const renderContent = () => {
        if (activeTab === "preferences") {
            return (
                <div className="max-w-3xl animate-in fade-in duration-300">
                    <h1 className="text-[20px] font-semibold text-[#EEEEEE] mb-1">Preferences</h1>
                    <p className="text-[13px] text-[#8A8F98] mb-8">Choose how you want HypeMind to look and behave</p>

                    {/* Appearance Section */}
                    <div className="mb-10">
                        <h2 className="text-[11px] font-semibold text-[#8A8F98] uppercase tracking-wider mb-4 border-b border-[#27282B] pb-2">Appearance</h2>
                        
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <h3 className="text-[14px] text-[#EEEEEE] font-medium">Theme</h3>
                                <p className="text-[12px] text-[#8A8F98]">Choose a theme for HypeMind on this device</p>
                            </div>
                            <div className="relative">
                                <select 
                                    value={mounted ? theme : "system"} 
                                    onChange={(e) => setTheme(e.target.value)}
                                    className="appearance-none bg-[#1C1D21] border border-[#27282B] text-[#EEEEEE] text-[13px] rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-[#5E6AD2] cursor-pointer hover:bg-[#26272B] transition-colors"
                                >
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="system">Use system setting</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-[#8A8F98] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Input Options Section */}
                    <div className="mb-10">
                        <h2 className="text-[11px] font-semibold text-[#8A8F98] uppercase tracking-wider mb-4 border-b border-[#27282B] pb-2">Input options</h2>
                        
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <h3 className="text-[14px] text-[#EEEEEE] font-medium">Use Enter to add a new line</h3>
                                <p className="text-[12px] text-[#8A8F98]">Applies to chat, comments, and other input fields. Press <kbd className="bg-[#1C1D21] border border-[#27282B] px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono">Cmd/Ctrl + Enter</kbd> to send.</p>
                            </div>
                            {/* Simple toggle switch */}
                            <button className="w-9 h-5 bg-[#5E6AD2] rounded-full relative transition-colors" aria-pressed="true">
                                <div className="w-3.5 h-3.5 bg-white rounded-full absolute right-0.5 top-[3px] transition-transform shadow-sm" />
                            </button>
                        </div>
                    </div>

                    {/* Language & Time Section */}
                    <div className="mb-10">
                        <h2 className="text-[11px] font-semibold text-[#8A8F98] uppercase tracking-wider mb-4 border-b border-[#27282B] pb-2">Language & time</h2>
                        
                        <div className="flex items-center justify-between py-2 mb-2">
                            <div>
                                <h3 className="text-[14px] text-[#EEEEEE] font-medium">Language</h3>
                                <p className="text-[12px] text-[#8A8F98]">Choose the language you want to use HypeMind in</p>
                            </div>
                            <div className="relative">
                                <select className="appearance-none bg-[#1C1D21] border border-[#27282B] text-[#EEEEEE] text-[13px] rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-[#5E6AD2] cursor-pointer hover:bg-[#26272B] transition-colors">
                                    <option>English (US)</option>
                                    <option>English (UK)</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-[#8A8F98] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between py-2 mb-2">
                            <div>
                                <h3 className="text-[14px] text-[#EEEEEE] font-medium">Number format</h3>
                                <p className="text-[12px] text-[#8A8F98]">Choose how numbers and currencies are formatted.</p>
                            </div>
                            <div className="relative">
                                <select className="appearance-none bg-[#1C1D21] border border-[#27282B] text-[#EEEEEE] text-[13px] rounded-md px-3 py-1.5 pr-8 focus:outline-none focus:border-[#5E6AD2] cursor-pointer hover:bg-[#26272B] transition-colors">
                                    <option>Default</option>
                                    <option>1,000,000.00</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-[#8A8F98] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeTab === "profile") {
             return (
                <div className="max-w-3xl animate-in fade-in duration-300">
                    <h1 className="text-[20px] font-semibold text-[#EEEEEE] mb-1">My profile</h1>
                    <p className="text-[13px] text-[#8A8F98] mb-8">Manage your personal information and security.</p>
                    
                    <div className="mb-10">
                        <h2 className="text-[11px] font-semibold text-[#8A8F98] uppercase tracking-wider mb-4 border-b border-[#27282B] pb-2">Profile Info</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[12px] font-medium text-[#8A8F98] mb-1.5">Full Name</label>
                                <input type="text" defaultValue="Prateek Singh" className="w-full max-w-sm bg-[#1C1D21] border border-[#27282B] rounded-md px-3 py-2 text-[13px] text-[#EEEEEE] focus:outline-none focus:border-[#5E6AD2]" />
                            </div>
                            <div>
                                <label className="block text-[12px] font-medium text-[#8A8F98] mb-1.5">Email Address</label>
                                <input type="email" defaultValue="prateek@hypemind.com" disabled className="w-full max-w-sm bg-[#131416] border border-[#27282B] rounded-md px-3 py-2 text-[13px] text-[#5A5D66] cursor-not-allowed" />
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Placeholder for other tabs
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in duration-300 mt-20">
                <div className="w-12 h-12 rounded-full border border-[#27282B] flex items-center justify-center text-[#5A5D66] mb-4">
                    <Settings className="w-5 h-5" />
                </div>
                <h2 className="text-[15px] font-medium text-[#EEEEEE] mb-1">Coming Soon</h2>
                <p className="text-[13px] text-[#8A8F98] max-w-sm">The {activeTab} settings panel is currently under development.</p>
            </div>
        );
    };

    return (
        <div className="flex h-full w-full bg-[#0E0F11] font-sans antialiased overflow-hidden">
            {/* Settings Sidebar */}
            <div className="w-[240px] flex-shrink-0 bg-[#151618] border-r border-[#27282B] flex flex-col h-full py-4 overflow-y-auto scrollbar-hide">
                {SETTINGS_NAV.map((group, index) => (
                    <div key={group.title} className={index > 0 ? "mt-6" : ""}>
                        <h3 className="px-4 mb-1 text-[11px] font-semibold text-[#5A5D66] uppercase tracking-wider">
                            {group.title}
                        </h3>
                        <div className="space-y-[1px] px-2">
                            {group.items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors duration-75 ${
                                        activeTab === item.id 
                                        ? "bg-[#26272B] text-[#EEEEEE] font-medium" 
                                        : "text-[#8A8F98] hover:bg-[#26272B]/50 hover:text-[#EEEEEE]"
                                    }`}
                                >
                                    <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-[#EEEEEE]" : "text-[#8A8F98]"}`} />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="mt-auto px-2 pt-6">
                     <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-[#E5484D] hover:bg-[#E5484D]/10 transition-colors duration-75 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? "Logging out..." : "Log out"}
                    </button>
                </div>
            </div>

            {/* Settings Content Area */}
            <div className="flex-1 h-full overflow-y-auto">
                <div className="p-8 md:p-12 min-h-full">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}
