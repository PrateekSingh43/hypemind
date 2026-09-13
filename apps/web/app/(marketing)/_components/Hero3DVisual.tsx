"use client";

import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { 
  Home, Inbox, Pin, FileText, File, FolderGit2, FolderOpen, 
  Trash2, Settings, Filter, Search, Sparkles, MoreHorizontal, ArrowRight, CornerDownRight, ChevronRight, ChevronDown,
  Minus, Maximize2, X, Paperclip, ArrowUp, GitPullRequest, Eye
} from "lucide-react";
import { MemoryWebGL } from "./MemoryWebGL";

export function Hero3DVisual() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const rotateX = useTransform(smoothProgress, [0, 0.4], [25, 0]);
  const scale = useTransform(smoothProgress, [0, 0.4], [0.85, 1]);
  const translateY = useTransform(smoothProgress, [0, 0.4], [100, 0]);
  const opacity = useTransform(smoothProgress, [0, 0.3], [0.3, 1]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        padding: "60px 0",
        perspective: "2500px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <motion.div
        style={{
          width: "100%",
          maxWidth: "1400px",
          rotateX,
          scale,
          y: translateY,
          opacity,
          transformStyle: "preserve-3d",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-20px",
            background: "radial-gradient(ellipse at top, var(--mkt-accent-glow) 0%, transparent 60%)",
            opacity: 0.5,
            filter: "blur(60px)",
            transform: "translateZ(-100px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            width: "100%",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#0E0E10",
            boxShadow: "0 40px 100px -20px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.05)",
            transformStyle: "preserve-3d",
            overflow: "hidden", 
          }}
        >
          <HypeMindInteractiveHero />
        </div>
      </motion.div>
    </div>
  );
}

// ----------------------------------------------------------------------------------
// Linear-Inspired Design System & Interactive Hero
// ----------------------------------------------------------------------------------
type View = "home" | "inbox" | "quick-note" | "pages" | "projects" | "area" | "pinned" | "trash" | "settings";
type StoryStep = "idle" | "inbox-capture" | "organize-move" | "ai-typing" | "ai-searching" | "ai-answering" | "ai-done";

