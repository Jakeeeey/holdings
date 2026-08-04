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

export interface TopHeaderProps {
    user: {
        name: string;
        email: string;
        avatar: string;
    };
    subsystemSlug?: string;
    breadcrumbs?: { title: string; href?: string; isLast?: boolean }[];
}

export function TopHeader({ user, subsystemSlug, breadcrumbs: customBreadcrumbs }: TopHeaderProps) {
    const pathname = usePathname();
    
    // Quick helper to generate breadcrumbs from path
    const pathSegments = pathname.split("/").filter(Boolean);
    const breadcrumbs = customBreadcrumbs || pathSegments.map((segment, index) => {
        const title = segment
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
        const href = "/" + pathSegments.slice(0, index + 1).join("/");
        return { title, href, isLast: index === pathSegments.length - 1 };
    });

    return (
        <header className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b shadow-sm bg-background sm:h-16 overflow-hidden">
            <div className="flex h-full min-w-0 items-center gap-2 px-3 sm:px-4 overflow-hidden">
                <SidebarTrigger className="-ml-1 shrink-0" />
                <Separator
                    orientation="vertical"
                    className="hidden sm:block mr-2 data-[orientation=vertical]:h-4 shrink-0"
                />
                <div className="min-w-0 overflow-hidden">
                    <Breadcrumb>
                        <BreadcrumbList className="min-w-0 overflow-hidden">
                            {breadcrumbs.map((crumb, i) => {
                                const isLast = crumb.isLast ?? (i === breadcrumbs.length - 1);
                                return (
                                    <React.Fragment key={i}>
                                        <BreadcrumbItem className={isLast ? "min-w-0 overflow-hidden" : "hidden md:block shrink-0"}>
                                            {isLast ? (
                                                <BreadcrumbPage className="truncate max-w-[56vw] sm:max-w-[60vw] md:max-w-none">
                                                    {crumb.title}
                                                </BreadcrumbPage>
                                            ) : (
                                                crumb.href ? (
                                                    <BreadcrumbLink href={crumb.href}>{crumb.title}</BreadcrumbLink>
                                                ) : (
                                                    <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                                                )
                                            )}
                                        </BreadcrumbItem>
                                        {!isLast && <BreadcrumbSeparator className="hidden md:block shrink-0" />}
                                    </React.Fragment>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>
            </div>
            <div className="flex h-full items-center px-2 sm:px-4 shrink-0 max-w-[48vw] sm:max-w-none overflow-hidden">
                <div className="w-56">
                    <NavUser 
                        user={user}
                        subsystemSlug={subsystemSlug}
                    />
                </div>
            </div>
        </header>
    );
}
