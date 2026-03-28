import React, { useState, useMemo } from "react";
import { useStore } from "../store/StoreContext";
import { EventLog } from "../types";
import { Plus, Search, Calendar as CalendarIcon, MapPin, Users, Star, List, Grid, Trash2, TrendingUp, Zap, Activity, CheckCircle2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "../hooks/useTranslation";
import { WILAYAS } from "../constants";
import { cn } from "../lib/utils";
import { isAfter, isBefore, subDays, addDays, parseISO } from "date-fns";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";

export default function Events() {
  const { data, addEvent, deleteEvent, currentUser } = useStore();
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isManager = currentUser?.role === "Manager";

  const filteredEvents = useMemo(() => {
    return data.events
      .filter(
        (e) => {
          const matchesSearch = e.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.wilaya.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.clients.find((c) => c.id === e.clientId)?.companyName.toLowerCase().includes(searchTerm.toLowerCase());
          
          if (isManager) return matchesSearch;
          
          const client = data.clients.find(c => c.id === e.clientId);
          return matchesSearch && client?.assignedTo === currentUser?.id;
        }
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.events, data.clients, searchTerm, isManager, currentUser?.id]);

  const stats = useMemo(() => {
    const totalEvents = filteredEvents.length;
    const today = new Date();
    const thirtyDaysAhead = addDays(today, 30);

    const upcomingEvents = filteredEvents.filter(e => {
      const date = parseISO(e.date);
      return isAfter(date, today) && isBefore(date, thirtyDaysAhead);
    }).length;

    const completedEvents = filteredEvents.filter(e => isBefore(parseISO(e.date), today)).length;
    const totalAttendees = filteredEvents.reduce((sum, e) => sum + (e.attendees || 0), 0);

    return {
      totalEvents,
      upcomingEvents,
      completedEvents,
      totalAttendees
    };
  }, [filteredEvents]);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{t("eventsTitle")}</h1>
          <p className="text-gray-500 font-medium mt-1">{t("manageEventsDescription") || "Suivez et gérez tous vos événements passés et futurs."}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-primary-gradient text-white px-6 py-3 rounded-2xl flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-xl shadow-blue-200 text-sm font-black uppercase tracking-wider active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>{t("logEvent")}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t("totalEvents")}
          value={stats.totalEvents.toString()}
          icon={<CalendarIcon />}
          color="blue"
        />
        <StatCard
          title={t("upcomingEventsShort") || "À venir"}
          value={stats.upcomingEvents.toString()}
          icon={<Zap />}
          color="green"
        />
        <StatCard
          title={t("completedEvents") || "Terminés"}
          value={stats.completedEvents.toString()}
          icon={<CheckCircle2 />}
          color="purple"
        />
        <StatCard
          title={t("totalAttendees")}
          value={stats.totalAttendees.toLocaleString()}
          icon={<Users />}
          color="orange"
        />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t("searchEventPlaceholder")}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-gray-700 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-gray-100/50 p-1.5 rounded-2xl ml-4 border border-gray-200/50 shadow-inner">
            <button
              onClick={() => setViewMode("list")}
              className={`p-2.5 rounded-xl flex items-center transition-all ${viewMode === "list" ? "bg-white shadow-md text-primary" : "text-gray-500 hover:text-gray-700"}`}
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-2.5 rounded-xl flex items-center transition-all ${viewMode === "calendar" ? "bg-white shadow-md text-primary" : "text-gray-500 hover:text-gray-700"}`}
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === "list" ? (
            <div className="space-y-4">
              {filteredEvents.map((event) => {
                const client = data.clients.find((c) => c.id === event.clientId);
                return (
                  <div
                    key={event.id}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:border-primary transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-blue-50 rounded-lg flex-shrink-0">
                        <CalendarIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{event.eventName}</h3>
                        <p className="text-sm text-gray-500 mb-2">{client?.companyName || t("unknownClient")}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                            {new Date(event.date).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                            {event.wilaya}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1 text-gray-400" />
                            {event.attendees} {t("attendeesCount")}
                          </div>
                          <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            {event.badgesPrinted} {t("badgesCount")}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between h-full space-y-4">
                      <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-md">
                        <span className="text-sm font-medium text-yellow-700 mr-1">
                          {event.satisfactionRating}/5
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= event.satisfactionRating
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end max-w-xs">
                        {event.servicesDelivered.map((service, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                            {service}
                          </span>
                        ))}
                      </div>
                      {isManager && (
                        <button
                          onClick={() => {
                            if (confirmDeleteId === event.id) {
                              deleteEvent(event.id);
                            } else {
                              setConfirmDeleteId(event.id);
                              setTimeout(() => setConfirmDeleteId(null), 3000);
                            }
                          }}
                          className={`mt-2 p-1.5 rounded-lg transition-colors self-end ${confirmDeleteId === event.id ? 'bg-red-600 text-white hover:bg-red-700' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                          title={t("delete")}
                        >
                          {confirmDeleteId === event.id ? <span className="text-xs font-bold px-1">{t("confirm")}</span> : <Trash2 className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {filteredEvents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {t("noEventsLogged")}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredEvents.map((event) => {
                const client = data.clients.find((c) => c.id === event.clientId);
                return (
                  <div key={event.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col h-full relative group">
                    {isManager && (
                      <button
                        onClick={() => {
                          if (confirmDeleteId === event.id) {
                            deleteEvent(event.id);
                          } else {
                            setConfirmDeleteId(event.id);
                            setTimeout(() => setConfirmDeleteId(null), 3000);
                          }
                        }}
                        className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors ${confirmDeleteId === event.id ? 'bg-red-600 text-white hover:bg-red-700 opacity-100' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100'}`}
                        title={t("delete")}
                      >
                        {confirmDeleteId === event.id ? <span className="text-xs font-bold px-1">{t("confirm")}</span> : <Trash2 className="w-4 h-4" />}
                      </button>
                    )}
                    <div className="flex items-center space-x-2 mb-3 pr-8">
                      <div className="bg-blue-100 text-primary text-xs font-bold px-2 py-1 rounded">
                        {new Date(event.date).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US', { day: 'numeric', month: 'short' })}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate flex-1" title={event.eventName}>{event.eventName}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-3 truncate">{client?.companyName || t("unknownClient")}</p>
                    <div className="mt-auto space-y-2 text-xs text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1" /> {event.wilaya}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" /> {event.attendees} {t("attendeesCount")}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredEvents.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  {t("noEventsLogged")}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <NewEventModal onClose={() => setIsModalOpen(false)} onSave={addEvent} />
      )}
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

function NewEventModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (event: EventLog) => void;
}) {
  const { data, currentUser } = useStore();
  const { t } = useTranslation();
  const isManager = currentUser?.role === "Manager";
  const [formData, setFormData] = useState<Partial<EventLog>>({
    servicesDelivered: [],
    satisfactionRating: 5,
  });

  const availableClients = isManager 
    ? data.clients 
    : data.clients.filter(c => c.assignedTo === currentUser?.id);

  const availableServices = [
    { key: "ticketingPlatform", label: t("ticketingPlatform") },
    { key: "registrationForm", label: t("registrationForm") },
    { key: "mobileApp", label: t("mobileApp") },
    { key: "badgePrinting", label: t("badgePrinting") },
    { key: "hostesses", label: t("hostesses") },
    { key: "accessControl", label: t("accessControl") },
    { key: "reportsAnalytics", label: t("reportsAnalytics") },
  ];

  const handleServiceToggle = (service: string) => {
    const current = formData.servicesDelivered || [];
    if (current.includes(service)) {
      setFormData({ ...formData, servicesDelivered: current.filter((s) => s !== service) });
    } else {
      setFormData({ ...formData, servicesDelivered: [...current, service] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    } as EventLog);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t("logEventTitle")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("client")}</Label>
            <select
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
            >
              <option value="">{t("selectClient")}</option>
              {availableClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t("eventName")}</Label>
              <Input
                required
                type="text"
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              />
            </div>
            <div>
              <Label>{t("date")}</Label>
              <Input
                required
                type="date"
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>{t("wilaya")}</Label>
              <select
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                value={formData.wilaya || ""}
                onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
              >
                <option value="">Sélectionner une wilaya</option>
                {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <Label>{t("attendees")}</Label>
              <Input
                required
                type="number"
                onChange={(e) => setFormData({ ...formData, attendees: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>{t("badgesPrinted")}</Label>
              <Input
                required
                type="number"
                onChange={(e) => setFormData({ ...formData, badgesPrinted: Number(e.target.value) })}
              />
            </div>
          </div>
          
          <div>
            <Label>{t("servicesDelivered")}</Label>
            <div className="grid grid-cols-2 gap-2">
              {availableServices.map((service) => (
                <label key={service.key} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.servicesDelivered?.includes(service.label) || false}
                    onChange={() => handleServiceToggle(service.label)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>{service.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label>{t("clientSatisfaction")}</Label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({ ...formData, satisfactionRating: rating })}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating <= (formData.satisfactionRating || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-gradient text-white rounded-lg hover:opacity-90 shadow-md shadow-blue-200"
            >
              {t("save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
