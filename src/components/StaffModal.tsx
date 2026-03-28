import React, { useState, useRef } from "react";
import { Staff } from "../types";
import { X, Save, Upload, Star } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { cn } from "../lib/utils";
import { WILAYAS } from "../constants";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";

const STAFF_TYPES = [
  { name: "Hôtesse (F)", icon: "👗" },
  { name: "Hôte (M)", icon: "🤵" },
  { name: "Agent de Sécurité", icon: "🔒" },
  { name: "Animateur/Animatrice", icon: "🎭" },
  { name: "Photographe/Vidéaste", icon: "📸" },
  { name: "Technicien", icon: "🔧" },
  { name: "DJ / Sonorisation", icon: "🎵" },
  { name: "Serveur/Serveuse", icon: "🍽️" },
  { name: "Décorateur", icon: "🎨" },
  { name: "Chauffeur", icon: "🚗" },
  { name: "Coordinateur terrain", icon: "📋" },
  { name: "Autre", icon: "➕" }
];

const LANGUAGES = ["Arabe", "Français", "Anglais", "Tamazight", "Autre"];

const getSpecializationsForType = (type: string) => {
  if (type.includes("Hôtesse") || type.includes("Hôte")) {
    return [
      "Accueil & Orientation", 
      "Badging", 
      "Remise de cadeaux", 
      "Assistance VIP", 
      "Animation", 
      "Interprétariat", 
      "Coordination",
      "Placement en salle",
      "Gestion vestiaire",
      "Passage micro",
      "Service boisson",
      "Animation stand",
      "Distribution flyers",
      "Saisie de données"
    ];
  }
  if (type.includes("Sécurité")) {
    return ["Contrôle d'accès", "Surveillance", "Gestion des foules", "Sécurité VIP", "Intervention d'urgence"];
  }
  if (type.includes("Animateur")) {
    return ["Animation scène", "Jeux & Quiz", "Cérémonie", "Animation enfants", "Présentation"];
  }
  if (type.includes("Photographe")) {
    return ["Photo événementielle", "Vidéo & Montage", "Drone", "Live streaming", "Portrait"];
  }
  if (type.includes("Technicien")) {
    return ["Sonorisation", "Éclairage", "Scène & Décor", "Informatique", "Électricité"];
  }
  return [];
};

interface StaffModalProps {
  onClose: () => void;
  onSave: (staff: Staff) => void;
  initialData?: Staff | null;
}

