"use client";

import React from "react";
import { useDashboardContext } from "@/components/providers/ExecutiveDashboardProvider";
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from "lucide-react";
import { KPI, ChartData } from "@/types/executive-dashboard.schema";

export default function ExecutiveDashboardPage() {
  const { data, isLoading, error } = useDashboardContext();

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="h-80 bg-gray-200 rounded-lg"></div>
          <div className="h-80 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error loading dashboard: {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Executive Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.kpis.map((kpi: KPI) => (
          <div key={kpi.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-500 mb-1">{kpi.label}</h3>
            <div className="flex items-baseline space-x-2">
              <p className="text-3xl font-semibold text-gray-900">
                {kpi.label.includes("Revenue") ? "$" : ""}
                {kpi.value.toLocaleString()}
              </p>
            </div>
            {kpi.trend !== undefined && (
              <div className="mt-4 flex items-center text-sm">
                {kpi.trendDirection === "up" ? (
                  <ArrowUpIcon className="w-4 h-4 text-emerald-500 mr-1" />
                ) : kpi.trendDirection === "down" ? (
                  <ArrowDownIcon className="w-4 h-4 text-rose-500 mr-1" />
                ) : (
                  <MinusIcon className="w-4 h-4 text-gray-400 mr-1" />
                )}
                <span
                  className={
                    kpi.trendDirection === "up"
                      ? "text-emerald-600 font-medium"
                      : kpi.trendDirection === "down"
                      ? "text-rose-600 font-medium"
                      : "text-gray-500 font-medium"
                  }
                >
                  {kpi.trend}%
                </span>
                <span className="text-gray-400 ml-2">vs last month</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Revenue Overview</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {/* Simple CSS-based bar chart for demonstration */}
            {data.revenueChart.map((point: ChartData) => {
              const max = Math.max(...data.revenueChart.map((d: ChartData) => d.value));
              const heightPercent = (point.value / max) * 100;
              return (
                <div key={point.name} className="flex flex-col items-center flex-1 group">
                  <div className="w-full flex justify-center h-full items-end relative">
                    <div 
                      className="w-full max-w-[40px] bg-blue-500 rounded-t-sm transition-all duration-500 group-hover:bg-blue-600 relative"
                      style={{ height: `${heightPercent}%` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded transition-opacity">
                        ${point.value.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{point.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Patient Activity</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {data.patientActivityChart.map((point: ChartData) => {
              const max = Math.max(...data.patientActivityChart.map((d: ChartData) => Math.max(d.value, d.secondaryValue || 0)));
              const height1 = (point.value / max) * 100;
              const height2 = ((point.secondaryValue || 0) / max) * 100;
              return (
                <div key={point.name} className="flex flex-col items-center flex-1">
                  <div className="w-full flex justify-center h-full items-end space-x-1">
                    <div 
                      className="w-1/2 max-w-[20px] bg-indigo-500 rounded-t-sm transition-all duration-500"
                      style={{ height: `${height1}%` }}
                      title={`Value: ${point.value}`}
                    />
                    <div 
                      className="w-1/2 max-w-[20px] bg-indigo-200 rounded-t-sm transition-all duration-500"
                      style={{ height: `${height2}%` }}
                      title={`Secondary: ${point.secondaryValue}`}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-2">{point.name}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center mt-4 space-x-4 text-xs text-gray-500">
             <div className="flex items-center"><div className="w-3 h-3 bg-indigo-500 rounded-sm mr-2"></div> New Patients</div>
             <div className="flex items-center"><div className="w-3 h-3 bg-indigo-200 rounded-sm mr-2"></div> Returning</div>
          </div>
        </div>
      </div>
    </div>
  );
}
