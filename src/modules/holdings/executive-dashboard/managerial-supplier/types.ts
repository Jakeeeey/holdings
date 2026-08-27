import { VSalesPerformanceDataDto as BaseDTO } from "../executive-health/types";

export interface SupplierMetric {
    supplierName: string;
    divisionName: string;
    totalSales: number;
    transactionCount: number;
}

export interface ProductSalesDetail {
    customerCode: string;
    salesmanId: number;
    supplierId: number;
    supplierName: string;
    invoiceNo: string;
    transactionDate: string;
    productId: number;
    productName: string;
    categoryName: string;
    brandName: string;
    unitName: string;
    totalQuantity: number;
    quantityInBox: number;
    quantityInPiece: number;
    unitPrice: number;
    discountAmount: number;
    netAmount: number;
    highestMonthlySales?: number;
}

export interface AreaTarget {
    province: string;
    city: string;
    target_amount: number;
}

export interface VSalesPerformanceDataDto extends BaseDTO {
    customerCode?: string;
    province?: string;
    city?: string;
    provinceName?: string;
    cityName?: string;
    productId?: number;
}
export interface VSalesPerformanceDataDto {
    divisionId: number;
    salesmanId: number;
    supplierId: number;
    divisionName: string;
    salesmanName: string;
    supplierName: string;
    transactionDate: string;
    netAmount: number;
    storeName?: string;
    storeType?: string;
    storeTypeLabel?: string;
    customerCode?: string;
    province?: string;
    city?: string;
}
export interface ProductSalesDetail {
    customerCode: string;
    salesmanId: number;
    supplierId: number;
    supplierName: string;
    invoiceNo: string;
    transactionDate: string;
    productId: number;
    productName: string;
    categoryName: string;
    brandName: string;
    unitName: string;
    totalQuantity: number;
    quantityInBox: number;
    quantityInPiece: number;
    unitPrice: number;
    discountAmount: number;
    netAmount: number;
    highestMonthlySales?: number;
}
