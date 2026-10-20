"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  User,
  Building,
  Phone,
  Mail,
  Coins,
  Clock,
  Copy,
  Check,
  Lightbulb,
} from "lucide-react";
import { LostCustomerRecord } from "../types";

interface LostCustomerDetailModalProps {
  customer: LostCustomerRecord | null;
  open: boolean;
  onClose: () => void;
}

function formatPhp(amount: number): string {
  return `₱${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getRecommendation(days: number, sales: number) {
  if (days >= 180) {
    return {
      severity: "Critical Risk (Lost Account)",
      badgeColor: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
      action:
        sales > 100000
          ? "High-priority account recovery required. Recommend executive/sales manager outreach with tailored win-back incentives and account review."
          : "Account has been inactive for over 6 months. Consider automated re-engagement campaign or reallocating to prospective sales rep.",
    };
  }
  if (days >= 90) {
    return {
      severity: "Severe Inactivity (Dormant)",
      badgeColor: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
      action:
        "Customer has missed routine replenishment cycles. Schedule immediate phone call from assigned salesman to check inventory needs or service friction.",
    };
  }
  return {
    severity: "Emerging Inactivity (At Risk)",
    badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    action:
      "Account is approaching dormant threshold. Prompt salesman to include outlet in next weekly route schedule.",
  };
}

export function LostCustomerDetailModal({
  customer,
  open,
  onClose,
}: LostCustomerDetailModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!customer) return null;

  const handleCopyCode = () => {
    if (!customer.customerCode) return;
    navigator.clipboard.writeText(customer.customerCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  const recommendation = getRecommendation(
    customer.minDaysNoSales,
    customer.totalHistoricalSales
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="space-y-2 pb-3 border-b border-border/50">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-muted-foreground">
                {customer.customerCode}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyCode}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Copy customer code"
              >
                {copiedCode ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
            <Badge variant="outline" className={`text-xs ${recommendation.badgeColor}`}>
              {customer.tagging}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-black text-foreground">
            {customer.customerName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Metrics summary grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="rounded-2xl border-border/60 bg-muted/20">
              <CardContent className="p-3.5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-red-500" /> Days Inactive
                </span>
                <div className="text-2xl font-black text-foreground">
                  {customer.minDaysNoSales}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Last: {customer.lastSalesDate || "No record"}
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 bg-muted/20">
              <CardContent className="p-3.5 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-amber-500" /> Past Sales Volume
                </span>
                <div className="text-2xl font-black text-foreground">
                  {formatPhp(customer.totalHistoricalSales)}
                </div>
                <p className="text-[10px] text-muted-foreground">Historical account value</p>
              </CardContent>
            </Card>
          </div>

          {/* Account Details */}
          <Card className="rounded-2xl border-border/60 bg-muted/10">
            <CardContent className="p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" /> Assigned Salesman:
                </span>
                <span className="font-bold text-foreground">
                  {customer.salesmanName || "Unassigned"}
                </span>
              </div>

              {customer.branchName && (
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-primary" /> Branch:
                  </span>
                  <span className="font-bold text-foreground">{customer.branchName}</span>
                </div>
              )}

              {customer.contactNumber && (
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-primary" /> Contact:
                  </span>
                  <span className="font-bold text-foreground">{customer.contactNumber}</span>
                </div>
              )}

              {customer.email && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-primary" /> Email:
                  </span>
                  <span className="font-bold text-foreground">{customer.email}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Action */}
          <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Lightbulb className="h-4 w-4" />
              <span>Recommended Retention Strategy ({recommendation.severity})</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {recommendation.action}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
