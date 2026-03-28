import React, { useState } from "react";
import { Staff, StaffAssignment, EventLog } from "../types";
import { X, Calendar, MapPin, Briefcase, Star, FileText, User } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface StaffAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: StaffAssignment) => void;
  staffList: Staff[];
  events: EventLog[];
  initialData?: StaffAssignment | null;
}

const ROLES = [
  "Hôtesse d'accueil",
  "Hôte d'accueil",
  "Superviseur",
  "Chef d'équipe",
  "Manutentionnaire",
  "Chauffeur",
  "Sécurité",
  "Autre"
];

export default function StaffAssignmentModal({
  isOpen,
  onClose,
  onSave,
  staffList,
  events,
  initialData
}: StaffAssignmentModalProps) {
  const [formData, setFormData] = useState<Partial<StaffAssignment>>(
    initialData || {
      staffId: "",
      eventId: "",
      eventName: "",
      eventDate: new Date().toISOString().split('T')[0],
      eventLocation: "",
      roleAtEvent: "",
      performanceRating: undefined,
      notes: ""
    }
  );

  if (!isOpen) return null;

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedEventId = e.target.value;
    const selectedEvent = events.find(ev => ev.id === selectedEventId);
    
    if (selectedEvent) {
      setFormData({
        ...formData,
        eventId: selectedEvent.id,
        eventName: selectedEvent.eventName,
        eventDate: selectedEvent.date.split('T')[0],
        eventLocation: selectedEvent.wilaya
      });
    } else {
      setFormData({
        ...formData,
        eventId: "",
        eventName: "",
        eventDate: new Date().toISOString().split('T')[0],
        eventLocation: ""
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.staffId || !formData.eventName || !formData.eventDate) {
      alert("Veuillez remplir les champs obligatoires");
      return;
    }

    onSave({
      ...formData,
      id: initialData?.id || uuidv4(),
      eventDate: new Date(formData.eventDate).toISOString(),
    } as StaffAssignment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Briefcase className="w-6 h-6 mr-2 text-primary" />
            {initialData ? "Modifier l'affectation" : "Nouvelle affectation"}
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
            {/* Staff Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Membre du Staff *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  required
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                >
                  <option value="">Sélectionner un membre...</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} - {s.staffType}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Event Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Événement *
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    required
                    value={formData.eventId || ""}
                    onChange={handleEventChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  >
                    <option value="">Sélectionner un événement...</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.eventName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de l'événement *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={formData.eventDate?.split('T')[0] || ""}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lieu
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.eventLocation || ""}
                    onChange={(e) => setFormData({ ...formData, eventLocation: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Ex: SAFEX"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle assigné
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.roleAtEvent || ""}
                    onChange={(e) => setFormData({ ...formData, roleAtEvent: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                  >
                    <option value="">Sélectionner un rôle...</option>
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note de performance (sur 5)
              </label>
              <div className="relative">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.5"
                  value={formData.performanceRating || ""}
                  onChange={(e) => setFormData({ ...formData, performanceRating: parseFloat(e.target.value) || undefined })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Ex: 4.5"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes / Commentaires
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  rows={3}
                  placeholder="Commentaires sur la prestation..."
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
              className="px-6 py-2 bg-primary-gradient text-white rounded-lg hover:opacity-90 font-medium transition-all shadow-md shadow-blue-200"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
