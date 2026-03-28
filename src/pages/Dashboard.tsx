import React, { useState } from "react";
import { useStore } from "../store/StoreContext";
import { cn, formatDZD } from "../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Users, DollarSign, TrendingUp, Calendar as CalendarIcon, Clock, Target, Trophy, Zap, Phone, Star, Mail, LogIn, LogOut as LogOutIcon, CheckCircle2, Plus, Activity, ListChecks, FileText, ChevronRight, AlertCircle, History, X, Calendar, Edit2, Save, Trash2 } from "lucide-react";
import { isAfter, isBefore, addDays, parseISO, isToday } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { ExpectedRevenue } from "../types";

import { useTranslation } from "../hooks/useTranslation";
import { Page } from "../App";

export default function Dashboard({ setCurrentPage }: { setCurrentPage: (page: Page) => void }) {
  const { data, currentUser, loading, isInitialFetchDone, checkIn, checkOut, addExpectedRevenue, updateExpectedRevenue, deleteExpectedRevenue } = useStore();
  const { t, lang } = useTranslation();
  const [chartTab, setChartTab] = useState<"comparison" | "expected" | "actual" | "team">("comparison");
  const [isAttendanceHistoryOpen, setIsAttendanceHistoryOpen] = useState(false);
  const [isExpectedRevenueModalOpen, setIsExpectedRevenueModalOpen] = useState(false);
  const [editingRevenueId, setEditingRevenueId] = useState<string | null>(null);
  const [editRevenueAmount, setEditRevenueAmount] = useState<number>(0);
  const [deletingRevenueId, setDeletingRevenueId] = useState<string | null>(null);

  const isManager = currentUser?.role === "Manager";
  const isSMM = currentUser?.role === "Social Media Manager";

  // Filter leads based on role
  const visibleLeads = isManager || isSMM
    ? data.leads 
    : data.leads.filter(l => l.assignedTo === currentUser?.id);

  const totalLeads = visibleLeads.length;
  const wonLeads = visibleLeads.filter((l) => l.stage === "Gagné").length;
  const conversionRate = totalLeads ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";

  const totalRevenueWon = data.clients
    .filter(c => isManager || c.assignedTo === currentUser?.id)
    .reduce((sum, client) => {
      const clientEvents = data.events.filter((e) => e.clientId === client.id);
      const calculatedRevenue = clientEvents.reduce((eventSum, e) => {
        const offer = data.offers.find(
          (o) => o.relatedToType === "Client" && o.relatedToId === client.id && o.eventName === e.eventName
        );
        return eventSum + (offer ? offer.price : 0);
      }, 0);
      const revenue = client.revenue !== undefined ? client.revenue : calculatedRevenue;
      return sum + revenue;
    }, 0);

  const pipelineValue = visibleLeads
    .filter((l) => l.stage !== "Gagné" && l.stage !== "Perdu")
    .reduce((sum, l) => sum + l.estimatedValue, 0);

  // Top 5 clients by revenue
  const topClients = [...data.clients]
    .map((c) => {
      const revenue = data.events
        .filter((e) => e.clientId === c.id)
        .reduce((sum, e) => {
          // Find associated offer for price
          const offer = data.offers.find((o) => o.relatedToType === "Client" && o.relatedToId === c.id && o.eventName === e.eventName);
          return sum + (offer ? offer.price : 0);
        }, 0);
      return { ...c, revenue };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Upcoming events next 30 days
  const today = new Date();
  const next30Days = addDays(today, 30);
  const upcomingEvents = data.events
    .filter((e) => {
      // If agent, only show events for their clients
      if (!isManager) {
        const client = data.clients.find(c => c.id === e.clientId);
        if (client?.assignedTo !== currentUser?.id) return false;
      }
      const eventDate = parseISO(e.date);
      return isAfter(eventDate, today) && isBefore(eventDate, next30Days);
    })
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

  // Overdue tasks
  const overdueTasks = data.tasks.filter(
    (t) => {
      if (!isManager && t.assignedTo !== currentUser?.id) return false;
      return !t.completed && isBefore(parseISO(t.dueDate), today);
    }
  );

  // Team Performance
  const teamStats = (data.team || [])
    .map((member) => {
      const memberLeads = data.leads.filter((l) => l.assignedTo === member.id);
      const wonLeads = memberLeads.filter((l) => l.stage === "Gagné");
      const revenue = wonLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);
      return { ...member, revenue, leadsCount: memberLeads.length };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Calculate actual vs expected revenue per month for the current year
  const currentYear = new Date().getFullYear();
  const months = [
    t("jan"), t("feb"), t("mar"), t("apr"), t("mayShort"), t("jun"),
    t("jul"), t("aug"), t("sep"), t("oct"), t("nov"), t("dec")
  ];
  
  const monthlyData = months.map((month, index) => {
    const monthLeads = data.leads.filter(l => {
      if (!l.eventDate) return false;
      const d = new Date(l.eventDate);
      return d.getFullYear() === currentYear && d.getMonth() === index;
    });

    const actual = monthLeads
      .filter(l => l.stage === "Gagné")
      .reduce((sum, l) => sum + l.estimatedValue, 0);

    const expectedRev = data.expectedRevenues.find(r => r.year === currentYear && r.month === index);
    const expected = expectedRev ? expectedRev.amount : 0;

    return {
      name: month,
      [t("actual")]: actual,
      [t("expected")]: expected
    };
  });

  // Team Performance Data for Chart
  const teamPerformanceData = (data.team || [])
    .filter(m => m.role === "Sales Agent")
    .map(member => {
      return {
        name: member.name.split(' ')[0],
        points: member.totalPointsBalance || 0
      };
    });

  // Leaderboard
  const leaderboard = (data.team || [])
    .filter(m => m.role === "Sales Agent")
    .sort((a, b) => (b.totalPointsBalance || 0) - (a.totalPointsBalance || 0))
    .slice(0, 5);


  const internalStages = ["Nouveau", "Contacté", "Démo Planifiée", "Devis Envoyé", "Négociation", "Gagné", "Perdu"];
  const pipelineDistribution = internalStages.map((stage, index) => ({
    name: [
      t("newStage"), 
      t("contactedStage"), 
      t("demoScheduledStage"), 
      t("quoteSentStage"), 
      t("negotiationStage"), 
      t("wonStage"), 
      t("lostStage")
    ][index],
    value: visibleLeads.filter(l => l.stage === stage).length
  })).filter(item => item.value > 0);

  const COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#10B981', '#EF4444'];

  // Recent Activity
  const recentInteractions = [...data.interactions]
    .filter(i => isManager || i.actionBy === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Expected Revenue Logic
  const sortedRevenues = [...data.expectedRevenues].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });

  const handleEditRevenue = (rev: ExpectedRevenue) => {
    setEditingRevenueId(rev.id);
    setEditRevenueAmount(rev.amount);
  };

  const handleSaveEditRevenue = (id: string) => {
    updateExpectedRevenue(id, { amount: editRevenueAmount });
    setEditingRevenueId(null);
  };

  const confirmDeleteRevenue = (id: string) => {
    deleteExpectedRevenue(id);
    setDeletingRevenueId(null);
  };

  if (isSMM) {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const socialLeadsThisMonth = data.leads.filter(l => {
      const d = new Date(l.createdAt);
      return d.getMonth() === currentMonth && 
             d.getFullYear() === currentYear && 
             ["LinkedIn", "Instagram", "Facebook"].includes(l.source || "");
    }).length;

    const scheduledPostsToday = data.socialPosts.filter(p => {
      return p.status === "Scheduled" && isToday(parseISO(p.scheduledDate));
    }).length;

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-900">{t("socialDashboard")}</h1>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("socialLeadsMonth")}
            value={socialLeadsThisMonth.toString()}
            icon={<Users />}
            color="blue"
          />
          <StatCard
            title={t("scheduledPostsToday")}
            value={scheduledPostsToday.toString()}
            icon={<CalendarIcon />}
            color="purple"
          />
          <StatCard
            title={t("activeCampaigns")}
            value={data.campaigns.filter(c => isBefore(new Date(), parseISO(c.endDate))).length.toString()}
            icon={<Target />}
            color="green"
          />
          <StatCard
            title={t("pendingIdeas")}
            value={data.contentIdeas.filter(i => i.status === "Idea").length.toString()}
            icon={<Zap />}
            color="orange"
          />
        </div>

        {/* Upcoming Events Row */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-orange-500" />
              {t("upcomingEventsContent")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 4).map((event) => {
                  const client = data.clients.find(c => c.id === event.clientId);
                  return (
                    <div key={event.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-orange-200 transition-colors bg-white shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="bg-orange-50 text-orange-600 p-2 rounded-lg text-center min-w-[2.5rem]">
                          <div className="text-[9px] font-black uppercase">{new Date(event.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' })}</div>
                          <div className="text-sm font-black leading-none">{new Date(event.date).getDate()}</div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{event.eventName}</p>
                          <p className="text-[10px] text-gray-500">{client?.companyName || t("unknownClient")}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-8 italic col-span-full">{t("noEventsScheduled")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">{t("dashboard")}</h1>
        
        {/* Check In / Out Section for Agents */}
        {!isManager && !isSMM && (
          <div className="flex items-center bg-white p-1 rounded-xl shadow-sm border border-gray-200">
            {!currentUser?.isCurrentlyCheckedIn ? (
              <button
                onClick={checkIn}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-bold text-sm shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>{t("checkIn")}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-4 px-2">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{t("arrivedAt")}</span>
                  <span className="text-sm font-black text-gray-900">
                    {currentUser.checkInTime ? new Date(currentUser.checkInTime).toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </span>
                </div>
                <button
                  onClick={checkOut}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm"
                >
                  <LogOutIcon className="w-4 h-4" />
                  <span>{t("checkOut")}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && !isInitialFetchDone ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title={t("totalLeads")}
              value={totalLeads.toString()}
              icon={<Users />}
              trend={`${conversionRate}% ${t("conversion")}`}
              color="blue"
            />
            <StatCard
              title={t("wonRevenue")}
              value={formatDZD(totalRevenueWon)}
              icon={<DollarSign />}
              color="green"
            />
            <StatCard
              title={t("pipelineValue")}
              value={formatDZD(pipelineValue)}
              icon={<TrendingUp />}
              color="purple"
            />
            <StatCard
              title={t("upcomingEvents")}
              value={upcomingEvents.length.toString()}
              icon={<CalendarIcon />}
              color="orange"
            />
          </>
        )}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue/Points Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-lg font-bold text-gray-900">{t("performanceAnalysis")}</h2>
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg self-start">
              {isManager && (
                <button
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                    chartTab === "team" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  }`}
                  onClick={() => setChartTab("team")}
                >
                  {t("teamPoints")}
                </button>
              )}
              <button
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  chartTab === "comparison" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
                onClick={() => setChartTab("comparison")}
              >
                {t("comparison")}
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  chartTab === "actual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
                onClick={() => setChartTab("actual")}
              >
                {t("actual")}
              </button>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartTab === "team" ? (
                <BarChart data={teamPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="points" name={t("points")} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10}}
                    tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatDZD(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  {(chartTab === "comparison" || chartTab === "actual") && (
                    <Bar dataKey={t("actual")} fill="#059669" radius={[4, 4, 0, 0]} />
                  )}
                  {(chartTab === "comparison" || chartTab === "expected") && (
                    <Bar dataKey={t("expected")} fill="#2563eb" radius={[4, 4, 0, 0]} />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pipeline Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t("pipelineDistribution")}</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pipelineDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{fontSize: '10px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions & Team Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance / My Progress */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          {isManager ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-bold text-gray-900">{t("attendanceTeam")}</h3>
                  <button 
                    onClick={() => setIsAttendanceHistoryOpen(true)}
                    className="p-1 text-gray-400 hover:text-primary transition-colors"
                    title={t("attendanceHistory")}
                  >
                    <History className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t("today")}</span>
              </div>
              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {(data.team || []).filter(m => m.role === "Sales Agent").map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 border border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                          {member.name.charAt(0)}
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
                          member.isCurrentlyCheckedIn ? "bg-emerald-500" : "bg-gray-300"
                        )} />
                      </div>
                      <span className="text-xs font-bold text-gray-900 truncate max-w-[80px]">{member.name.split(' ')[0]}</span>
                    </div>
                    <div className="text-right">
                      {member.checkInTime ? (
                        <span className="text-[9px] font-bold text-emerald-600 uppercase">{new Date(member.checkInTime).toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      ) : (
                        <span className="text-[9px] font-bold text-gray-400 uppercase italic">{t("absent")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold text-gray-900">{t("myTarget")}</h3>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">{t("achieved")}</span>
                  <span className="font-bold text-primary">{Math.round((totalRevenueWon / (currentUser?.target || 1000000)) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-primary-gradient h-2 rounded-full" 
                    style={{ width: `${Math.min(100, (totalRevenueWon / (currentUser?.target || 1000000)) * 100)}%` }}
                  ></div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-[10px] text-blue-600 font-bold uppercase mb-1 tracking-wider">{t("performancePoints")}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-blue-700">{currentUser?.totalPointsBalance || 0}</span>
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Leaderboard / Team Stats */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-gray-900">{t("leaderboard")}</h3>
            </div>
          </div>
          <div className="space-y-2">
            {leaderboard.map((member, index) => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <span className={cn(
                    "text-xs font-black",
                    index === 0 ? "text-amber-500" : index === 1 ? "text-slate-400" : index === 2 ? "text-orange-400" : "text-gray-300"
                  )}>#{index + 1}</span>
                  <span className="text-xs font-bold text-gray-900 truncate max-w-[100px]">{member.name}</span>
                </div>
                <span className="text-[10px] font-black text-blue-600">{member.totalPointsBalance || 0} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <h3 className="text-sm font-bold text-gray-900">{t("quickActions")}</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 flex-1">
            <button 
              onClick={() => setCurrentPage('Leads')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors group h-full"
            >
              <Plus className="w-5 h-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-blue-700">{t("newLead")}</span>
            </button>
            <button 
              onClick={() => setCurrentPage('Tasks')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors group h-full"
            >
              <ListChecks className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-emerald-700">{t("newTask")}</span>
            </button>
            <button 
              onClick={() => setCurrentPage('FinancialDocuments')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors group h-full"
            >
              <FileText className="w-5 h-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-purple-700">{t("createOffer")}</span>
            </button>
            <button 
              onClick={() => setCurrentPage('Instructions')}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors group h-full"
            >
              <Star className="w-5 h-5 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold text-amber-700">{t("guide")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overdue Tasks Alert */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
            <p className="text-sm text-red-700 font-bold">
              {t("overdueTasks", { count: overdueTasks.length })}
            </p>
          </div>
          <button 
            onClick={() => setCurrentPage('Tasks')}
            className="text-xs font-bold text-red-600 hover:underline"
          >
            {t("viewAll")}
          </button>
        </div>
      )}

      {isAttendanceHistoryOpen && (
        <AttendanceHistoryModal 
          onClose={() => setIsAttendanceHistoryOpen(false)} 
        />
      )}

      {isExpectedRevenueModalOpen && (
        <NewExpectedRevenueModal
          onClose={() => setIsExpectedRevenueModalOpen(false)}
          onSave={addExpectedRevenue}
          currentYear={currentYear}
          t={t}
        />
      )}

      {/* Expected Revenue Row */}
      {isManager && (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                {t("expectedRevenueTitle")}
              </h2>
              <button
                onClick={() => setIsExpectedRevenueModalOpen(true)}
                className="bg-primary-gradient text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 hover:opacity-90 transition-all shadow-sm text-xs font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>{t("addRevenue")}</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("year")}</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("month")}</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">{t("amount")}</th>
                    <th className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedRevenues.map((rev) => (
                    <tr key={rev.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{rev.year}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{months[rev.month]}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-primary">
                        {editingRevenueId === rev.id ? (
                          <input
                            type="number"
                            value={editRevenueAmount}
                            onChange={(e) => setEditRevenueAmount(Number(e.target.value))}
                            className="border border-gray-300 rounded px-2 py-1 w-24 focus:ring-primary focus:border-primary text-sm"
                            autoFocus
                          />
                        ) : (
                          formatDZD(rev.amount)
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        {editingRevenueId === rev.id ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => handleSaveEditRevenue(rev.id)} className="text-green-600 hover:text-green-900">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={() => setEditingRevenueId(null)} className="text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            <button onClick={() => handleEditRevenue(rev)} className="text-primary hover:text-primary-dark">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => setDeletingRevenueId(rev.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sortedRevenues.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500 italic">
                        {t("noForecastFound")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRevenueId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t("confirmDeleteForecast")}</h3>
            <p className="text-gray-600 mb-6">{t("confirmDeleteForecastMessage")}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeletingRevenueId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => confirmDeleteRevenue(deletingRevenueId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Events Row */}
      <div className="grid grid-cols-1 gap-6">
        {/* Upcoming Events */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-orange-500" />
            {t("upcomingEventsTitle")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.slice(0, 4).map((event) => {
                const client = data.clients.find(c => c.id === event.clientId);
                return (
                  <div key={event.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-orange-200 transition-colors bg-white shadow-sm">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-50 text-orange-600 p-2 rounded-lg text-center min-w-[2.5rem]">
                        <div className="text-[9px] font-black uppercase">{new Date(event.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short' })}</div>
                        <div className="text-sm font-black leading-none">{new Date(event.date).getDate()}</div>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{event.eventName}</p>
                        <p className="text-[10px] text-gray-500">{client?.companyName || t("unknownClient")}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-8 italic col-span-full">{t("noEventsScheduled")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        <div className="w-16 h-4 bg-gray-100 rounded"></div>
      </div>
      <div className="w-24 h-8 bg-gray-200 rounded mb-2"></div>
      <div className="w-32 h-4 bg-gray-100 rounded"></div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  color = "blue"
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  color?: "blue" | "green" | "purple" | "orange";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
  };

  const cookieMaskStyle = {
    maskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50,0 C61,0 67,2 73,8 C79,14 86,21 92,27 C98,33 100,39 100,50 C100,61 98,67 92,73 C86,79 79,86 73,92 C67,98 61,100 50,100 C39,100 33,98 27,92 C21,86 14,79 8,73 C2,67 0,61 0,50 C0,39 2,33 8,27 C14,21 21,14 27,8 C33,2 39,0 50,0 Z'/%3E%3C/svg%3E")`,
    maskSize: 'contain',
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50,0 C61,0 67,2 73,8 C79,14 86,21 92,27 C98,33 100,39 100,50 C100,61 98,67 92,73 C86,79 79,86 73,92 C67,98 61,100 50,100 C39,100 33,98 27,92 C21,86 14,79 8,73 C2,67 0,61 0,50 C0,39 2,33 8,27 C14,21 21,14 27,8 C33,2 39,0 50,0 Z'/%3E%3C/svg%3E")`,
    WebkitMaskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center'
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 group relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div 
            className={cn("p-3 transition-transform duration-300 group-hover:scale-110", colors[color])}
            style={cookieMaskStyle}
          >
            {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
          </div>
          {trend && (
            <div className="flex items-center space-x-1 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700">{trend}</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
        </div>
      </div>
      
      {/* Decorative background blob */}
      <div 
        className={cn("absolute -right-6 -bottom-6 w-24 h-24 opacity-5 group-hover:scale-150 transition-transform duration-500 ease-out", 
          color === 'blue' ? 'bg-blue-500' : 
          color === 'green' ? 'bg-emerald-500' : 
          color === 'purple' ? 'bg-purple-500' : 
          'bg-orange-500'
        )} 
        style={cookieMaskStyle}
      />
    </div>
  );
}

function AttendanceHistoryModal({ onClose }: { onClose: () => void }) {
  const { data, currentUser } = useStore();
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isManager = currentUser?.role === "Manager";

  const filteredAttendance = (data.attendance || [])
    .filter(record => {
      // Filter by user role
      if (!isManager && record.userId !== currentUser?.id) return false;

      const matchesName = (record.userName || "").toLowerCase().includes(searchTerm.toLowerCase());
      const recordDate = new Date(record.date);
      const matchesStart = startDate ? recordDate >= new Date(startDate) : true;
      const matchesEnd = endDate ? recordDate <= new Date(endDate) : true;
      return matchesName && matchesStart && matchesEnd;
    })
    .sort((a, b) => {
      // Sort by date descending
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      
      // Secondary sort by check-in time
      const timeA = a.checkIn ? new Date(a.checkIn).getTime() : 0;
      const timeB = b.checkIn ? new Date(b.checkIn).getTime() : 0;
      return timeB - timeA;
    });

  const totalHours = filteredAttendance.reduce((total, record) => {
    if (record.checkIn && record.checkOut) {
      const start = new Date(record.checkIn).getTime();
      const end = new Date(record.checkOut).getTime();
      return total + (end - start) / (1000 * 60 * 60);
    }
    return total;
  }, 0);

  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return "--";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const diff = endTime - startTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t("attendanceHistory")}</h2>
              <p className="text-sm text-gray-500">
                {t("attendanceTracking")} {isManager ? t("teamGenitive") : t("personal")}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-white space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isManager && (
              <div className="relative">
                <History className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder={t("searchEmployee")}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <div>
              <input 
                type="date" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <input 
                type="date" 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex justify-between items-center">
            <span className="text-sm font-medium text-emerald-800">{t("totalHoursWorked")}</span>
            <span className="text-lg font-black text-emerald-600">{totalHours.toFixed(1)}h</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
          {filteredAttendance.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">{t("agent")}</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">{t("date")}</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">{t("arrival")}</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">{t("departure")}</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">{t("duration")}</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-right">{t("points")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAttendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                          {(record.userName || "?").charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900">{record.userName || t("unknown")}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {record.date ? new Date(record.date).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded text-xs font-bold">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-bold">
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString(lang === 'fr' ? 'fr-DZ' : 'en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </span>
                    </td>
                    <td className="p-4 text-center text-sm font-medium text-gray-700">
                      {calculateDuration(record.checkIn, record.checkOut)}
                    </td>
                    <td className="p-4 text-right">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-xs font-bold",
                        (record.pointsEarned || 0) >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      )}>
                        {(record.pointsEarned || 0) > 0 ? "+" : ""}{record.pointsEarned || 0} pts
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">{t("noHistoryFound")}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewExpectedRevenueModal({
  onClose,
  onSave,
  currentYear,
  t
}: {
  onClose: () => void;
  onSave: (revenue: ExpectedRevenue) => void;
  currentYear: number;
  t: any;
}) {
  const [formData, setFormData] = useState<Partial<ExpectedRevenue>>({
    year: currentYear,
    month: new Date().getMonth(),
    amount: 0,
  });

  const months = [
    t("jan"), t("feb"), t("mar"), t("apr"), t("mayShort"), t("jun"), 
    t("jul"), t("aug"), t("sep"), t("oct"), t("nov"), t("dec")
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: uuidv4(),
    } as ExpectedRevenue);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t("addRevenue")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("year")}
              </label>
              <input
                required
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                value={formData.year ?? currentYear}
                onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("month")}
              </label>
              <select
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                value={formData.month ?? 0}
                onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })}
              >
                {months.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("amount")} (DZD)
            </label>
            <input
              required
              type="number"
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
              value={formData.amount ?? 0}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
