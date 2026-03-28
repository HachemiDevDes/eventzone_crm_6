import React, { useState, useMemo } from "react";
import { useStore } from "../store/StoreContext";
import { Priority, Task } from "../types";
import { Plus, Search, Calendar, CheckCircle2, Circle, AlertCircle, Trash2, Edit2, GripVertical, TrendingUp, Zap, Activity, Clock } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { isBefore, parseISO, isToday, startOfDay } from "date-fns";
import { cn } from "../lib/utils";
import { useTranslation } from "../hooks/useTranslation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function Tasks() {
  const { data, addTask, updateTask, deleteTask, reorderTasks, currentUser } = useStore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("pending");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isManager = currentUser?.role === "Manager";
  const isSMM = currentUser?.role === "Social Media Manager";

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredTasks = useMemo(() => {
    return data.tasks
      .filter((t) => {
        if (filter === "pending") return !t.completed;
        if (filter === "completed") return t.completed;
        return true;
      })
      .filter((t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter((t) => {
        if (isManager) return true;
        
        // Show tasks assigned to the current user
        return t.assignedTo === currentUser?.id;
      })
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        if (a.completed === b.completed) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return a.completed ? 1 : -1;
      });
  }, [data.tasks, filter, searchTerm, isManager, currentUser?.id]);

  const stats = useMemo(() => {
    const userTasks = data.tasks.filter(t => isManager || t.assignedTo === currentUser?.id);
    const totalTasks = userTasks.length;
    const pendingTasks = userTasks.filter(t => !t.completed).length;
    const completedTasks = userTasks.filter(t => t.completed).length;
    const overdueTasks = userTasks.filter(t => !t.completed && isBefore(parseISO(t.dueDate), startOfDay(new Date()))).length;

    return {
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks
    };
  }, [data.tasks, isManager, currentUser?.id]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = filteredTasks.findIndex((t) => t.id === active.id);
      const newIndex = filteredTasks.findIndex((t) => t.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(filteredTasks, oldIndex, newIndex);
        reorderTasks(newOrder);
      }
    }
  };

  const priorityTranslationKeys: Record<Priority, string> = {
    "Haute": "high",
    "Moyenne": "medium",
    "Basse": "low",
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "Haute":
        return "text-red-600 bg-red-50";
      case "Moyenne":
        return "text-yellow-600 bg-yellow-50";
      case "Basse":
        return "text-blue-600 bg-blue-50";
    }
  };

  const getRelatedName = (task: Task) => {
    if (!task.relatedToType) return t("general");
    if (task.relatedToType === "Plateforme") {
      return task.relatedToId;
    } else if (task.relatedToType === "Client") {
      return data.clients.find((c) => c.id === task.relatedToId)?.companyName || t("unknownClient");
    } else {
      return data.leads.find((l) => l.id === task.relatedToId)?.companyName || t("unknownLead");
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{t("tasksTitle")}</h1>
          <p className="text-gray-500 font-medium mt-1">{t("manageTasksDescription") || "Gérez vos tâches quotidiennes et priorités."}</p>
        </div>
        <button
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto bg-primary-gradient text-white px-6 py-3 rounded-2xl flex items-center justify-center space-x-2 hover:opacity-90 transition-all shadow-xl shadow-blue-200 text-sm font-black uppercase tracking-wider active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>{t("addTask")}</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t("searchTaskPlaceholder")}
              className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-transparent rounded-2xl focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all outline-none text-sm font-medium text-gray-700 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200/50 shadow-inner">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === "all" ? "bg-white shadow-md text-primary" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t("all")}
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === "pending" ? "bg-white shadow-md text-primary" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t("pending")}
            </button>
            <button
              onClick={() => setFilter("completed")}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === "completed" ? "bg-white shadow-md text-primary" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t("completed")}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    isManager={isManager}
                    updateTask={updateTask}
                    deleteTask={deleteTask}
                    setEditingTask={setEditingTask}
                    setIsModalOpen={setIsModalOpen}
                    t={t}
                    confirmDeleteId={confirmDeleteId}
                    setConfirmDeleteId={setConfirmDeleteId}
                    getPriorityColor={getPriorityColor}
                    getRelatedName={getRelatedName}
                  />
                ))}
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    {t("noTasksFound")}
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </div>

      {isModalOpen && (
        <TaskModal 
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }} 
          onSave={(taskData) => {
            if (editingTask) {
              updateTask(editingTask.id, taskData);
            } else {
              addTask(taskData as Task);
            }
          }}
          task={editingTask}
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

