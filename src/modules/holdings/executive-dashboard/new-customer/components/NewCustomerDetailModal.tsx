"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Store,
    User,
    MapPin,
    Calendar,
    FileText,
    ExternalLink,
    Copy,
    Check,
    Phone,
    Mail,
    CheckCircle2,
    XCircle,
} from "lucide-react";
import { NewCustomerItem } from "../types";

interface NewCustomerDetailModalProps {
    customer: NewCustomerItem | null;
    open: boolean;
    onClose: () => void;
}

export const NewCustomerDetailModal: React.FC<NewCustomerDetailModalProps> = ({
    customer,
    open,
    onClose,
}) => {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    if (!customer) return null;

    const handleCopy = (text: string, key: string) => {
        if (!text || text === "-") return;
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 1500);
    };

    const hasCoordinates = customer.latitude && customer.longitude;
    const mapUrl = hasCoordinates
        ? `https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customer.location)}`;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border-border shadow-xl">
                <DialogHeader className="space-y-2 pb-3 border-b border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-mono">
                                #{customer.id}
                            </Badge>
                            <Badge
                                variant={customer.isActive ? "default" : "secondary"}
                                className={customer.isActive ? "bg-emerald-600 text-white" : ""}
                            >
                                {customer.isActive ? (
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" /> Active Account
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <XCircle className="h-3 w-3" /> Inactive
                                    </span>
                                )}
                            </Badge>
                        </div>
                    </div>

                    <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {customer.storeName || customer.customerName}
                    </DialogTitle>

                    {customer.storeName !== customer.customerName && (
                        <DialogDescription className="text-xs font-medium text-muted-foreground">
                            Proprietor: <strong className="text-foreground">{customer.customerName}</strong>
                        </DialogDescription>
                    )}
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Key Attributes Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Customer Code */}
                        <Card className="border-border/60 bg-muted/20">
                            <CardContent className="p-3.5 flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                                        Customer Code
                                    </span>
                                    <span className="text-sm font-mono font-bold text-foreground">
                                        {customer.customerCode}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleCopy(customer.customerCode, "code")}
                                >
                                    {copiedKey === "code" ? (
                                        <Check className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Store Classification */}
                        <Card className="border-border/60 bg-muted/20">
                            <CardContent className="p-3.5 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <Store className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                                        Store Classification
                                    </span>
                                    <span className="text-sm font-bold text-foreground">
                                        {customer.storeType}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Assigned Salesman */}
                        <Card className="border-border/60 bg-muted/20">
                            <CardContent className="p-3.5 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <User className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                                        Onboarded By
                                    </span>
                                    <span className="text-sm font-bold text-foreground">
                                        {customer.salesmanName}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Registration Date */}
                        <Card className="border-border/60 bg-muted/20">
                            <CardContent className="p-3.5 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                    <Calendar className="h-4 w-4" />
                                </div>
                                <div>
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                                        Registration Date
                                    </span>
                                    <span className="text-sm font-bold text-foreground">
                                        {customer.dateEntered || "Not recorded"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact & Geographic Information */}
                    <Card className="border-border/60 bg-muted/10">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                    <span>Location &amp; Contact</span>
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="h-7 text-xs gap-1 border-border/70"
                                >
                                    <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3" />
                                        <span>Open Map</span>
                                    </a>
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-muted-foreground font-medium block">Address:</span>
                                    <span className="text-foreground font-semibold">{customer.location}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground font-medium block">Contact Number:</span>
                                    <span className="text-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        {customer.contactNumber}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground font-medium block">Email:</span>
                                    <span className="text-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                        {customer.customerEmail}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground font-medium block">Tax ID (TIN):</span>
                                    <span className="text-foreground font-mono font-semibold flex items-center gap-1.5 mt-0.5">
                                        <FileText className="h-3 w-3 text-muted-foreground" />
                                        {customer.customerTin}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
};