function HypeMindInteractiveHero() {
  const [activeView, setActiveView] = useState<View>("inbox");
  const [storyStep, setStoryStep] = useState<StoryStep>("idle");
  const [userInteracted, setUserInteracted] = useState(false);
  
  // Interactive State
  const [typedQuery, setTypedQuery] = useState("");
  const [searchPhase, setSearchPhase] = useState(0); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Memory Glow States
  const [glowFiles, setGlowFiles] = useState<string[]>([]);
  
  // Sidebar Accordion States
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    "quick-note": true,
    "pages": true,
    "projects": true
  });

  const toggleSection = (section: string) => {
    handleInteraction(() => {
      setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    });
  };

  const handleInteraction = (action: () => void) => {
    setUserInteracted(true);
    action();
  };

  // Experience Engine (Autoplay)
  useEffect(() => {
    if (userInteracted) return;
    let isMounted = true;

    const runStory = async () => {
      while (isMounted) {
        // Step 1: The chat bar exist empty
        setStoryStep("idle");
        setTypedQuery("");
        setSearchPhase(0);
        setGlowFiles([]);
        
        await new Promise(r => setTimeout(r, 2000));
        if (!isMounted || userInteracted) break;

        // Step 2: You start typing
        setActiveView("projects");
        setStoryStep("ai-typing");
        const query = "What authentication approach did I choose?";
        for (let i = 0; i <= query.length; i++) {
          if (!isMounted || userInteracted) break;
          setTypedQuery(query.slice(0, i));
          await new Promise(r => setTimeout(r, 40));
        }
        await new Promise(r => setTimeout(r, 500));
        if (!isMounted || userInteracted) break;

        // Step 3: Our full things is shown
        setStoryStep("ai-searching");
        setSearchPhase(1); 
        await new Promise(r => setTimeout(r, 1200));
        if (!isMounted || userInteracted) break;
        
        setSearchPhase(2); 
        setExpandedSections(prev => ({ ...prev, "quick-note": true, "pages": true }));
        setGlowFiles(["auth-strategy", "stripe-api", "arch-decisions"]); 
        await new Promise(r => setTimeout(r, 800));
        if (!isMounted || userInteracted) break;

        setStoryStep("ai-answering");
        await new Promise(r => setTimeout(r, 2500));
        if (!isMounted || userInteracted) break;
        
        setStoryStep("ai-done");
        
        // Step 4: Chat bar is still there (Wait to let user read)
        await new Promise(r => setTimeout(r, 5000));
        if (!isMounted || userInteracted) break;

        // Step 5: Content is removed (Loops back to idle)
      }
    };
    runStory();
    return () => { isMounted = false; };
  }, [userInteracted]);

  return (
    <div className="linear-theme" style={{ display: "flex", width: "100%", height: "750px", color: "#E0E0E0", fontFamily: "'Inter', sans-serif", position: "relative" }} onClick={() => setUserInteracted(true)}>
      
      {/* Sidebar - Linear Style */}
      <div style={{ 
        width: "240px", 
        borderRight: "1px solid rgba(255,255,255,0.08)", 
        background: "#151516", 
        display: "flex",
        flexDirection: "column",
        position: "relative",
        zIndex: 1,
        userSelect: "none"
      }}>
        {/* Workspace Profile */}
        <div className="hover-target" style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 4, background: "var(--mkt-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>P</div>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#F2F2F2" }}>PrateekSingh'Hypemind</span>
          </div>
          <Search size={14} color="var(--mkt-text-low)" />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 8px", display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Top Section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <NavItem icon={<Home size={14} />} label="Home" active={activeView === "home"} onClick={() => handleInteraction(() => setActiveView("home"))} />
            <NavItem icon={<Inbox size={14} />} label="Inbox" active={activeView === "inbox"} onClick={() => handleInteraction(() => setActiveView("inbox"))} />
            <NavItem icon={<Pin size={14} />} label="Pinned" active={activeView === "pinned"} onClick={() => handleInteraction(() => setActiveView("pinned"))} />
          </div>

          {/* Collapsible Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            
            {/* Quick Note */}
            <div>
              <NavSection 
                title="Quick Note" 
                expanded={expandedSections["quick-note"]} 
                onClick={() => toggleSection("quick-note")} 
              />
              <AnimatePresence initial={false}>
                {expandedSections["quick-note"] && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                    <div style={{ paddingLeft: 12, marginTop: 2, display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
                      <div style={{ position: "absolute", left: 18, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.06)" }} />
                      <NavSubItem id="auth-strategy" icon={<FileText size={12}/>} label="Authentication Strategy" isGlowing={glowFiles.includes("auth-strategy")} onClick={() => handleInteraction(() => setActiveView("quick-note"))} />
                      <NavSubItem icon={<FileText size={12}/>} label="Pricing Thoughts" />
                      <NavSubItem icon={<FileText size={12}/>} label="API Refactor" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pages */}
            <div>
              <NavSection 
                title="Pages" 
                expanded={expandedSections["pages"]} 
                onClick={() => toggleSection("pages")} 
              />
              <AnimatePresence initial={false}>
                {expandedSections["pages"] && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                    <div style={{ paddingLeft: 12, marginTop: 2, display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
                      <div style={{ position: "absolute", left: 18, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.06)" }} />
                      <NavSubItem icon={<File size={12}/>} label="Product Vision" />
                      <NavSubItem id="arch-decisions" icon={<File size={12}/>} label="Architecture Decisions" isGlowing={glowFiles.includes("arch-decisions")} onClick={() => handleInteraction(() => setActiveView("pages"))} />
                      <NavSubItem icon={<File size={12}/>} label="Launch Checklist" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Projects */}
            <div>
              <NavSection 
                title="Projects" 
                expanded={expandedSections["projects"]} 
                onClick={() => toggleSection("projects")} 
              />
              <AnimatePresence initial={false}>
                {expandedSections["projects"] && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden" }}>
                    <div style={{ paddingLeft: 12, marginTop: 2, display: "flex", flexDirection: "column", gap: 2, position: "relative" }}>
                      <div style={{ position: "absolute", left: 18, top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.06)" }} />
                      <NavSubItem icon={<FolderGit2 size={12}/>} label="HypeMind MVP" active={activeView === "projects"} onClick={() => handleInteraction(() => setActiveView("projects"))} />
                      <NavSubItem icon={<FolderGit2 size={12}/>} label="AI Memory Engine" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Area */}
            <NavItem icon={<FolderOpen size={14} />} label="Area" active={activeView === "area"} onClick={() => handleInteraction(() => setActiveView("area"))} />
          </div>

        </div>

        {/* System */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <NavItem icon={<Trash2 size={14} />} label="Trash" active={activeView === "trash"} onClick={() => handleInteraction(() => setActiveView("trash"))} />
          <NavItem icon={<Settings size={14} />} label="Settings" active={activeView === "settings"} onClick={() => handleInteraction(() => setActiveView("settings"))} />
        </div>
      </div>

      {/* Main Content Area - Sharp, High Density */}
      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", background: "#0E0E0E" }}>
        <AnimatePresence mode="wait">
          {activeView === "inbox" && <InboxView key="inbox" storyStep={storyStep} glowFiles={glowFiles} />}
          {activeView === "projects" && <ProjectView key="projects" storyStep={storyStep} glowFiles={glowFiles} />}
          {(activeView !== "inbox" && activeView !== "projects") && <GenericView key="generic" title={activeView} glowFiles={glowFiles} />}
        </AnimatePresence>
      </div>

      {/* Persistent AI Panel */}
      <AiContextualPanel 
        storyStep={storyStep} 
        searchPhase={searchPhase}
        setSearchPhase={setSearchPhase}
        typedQuery={typedQuery} 
        userInteracted={userInteracted}
        setGlowFiles={setGlowFiles}
        glowFiles={glowFiles}
        handleInteraction={handleInteraction}
      />

      <style dangerouslySetInnerHTML={{__html: `
        /* Linear Design System CSS */
        .nav-item, .nav-subitem {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px;
          font-size: 13px;
          color: #8A8F98;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.1s, color 0.1s;
          position: relative;
        }
        .nav-item:hover, .nav-subitem:hover { background: rgba(255,255,255,0.05); color: #E0E0E0; }
        
        .nav-item.active, .nav-subitem.active { 
          background: rgba(255,255,255,0.08); 
          color: #fff; 
          font-weight: 500; 
        }
        
        /* The Linear Left Border Glow for Active/Glowing Items */
        .nav-item.active::before, .nav-subitem.active::before, .nav-subitem.glowing::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 16px;
          background: var(--mkt-accent);
          border-radius: 0 4px 4px 0;
          box-shadow: 0 0 10px var(--mkt-accent);
        }

        .nav-subitem.glowing {
          color: #fff;
          background: rgba(94, 106, 210, 0.15);
          font-weight: 500;
        }
        
        .nav-section-title {
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #8A8F98;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: color 0.1s;
        }
        .nav-section-title:hover { color: #E0E0E0; }

        .hover-target:hover { background: rgba(255,255,255,0.05); }

        /* Data Panel Rows (No border radius) */
        .data-row {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          cursor: pointer;
          transition: background 0.1s;
          font-size: 13px;
        }
        .data-row:hover { background: rgba(255,255,255,0.03); }
      `}} />
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <div className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      {icon} <span>{label}</span>
    </div>
  );
}
function NavSection({ title, expanded, onClick }: any) {
  return (
    <div className="nav-section-title" onClick={onClick}>
      <span>{title}</span>
      <motion.div animate={{ rotate: expanded ? 0 : -90 }} transition={{ duration: 0.2 }}>
        <ChevronDown size={12} />
      </motion.div>
    </div>
  );
}
function NavSubItem({ id, icon, label, active, onClick, isGlowing }: any) {
  return (
    <div className={`nav-subitem ${active ? "active" : ""} ${isGlowing ? "glowing" : ""}`} onClick={onClick} style={{ paddingLeft: 24 }}>
      {icon} 
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </div>
  );
}

// -------------------------------------------------------------
// Realistic Content Views (Linear Style - Flat, 1px Borders)
// -------------------------------------------------------------

function InboxView({ storyStep, glowFiles }: any) {
  const isCapture = storyStep === "inbox-capture";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* Middle Pane - List View */}
      <div style={{ width: "320px", borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", background: "#111111" }}>
        <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Inbox</span>
          <div style={{ display: "flex", gap: 12 }}>
            <Filter size={14} color="#8A8F98" />
            <MoreHorizontal size={14} color="#8A8F98" />
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: "auto" }}>
          <AnimatePresence>
            {isCapture && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }}
                style={{ overflow: "hidden" }}
              >
                <div className="data-row" style={{ background: "rgba(94, 106, 210, 0.05)" }}>
                  <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", fontWeight: 500 }}><FileText size={14} color="var(--mkt-accent)"/> ByteByteGo Video</div>
                      <div style={{ fontSize: 11, color: "var(--mkt-accent)" }}>Extracting tags...</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#8A8F98", paddingLeft: 22 }}>System design deep dive...</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="data-row" style={glowFiles.includes("stripe-api") ? { background: "rgba(94, 106, 210, 0.1)" } : {}}>
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: glowFiles.includes("stripe-api") ? "#fff" : "#E0E0E0", fontWeight: 500 }}><FileText size={14}/> Stripe API Design</div>
                <div style={{ fontSize: 11, color: "#8A8F98" }}>8m</div>
              </div>
              <div style={{ fontSize: 12, color: "#8A8F98", paddingLeft: 22 }}>Idempotency strategies</div>
            </div>
          </div>
          
          <div className="data-row">
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#E0E0E0", fontWeight: 500 }}><FileText size={14}/> Martin Fowler — CQRS</div>
                <div style={{ fontSize: 11, color: "#8A8F98" }}>1h</div>
              </div>
            </div>
          </div>
          
          <div className="data-row">
            <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#E0E0E0", fontWeight: 500 }}><FileText size={14}/> Uber Eng Hexagonal</div>
                <div style={{ fontSize: 11, color: "#8A8F98" }}>4h</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Empty State for Editor Pane */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#8A8F98", background: "#0E0E0E" }}>
        Select an item to view details
      </div>
    </motion.div>
  )
}

function ProjectView({ storyStep, glowFiles }: any) {
  const isOrganizing = storyStep === "organize-move";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", width: "100%", height: "100%" }}>
      {/* Middle Pane - List View */}
      <div style={{ width: "320px", borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", background: "#111111" }}>
        <div style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>HypeMind MVP</span>
          <MoreHorizontal size={14} color="#8A8F98" />
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
           <div className="data-row" style={{ background: "rgba(255,255,255,0.03)" }}>
             <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", fontWeight: 500 }}><FileText size={14}/> Architecture Refactor</div>
           </div>
           <div className="data-row">
             <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#E0E0E0", fontWeight: 500 }}><FileText size={14}/> Launch Checklist</div>
           </div>
        </div>
      </div>
      
      {/* Editor Pane - Document View */}
      <div style={{ flex: 1, padding: "48px 64px", display: "flex", flexDirection: "column", position: "relative", overflowY: "auto" }}>
        <AnimatePresence>
          {isOrganizing && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ position: "absolute", top: 16, right: 32, background: "rgba(94, 106, 210, 0.15)", border: "1px solid rgba(94, 106, 210, 0.3)", padding: "6px 10px", borderRadius: 4, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#fff" }}>
              <Sparkles size={12} color="var(--mkt-accent)" />
              Pricing Thoughts connected
            </motion.div>
          )}
        </AnimatePresence>
        
        <div style={{ fontSize: 12, color: "#8A8F98", marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
          <span>Projects</span> <ChevronRight size={12}/> <span>HypeMind MVP</span>
        </div>
        
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24, color: "#fff", letterSpacing: "-0.02em" }}>Architecture Refactor</h1>
        
        <div style={{ fontSize: 14, color: "#A0A5B1", lineHeight: 1.6, maxWidth: 640 }}>
          <p style={{ marginBottom: 16 }}>We are evaluating our persistence layer to ensure scalability and reliability during high concurrency.</p>
          <strong style={{ color: "#E0E0E0", display: "block", marginTop: 24, marginBottom: 8 }}>Outstanding questions:</strong>
          <ul style={{ paddingLeft: 20, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            <li>Do we use JWT or session cookies?</li>
            <li>How do we handle multi-tenant isolation safely?</li>
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

function GenericView({ title, glowFiles }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: "48px 64px", width: "100%" }}>
       <h1 className={glowFiles.includes("auth-strategy") && title === "quick-note" ? "glowing-text" : ""} style={{ fontSize: 24, fontWeight: 600, textTransform: "capitalize", transition: "color 0.3s" }}>{title.replace('-', ' ')}</h1>
       {title === "quick-note" && glowFiles.includes("auth-strategy") && (
         <div style={{ marginTop: 24, fontSize: 14, color: "#A0A5B1", maxWidth: 600, lineHeight: 1.6 }}>
           <strong style={{ color: "#fff" }}>Decision:</strong> We'll use Auth.js with Prisma sessions instead of JWT for immediate token invalidation capabilities.
         </div>
       )}
    </motion.div>
  )
}

// -------------------------------------------------------------
// Interactive AI Engine (Persistent Panel)
// -------------------------------------------------------------
function AiContextualPanel({ storyStep, searchPhase, setSearchPhase, typedQuery, userInteracted, setGlowFiles, glowFiles, handleInteraction }: any) {
  
  const [localQuery, setLocalQuery] = useState("");
  const [interactivePhase, setInteractivePhase] = useState<"idle"|"typing"|"searching"|"synthesizing"|"answered">("idle");

  const handleInputSubmit = async (e: React.KeyboardEvent | React.MouseEvent) => {
    const isEnter = (e as React.KeyboardEvent).key === "Enter";
    const isClick = e.type === "click";
    
    if ((isEnter || isClick) && localQuery.trim() !== "") {
      const q = localQuery.toLowerCase();
      setInteractivePhase("searching");
      setSearchPhase(1);
      
      await new Promise(r => setTimeout(r, 800));
      setInteractivePhase("synthesizing");
      setSearchPhase(2);
      
      if (q.includes("auth") || q.includes("authentication")) {
        setGlowFiles(["auth-strategy", "stripe-api"]);
        await new Promise(r => setTimeout(r, 1200));
        setInteractivePhase("answered");
        setSearchPhase(3);
      } else {
        await new Promise(r => setTimeout(r, 800));
        setInteractivePhase("answered");
        setSearchPhase(3);
        setGlowFiles([]);
      }
    }
  };

  const isAutoplay = !userInteracted;
  const isSearching = (isAutoplay && searchPhase === 1) || (!isAutoplay && interactivePhase === "searching");
  const isSynthesizing = (isAutoplay && searchPhase === 2) || (!isAutoplay && interactivePhase === "synthesizing");
  const showAnswer = (isAutoplay && (storyStep === "ai-answering" || storyStep === "ai-done")) || (!isAutoplay && interactivePhase === "answered");
  const hasContent = isSearching || isSynthesizing || showAnswer;
  const displayQuery = isAutoplay && hasContent ? typedQuery : localQuery;
  
  // Clear search phase when idle
  useEffect(() => {
    if (!isAutoplay && interactivePhase === "idle") {
      setSearchPhase(0);
    }
  }, [interactivePhase, isAutoplay, setSearchPhase]);

  const isError = !isAutoplay && interactivePhase === "answered" && !localQuery.toLowerCase().includes("auth");

  return (
    <div style={{ 
      position: "absolute", right: 24, bottom: 24, width: 440, maxHeight: "calc(100% - 48px)", 
      background: "#151516", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, 
      display: "flex", flexDirection: "column", zIndex: 100, boxShadow: "0 24px 48px -12px rgba(0,0,0,0.9)",
      color: "#E0E0E0", fontFamily: "var(--font-inter), sans-serif"
    }}>
      {/* Header - Linear Style */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 500, fontSize: 13, background: "#151516", borderRadius: "8px 8px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={14} color="#E0E0E0" /> 
          <span style={{ color: "#E0E0E0", fontWeight: 600 }}>HypeMind</span>
          <div style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", padding: "2px 6px", borderRadius: 4, fontSize: 11, color: "#8A8F98" }}>
            Memory 2.0
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#8A8F98" }}>
          <Minus size={14} />
          <Maximize2 size={12} />
          <X size={14} />
        </div>
      </div>
      
      {/* Chat Content - Hidden when idle, but container remains */}
      <div style={{ flex: 1, padding: "20px 20px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", minHeight: 280 }}>
         {/* User Initiated Action */}
         <AnimatePresence>
           {hasContent && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", alignItems: "center", gap: 10 }}>
               <img src="https://ui-avatars.com/api/?name=Prateek+Singh&background=333&color=fff&size=64" alt="User" style={{ width: 18, height: 18, borderRadius: 9 }} />
               <div style={{ fontSize: 13, color: "#8A8F98" }}>
                 <span style={{ color: "#E0E0E0", fontWeight: 500 }}>Prateek</span> connected HypeMind to Authentication Strategy
               </div>
             </motion.div>
           )}
         </AnimatePresence>

         {/* AI Status / Processing text */}
         <AnimatePresence>
           {hasContent && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Examining state */}
                <div style={{ fontSize: 14, color: "#E0E0E0", fontWeight: 500 }}>
                  Examining the workspace...
                </div>
                
                {/* Worked for Xs dropdown */}
                {(isSynthesizing || showAnswer) && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 12, color: "#8A8F98", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    Worked for 3s <ChevronDown size={10} />
                  </motion.div>
                )}
                
                {/* Final Output */}
                {showAnswer && !isError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ fontSize: 14, color: "#E0E0E0", fontWeight: 500 }}>
                      Synthesized from 7 memories. Insights:
                    </div>
                    
                    {/* Bullet Points */}
                    <div style={{ paddingLeft: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ display: "flex", gap: 8, fontSize: 13, color: "#E0E0E0" }}>
                        <span style={{ color: "#8A8F98" }}>•</span>
                        <div>
                          <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 12 }}>auth-strategy.md</code> : we decided to use Auth.js with Prisma sessions instead of JWT.
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, fontSize: 13, color: "#E0E0E0" }}>
                        <span style={{ color: "#8A8F98" }}>•</span>
                        <div>
                          <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, fontFamily: "monospace", fontSize: 12 }}>stripe-api.md</code> : needed for reliable webhook invalidation.
                        </div>
                      </div>
                    </div>

                    {/* Summary Card (Linear PR style) */}
                    <div style={{ marginTop: 8, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, background: "rgba(255,255,255,0.02)", overflow: "hidden" }}>
                      <div style={{ padding: "12px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#E0E0E0" }}>
                          Referenced 2 memories <span style={{ color: "#4ADE80", marginLeft: 4 }}>+4</span> <span style={{ color: "#F87171" }}>-2</span>
                        </div>
                        <div className="hover-target" style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, fontSize: 12, color: "#E0E0E0", cursor: "pointer" }}>
                          <Eye size={12} /> Preview
                        </div>
                      </div>
                      <div style={{ padding: "12px", display: "flex", gap: 12 }}>
                        <GitPullRequest size={16} color="var(--mkt-accent)" style={{ marginTop: 2 }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: "#E0E0E0" }}>Draft Update Authentication Strategy</div>
                          <div style={{ fontSize: 11, color: "#8A8F98", fontFamily: "monospace" }}>workspace ← quick-notes/auth-strategy</div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {showAnswer && isError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 14, color: "#E0E0E0" }}>
                    No matching memories. Try searching Projects or Pages.
                  </motion.div>
                )}
             </motion.div>
           )}
         </AnimatePresence>
      </div>

      {/* Input Area - Persistent */}
      <div style={{ padding: "0 16px 16px 16px" }}>
         <div style={{ border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)", borderRadius: 8, display: "flex", flexDirection: "column" }}>
           <input 
              type="text" 
              value={!userInteracted ? typedQuery : localQuery}
              onChange={(e) => {
                handleInteraction(() => {
                  setLocalQuery(e.target.value);
                  if (interactivePhase !== "idle") setInteractivePhase("idle");
                  if (glowFiles.length > 0) setGlowFiles([]);
                });
              }}
              onKeyDown={handleInputSubmit}
              placeholder="Tell HypeMind what to do next..." 
              style={{ width: "100%", background: "transparent", border: "none", padding: "14px 16px", color: "#fff", outline: "none", fontSize: 14, fontWeight: 500, fontFamily: "inherit" }}
           />
           <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14, padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
             <Maximize2 size={14} color="#8A8F98" style={{ cursor: "pointer" }} className="hover-target" />
             <Paperclip size={14} color="#8A8F98" style={{ cursor: "pointer" }} className="hover-target" />
             <div onClick={handleInputSubmit} style={{ width: 24, height: 24, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }} className="hover-target">
               <ArrowUp size={14} color="#E0E0E0" />
             </div>
           </div>
         </div>
      </div>
    </div>
  );
}
