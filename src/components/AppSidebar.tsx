import React from "react";
import {
  Briefcase,
  FileSearch,
  UserCheck,
  Building2,
  CheckCircle2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export type FlowRolePage =
  | "role1_jd"
  | "role2_resume"
  | "role3_profile"
  | "role4_talent_check"
  | "role5_matching";

interface AppSidebarProps {
  activePage: FlowRolePage;
  onSelectPage: (page: FlowRolePage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenContractModal: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activePage,
  onSelectPage,
  collapsed,
  onToggleCollapse,
  onOpenContractModal,
}) => {
  const navItems = [
    {
      id: "role1_jd" as FlowRolePage,
      label: "Job Analysis",
      description: "Parse requirements",
      icon: Briefcase,
    },
    {
      id: "role2_resume" as FlowRolePage,
      label: "Resume Scanner",
      description: "Extract skills",
      icon: FileSearch,
    },
    {
      id: "role3_profile" as FlowRolePage,
      label: "Profile Builder",
      description: "Enrich profile",
      icon: UserCheck,
    },
    {
      id: "role4_talent_check" as FlowRolePage,
      label: "Benchmarks",
      description: "Company fit",
      icon: Building2,
    },
    {
      id: "role5_matching" as FlowRolePage,
      label: "Job Match",
      description: "Gap analysis",
      icon: CheckCircle2,
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 flex flex-col justify-between border-r border-slate-200 bg-white text-slate-800 transition-all duration-300 ease-in-out select-none shadow-xs ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Branding */}
      <div>
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xs shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="truncate">
                <h1 className="font-heading text-sm font-bold text-slate-900 truncate">
                  RADIX
                </h1>
                <p className="text-[11px] text-slate-400 truncate">
                  Talent Platform
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white mx-auto">
              <Sparkles className="h-4 w-4" />
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className={`flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors ${
              collapsed ? "mx-auto mt-2" : ""
            }`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-2.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-all group ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                {!collapsed && (
                  <div className="flex-1 truncate">
                    <span className={`text-xs font-semibold truncate block ${isActive ? "text-blue-950" : "text-slate-800"}`}>
                      {item.label}
                    </span>
                    <p
                      className={`text-[10px] truncate ${
                        isActive ? "text-blue-600/80" : "text-slate-400 group-hover:text-slate-500"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Minimal Footer */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex justify-center">
          <span className="text-[11px] text-slate-400">v1.0</span>
        </div>
      </div>
    </aside>
  );
};
