"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NavUser } from "@/components/shared/app-sidebar/nav-user";

export function TopHeader() {
    const pathname = usePathname();
    
    // Quick helper to generate breadcrumbs from path
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const title = segment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        const href = "/" + pathSegments.slice(0, index + 1).join("/");
        return { title, href, isLast: index === pathSegments.length - 1 };
    });

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background">
            <div className="flex flex-1 items-center gap-2 px-3">
                <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb) => (
                            <React.Fragment key={crumb.href}>
                                <BreadcrumbItem className="hidden md:block">
                                    {crumb.isLast ? (
                                        <BreadcrumbPage className="font-semibold text-primary">{crumb.title}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink href={crumb.href}>{crumb.title}</BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                                {!crumb.isLast && <BreadcrumbSeparator className="hidden md:block" />}
                            </React.Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-56">
                    <NavUser 
                        user={{
                            name: "dev vertex",
                            email: "dev@men2corp.com",
                            avatar: ""
                        }}
                        subsystemSlug="holdings"
                    />
                </div>
            </div>
        </header>
    );
}
