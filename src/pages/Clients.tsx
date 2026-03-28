import React, { useState, useRef, useMemo } from "react";
import { useStore } from "../store/StoreContext";
import { Client } from "../types";
import { formatDZD, cn } from "../lib/utils";
import { Plus, Search, MapPin, Phone, Mail, Building2, Users as UsersIcon, CheckSquare, Edit2, X, Paperclip, FileText, Download, Trash2, ChevronLeft, ChevronRight, Users, TrendingUp, Calendar, Zap, Activity } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "../hooks/useTranslation";
import { WILAYAS } from "../constants";
import { subDays, isAfter, parseISO } from "date-fns";

export default function Clients() {
  const { data, addClient, updateClient, deleteClient, currentUser, uploadFile, deleteDocument } = useStore();
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const isManager = currentUser?.role === "Manager";

  const filteredClients = useMemo(() => {
    return data.clients.filter(
      (c) => {
        const matchesSearch = c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.wilaya.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (isManager) return matchesSearch;
        return matchesSearch && c.assignedTo === currentUser?.id;
      }
    );
  }, [data.clients, searchTerm, isManager, currentUser?.id]);

  // Statistics calculations
  const stats = useMemo(() => {
    const totalClients = filteredClients.length;
    
    const totalRevenue = filteredClients.reduce((sum, client) => {
      const clientEvents = data.events.filter((e) => e.clientId === client.id);
      const calculatedRevenue = clientEvents.reduce((eventSum, e) => {
        const offer = data.offers.find(
          (o) => o.relatedToType === "Client" && o.relatedToId === client.id && o.eventName === e.eventName
        );
        return eventSum + (offer ? offer.price : 0);
      }, 0);
      return sum + (client.revenue !== undefined ? client.revenue : calculatedRevenue);
    }, 0);

    const thirtyDaysAgo = subDays(new Date(), 30);
    const newClients = filteredClients.filter(c => isAfter(parseISO(c.createdAt), thirtyDaysAgo)).length;

    const today = new Date();
    const activeEvents = data.events.filter(e => {
      const isUpcoming = isAfter(parseISO(e.date), today);
      if (!isUpcoming) return false;
      const client = data.clients.find(c => c.id === e.clientId);
      if (!client) return false;
      if (!isManager && client.assignedTo !== currentUser?.id) return false;
      return true;
    }).length;

    return {
      totalClients,
      totalRevenue,
      newClients,
      activeEvents
    };
  }, [filteredClients, data.events, data.offers, data.clients, isManager, currentUser?.id]);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{t("clientsTitle")}</h1>
          <p className="text-gray-500 font-medium mt-1">{t("manageClientsDescription") || "Gérez votre base de clients et suivez leurs performances."}</p>
        </div>
        <button
          onClick={() => {
            setEditingClient(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-primary-gradient text-white px-6 py-3 rounded-2xl flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-xl shadow-blue-200 text-sm font-black uppercase tracking-wider active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>{t("newClient")}</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t("searchClientPlaceholder")}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-gray-700 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  {t("company")}
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  {t("contact")}
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  {t("location")}
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  {t("events")}
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  {t("totalRevenue")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClients.map((client) => {
                const clientEvents = data.events.filter((e) => e.clientId === client.id);
                const calculatedRevenue = clientEvents.reduce((sum, e) => {
                  const offer = data.offers.find(
                    (o) => o.relatedToType === "Client" && o.relatedToId === client.id && o.eventName === e.eventName
                  );
                  return sum + (offer ? offer.price : 0);
                }, 0);
                const revenue = client.revenue !== undefined ? client.revenue : calculatedRevenue;

                return (
                  <tr
                    key={client.id}
                    className="hover:bg-primary/5 cursor-pointer transition-all group"
                    onClick={() => setSelectedClient(client)}
                  >
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 bg-white border-2 border-gray-50 rounded-2xl flex items-center justify-center shadow-sm group-hover:border-primary/20 transition-all">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm font-black text-gray-800 group-hover:text-primary transition-colors">
                              {client.companyName}
                            </div>
                            {client.convertedFromLeadId && (
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-green-100">
                                {t("convertedBadge")}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{client.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-700">{client.contactPerson}</div>
                      <div className="text-xs font-medium text-gray-400 mt-0.5">{client.email}</div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center text-xs font-bold text-gray-600">
                        <MapPin className="w-4 h-4 mr-1.5 text-primary opacity-60" />
                        {client.wilaya}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-black rounded-lg">
                        {clientEvents.length}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-primary">{formatDZD(revenue)}</span>
                        {isManager && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirmDeleteId === client.id) {
                                deleteClient(client.id);
                              } else {
                                setConfirmDeleteId(client.id);
                                setTimeout(() => setConfirmDeleteId(null), 3000);
                              }
                            }}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              confirmDeleteId === client.id 
                                ? "bg-red-500 text-white shadow-lg shadow-red-200 opacity-100" 
                                : "text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                            )}
                            title={t("delete")}
                          >
                            {confirmDeleteId === client.id ? <span className="text-[10px] font-black px-1">{t("confirm")}</span> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredClients.length === 0 && (
            <div className="p-20 text-center">
              <div className="inline-flex p-6 bg-gray-50 rounded-[2rem] mb-4">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-gray-400 font-bold">{t("noClientsFound")}</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <NewClientModal 
          onClose={() => {
            setIsModalOpen(false);
            setEditingClient(null);
          }} 
          onSave={(client) => {
            if (editingClient) {
              updateClient(editingClient.id, client);
            } else {
              addClient(client);
            }
          }} 
          initialData={editingClient}
        />
      )}

      {selectedClient && (
        <ClientDetailsModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onEdit={() => {
            setEditingClient(selectedClient);
            setSelectedClient(null);
            setIsModalOpen(true);
          }}
          tasks={data.tasks.filter(t => t.relatedToId === selectedClient.id)}
          isManager={isManager}
          deleteClient={deleteClient}
        />
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

function NewClientModal({
  onClose,
  onSave,
  initialData,
}: {
  onClose: () => void;
  onSave: (client: Client) => void;
  initialData?: Client | null;
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Client>>(initialData || { 
    documents: [],
    rc: "",
    nif: "",
    nis: "",
    art: "",
    rib: "",
    bankName: "",
    address: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const [isUploading, setIsUploading] = useState(false);
  const { uploadFile } = useStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const publicUrl = await uploadFile(file);
      setIsUploading(false);

      if (publicUrl) {
        const newDoc = {
          id: uuidv4(),
          name: file.name,
          url: publicUrl,
          type: file.type || "application/octet-stream",
          size: file.size,
          createdAt: new Date().toISOString()
        };
        setFormData({
          ...formData,
          documents: [...(formData.documents || []), newDoc]
        });
      }
    }
  };

  const removeDocument = (id: string) => {
    setFormData({
      ...formData,
      documents: (formData.documents || []).filter(d => d.id !== id)
    });
  };

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
    } as Client);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Modern Header */}
        <div className="bg-primary-gradient px-8 py-10 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-all hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">
                {initialData ? t("editClient") : t("newClient")}
              </h2>
              <p className="text-blue-100/80 font-medium mt-1">
                {step === 1 ? "Informations de contact" : "Détails financiers & bancaires"}
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center mt-10 space-x-4">
            <div className="flex items-center flex-1">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 ${
                step >= 1 ? 'bg-white text-primary shadow-xl scale-110' : 'bg-white/20 text-white/60'
              }`}>
                1
              </div>
              <div className="flex-1 mx-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
                <div className={`h-full bg-white transition-all duration-700 ease-out ${step > 1 ? 'w-full' : 'w-0'}`} />
              </div>
            </div>
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 ${
                step >= 2 ? 'bg-white text-primary shadow-xl scale-110' : 'bg-white/20 text-white/60'
              }`}>
                2
              </div>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <form id="client-form" onSubmit={handleSubmit} className="space-y-8">
            {step === 1 ? (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                    {t("company")}
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Nom de l'entreprise"
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium"
                    value={formData.companyName || ""}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      {t("sector")}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: Technologie, BTP..."
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium"
                      value={formData.sector || ""}
                      onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      {t("wilaya")}
                    </label>
                    <select
                      required
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium appearance-none cursor-pointer"
                      value={formData.wilaya || ""}
                      onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                    >
                      <option value="">Sélectionner</option>
                      {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                    {t("contactPerson")}
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Nom du contact principal"
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium"
                    value={formData.contactPerson || ""}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      {t("phone")}
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="05XX XX XX XX"
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                      {t("email")}
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="contact@entreprise.com"
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                    {t("revenueDZD")}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-bold"
                      value={formData.revenue || ""}
                      onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">DZD</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                    {t("notes")}
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Informations complémentaires..."
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium resize-none"
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                    {t("attachedDocuments")}
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {(formData.documents || []).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl group hover:border-primary/20 transition-all">
                        <div className="flex items-center space-x-4 overflow-hidden">
                          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:text-primary transition-colors">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-700 truncate max-w-[200px]">{doc.name}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{(doc.size / 1024).toFixed(1)} KB</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(doc.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-400 hover:bg-gray-50 hover:border-primary/40 hover:text-primary flex flex-col items-center justify-center space-y-2 transition-all disabled:opacity-50"
                  >
                    <div className="p-3 bg-gray-100 rounded-full group-hover:bg-primary/10 transition-colors">
                      <Paperclip className="w-6 h-6" />
                    </div>
                    <span>{isUploading ? t("uploading") : t("addDocument")}</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
                <div className="bg-blue-50/50 p-5 rounded-2xl border-2 border-blue-100/50 flex items-start space-x-4">
                  <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-blue-700 font-semibold leading-relaxed">
                    Ces informations financières sont facultatives mais seront utilisées pour générer automatiquement vos documents officiels (devis, factures).
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Adresse complète</label>
                  <textarea
                    rows={2}
                    placeholder="Adresse du siège social"
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium resize-none"
                    value={formData.address || ""}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">RC (Registre de Commerce)</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium"
                      value={formData.rc || ""}
                      onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">NIF</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium"
                      value={formData.nif || ""}
                      onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">NIS</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium"
                      value={formData.nis || ""}
                      onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Article d'Imposition</label>
                    <input
                      type="text"
                      className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium"
                      value={formData.art || ""}
                      onChange={(e) => setFormData({ ...formData, art: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Banque</label>
                  <input
                    type="text"
                    placeholder="Nom de la banque"
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-medium"
                    value={formData.bankName || ""}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">RIB (20 chiffres)</label>
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000 0000"
                    className="w-full bg-gray-50 border-2 border-transparent rounded-2xl px-5 py-4 focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-gray-700 font-bold tracking-widest"
                    value={formData.rib || ""}
                    onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-8 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center space-x-2 px-6 py-4 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>{t("back")}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-4 text-gray-400 font-bold hover:bg-gray-100 rounded-2xl transition-all"
            >
              {t("cancel")}
            </button>
          )}

          <div className="flex space-x-4">
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center space-x-3 px-10 py-4 bg-primary-gradient text-white font-black rounded-2xl hover:opacity-90 shadow-xl shadow-blue-200 transition-all active:scale-95"
              >
                <span>{t("next")}</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                form="client-form"
                type="submit"
                className="px-12 py-4 bg-primary-gradient text-white font-black rounded-2xl hover:opacity-90 shadow-xl shadow-blue-200 transition-all active:scale-95"
              >
                {initialData ? t("save") : t("createClient")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClientDetailsModal({ 
  client, 
  onClose, 
  onEdit, 
  tasks, 
  isManager, 
  deleteClient 
}: { 
  client: Client; 
  onClose: () => void; 
  onEdit: () => void; 
  tasks: any[]; 
  isManager: boolean; 
  deleteClient: (id: string) => void 
}) {
  const { data, deleteDocument } = useStore();
  const { t, lang } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);
  const clientEvents = data.events.filter((e) => e.clientId === client.id);
  const clientOffers = data.offers.filter((o) => o.relatedToType === "Client" && o.relatedToId === client.id);

  const handleDownload = async (url: string, fileName: string) => {
    console.log('Attempting download:', { url, fileName });
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download error, falling back to new tab:', error);
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Modern Header */}
        <div className="bg-primary-gradient px-8 py-10 text-white relative">
          <div className="absolute top-6 right-6 flex items-center space-x-3">
            {isManager && (
              <button
                onClick={() => {
                  if (confirmDelete) {
                    deleteClient(client.id);
                    onClose();
                  } else {
                    setConfirmDelete(true);
                    setTimeout(() => setConfirmDelete(false), 3000);
                  }
                }}
                className={`p-2.5 rounded-2xl transition-all ${confirmDelete ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-white/10 hover:bg-red-500/20 text-white'}`}
                title={t("delete")}
              >
                {confirmDelete ? <span className="text-xs font-black px-2">{t("confirm")}</span> : <Trash2 className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={onEdit}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
              title={t("edit")}
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all hover:rotate-90"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="p-5 bg-white/20 backdrop-blur-md rounded-[2rem] shadow-inner">
              <Building2 className="w-12 h-12 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-4xl font-black tracking-tight">{client.companyName}</h2>
                {client.convertedFromLeadId && (
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-[10px] font-black rounded-full uppercase tracking-widest border border-white/20">
                    {t("convertedBadge")}
                  </span>
                )}
              </div>
              <p className="text-blue-100/80 font-bold text-lg mt-1 tracking-wide uppercase text-sm opacity-80">
                {client.sector} • {client.wilaya}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Info Cards */}
            <div className="lg:col-span-4 space-y-6">
              {/* Contact Card */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                  <UsersIcon className="w-4 h-4 mr-2 text-primary" />
                  {t("contact")}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center p-3 bg-gray-50 rounded-2xl group hover:bg-primary/5 transition-colors">
                    <div className="p-2 bg-white rounded-xl shadow-sm mr-3 group-hover:text-primary transition-colors">
                      <UsersIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Responsable</p>
                      <p className="text-sm font-bold text-gray-700">{client.contactPerson}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-2xl group hover:bg-primary/5 transition-colors">
                    <div className="p-2 bg-white rounded-xl shadow-sm mr-3 group-hover:text-primary transition-colors">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Téléphone</p>
                      <p className="text-sm font-bold text-gray-700">{client.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-2xl group hover:bg-primary/5 transition-colors">
                    <div className="p-2 bg-white rounded-xl shadow-sm mr-3 group-hover:text-primary transition-colors">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-bold text-gray-700 truncate">{client.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Info Card (Optional) */}
              {(client.rc || client.nif || client.bankName) && (
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
                  <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-primary" />
                    Détails Financiers
                  </h3>
                  <div className="space-y-3">
                    {client.rc && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-xs font-bold text-gray-400 uppercase">RC</span>
                        <span className="text-xs font-black text-gray-700">{client.rc}</span>
                      </div>
                    )}
                    {client.nif && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <span className="text-xs font-bold text-gray-400 uppercase">NIF</span>
                        <span className="text-xs font-black text-gray-700">{client.nif}</span>
                      </div>
                    )}
                    {client.bankName && (
                      <div className="pt-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Banque & RIB</p>
                        <p className="text-xs font-bold text-gray-700">{client.bankName}</p>
                        <p className="text-[10px] font-mono font-bold text-primary mt-1 tracking-widest">{client.rib}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Documents Card */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center">
                  <Paperclip className="w-4 h-4 mr-2 text-primary" />
                  {t("documents")}
                </h3>
                {(client.documents || []).length > 0 ? (
                  <div className="space-y-3">
                    {client.documents?.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl group/doc hover:bg-primary/5 transition-all">
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="p-2 bg-white rounded-xl shadow-sm group-hover/doc:text-primary transition-colors">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-bold text-gray-700 truncate">{doc.name}</p>
                            <p className="text-[10px] text-gray-400 font-medium">
                              {doc.size ? `${(doc.size / 1024 / 1024).toFixed(2)} MB` : t("unknownSize")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleDownload(doc.url, doc.name)}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-xl transition-all"
                            title={t("download")}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirmDeleteDocId === doc.id) {
                                deleteDocument(doc.id);
                                setConfirmDeleteDocId(null);
                              } else {
                                setConfirmDeleteDocId(doc.id);
                                setTimeout(() => setConfirmDeleteDocId(null), 3000);
                              }
                            }}
                            className={cn(
                              "p-2 rounded-xl transition-all",
                              confirmDeleteDocId === doc.id 
                                ? "bg-red-500 text-white" 
                                : "text-gray-400 hover:text-red-500 hover:bg-white"
                            )}
                            title={t("delete")}
                          >
                            {confirmDeleteDocId === doc.id ? <span className="text-[8px] font-black px-1">{t("confirm")}</span> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 font-medium text-center py-4 italic">{t("noDocuments")}</p>
                )}
              </div>
            </div>

            {/* Right Column: Activity & History */}
            <div className="lg:col-span-8 space-y-8">
              {/* Notes Section */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-primary" />
                  {t("notes")}
                </h3>
                <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100/50">
                  <p className="text-sm text-gray-600 font-medium leading-relaxed whitespace-pre-wrap italic">
                    {client.notes || t("noNotesClient")}
                  </p>
                </div>
              </div>

              {/* Tasks Section */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center">
                  <CheckSquare className="w-4 h-4 mr-2 text-primary" />
                  {t("associatedTasks")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <div key={task.id} className="p-5 bg-gray-50 rounded-3xl border-2 border-gray-100/50 flex justify-between items-start group hover:border-primary/20 transition-all">
                        <div>
                          <h4 className="font-bold text-gray-800 group-hover:text-primary transition-colors">{task.title}</h4>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-2">
                            {t("dueDate")}: {new Date(task.dueDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${
                          task.completed ? 'bg-green-50 text-green-600 border-green-100' :
                          'bg-yellow-50 text-yellow-600 border-yellow-100'
                        }`}>
                          {task.completed ? t("completed") : t("inProgress")}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                      <p className="text-sm text-gray-400 font-bold">{t("noAssociatedTasksClient")}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Events History */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center">
                  <UsersIcon className="w-4 h-4 mr-2 text-primary" />
                  {t("eventsHistory")}
                </h3>
                {clientEvents.length > 0 ? (
                  <div className="overflow-hidden rounded-3xl border-2 border-gray-100/50">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("date")}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("event")}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("attendees")}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("satisfaction")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {clientEvents.map((event) => (
                          <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-gray-500">{new Date(event.date).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}</td>
                            <td className="px-6 py-4 text-sm font-black text-gray-800">{event.eventName}</td>
                            <td className="px-6 py-4 text-xs font-bold text-gray-600">{event.attendees}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-1">
                                <span className="text-sm font-black text-primary">{event.satisfactionRating}</span>
                                <span className="text-[10px] font-bold text-gray-400">/ 5</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-400 font-bold">{t("noEventsRecorded")}</p>
                  </div>
                )}
              </div>

              {/* Quotes & Offers */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-primary" />
                  {t("quotesAndOffers")}
                </h3>
                {clientOffers.length > 0 ? (
                  <div className="overflow-hidden rounded-3xl border-2 border-gray-100/50">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("eventDate")}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("event")}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("price")}</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("status")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {clientOffers.map((offer) => (
                          <tr key={offer.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 text-xs font-bold text-gray-500">{new Date(offer.eventDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}</td>
                            <td className="px-6 py-4 text-sm font-black text-gray-800">{offer.eventName}</td>
                            <td className="px-6 py-4 text-sm font-black text-primary">{formatDZD(offer.price)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                offer.status === "Accepté" ? "bg-green-50 text-green-700 border-green-100" :
                                offer.status === "Rejeté" ? "bg-red-50 text-red-700 border-red-100" :
                                "bg-yellow-50 text-yellow-700 border-yellow-100"
                              }`}>
                                {offer.status === "Accepté" ? t("accepted") :
                                 offer.status === "Rejeté" ? t("rejected") :
                                 offer.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-sm text-gray-400 font-bold">{t("noQuotesRecorded")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


