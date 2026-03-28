import React, { useState } from "react";
import { Supplier } from "../types";
import { X, Building2, User, Mail, Phone, MapPin, Globe, Tag, Star, Save } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  initialData?: Supplier | null;
  categories: { name: string; icon: string; color: string }[];
  wilayas: string[];
  contractStatuses: string[];
}

export default function SupplierModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  categories,
  wilayas,
  contractStatuses
}: SupplierModalProps) {
  const [formData, setFormData] = useState<Partial<Supplier>>(
    initialData || {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      wilaya: "",
      website: "",
      category: categories[0]?.name || "",
      servicesProvided: [],
      rating: 0,
      isPreferred: false,
      isActive: true,
      contractStatus: "Aucun"
    }
  );

  const [newService, setNewService] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: initialData?.id || uuidv4(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      totalOrders: initialData?.totalOrders || 0,
      totalSpent: initialData?.totalSpent || 0,
    } as Supplier);
    onClose();
  };

  const addService = () => {
    if (newService.trim() && !formData.servicesProvided?.includes(newService.trim())) {
      setFormData(prev => ({
        ...prev,
        servicesProvided: [...(prev.servicesProvided || []), newService.trim()]
      }));
      setNewService("");
    }
  };

  const removeService = (serviceToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      servicesProvided: prev.servicesProvided?.filter(s => s !== serviceToRemove)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations principales */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Informations principales</h3>
              
              <div>
              <div>
                <Label>Nom de l'entreprise *</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="pl-10"
                    placeholder="Ex: Tech Solutions"
                  />
                </div>
              </div>
              </div>

              <div>
              <div>
                <Label>Catégorie *</Label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut du contrat
                </label>
                <select
                  value={formData.contractStatus}
                  onChange={(e) => setFormData({ ...formData, contractStatus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {contractStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Fournisseur actif</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPreferred}
                    onChange={(e) => setFormData({ ...formData, isPreferred: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500 mr-1" />
                    Préféré
                  </span>
                </label>
              </div>
            </div>

            {/* Contact & Localisation */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Contact & Localisation</h3>
              
              <div>
              <div>
                <Label>Nom du contact</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    value={formData.contactName || ""}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="pl-10"
                    placeholder="Ex: Jean Dupont"
                  />
                </div>
              </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="pl-10"
                      placeholder="0555..."
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-10"
                      placeholder="contact@..."
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      rows={2}
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wilaya
                  </label>
                  <select
                    value={formData.wilaya || ""}
                    onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value="">Sélectionner...</option>
                    {wilayas.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site web
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.website || ""}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services proposés */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 mb-4">Services proposés</h3>
            <div className="flex space-x-2 mb-3">
              <select
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Sélectionner un service...</option>
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addService}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
              >
                Ajouter
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.servicesProvided?.map((service, idx) => (
                <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
                  {service}
                  <button
                    type="button"
                    onClick={() => removeService(service)}
                    className="ml-2 text-blue-400 hover:text-blue-600 focus:outline-none"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
              {(!formData.servicesProvided || formData.servicesProvided.length === 0) && (
                <p className="text-sm text-gray-500 italic">Aucun service ajouté</p>
              )}
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
