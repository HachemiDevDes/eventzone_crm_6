import React, { useState } from "react";
import { CompanySettings } from "../types";
import { X, Save, Upload } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: CompanySettings;
  onSave: (settings: CompanySettings) => void;
}

export default function CompanySettingsModal({ isOpen, onClose, settings, onSave }: CompanySettingsModalProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CompanySettings>(settings || {
    name: "",
    address: "",
    phone: "",
    email: "",
    rc: "",
    nif: "",
    nis: "",
    art: "",
    rib: "",
    bankName: "",
    logoUrl: ""
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Paramètres de l'entreprise</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="company-settings-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Logo Upload */}
            <div className="flex flex-col items-center justify-center space-y-4 p-6 border-2 border-dashed border-gray-300 rounded-lg">
              {formData.logoUrl ? (
                <div className="relative">
                  <img src={formData.logoUrl} alt="Company Logo" className="h-24 object-contain" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, logoUrl: "" })}
                    className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-600">
                    <label
                      htmlFor="logo-upload"
                      className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none hover:text-blue-500"
                    >
                      <span>Télécharger un logo</span>
                      <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoUpload} />
                    </label>
                  </div>
                  <p className="text-xs leading-5 text-gray-500">PNG, JPG, GIF jusqu'à 2MB</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nom de l'entreprise *</Label>
                <Input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Téléphone *</Label>
                <Input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Adresse *</Label>
                <Input
                  required
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informations Légales & Bancaires</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>RC (Registre de Commerce)</Label>
                  <Input
                    type="text"
                    value={formData.rc || ""}
                    onChange={(e) => setFormData({ ...formData, rc: e.target.value })}
                  />
                </div>
                <div>
                  <Label>NIF (Numéro d'Identification Fiscale)</Label>
                  <Input
                    type="text"
                    value={formData.nif || ""}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                  />
                </div>
                <div>
                  <Label>NIS (Numéro d'Identification Statistique)</Label>
                  <Input
                    type="text"
                    value={formData.nis || ""}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  />
                </div>
                <div>
                  <Label>ART (Article d'Imposition)</Label>
                  <Input
                    type="text"
                    value={formData.art || ""}
                    onChange={(e) => setFormData({ ...formData, art: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Banque</Label>
                  <Input
                    type="text"
                    value={formData.bankName || ""}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>RIB</Label>
                  <Input
                    type="text"
                    value={formData.rib || ""}
                    onChange={(e) => setFormData({ ...formData, rib: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="company-settings-form"
            className="px-4 py-2 bg-primary-gradient text-white rounded-lg hover:opacity-90 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
