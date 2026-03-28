import React, { useState, useMemo } from "react";
import { useStore } from "../store/StoreContext";
import { Client, Lead, LeadStage, ServiceType, Task } from "../types";
import { formatDZD, cn } from "../lib/utils";
import { Plus, Phone, Mail, Calendar, MoreVertical, Edit2, CheckSquare, Star, User, Trash2, Globe, ExternalLink, TrendingUp, Zap, Activity, Users } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "../hooks/useTranslation";
import { toast } from "sonner";
import { subDays, isAfter, parseISO } from "date-fns";

const STAGES: LeadStage[] = [
  "Nouveau",
  "Contacté",
  "Démo Planifiée",
  "Devis Envoyé",
  "Négociation",
  "Gagné",
  "Perdu",
];

export default function Leads() {
  const { data, addLead, updateLead, deleteLead, addClient, currentUser } = useStore();
  const { t, lang } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const stageTranslationKeys: Record<LeadStage, string> = {
    "Nouveau": "newStage",
    "Contacté": "contactedStage",
    "Démo Planifiée": "demoScheduledStage",
    "Devis Envoyé": "quoteSentStage",
    "Négociation": "negotiationStage",
    "Gagné": "wonStage",
    "Perdu": "lostStage",
  };
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [loggingCallLead, setLoggingCallLead] = useState<Lead | null>(null);
  const [loggingLinkedInLead, setLoggingLinkedInLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const isManager = currentUser?.role === "Manager";
  const isSMM = currentUser?.role === "Social Media Manager";

  const filteredLeads = useMemo(() => {
    if (isManager) return data.leads;
    return data.leads.filter(l => l.assignedTo === currentUser?.id);
  }, [data.leads, isManager, currentUser?.id]);

  const stats = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const pipelineValue = filteredLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    
    const wonLeads = filteredLeads.filter(l => l.stage === "Gagné").length;
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    const thirtyDaysAgo = subDays(new Date(), 30);
    const newLeads = filteredLeads.filter(l => isAfter(parseISO(l.createdAt), thirtyDaysAgo)).length;

    return {
      totalLeads,
      pipelineValue,
      conversionRate,
      newLeads
    };
  }, [filteredLeads]);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    if (isSMM) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDrop = (e: React.DragEvent, stage: LeadStage) => {
    if (isSMM) return;
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      const lead = data.leads.find(l => l.id === leadId);
      if (stage === "Gagné" && lead && !lead.convertedToClientId) {
        setConvertingLead(lead);
      } else {
        updateLead(leadId, { stage });
      }
    }
  };

  const confirmConversion = () => {
    if (!convertingLead) return;
    
    const newClientId = uuidv4();
    const newClient: Client = {
      id: newClientId,
      companyName: convertingLead.companyName,
      contactPerson: convertingLead.contactName,
      email: convertingLead.email,
      phone: convertingLead.phone,
      sector: t("unspecified"),
      wilaya: t("unspecified"),
      notes: t("convertedFromLead"),
      createdAt: new Date().toISOString(),
      convertedFromLeadId: convertingLead.id,
      assignedTo: convertingLead.assignedTo,
      revenue: convertingLead.estimatedValue,
    };

    addClient(newClient);
    updateLead(convertingLead.id, { stage: "Gagné", convertedToClientId: newClientId });
    
    setConvertingLead(null);
    toast.success(t("successConvert"));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{t("leadsPipeline")}</h1>
          <p className="text-gray-500 font-medium mt-1">{t("manageLeadsDescription") || "Gérez votre pipeline de ventes et convertissez vos prospects."}</p>
        </div>
        <button
          onClick={() => {
            setEditingLead(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-primary-gradient text-white px-6 py-3 rounded-2xl flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-xl shadow-blue-200 text-sm font-black uppercase tracking-wider active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>{t("newLead")}</span>
        </button>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex space-x-4 min-w-max pb-4 h-full">
          {STAGES.map((stage) => {
            const stageLeads = data.leads.filter((l) => {
              const matchesStage = l.stage === stage;
              const matchesRole = isManager || isSMM || l.assignedTo === currentUser?.id;
              if (isSMM && !["LinkedIn", "Instagram", "Facebook"].includes(l.source || "")) return false;
              return matchesStage && matchesRole;
            });
            return (
              <div
                key={stage}
                className="w-[85vw] md:w-80 bg-gray-100 rounded-xl flex flex-col max-h-full"
                onDrop={(e) => handleDrop(e, stage)}
                onDragOver={handleDragOver}
              >
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-700">{t(stageTranslationKeys[stage])}</h3>
                  <span className="bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-full font-medium">
                    {stageLeads.length}
                  </span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {stageLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      onDragStart={(e) => handleDragStart(e, lead.id)}
                      onClick={() => setSelectedLead(lead)}
                      onEdit={!isSMM ? (e) => {
                        e.stopPropagation();
                        setEditingLead(lead);
                        setIsModalOpen(true);
                      } : undefined}
                      onDelete={isManager ? (e) => {
                        e.stopPropagation();
                        deleteLead(lead.id);
                      } : undefined}
                      onLogCall={!isSMM ? (e) => {
                        e.stopPropagation();
                        setLoggingCallLead(lead);
                      } : undefined}
                      onLogLinkedIn={!isSMM ? (e) => {
                        e.stopPropagation();
                        setLoggingLinkedInLead(lead);
                      } : undefined}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <NewLeadModal 
          onClose={() => {
            setIsModalOpen(false);
            setEditingLead(null);
          }} 
          onSave={(lead) => {
            if (editingLead) {
              updateLead(editingLead.id, lead);
            } else {
              addLead(lead);
            }
          }} 
          initialData={editingLead}
        />
      )}

      {loggingCallLead && (
        <LogCallModal 
          lead={loggingCallLead} 
          onClose={() => setLoggingCallLead(null)} 
        />
      )}

      {loggingLinkedInLead && (
        <LogLinkedInModal 
          lead={loggingLinkedInLead} 
          onClose={() => setLoggingLinkedInLead(null)} 
        />
      )}

      {selectedLead && (
        <LeadDetailsModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)} 
          tasks={data.tasks.filter(t => t.relatedToId === selectedLead.id)}
        />
      )}

      {convertingLead && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t("convertLead")}</h2>
            <p className="text-gray-600 mb-6">{t("convertConfirm")}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConvertingLead(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                {t("cancel")}
              </button>
              <button
                onClick={confirmConversion}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {t("convert")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const LeadCard: React.FC<{
  lead: Lead;
  onDragStart: (e: React.DragEvent) => void;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onLogCall?: (e: React.MouseEvent) => void;
  onLogLinkedIn?: (e: React.MouseEvent) => void;
}> = ({ lead, onDragStart, onClick, onEdit, onDelete, onLogCall, onLogLinkedIn }) => {
  const { data } = useStore();
  const { t, lang } = useTranslation();
  const assignedMember = (data.team || []).find(m => m.id === lead.assignedTo);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="group bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:border-primary hover:shadow-md transition-all relative overflow-hidden"
    >
      {/* Top Section: Company & Value */}
      <div className="flex justify-between items-start mb-1">
        <h4 className="font-bold text-gray-900 line-clamp-1 flex-1 pr-2" title={lead.companyName}>
          {lead.companyName}
        </h4>
        <span className="text-sm font-bold text-primary whitespace-nowrap">
          {formatDZD(lead.estimatedValue)}
        </span>
      </div>

      {lead.eventName && (
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 truncate">
          {lead.eventName}
        </p>
      )}

      {/* Subtitle: Contact Name */}
      <p className="text-xs font-medium text-gray-500 mb-3">{lead.contactName}</p>
      
      {/* Contact Info Grid */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-gray-500 mb-4">
        <div className="flex items-center space-x-1.5 min-w-0">
          <Phone className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="truncate">{lead.phone}</span>
        </div>
        <div className="flex items-center space-x-1.5 min-w-0">
          <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="truncate">{new Date(lead.eventDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}</span>
        </div>
        <div className="flex items-center space-x-1.5 col-span-2 min-w-0">
          <Mail className="w-3 h-3 text-gray-400 shrink-0" />
          <span className="truncate">{lead.email}</span>
        </div>
      </div>

      {/* Footer: Tags & Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center space-x-2">
          {assignedMember ? (
            <div 
              className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20" 
              title={`${t("assignedTo")}: ${assignedMember.name}`}
            >
              {assignedMember.name.charAt(0)}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center" title={t("unassigned")}>
              <User className="w-3 h-3 text-gray-400" />
            </div>
          )}
          
          <div className="flex gap-1">
            {lead.website && (
              <a 
                href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 bg-gray-100 text-gray-600 hover:text-primary hover:bg-primary/10 rounded transition-colors"
                title={`${t("website")}: ${lead.website}`}
              >
                <Globe className="w-3 h-3" />
              </a>
            )}
            {lead.source === "LinkedIn" && (
              <div className="p-1 bg-blue-50 text-blue-600 rounded" title={`${t("leadSource")}: LinkedIn`}>
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </div>
            )}
            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded uppercase tracking-wider">
              {lead.serviceType.split(' ')[0]}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onLogLinkedIn && lead.source === "LinkedIn" && (
            <button
              onClick={onLogLinkedIn}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title={t("logLinkedIn")}
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
          )}
          {onLogCall && (
            <button
              onClick={onLogCall}
              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
              title={t("logCallAction")}
            >
              <Phone className="w-3.5 h-3.5" />
            </button>
          )}
          {onEdit && (
            <button 
              onClick={onEdit}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded-md transition-colors"
              title={t("edit")}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
              title={t("delete")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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

function NewLeadModal({
  onClose,
  onSave,
  initialData
}: {
  onClose: () => void;
  onSave: (lead: Lead) => void;
  initialData: Lead | null;
}) {
  const { data, currentUser } = useStore();
  const { t } = useTranslation();
  const isManager = currentUser?.role === "Manager";
  const isSMM = currentUser?.role === "Social Media Manager";
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Lead>>(
    initialData || {
      stage: "Nouveau",
      serviceType: "Plateforme uniquement",
      source: isSMM ? "LinkedIn" : "Direct",
      website: "",
      eventName: "",
      assignedTo: currentUser?.id,
      rc: "",
      nif: "",
      nis: "",
      art: "",
      rib: "",
      bankName: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    onSave({
      ...formData,
      id: initialData?.id || uuidv4(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
    } as Lead);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Sticky Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {initialData ? t("editLead") : t("newLead")}
            </h2>
            <div className="flex items-center space-x-2 mt-1">
              <div className={`h-1.5 w-8 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <div className={`h-1.5 w-8 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
              <span className="text-xs text-gray-500 font-medium ml-2">Étape {step} sur 2</span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <MoreVertical className="w-5 h-5 rotate-90" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <form id="lead-form" onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("company")}
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all"
                    value={formData.companyName || ""}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("website")}
                  </label>
                  <input
                    type="url"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                    value={formData.website || ""}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("eventName")}
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all"
                    value={formData.eventName || ""}
                    onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                    placeholder="ex: Salon de l'Auto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("contact")}
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                    value={formData.contactName || ""}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("phone")}
                    </label>
                    <input
                      required
                      type="tel"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("email")}
                    </label>
                    <input
                      required
                      type="email"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("eventDate")}
                    </label>
                    <input
                      required
                      type="date"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                      value={formData.eventDate || ""}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("estimatedValue")}
                    </label>
                    <input
                      required
                      type="number"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                      value={formData.estimatedValue || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, estimatedValue: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("serviceType")}
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                    value={formData.serviceType || "Plateforme uniquement"}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceType: e.target.value as ServiceType })
                    }
                  >
                    <option value="Plateforme uniquement">{t("platformOnly")}</option>
                    <option value="Opérations sur site">{t("onsiteOperations")}</option>
                    <option value="Package complet">{t("fullPackage")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("leadSource")}
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                    value={formData.source || "Direct"}
                    onChange={(e) =>
                      setFormData({ ...formData, source: e.target.value as any })
                    }
                    disabled={isSMM}
                  >
                    {!isSMM && <option value="Direct">{t("direct")}</option>}
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    {!isSMM && <option value="Google">Google</option>}
                    {!isSMM && <option value="Cold Email">{t("coldEmail")}</option>}
                    {!isSMM && <option value="Referral">{t("referral")}</option>}
                    {!isSMM && <option value="Salon">{t("exhibition")}</option>}
                    {!isSMM && <option value="Other">{t("other")}</option>}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("leadScore")}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                      value={formData.score || ""}
                      onChange={(e) => setFormData({ ...formData, score: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t("assignedTo")}
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                      value={formData.assignedTo || ""}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      disabled={!isManager}
                    >
                      <option value="">{t("unassigned")}</option>
                      {(data.team || []).map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("notes")}
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary transition-all"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  ></textarea>
                </div>
              </>
            ) : (
              <>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-700 font-medium">
                    Ces informations financières sont facultatives mais seront utilisées pour générer vos documents (devis, factures).
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RC (Registre de Commerce)</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                      value={formData.rc || ""}
                      onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                      placeholder="ex: 21B0123456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIF</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                      value={formData.nif || ""}
                      onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIS</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                      value={formData.nis || ""}
                      onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Article d'Imposition</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                      value={formData.art || ""}
                      onChange={(e) => setFormData({ ...formData, art: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banque</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                    value={formData.bankName || ""}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="ex: BNA, BEA, CPA..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RIB</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                    value={formData.rib || ""}
                    onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                    placeholder="20 chiffres"
                  />
                </div>
              </>
            )}
          </form>
        </div>

        {/* Sticky Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t("cancel")}
          </button>
          <div className="flex space-x-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Précédent
              </button>
            )}
            <button
              form="lead-form"
              type="submit"
              className="px-6 py-2 text-sm font-bold bg-primary-gradient text-white rounded-lg hover:opacity-90 shadow-md shadow-blue-200 transition-all"
            >
              {step === 1 ? "Suivant" : (initialData ? t("save") : t("create"))}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogCallModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { logInteraction } = useStore();
  const { t } = useTranslation();
  const [outcome, setOutcome] = useState<any>("Reached");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logInteraction({
      leadId: lead.id,
      type: "Phone Call",
      outcome,
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <Phone className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("logCall")}</h2>
            <p className="text-sm text-gray-500">{lead.companyName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("callOutcome")}</label>
            <select 
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            >
              <option value="Reached">{t("reached")}</option>
              <option value="No Answer">{t("noAnswer")}</option>
              <option value="Busy">{t("busy")}</option>
              <option value="Wrong Number">{t("wrongNumber")}</option>
              <option value="Not Interested">{t("notInterested")}</option>
              <option value="Interested">{t("interested")}</option>
              <option value="Meeting Scheduled">{t("meetingScheduled")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("notes")}</label>
            <textarea 
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
              placeholder={t("callDetailsPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t("cancel")}</button>
            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-100">{t("saveCall")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeadDetailsModal({ lead, onClose, tasks }: { lead: Lead; onClose: () => void; tasks: Task[] }) {
  const { data } = useStore();
  const { t, lang } = useTranslation();
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{lead.companyName}</h2>
            <p className="text-gray-500">{lead.contactName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">{t("contactInfo")}</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" />
                  {lead.phone}
                </div>
                <div className="flex items-center text-gray-700">
                  <Mail className="w-4 h-4 mr-3 text-gray-400" />
                  {lead.email}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">{t("projectDetails")}</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  {new Date(lead.eventDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="text-gray-400 font-bold mr-3 text-xs">DZD</span>
                  {formatDZD(lead.estimatedValue)}
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md">
                    {lead.serviceType}
                  </span>
                </div>
                {lead.score && (
                  <div className="flex items-center text-gray-700">
                    <Star className="w-4 h-4 mr-3 text-yellow-500 fill-current" />
                    Score: {lead.score}/100
                  </div>
                )}
                {lead.assignedTo && (
                  <div className="flex items-center text-gray-700">
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    {t("assignedTo")}: {(data.team || []).find(m => m.id === lead.assignedTo)?.name || t("unknown")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {lead.notes && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-gray-500 mb-2">{t("notes")}</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border border-gray-100">
                {lead.notes}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckSquare className="w-5 h-5 mr-2 text-primary" />
              {t("associatedTasks")}
            </h3>
            <div className="space-y-3">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div key={task.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {t("dueDate")}: {new Date(task.dueDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      task.completed ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {task.completed ? t("completed") : t("inProgress")}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">{t("noAssociatedTasks")}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

function LogLinkedInModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { logInteraction } = useStore();
  const { t } = useTranslation();
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logInteraction({
      leadId: lead.id,
      type: "LinkedIn Message",
      notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t("logLinkedInMessage")}</h2>
            <p className="text-sm text-gray-500">{lead.companyName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("messageNotes")}</label>
            <textarea 
              required
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
              placeholder={t("messageDetailsPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t("cancel")}</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-100">{t("saveMessage")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
