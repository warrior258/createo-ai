"use client"
import { Home, Video, List, LayoutTemplate, Settings, HelpCircle, Unplug, LogOut } from "lucide-react";
import { usePathname, useRouter } from 'next/navigation';


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { ModeToggle } from "./ModeToogle";
import { getCurrentUser } from "@/app/utils/auth";

// Updated menu items
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    color: "text-blue-500"
  },
  {
    title: "Create Video",
    url: "/createvideo",
    icon: Video,
    color: "text-purple-500"
  },
  {
    title: "My Videos",
    url: "/videos",
    icon: List,
    color: "text-emerald-500"
  },
  {
    title: "Integrations",
    url: "/integrations",
    icon: Unplug,
    color: "text-amber-500"
  },
];

const footerItems = [
  {
    title: "Support",
    url: "#",
    icon: HelpCircle,
    color: "text-sky-500"
  }
];


export default function AppSidebar() {
  const pathname = usePathname();
  const isLoginPage = pathname === '/';
  const router = useRouter();

  if(isLoginPage) return <></>;

  const handleLogout = async () => {
    try {
      // Call your logout API
      const response = await fetch('/api/google-auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        // Redirect to login page after successful logout
        router.push('/');
        router.refresh(); // Ensure client state updates
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader className="px-4">
            <div className="flex items-center justify-between">
                <h1 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CreateoAI</h1>
                <ModeToggle/>
            </div>
        </SidebarHeader>
        <SidebarContent>
          {/* Main App Navigation */}
          <SidebarGroup>
            <SidebarMenu>
            {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                    <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                        <span>{item.title}</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
          </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
              <SidebarMenu>
                {footerItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={handleLogout}>
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
          </SidebarFooter>
        
      </Sidebar>
      <SidebarTrigger />
    </>
  );
}
