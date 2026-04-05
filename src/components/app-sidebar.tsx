"use client"

import * as React from "react"
import {
  BarChart3,
  Bookmark,
  BookOpen,
  Calendar,
  CheckSquare,
  Cloud,
  Database,
  FileText,
  Files,
  Home,
  MessageSquare,
  Phone,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "EcoDigital",
    email: "control@ecodigital.local",
    avatar: "",
  },
  navMain: [
    {
      title: "Cloud",
      url: "#",
      icon: Cloud,
      items: [
        { title: "Integraciones de storage", url: "#" },
        { title: "Cloud sync", url: "#" },
        { title: "Calendarios externos", url: "#" },
        { title: "Videoconferencia", url: "#" },
        { title: "Credenciales", url: "#" },
        { title: "Variables de entorno", url: "#" },
        { title: "App Store", url: "#" },
        { title: "Proveedores externos", url: "#" },
        { title: "Modelos IA", url: "#" },
        { title: "Workspace", url: "#" },
        { title: "Sessions", url: "#" },
        { title: "Conexiones de canal", url: "#" },
      ],
    },
    {
      title: "Notas",
      url: "#",
      icon: FileText,
      items: [
        { title: "Notas de contactos", url: "#" },
        { title: "Highlights", url: "#" },
        { title: "Colecciones", url: "#" },
        { title: "Diccionario medico", url: "#" },
        { title: "Anotaciones sobre imagen", url: "#" },
        { title: "Notas internas", url: "#" },
      ],
    },
    {
      title: "Tareas",
      url: "#",
      icon: CheckSquare,
      items: [
        { title: "Workflows", url: "#" },
        { title: "Triggers", url: "#" },
        { title: "Actions", url: "#" },
        { title: "Control", url: "#" },
        { title: "Transformations", url: "#" },
        { title: "Webhooks", url: "#" },
        { title: "Cron", url: "#" },
        { title: "Queues", url: "#" },
        { title: "Templates", url: "#" },
        { title: "Custom nodes", url: "#" },
        { title: "Modulos clinicos", url: "#" },
        { title: "Automatizaciones internas", url: "#" },
        { title: "Agentes operativos", url: "#" },
        { title: "Orquestacion asistida", url: "#" },
        { title: "Backend orchestrations", url: "#" },
        { title: "PDF pipelines", url: "#" },
      ],
    },
    {
      title: "AI Chat",
      url: "#",
      icon: MessageSquare,
      items: [
        { title: "WebChat", url: "#" },
        { title: "Agent", url: "#" },
        { title: "Canvas", url: "#" },
        { title: "Voz", url: "#" },
        { title: "Talk Mode", url: "#" },
        { title: "Voice Wake", url: "#" },
        { title: "Omnichannel", url: "#" },
        { title: "Captain", url: "#" },
        { title: "Selected text actions", url: "#" },
        { title: "Asistente virtual", url: "#" },
        { title: "AI agent workflows", url: "#" },
        { title: "Memoria", url: "#" },
        { title: "Tools", url: "#" },
        { title: "RAG", url: "#" },
      ],
    },
    {
      title: "Agenda",
      url: "#",
      icon: BookOpen,
      items: [
        { title: "Booking publico", url: "#" },
        { title: "Booking success", url: "#" },
        { title: "Reschedule", url: "#" },
        { title: "Cancelacion", url: "#" },
        { title: "Recurrencia", url: "#" },
        { title: "Waitlist", url: "#" },
        { title: "Event types", url: "#" },
        { title: "Round robin", url: "#" },
        { title: "Membresias", url: "#" },
        { title: "Team calendars", url: "#" },
        { title: "Bandeja unificada", url: "#" },
        { title: "Assignment", url: "#" },
        { title: "Horarios de atencion", url: "#" },
        { title: "Citas medicas", url: "#" },
        { title: "Disponibilidad clinica", url: "#" },
        { title: "Seguimientos", url: "#" },
        { title: "Notificaciones", url: "#" },
      ],
    },
    {
      title: "Metricas",
      url: "#",
      icon: BarChart3,
      items: [
        { title: "Scheduling insights", url: "#" },
        { title: "Conversation reports", url: "#" },
        { title: "Agents", url: "#" },
        { title: "Inbox", url: "#" },
        { title: "Labels", url: "#" },
        { title: "Team", url: "#" },
        { title: "CSAT", url: "#" },
        { title: "Live view", url: "#" },
        { title: "Exportables", url: "#" },
        { title: "Execution history", url: "#" },
        { title: "Exito y error", url: "#" },
        { title: "Throughput", url: "#" },
        { title: "Workflow usage", url: "#" },
        { title: "Clinical analytics", url: "#" },
        { title: "PDF auditing", url: "#" },
        { title: "Platform usage", url: "#" },
        { title: "BlackShell diagnostics", url: "#" },
      ],
    },
    {
      title: "Archivos",
      url: "#",
      icon: Files,
      items: [
        { title: "PDF tools", url: "#" },
        { title: "Merge", url: "#" },
        { title: "Split", url: "#" },
        { title: "Rotate", url: "#" },
        { title: "Reorder", url: "#" },
        { title: "Extract", url: "#" },
        { title: "Crop", url: "#" },
        { title: "OCR", url: "#" },
        { title: "Compress", url: "#" },
        { title: "Redact", url: "#" },
        { title: "Watermark", url: "#" },
        { title: "Cert sign", url: "#" },
        { title: "Validate signature", url: "#" },
        { title: "Compare", url: "#" },
        { title: "Repair", url: "#" },
        { title: "PDF info", url: "#" },
        { title: "Attachments", url: "#" },
        { title: "Help center assets", url: "#" },
        { title: "Documentos clinicos", url: "#" },
        { title: "DICOM viewer", url: "#" },
        { title: "3D", url: "#" },
        { title: "Mediciones", url: "#" },
        { title: "Exportacion", url: "#" },
        { title: "Reportes", url: "#" },
        { title: "Share cards", url: "#" },
      ],
    },
    {
      title: "Call Logs",
      url: "#",
      icon: Phone,
      items: [
        { title: "Historial por canal", url: "#" },
        { title: "Correos", url: "#" },
        { title: "SMS", url: "#" },
        { title: "WhatsApp", url: "#" },
        { title: "Telegram", url: "#" },
        { title: "API channel", url: "#" },
        { title: "Redes sociales", url: "#" },
        { title: "Meetings", url: "#" },
        { title: "Voz", url: "#" },
        { title: "Talk sessions", url: "#" },
        { title: "Backend communications", url: "#" },
      ],
    },
    {
      title: "Registros",
      url: "#",
      icon: Database,
      items: [
        { title: "Audit logs", url: "#" },
        { title: "Activity logs", url: "#" },
        { title: "Historial clinico", url: "#" },
        { title: "Usuarios", url: "#" },
        { title: "Roles", url: "#" },
        { title: "Permisos", url: "#" },
        { title: "Sesiones", url: "#" },
        { title: "Organizaciones", url: "#" },
        { title: "Accesos", url: "#" },
        { title: "Flags", url: "#" },
        { title: "Impersonation", url: "#" },
        { title: "SSO", url: "#" },
        { title: "Dsync", url: "#" },
        { title: "API keys", url: "#" },
        { title: "Webhooks", url: "#" },
        { title: "OAuth apps", url: "#" },
        { title: "Perfil", url: "#" },
        { title: "Appearance", url: "#" },
        { title: "Push", url: "#" },
        { title: "Features", url: "#" },
        { title: "Domains", url: "#" },
        { title: "Timezones", url: "#" },
        { title: "Idiomas", url: "#" },
        { title: "Credenciales", url: "#" },
        { title: "Configuracion", url: "#" },
        { title: "Variables de entorno", url: "#" },
        { title: "Versionado", url: "#" },
        { title: "Extensions", url: "#" },
        { title: "Devices", url: "#" },
        { title: "Nodes", url: "#" },
        { title: "Sandbox", url: "#" },
        { title: "Password manager", url: "#" },
        { title: "Auth popup", url: "#" },
        { title: "Saved state", url: "#" },
        { title: "Security events", url: "#" },
        { title: "Contactos", url: "#" },
        { title: "Segmentos", url: "#" },
        { title: "Custom attributes", url: "#" },
        { title: "Formularios", url: "#" },
      ],
    },
    {
      title: "Calendario",
      url: "#",
      icon: Calendar,
      items: [
        { title: "Availability", url: "#" },
        { title: "Connected calendars", url: "#" },
        { title: "Destination calendars", url: "#" },
        { title: "Conferencias", url: "#" },
        { title: "Out of office", url: "#" },
        { title: "Recursos", url: "#" },
        { title: "Horarios", url: "#" },
        { title: "Disponibilidad por medico", url: "#" },
        { title: "Excepciones", url: "#" },
        { title: "Horarios especiales", url: "#" },
        { title: "Recursos reservables", url: "#" },
      ],
    },
  ],
}

export function AppSidebar({
  favorites,
  onOpenFavorite,
  onRemoveFavorite,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  favorites: BookmarkItem[]
  onOpenFavorite: (url: string) => void
  onRemoveFavorite: (url: string) => void
}) {
  const favoriteItems = favorites.map((favorite) => ({
    name: favorite.title || favorite.url,
    url: favorite.url,
    icon: Bookmark,
  }))

  return (
    <Sidebar variant="inset" {...props}>
      <div className="flex h-full flex-col pt-[10px]">
        <SidebarHeader className="pt-[16px]">
          <SidebarMenu>
            <SidebarMenuItem className="mt-[5px]">
              <SidebarMenuButton asChild>
                <a href="#">
                  <Home />
                  <span>Home</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavProjects
            projects={favoriteItems}
            onOpen={onOpenFavorite}
            onRemove={onRemoveFavorite}
          />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}
