"use client";

import React, { useState } from "react";
import { usePermitCreation } from "./hooks/usePermitCreation";
import { PermitCreationHeader } from "./components/PermitCreationHeader";
import { PermitMatrixTable } from "./components/PermitMatrixTable";
import { PermitFormDialog } from "./components/PermitFormDialog";
import { PermitDetailDialog } from "./components/PermitDetailDialog";
import { ManagePermitTypesDialog } from "./components/ManagePermitTypesDialog";
import {
  PermitCompany,
  PermitTypeItem,
  PermitRecord,
  PermitFormData,
} from "./types/permit-creation.types";

export default function PermitCreationPage() {
  const {
    companies,
    totalCompanies,
    permitTypes,
    activePermitTypes,
    allPermitTypes,
    permits,
    permitMap,
    isLoading,
    isSubmitting,
    searchTerm,
    setSearchTerm,
    selectedTypeIds,
    toggleTypeSelection,
    selectAllTypes,
    unselectAllTypes,
    refetch,
    addPermit,
    updatePermit,
    deletePermit,
    createPermitType,
    updatePermitType,
  } = usePermitCreation();

  // State for Add / Edit modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isRenewalMode, setIsRenewalMode] = useState(false);
  const [selectedCompanyForForm, setSelectedCompanyForForm] = useState<PermitCompany | null>(null);
  const [selectedPermitTypeForForm, setSelectedPermitTypeForForm] = useState<PermitTypeItem | null>(null);
  const [editRecord, setEditRecord] = useState<PermitRecord | null>(null);

  // State for Add Permit Type modal
  const [isAddTypeOpen, setIsAddTypeOpen] = useState(false);

  // State for View Details modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPermitForDetail, setSelectedPermitForDetail] = useState<PermitRecord | null>(null);
  const [selectedCompanyForDetail, setSelectedCompanyForDetail] = useState<PermitCompany | null>(null);
  const [selectedPermitTypeForDetail, setSelectedPermitTypeForDetail] = useState<PermitTypeItem | null>(null);

  // Handler: click Add on empty cell
  const handleAddPermitForCell = (company: PermitCompany, permitType: PermitTypeItem) => {
    setIsRenewalMode(false);
    setEditRecord(null);
    setSelectedCompanyForForm(company);
    setSelectedPermitTypeForForm(permitType);
    setIsFormOpen(true);
  };

  // Handler: click Global new permit
  const handleOpenGlobalNewPermit = () => {
    setIsRenewalMode(false);
    setEditRecord(null);
    setSelectedCompanyForForm(null);
    setSelectedPermitTypeForForm(null);
    setIsFormOpen(true);
  };

  // Handler: view details
  const handleViewPermitDetails = (
    permit: PermitRecord,
    company: PermitCompany,
    permitType: PermitTypeItem
  ) => {
    setSelectedPermitForDetail(permit);
    setSelectedCompanyForDetail(company);
    setSelectedPermitTypeForDetail(permitType);
    setIsDetailOpen(true);
  };

  // Handler: Edit from detail dialog
  const handleEditFromDetail = (permit: PermitRecord) => {
    const comp = companies.find((c) => c.company_id === permit.company_id) || null;
    const type = allPermitTypes.find((t) => String(t.id) === String(permit.permit_type_id)) || null;

    setIsRenewalMode(false);
    setEditRecord(permit);
    setSelectedCompanyForForm(comp);
    setSelectedPermitTypeForForm(type);
    setIsFormOpen(true);
  };

  // Handler: Renew from detail dialog
  const handleRenewFromDetail = (permit: PermitRecord) => {
    const comp = companies.find((c) => c.company_id === permit.company_id) || null;
    const type = allPermitTypes.find((t) => String(t.id) === String(permit.permit_type_id)) || null;

    setIsRenewalMode(true);
    setEditRecord(permit);
    setSelectedCompanyForForm(comp);
    setSelectedPermitTypeForForm(type);
    setIsFormOpen(true);
  };

  // Form submit handler
  const handleFormSubmit = async (data: PermitFormData): Promise<boolean> => {
    if (isRenewalMode) {
      // In renewal mode, create brand new record with status='Active' and link renew_from_id for atomic archiving
      const createData = { ...data };
      delete createData.id;
      return await addPermit({
        ...createData,
        status: "Active",
        renew_from_id: editRecord?.id,
      });
    }

    if (data.id) {
      return await updatePermit(data.id, data);
    } else {
      return await addPermit({
        ...data,
        status: "Active",
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 gap-2.5 overflow-hidden">
      <div className="shrink-0">
        <PermitCreationHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedTypeIds={selectedTypeIds}
          onToggleType={toggleTypeSelection}
          onSelectAllTypes={selectAllTypes}
          onUnselectAllTypes={unselectAllTypes}
          permitTypes={activePermitTypes}
          totalCompanies={totalCompanies}
          totalPermits={permits.length}
          isLoading={isLoading}
          onRefresh={refetch}
          onOpenNewPermit={handleOpenGlobalNewPermit}
          onOpenAddPermitType={() => setIsAddTypeOpen(true)}
        />
      </div>

      <div className="flex-1 min-h-0 w-full overflow-hidden">
        <PermitMatrixTable
          companies={companies}
          permitTypes={permitTypes}
          totalActiveTypes={activePermitTypes.length}
          permitMap={permitMap}
          isLoading={isLoading}
          onAddPermitForCell={handleAddPermitForCell}
          onViewPermitDetails={handleViewPermitDetails}
          onOpenAddPermitType={() => setIsAddTypeOpen(true)}
        />
      </div>

      {/* Manage Permit Types Dialog */}
      <ManagePermitTypesDialog
        isOpen={isAddTypeOpen}
        onClose={() => setIsAddTypeOpen(false)}
        permitTypes={allPermitTypes}
        permits={permits}
        onCreateType={createPermitType}
        onUpdateType={updatePermitType}
        isSubmitting={isSubmitting}
      />

      {/* Add / Edit / Renew Dialog */}
      <PermitFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        companies={companies}
        permitTypes={allPermitTypes}
        initialCompany={selectedCompanyForForm}
        initialPermitType={selectedPermitTypeForForm}
        editRecord={editRecord}
        isRenewalMode={isRenewalMode}
      />

      {/* Details Dialog */}
      <PermitDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        permit={selectedPermitForDetail}
        company={selectedCompanyForDetail}
        permitType={selectedPermitTypeForDetail}
        onEdit={handleEditFromDetail}
        onRenew={handleRenewFromDetail}
        onDelete={deletePermit}
        isDeleting={isSubmitting}
      />
    </div>
  );
}
