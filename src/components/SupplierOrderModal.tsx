import React, { useState } from "react";
import { Supplier, SupplierOrder } from "../types";
import { X, Calendar, DollarSign, FileText, Truck, Save, Building2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface SupplierOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: SupplierOrder) => void;
  initialData?: SupplierOrder | null;
  suppliers: Supplier[];
  orderStatuses: string[];
  paymentStatuses: string[];
  paymentTerms: string[];
  preselectedSupplierId?: string;
}

export default function SupplierOrderModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  suppliers,
  orderStatuses,
  paymentStatuses,
  paymentTerms,
  preselectedSupplierId
}: SupplierOrderModalProps) {
  const [formData, setFormData] = useState<Partial<SupplierOrder>>(
    initialData || {
      supplierId: preselectedSupplierId || "",
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: "",
      totalAmount: 0,
      status: "En attente",
      paymentStatus: "Non payé",
      paymentTerms: "30 jours",
      notes: ""
    }
  );

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'invoiceUrl' | 'contractUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId) {
      alert("Veuillez sélectionner un fournisseur");
      return;
    }
    
    // Ensure dates are properly formatted ISO strings if they exist
    const orderDate = formData.orderDate ? new Date(formData.orderDate).toISOString() : new Date().toISOString();
    const deliveryDate = formData.deliveryDate ? new Date(formData.deliveryDate).toISOString() : undefined;

    onSave({
      ...formData,
      id: initialData?.id || uuidv4(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      orderDate,
      deliveryDate,
    } as SupplierOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Truck className="w-6 h-6 mr-2 text-primary" />
            {initialData ? "Modifier la commande" : "Nouvelle commande fournisseur"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Fournisseur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fournisseur *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  required
                  value={formData.supplierId}
                  onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  disabled={!!preselectedSupplierId && !initialData}
                >
                  <option value="">Sélectionner un fournisseur...</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.companyName} - {s.category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dates & Montant */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de commande *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={formData.orderDate?.split('T')[0] || ""}
                    onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de livraison prévue
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.deliveryDate?.split('T')[0] || ""}
                    onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant total (DZD) *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.totalAmount || ""}
                    onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Statuts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut de la commande *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {orderStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut du paiement *
                </label>
                <select
                  required
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {paymentStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conditions de paiement
                </label>
                <select
                  value={formData.paymentTerms || ""}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="">Sélectionner...</option>
                  {paymentTerms.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Documents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facture (Document)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'invoiceUrl')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                {formData.invoiceUrl && (
                  <p className="mt-1 text-xs text-emerald-600 font-medium">Document attaché</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contrat (Document)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, 'contractUrl')}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  />
                </div>
                {formData.contractUrl && (
                  <p className="mt-1 text-xs text-emerald-600 font-medium">Document attaché</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes / Description
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={4}
                  placeholder="Détails de la commande, références, etc."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-gradient text-white rounded-lg hover:opacity-90 font-medium transition-all shadow-md shadow-blue-200 flex items-center"
            >
              <Save className="w-5 h-5 mr-2" />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