function SortableTaskItem({ 
  task, 
  isManager, 
  updateTask, 
  deleteTask, 
  setEditingTask, 
  setIsModalOpen, 
  t, 
  confirmDeleteId, 
  setConfirmDeleteId,
  getPriorityColor,
  getRelatedName
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityTranslationKeys: Record<Priority, string> = {
    "Haute": "high",
    "Moyenne": "medium",
    "Basse": "low",
  };

  const isOverdue = !task.completed && isBefore(parseISO(task.dueDate), new Date()) && !isToday(parseISO(task.dueDate));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "border rounded-xl p-4 flex items-start space-x-4 transition-colors bg-white",
        task.completed ? "bg-gray-50 border-gray-200" : "border-gray-200 hover:border-primary",
        isOverdue && "border-red-300 bg-red-50/30"
      )}
    >
      <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500">
        <GripVertical className="w-5 h-5" />
      </div>

      <button
        onClick={() => updateTask(task.id, { completed: !task.completed })}
        className="mt-1 flex-shrink-0 focus:outline-none"
      >
        {task.completed ? (
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        ) : (
          <Circle className="w-6 h-6 text-gray-300 hover:text-primary" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={cn("text-base font-medium truncate", task.completed ? "text-gray-500 line-through" : "text-gray-900")}>
            {task.title}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={cn("px-2 py-1 text-xs font-medium rounded-md flex-shrink-0", getPriorityColor(task.priority))}>
              {t(priorityTranslationKeys[task.priority])}
            </span>
            <button
              onClick={() => {
                setEditingTask(task);
                setIsModalOpen(true);
              }}
              className="p-1 text-gray-400 hover:text-primary hover:bg-blue-50 rounded transition-colors"
              title={t("edit")}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <p className={cn("text-sm mb-3", task.completed ? "text-gray-400" : "text-gray-600")}>
          {task.description}
        </p>
        
        <div className="flex items-center space-x-4 text-xs font-medium">
          <div className={cn("flex items-center", isOverdue ? "text-red-600" : "text-gray-500")}>
            {isOverdue ? <AlertCircle className="w-4 h-4 mr-1" /> : <Calendar className="w-4 h-4 mr-1" />}
            {new Date(task.dueDate).toLocaleDateString("fr-DZ")}
            {isOverdue && ` (${t("overdue")})`}
          </div>
          <div className="text-gray-500 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mr-2"></span>
            {task.relatedToType ? `${task.relatedToType}: ${getRelatedName(task)}` : "Général"}
          </div>
        </div>
      </div>
      {isManager && (
        <button
          onClick={() => {
            if (confirmDeleteId === task.id) {
              deleteTask(task.id);
            } else {
              setConfirmDeleteId(task.id);
              setTimeout(() => setConfirmDeleteId(null), 3000);
            }
          }}
          className={`ml-4 p-2 rounded-lg transition-colors flex-shrink-0 ${confirmDeleteId === task.id ? 'bg-red-600 text-white hover:bg-red-700' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
          title={t("delete")}
        >
          {confirmDeleteId === task.id ? <span className="text-xs font-bold">{t("confirm")}</span> : <Trash2 className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
}

function TaskModal({
  onClose,
  onSave,
  task,
}: {
  onClose: () => void;
  onSave: (task: Partial<Task>) => void;
  task?: Task | null;
}) {
  const { data, currentUser } = useStore();
  const { t } = useTranslation();
  const isManager = currentUser?.role === "Manager";
  const isSMM = currentUser?.role === "Social Media Manager";
  const [formData, setFormData] = useState<Partial<Task>>(
    task || {
      priority: "Moyenne",
      relatedToType: isSMM ? "Plateforme" : isManager ? undefined : "Lead",
      completed: false,
    }
  );

  const availableLeads = isManager 
    ? data.leads 
    : data.leads.filter(l => l.assignedTo === currentUser?.id);
    
  const availableClients = isManager 
    ? data.clients 
    : data.clients.filter(c => c.assignedTo === currentUser?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task) {
      onSave(formData);
    } else {
      onSave({
        ...formData,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      } as Task);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {task ? t("editTask") : t("newTask")}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("title")}
            </label>
            <input
              required
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("description")}
            </label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("dueDate")}
              </label>
              <input
                required
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                value={formData.dueDate || ""}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("priority")}
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                value={formData.priority || "Moyenne"}
              >
                <option value="Haute">{t("high")}</option>
                <option value="Moyenne">{t("medium")}</option>
                <option value="Basse">{t("low")}</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("relatedTo")}
              </label>
              {isSMM ? (
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary bg-gray-50"
                  disabled
                  value="Plateforme"
                >
                  <option value="Plateforme">{t("socialPlatform")}</option>
                </select>
              ) : (
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary"
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ 
                      ...formData, 
                      relatedToType: val === "General" ? undefined : val as "Lead" | "Client" | "Plateforme", 
                      relatedToId: val === "General" ? undefined : "" 
                    });
                  }}
                  value={formData.relatedToType || "General"}
                >
                  {isManager && <option value="General">Général</option>}
                  <option value="Lead">Lead</option>
                  <option value="Client">Client</option>
                  {isManager && <option value="Plateforme">{t("socialPlatform")}</option>}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("select")}
              </label>
              {isSMM || formData.relatedToType === "Plateforme" ? (
                <select
                  required={!!formData.relatedToType}
                  disabled={!formData.relatedToType}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-400"
                  onChange={(e) => setFormData({ ...formData, relatedToId: e.target.value })}
                  value={formData.relatedToId || ""}
                >
                  <option value="">{t("selectPlaceholder")}</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Meta">Meta (Facebook/Instagram)</option>
                  <option value="TikTok">TikTok</option>
                </select>
              ) : (
                <select
                  required={!!formData.relatedToType}
                  disabled={!formData.relatedToType}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:text-gray-400"
                  onChange={(e) => setFormData({ ...formData, relatedToId: e.target.value })}
                  value={formData.relatedToId || ""}
                >
                  <option value="">{t("selectPlaceholder")}</option>
                  {formData.relatedToType === "Lead"
                    ? availableLeads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.companyName}
                        </option>
                      ))
                    : formData.relatedToType === "Client" 
                      ? availableClients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.companyName}
                          </option>
                        ))
                      : null}
                </select>
              )}
            </div>
          </div>

          {isManager && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("assignedTo")}
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {data.team.map((member) => {
                  const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase();
                  const isSelected = formData.assignedTo === member.id;
                  
                  return (
                    <div 
                      key={member.id}
                      onClick={() => setFormData({ ...formData, assignedTo: member.id })}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                        isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50 border border-transparent"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{member.name}</p>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider",
                            member.role === "Manager" ? "bg-purple-100 text-purple-700" :
                            member.role === "Sales Agent" ? "bg-blue-100 text-blue-700" :
                            "bg-pink-100 text-pink-700"
                          )}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              {task ? t("saveChanges") : t("createTask")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
