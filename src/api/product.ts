import { get, post } from '@/utils/request'
import type { PageData } from '@/types/common'

export interface Product {
    id: number
    name: string
    description: string
    price: number
    status: number
    status_name: string
    dept_id: number
    dept_name: string
    created_by: number
    created_at: string
    updated_at: string
}

export interface ProductQuery {
    name?: string
    status?: number
    page?: number
    per_page?: number
}

export interface ProductPayload {
    name: string
    description: string
    price: number
    status: number
    dept_id?: number
}

export type ProductUpdatePayload = ProductPayload & Pick<Product, 'id'>

export function getProductList(params: Partial<ProductQuery>) {
    return get<PageData<Product>>('/v1/product/list', { ...params })
}

export function getProductDetail(params: Pick<Product, 'id'>) {
    return get<Product>('/v1/product/detail', params)
}

export function createProduct(data: ProductPayload) {
    return post<unknown>('/v1/product/create', data)
}

export function updateProduct(data: ProductUpdatePayload) {
    return post<unknown>('/v1/product/update', data)
}

export function deleteProduct(id: number | string) {
    return post<unknown>('/v1/product/delete', { id })
}
