import React, { useState, useRef } from "react";
import { useStore } from "../store/StoreContext";
import { Offer, OfferStatus, DocumentType } from "../types";
import { formatDZD } from "../lib/utils";
import { Plus, Search, FileText, CheckCircle, XCircle, Clock, ExternalLink, Edit2, Paperclip, FileDown, MessageCircle, Mail, Trash2, AlertTriangle, Settings, LayoutGrid, List, ChevronLeft, ChevronRight, Calendar, Users, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "../hooks/useTranslation";
import CompanySettingsModal from "../components/CompanySettingsModal";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Select } from "../components/ui/Select";
import fr from "../locales/fr";
import en from "../locales/en";

const languages = { fr, en };

export default function FinancialDocuments() {
  const { data, addOffer, updateOffer, deleteOffer, updateCompanySettings, currentUser } = useStore();
  const { t, lang } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);
  const [activeDownloadMenu, setActiveDownloadMenu] = useState<string | null>(null);

  const isManager = currentUser?.role === "Manager";

  const filteredOffers = (data.offers || []).filter(
    (o) => {
      const related = o.relatedToType === "Client" 
        ? data.clients.find((c) => c.id === o.relatedToId)
        : data.leads.find((l) => l.id === o.relatedToId);

      const matchesSearch = (o.eventName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (related?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      if (isManager) return matchesSearch;
      
      return matchesSearch && related?.assignedTo === currentUser?.id;
    }
  );

  const getStatusIcon = (status: OfferStatus) => {
    switch (status) {
      case "Accepté":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "Rejeté":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "En attente":
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusClass = (status: OfferStatus) => {
    switch (status) {
      case "Accepté":
        return "bg-green-50 text-green-700 border-green-200";
      case "Rejeté":
        return "bg-red-50 text-red-700 border-red-200";
      case "En attente":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
    }
  };

  const generatePDF = (offer: Offer, targetLang?: "fr" | "en") => {
    const pdfLang = targetLang || lang;
    const pdfT = (key: string) => {
      return (languages[pdfLang as keyof typeof languages] as any)[key] || (languages["fr"] as any)[key] || key;
    };

    const related = offer.relatedToType === "Client" 
      ? data.clients.find(c => c.id === offer.relatedToId)
      : data.leads.find(l => l.id === offer.relatedToId);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const customServicesTotal = (offer.customServices || []).reduce((sum, s) => sum + (s.price * s.quantity), 0);
    const totalHT = offer.price + customServicesTotal;
    const vat = totalHT * 0.19;
    const totalTTC = totalHT + vat;
    const docType = offer.documentType || (pdfLang === 'fr' ? "Devis" : "Quote");
    const company = data.companySettings;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${docType} ${offer.eventName ? `- ${offer.eventName}` : ''}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1a1a1a; margin: 0; padding: 40px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; margin-bottom: 60px; }
          .logo-container { display: flex; flex-direction: column; }
          .logo { font-size: 32px; font-weight: 700; color: #2563eb; letter-spacing: -1.5px; margin: 0; }
          .logo-img { max-height: 70px; max-width: 220px; object-fit: contain; margin-bottom: 12px; }
          .company-details { font-size: 12px; color: #4b5563; margin-top: 10px; line-height: 1.6; }
          .quote-info { text-align: right; min-width: 250px; }
          .quote-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px; }
          .quote-meta { font-size: 13px; color: #4b5563; margin: 4px 0; }
          .client-section { margin-top: 30px; text-align: right; }
          .client-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
          .client-name { font-weight: 700; font-size: 16px; color: #111827; margin-bottom: 4px; }
          .client-details { font-size: 13px; color: #4b5563; line-height: 1.5; }
          .divider { height: 2px; background: linear-gradient(to right, #2563eb, #3b82f6); margin: 40px 0; border: none; }
          .config-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 40px; border: 1px solid #e5e7eb; }
          .config-item { display: flex; flex-direction: column; }
          .config-label { font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
          .config-value { font-size: 14px; font-weight: 600; color: #111827; }
          .description-section { margin-bottom: 40px; }
          .platform-access { font-size: 14px; font-weight: 600; color: #111827; margin-bottom: 12px; }
          table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 40px; }
          th { text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 0; border-bottom: 2px solid #e5e7eb; }
          td { padding: 20px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; vertical-align: top; }
          .service-list { list-style: none; padding: 0; margin: 0; }
          .service-item { display: flex; align-items: flex-start; margin-bottom: 8px; color: #374151; }
          .service-bullet { color: #2563eb; margin-right: 10px; font-weight: bold; }
          .text-right { text-align: right; }
          .totals-container { display: flex; justify-content: flex-end; }
          .totals-box { width: 320px; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #4b5563; }
          .total-row.grand-total { border-bottom: none; font-size: 20px; font-weight: 700; color: #111827; margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb; }
          .total-value { font-weight: 600; }
          .grand-total-value { color: #2563eb; }
          .footer { margin-top: 100px; padding-top: 30px; border-top: 1px solid #e5e7eb; text-align: center; }
          .footer-company { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px; }
          .footer-info { font-size: 11px; color: #6b7280; line-height: 1.8; }
          .legal-grid { display: flex; justify-content: center; gap: 20px; margin-top: 12px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            ${company?.logoUrl ? `<img src="${company.logoUrl}" class="logo-img" alt="Logo" />` : `<h1 class="logo">${company?.name || 'eventzone'}</h1>`}
            <div class="company-details">
              ${company?.address ? `<div>${company.address}</div>` : ''}
              ${company?.phone ? `<div>${pdfT('phone')}: ${company.phone}</div>` : ''}
              ${company?.email ? `<div>${pdfT('email')}: ${company.email}</div>` : ''}
            </div>
          </div>
          <div class="quote-info">
            <h2 class="quote-title">${docType}</h2>
            <div class="quote-meta"><strong>${pdfT('pdfDate')}:</strong> ${new Date().toLocaleDateString(pdfLang === 'fr' ? 'fr-FR' : 'en-US')}</div>
            <div class="quote-meta"><strong>${pdfT('pdfRef')}:</strong> ${offer.id.substring(0, 8).toUpperCase()}</div>
            
            <div class="client-section">
              <div class="client-label">${pdfT('pdfTo')}</div>
              <div class="client-name">${related?.companyName || 'Client'}</div>
              <div class="client-details">
                ${related?.contactPerson ? `<div>${related.contactPerson}</div>` : ''}
                ${related?.address ? `<div>${related.address}</div>` : ''}
                ${(related as any)?.rc || (related as any)?.nif || (related as any)?.nis || (related as any)?.art ? `
                  <div style="font-size: 11px; color: #6b7280; margin-top: 8px;">
                    ${(related as any)?.rc ? `RC: ${(related as any).rc} &nbsp;` : ''}
                    ${(related as any)?.nif ? `NIF: ${(related as any).nif} &nbsp;` : ''}
                    ${(related as any)?.nis ? `NIS: ${(related as any).nis} &nbsp;` : ''}
                    ${(related as any)?.art ? `ART: ${(related as any).art}` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>

        <hr class="divider" />
        
        ${offer.eventName || offer.eventDate || offer.attendees ? `
        <div class="config-grid">
          <div class="config-item">
            <span class="config-label">${pdfT('pdfEvent')}</span>
            <span class="config-value">${offer.eventName || 'N/A'}</span>
          </div>
          <div class="config-item">
            <span class="config-label">${pdfT('pdfDate')}</span>
            <span class="config-value">${offer.eventDate ? new Date(offer.eventDate).toLocaleDateString(pdfLang === 'fr' ? 'fr-FR' : 'en-US') : 'N/A'}</span>
          </div>
          <div class="config-item">
            <span class="config-label">${pdfT('pdfAttendees')}</span>
            <span class="config-value">${offer.attendees || 'N/A'} ${pdfT('pdfPax')}</span>
          </div>
        </div>
        ` : ''}

        <div class="description-section">
          <div class="platform-access">${pdfT('pdfPlatformAccess')}</div>
          <table>
            <thead>
              <tr>
                <th>${pdfT('pdfDescription')}</th>
                <th class="text-right" style="width: 100px;">${pdfT('pdfQuantity')}</th>
                <th class="text-right" style="width: 150px;">${pdfT('pdfTotalHT')}</th>
              </tr>
            </thead>
            <tbody>
              ${offer.servicesIncluded.map(s => `
                <tr>
                  <td>${pdfT(s)}</td>
                  <td class="text-right">1</td>
                  <td class="text-right" style="font-weight: 600;">-</td>
                </tr>
              `).join('')}
              ${(offer.customServices || []).map(s => `
                <tr>
                  <td>${s.name}</td>
                  <td class="text-right">${s.quantity}</td>
                  <td class="text-right" style="font-weight: 600;">${formatDZD(s.price * s.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="totals-container">
          <div class="totals-box">
            <div class="total-row">
              <span>${pdfT('pdfTotalHT')}</span>
              <span class="total-value">${formatDZD(totalHT)}</span>
            </div>
            <div class="total-row">
              <span>${pdfT('pdfVat')}</span>
              <span class="total-value">${formatDZD(vat)}</span>
            </div>
            <div class="total-row grand-total">
              <span>${pdfT('pdfTotalTTC')}</span>
              <span class="grand-total-value">${formatDZD(totalTTC)}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-company">${company?.name || 'Eventzone'}</div>
          <div class="footer-info">
            ${company?.address || ''}
            <div class="legal-grid">
              ${company?.rc ? `<span>RC: ${company.rc}</span>` : ''}
              ${company?.nif ? `<span>NIF: ${company.nif}</span>` : ''}
              ${company?.nis ? `<span>NIS: ${company.nis}</span>` : ''}
              ${company?.art ? `<span>ART: ${company.art}</span>` : ''}
            </div>
            ${company?.bankName && company?.rib ? `
              <div style="margin-top: 12px; font-weight: 500;">
                ${pdfT('pdfBank')}: ${company.bankName} &nbsp; | &nbsp; ${pdfT('pdfRib')}: ${company.rib}
              </div>
            ` : ''}
            <div style="margin-top: 20px; font-style: italic; opacity: 0.8;">${pdfT('pdfValidFor')}</div>
          </div>
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Documents Financiers</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="bg-white text-gray-700 border border-gray-300 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center justify-center space-x-1.5 md:space-x-2 hover:bg-gray-50 transition-colors shadow-sm text-xs md:text-sm font-medium"
          >
            <Settings className="w-4 h-4 md:w-5 md:h-5" />
            <span>Paramètres</span>
          </button>
          <a
            href="https://eventzone-devis-calculator-776224860515.us-west1.run.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center space-x-1.5 md:space-x-2 hover:bg-gray-50 transition-colors text-xs md:text-sm font-medium flex-1 sm:flex-none justify-center"
          >
            <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
            <span className="whitespace-nowrap">{t("quoteCalculator")}</span>
          </a>
          <button
            onClick={() => {
              setEditingOffer(null);
              setIsModalOpen(true);
            }}
            className="bg-primary-gradient text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg flex items-center space-x-1.5 md:space-x-2 hover:opacity-90 transition-all shadow-md shadow-blue-200 text-xs md:text-sm font-medium flex-1 sm:flex-none justify-center"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
            <span className="whitespace-nowrap">{t("newQuote")}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchQuotePlaceholder")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center bg-gray-100 p-1 rounded-lg ml-4">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "grid"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Vue Grille"
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "table"
                  ? "bg-white text-primary shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Vue Tableau"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {viewMode === "grid" ? (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => {
                const related = offer.relatedToType === "Client" 
                  ? data.clients.find((c) => c.id === offer.relatedToId)
                  : data.leads.find((l) => l.id === offer.relatedToId);
                return (
                  <div
                    key={offer.id}
                    className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{offer.eventName}</h3>
                          <p className="text-sm text-gray-500">{related?.companyName || t("unknownClient")}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingOffer(offer);
                            setIsModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                          title={t("edit")}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isManager && (
                          <button
                            onClick={() => setOfferToDelete(offer.id)}
                            className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            title={t("delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t("eventDate")}:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(offer.eventDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t("attendees")}:</span>
                        <span className="font-medium text-gray-900">{offer.attendees}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t("followedUpOn")}:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(offer.followUpDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-sm block mb-1">{t("services")}:</span>
                        <div className="flex flex-wrap gap-1">
                          {offer.servicesIncluded.map((service, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                              {t(service)}
                            </span>
                          ))}
                        </div>
                      </div>
                      {offer.attachmentName && (
                        <div className="mt-3 flex items-center space-x-2 text-sm text-primary bg-blue-50 p-2 rounded-md">
                          <Paperclip className="w-4 h-4" />
                          <span className="truncate">{offer.attachmentName}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <select
                          value={offer.status}
                          onChange={(e) => updateOffer(offer.id, { status: e.target.value as OfferStatus })}
                          disabled={!isManager}
                          className={`text-sm font-medium px-3 py-1.5 rounded-lg border appearance-none ${isManager ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} pr-8 ${getStatusClass(
                            offer.status
                          )}`}
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                            backgroundPosition: "right 0.5rem center",
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "1.5em 1.5em",
                          }}
                        >
                          <option value="En attente">{t("pending")}</option>
                          <option value="Accepté">{t("accepted")}</option>
                          <option value="Rejeté">{t("rejected")}</option>
                        </select>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {formatDZD(offer.price)}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => generatePDF(offer, 'fr')} 
                          className="flex-1 flex items-center justify-center space-x-2 py-2 bg-gray-50 hover:bg-blue-50 hover:text-primary text-gray-700 rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-blue-100"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>FR</span>
                        </button>
                        <button 
                          onClick={() => generatePDF(offer, 'en')} 
                          className="flex-1 flex items-center justify-center space-x-2 py-2 bg-gray-50 hover:bg-blue-50 hover:text-primary text-gray-700 rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-blue-100"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>EN</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Document</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client/Lead</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date Événement</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Montant</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOffers.map((offer) => {
                    const related = offer.relatedToType === "Client" 
                      ? data.clients.find((c) => c.id === offer.relatedToId)
                      : data.leads.find((l) => l.id === offer.relatedToId);
                    return (
                      <tr key={offer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{offer.eventName}</div>
                              <div className="text-xs text-gray-500">{offer.documentType || "Devis"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{related?.companyName || t("unknownClient")}</div>
                          <div className="text-xs text-gray-500">{offer.relatedToType}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(offer.eventDate).toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'en-US')}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={offer.status}
                            onChange={(e) => updateOffer(offer.id, { status: e.target.value as OfferStatus })}
                            disabled={!isManager}
                            className={`text-xs font-medium px-2 py-1 rounded-lg border appearance-none ${isManager ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} pr-6 ${getStatusClass(
                              offer.status
                            )}`}
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: "right 0.3rem center",
                              backgroundRepeat: "no-repeat",
                              backgroundSize: "1.2em 1.2em",
                            }}
                          >
                            <option value="En attente">{t("pending")}</option>
                            <option value="Accepté">{t("accepted")}</option>
                            <option value="Rejeté">{t("rejected")}</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-primary">
                          {formatDZD(offer.price)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-100">
                              <button
                                onClick={() => generatePDF(offer, 'fr')}
                                className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-primary hover:bg-white rounded-md transition-all"
                                title="Download FR"
                              >
                                FR
                              </button>
                              <div className="w-px h-3 bg-gray-200 mx-0.5"></div>
                              <button
                                onClick={() => generatePDF(offer, 'en')}
                                className="px-2 py-1 text-[10px] font-bold text-gray-500 hover:text-primary hover:bg-white rounded-md transition-all"
                                title="Download EN"
                              >
                                EN
                              </button>
                            </div>
                            <button
                              onClick={() => {
                                setEditingOffer(offer);
                                setIsModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-primary p-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                              title={t("edit")}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isManager && (
                              <button
                                onClick={() => setOfferToDelete(offer.id)}
                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                title={t("delete")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {filteredOffers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {t("noQuotesFound")}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <NewOfferModal 
          onClose={() => {
            setIsModalOpen(false);
            setEditingOffer(null);
          }} 
          onSave={(offer) => {
            if (editingOffer) {
              updateOffer(editingOffer.id, offer);
            } else {
              addOffer(offer);
            }
          }} 
          initialData={editingOffer}
        />
      )}

      <CompanySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={data.companySettings}
        onSave={updateCompanySettings}
      />

      {offerToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">{t("deleteQuoteConfirmTitle") || "Supprimer le devis"}</h3>
            </div>
            <p className="text-gray-600 mb-6">
              {t("deleteQuoteConfirmMessage") || "Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible."}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setOfferToDelete(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => {
                  deleteOffer(offerToDelete);
                  setOfferToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm shadow-red-200"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewOfferModal({
  onClose,
  onSave,
  initialData
}: {
  onClose: () => void;
  onSave: (offer: Offer) => void;
  initialData: Offer | null;
}) {
  const { data, currentUser } = useStore();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isManager = currentUser?.role === "Manager";
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Offer>>(
    initialData || {
      status: "En attente",
      servicesIncluded: [],
      customServices: [],
      relatedToType: "Client",
      documentType: "Devis"
    }
  );

  const addCustomService = () => {
    setFormData({
      ...formData,
      customServices: [...(formData.customServices || []), { name: "", price: 0, quantity: 1 }]
    });
  };

  const removeCustomService = (index: number) => {
    setFormData({
      ...formData,
      customServices: (formData.customServices || []).filter((_, i) => i !== index)
    });
  };

  const updateCustomService = (index: number, field: string, value: any) => {
    const services = [...(formData.customServices || [])];
    services[index] = { ...services[index], [field]: value };
    setFormData({ ...formData, customServices: services });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to a server and get a URL.
      // For this MVP, we'll just store the name and create a local object URL.
      setFormData({
        ...formData,
        attachmentName: file.name,
        attachmentUrl: URL.createObjectURL(file)
      });
    }
  };

  const availableServices = [
    "ticketingPlatform",
    "registrationForm",
    "mobileApp",
    "badgePrinting",
    "hostesses",
    "accessControl",
    "reportsAnalytics",
  ];

  const handleServiceToggle = (service: string) => {
    const current = formData.servicesIncluded || [];
    if (current.includes(service)) {
      setFormData({ ...formData, servicesIncluded: current.filter((s) => s !== service) });
    } else {
      setFormData({ ...formData, servicesIncluded: [...current, service] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: initialData?.id || uuidv4(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
    } as Offer);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="bg-primary-gradient px-6 py-8 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">
              {initialData ? t("editOfferTitle") : t("addOfferTitle")}
            </h2>
          </div>
          <p className="text-blue-100 text-sm opacity-90">
            {step === 1 ? t("projectDetails") : t("offerDetails")}
          </p>

          {/* Step Indicator */}
          <div className="flex items-center mt-8 space-x-4">
            <div className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                step >= 1 ? 'bg-white text-primary shadow-lg scale-110' : 'bg-white/30 text-white'
              }`}>
                1
              </div>
              <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-500 ${
                step > 1 ? 'bg-white' : 'bg-white/30'
              }`} />
            </div>
            <div className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                step >= 2 ? 'bg-white text-primary shadow-lg scale-110' : 'bg-white/30 text-white'
              }`}>
                2
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Type de document
                  </Label>
                  <Select
                    value={formData.documentType || "Devis"}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
                  >
                    <option value="Devis">Devis</option>
                    <option value="Facture">Facture</option>
                    <option value="Facture Proforma">Facture Proforma</option>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {t("type")}
                  </Label>
                  <Select
                    value={formData.relatedToType || "Client"}
                    onChange={(e) => setFormData({ ...formData, relatedToType: e.target.value as "Client" | "Lead", relatedToId: "" })}
                  >
                    <option value="Client">{t("client")}</option>
                    <option value="Lead">{t("lead")}</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {formData.relatedToType === "Client" ? t("client") : t("lead")}
                </Label>
                <Select
                  required
                  value={formData.relatedToId || ""}
                  onChange={(e) => setFormData({ ...formData, relatedToId: e.target.value })}
                >
                  <option value="">{t("select")}</option>
                  {formData.relatedToType === "Client"
                    ? data.clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.companyName}
                        </option>
                      ))
                    : data.leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.companyName}
                        </option>
                      ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {t("eventName")}
                  </Label>
                  <Select
                    value={formData.eventName || ""}
                    onChange={(e) => {
                      const event = data.events.find(ev => ev.eventName === e.target.value);
                      if (event) {
                        setFormData({
                          ...formData,
                          eventName: event.eventName,
                          eventDate: event.date.split('T')[0],
                          attendees: event.attendees
                        });
                      } else {
                        setFormData({ ...formData, eventName: e.target.value });
                      }
                    }}
                  >
                    <option value="">Sélectionner un événement</option>
                    {data.events.map(event => (
                      <option key={event.id} value={event.eventName}>{event.eventName}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {t("eventDate")}
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="date"
                      className="pl-11"
                      value={formData.eventDate || ""}
                      onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {t("estimatedAttendees")}
                </Label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="0"
                    className="pl-11"
                    value={formData.attendees || ""}
                    onChange={(e) => setFormData({ ...formData, attendees: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  {t("includedServices")}
                </label>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl">
                  {availableServices.map((service) => (
                    <label 
                      key={service} 
                      className={`flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        formData.servicesIncluded?.includes(service)
                          ? 'bg-white border-primary shadow-sm'
                          : 'bg-transparent border-transparent hover:bg-white/50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.servicesIncluded?.includes(service) || false}
                        onChange={() => handleServiceToggle(service)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-300"
                      />
                      <span className="ml-3 text-sm font-medium text-gray-700">{t(service)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Services additionnels
                  </label>
                  <button
                    type="button"
                    onClick={addCustomService}
                    className="text-xs font-bold text-primary hover:text-primary/80"
                  >
                    + Ajouter un service
                  </button>
                </div>
                <div className="space-y-3">
                  {formData.customServices?.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Input
                        placeholder="Nom du service"
                        value={service.name}
                        onChange={(e) => updateCustomService(index, "name", e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Prix"
                        className="w-24"
                        value={service.price}
                        onChange={(e) => updateCustomService(index, "price", Number(e.target.value))}
                      />
                      <Input
                        type="number"
                        placeholder="Qté"
                        className="w-20"
                        value={service.quantity}
                        onChange={(e) => updateCustomService(index, "quantity", Number(e.target.value))}
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomService(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {t("proposedPrice")}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">DZD</span>
                    <Input
                      required
                      type="number"
                      disabled={!isManager}
                      className={`pl-14 ${
                        !isManager ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                      value={formData.price || ""}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    {t("followUpDate")}
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      required
                      type="date"
                      className="pl-11"
                      value={formData.followUpDate || ""}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {t("status")}
                </Label>
                <Select
                  required
                  value={formData.status || "En attente"}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="En attente">En attente</option>
                  <option value="Envoyé">Envoyé</option>
                  <option value="Accepté">Accepté</option>
                  <option value="Refusé">Refusé</option>
                  <option value="Payé">Payé</option>
                </Select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {t("attachedDocument")}
                </label>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    <Paperclip className="w-4 h-4 text-primary" />
                    <span>{formData.attachmentName ? t("changeDocument") : t("attachDocument")}</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                  {formData.attachmentName && (
                    <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                      <span className="text-xs font-medium text-gray-600 truncate max-w-[150px]">
                        {formData.attachmentName}
                      </span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, attachmentName: undefined, attachmentUrl: undefined })}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center space-x-2 px-6 py-3 text-gray-600 font-semibold hover:bg-gray-50 rounded-xl transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>{t("back")}</span>
              </button>
            ) : (
              <div />
            )}
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl transition-all"
              >
                {t("cancel")}
              </button>
              
              {step === 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center space-x-2 px-8 py-3 bg-primary-gradient text-white font-bold rounded-xl hover:opacity-90 shadow-lg shadow-blue-100 transition-all"
                >
                  <span>{t("next")}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-10 py-3 bg-primary-gradient text-white font-bold rounded-xl hover:opacity-90 shadow-lg shadow-blue-100 transition-all"
                >
                  {initialData ? t("save") : t("createQuote")}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