export default function StaffModal({ onClose, onSave, initialData }: StaffModalProps) {
  const [formData, setFormData] = useState<Partial<Staff>>(initialData || {
    firstName: "",
    lastName: "",
    gender: "Homme",
    staffType: "Hôte (M)",
    phone: "",
    dateOfBirth: "",
    wilaya: "Alger",
    profilePhotoUrl: "",
    languages: ["Arabe", "Français"],
    experienceYears: 0,
    specializations: [],
    availability: "Disponible",
    rating: 0,
    totalEvents: 0,
    notes: "",
    isActive: true
  });

  const [customSpec, setCustomSpec] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateAge = (dob: string) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    const age = new Date(diff).getUTCFullYear() - 1970;
    return `${age} ans`;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePhotoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      alert("Veuillez remplir les champs obligatoires (Nom, Prénom, Téléphone).");
      return;
    }

    const staff: Staff = {
      id: initialData?.id || uuidv4(),
      firstName: formData.firstName!,
      lastName: formData.lastName!,
      gender: formData.gender!,
      staffType: formData.staffType!,
      phone: formData.phone!,
      dateOfBirth: formData.dateOfBirth,
      wilaya: formData.wilaya,
      profilePhotoUrl: formData.profilePhotoUrl,
      languages: formData.languages,
      experienceYears: formData.experienceYears || 0,
      specializations: formData.specializations,
      availability: formData.availability || "Disponible",
      rating: formData.rating || 0,
      totalEvents: formData.totalEvents || 0,
      notes: formData.notes,
      isActive: formData.isActive ?? true,
      createdAt: initialData?.createdAt || new Date().toISOString()
    };

    onSave(staff);
    onClose();
  };

  const toggleLanguage = (lang: string) => {
    const current = formData.languages || [];
    if (current.includes(lang)) {
      setFormData({ ...formData, languages: current.filter(l => l !== lang) });
    } else {
      setFormData({ ...formData, languages: [...current, lang] });
    }
  };

  const toggleSpec = (spec: string) => {
    const current = formData.specializations || [];
    if (current.includes(spec)) {
      setFormData({ ...formData, specializations: current.filter(s => s !== spec) });
    } else {
      setFormData({ ...formData, specializations: [...current, spec] });
    }
  };

  const addCustomSpec = () => {
    if (customSpec.trim() && !(formData.specializations || []).includes(customSpec.trim())) {
      setFormData({ ...formData, specializations: [...(formData.specializations || []), customSpec.trim()] });
      setCustomSpec("");
    }
  };

  const availableSpecs = getSpecializationsForType(formData.staffType || "");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? "Modifier le membre" : "Ajouter un membre du staff"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="staff-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Photo Upload Section */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div 
                className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.profilePhotoUrl ? (
                  <>
                    <img src={formData.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <Upload className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium uppercase">Photo</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <p className="text-xs text-gray-500 mt-2">Optionnel (JPG, PNG)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Info */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Informations Personnelles</h3>
              </div>
              
              <div>
                <Label>Prénom *</Label>
                <Input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label>Nom *</Label>
                <Input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type de Staff *</label>
                <select
                  required
                  value={formData.staffType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    const newGender = newType.includes("(F)") ? "Femme" : newType.includes("(M)") ? "Homme" : formData.gender;
                    setFormData({ ...formData, staffType: newType, gender: newGender, specializations: [] });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {STAFF_TYPES.map(t => <option key={t.name} value={t.name}>{t.icon} {t.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Genre *</label>
                <div className="flex space-x-4 mt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="Homme" 
                      checked={formData.gender === "Homme"}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Homme</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="gender" 
                      value="Femme" 
                      checked={formData.gender === "Femme"}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Femme</span>
                  </label>
                </div>
              </div>

              <div>
                <Label>Téléphone *</Label>
                <Input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wilaya</label>
                <select
                  value={formData.wilaya}
                  onChange={(e) => setFormData({ ...formData, wilaya: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  {WILAYAS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div>
                <Label>Date de naissance</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  />
                  {formData.dateOfBirth && (
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                      {calculateAge(formData.dateOfBirth)}
                    </span>
                  )}
                </div>
              </div>

              {/* Professional Profile */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Profil Professionnel</h3>
              </div>

              <div>
                <Label>Années d'expérience</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disponibilité</label>
                <select
                  value={formData.availability}
                  onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="Disponible">Disponible</option>
                  <option value="Occupé">Occupé</option>
                  <option value="Indisponible">Indisponible</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Langues parlées</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                        (formData.languages || []).includes(lang)
                          ? "bg-primary text-white border-primary"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Spécialisations</label>
                {availableSpecs.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {availableSpecs.map(spec => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleSpec(spec)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
                          (formData.specializations || []).includes(spec)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                        )}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    value={customSpec}
                    onChange={(e) => setCustomSpec(e.target.value)}
                    placeholder="Autre spécialisation..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomSpec();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomSpec}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    Ajouter
                  </button>
                </div>
                {/* Custom specs display */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {(formData.specializations || []).filter(s => !availableSpecs.includes(s)).map(spec => (
                    <span key={spec} className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200 flex items-center">
                      {spec}
                      <button type="button" onClick={() => toggleSpec(spec)} className="ml-2 text-blue-500 hover:text-blue-800">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Validation & Notes */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Évaluation & Notes</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note initiale (sur 5)</label>
                <div className="flex items-center space-x-2 mt-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star className={cn("w-8 h-8", (formData.rating || 0) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300")} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes internes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informations supplémentaires, remarques..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-between shrink-0 bg-gray-50 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Annuler
          </button>
          
          <button
            type="submit"
            form="staff-form"
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
