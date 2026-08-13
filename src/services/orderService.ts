/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order, OrderStatus, OrderOrigin, PaymentStatus } from './storage/types';
import { ordersRepository } from './storage';

/**
 * Validates if a transition from currentStatus to nextStatus is allowed according to business logic.
 */
export function canTransitionOrderStatus(currentStatus: OrderStatus, nextStatus: OrderStatus): boolean {
  if (currentStatus === nextStatus) return false;

  switch (currentStatus) {
    case 'DRAFT':
      return nextStatus === 'PENDING' || nextStatus === 'CANCELLED';
    case 'PENDING':
      return nextStatus === 'CONFIRMED' || nextStatus === 'PREPARING' || nextStatus === 'CANCELLED';
    case 'CONFIRMED':
      return nextStatus === 'PREPARING' || nextStatus === 'CANCELLED';
    case 'PREPARING':
      return nextStatus === 'READY' || nextStatus === 'CANCELLED';
    case 'READY':
      return (
        nextStatus === 'OUT_FOR_DELIVERY' ||
        nextStatus === 'DELIVERED' ||
        nextStatus === 'COMPLETED' ||
        nextStatus === 'CANCELLED'
      );
    case 'OUT_FOR_DELIVERY':
      return nextStatus === 'DELIVERED' || nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED';
    case 'DELIVERED':
      return nextStatus === 'COMPLETED' || nextStatus === 'CANCELLED';
    case 'COMPLETED':
    case 'CANCELLED':
      return false; // Terminal states
    default:
      return false;
  }
}

export interface TransitionAction {
  nextStatus: OrderStatus;
  label: string;
  buttonClass: string;
}

/**
 * Retrieves available status transition actions for a given order.
 */
export function getAvailableTransitions(order: Order): TransitionAction[] {
  const actions: TransitionAction[] = [];
  const status = order.status;

  if (status === 'PENDING') {
    actions.push({
      nextStatus: 'CONFIRMED',
      label: 'Confirmar Pedido',
      buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white font-extrabold',
    });
    actions.push({
      nextStatus: 'PREPARING',
      label: 'Enviar Direto p/ Preparo',
      buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold',
    });
    actions.push({
      nextStatus: 'CANCELLED',
      label: 'Cancelar Pedido',
      buttonClass: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium',
    });
  } else if (status === 'CONFIRMED') {
    actions.push({
      nextStatus: 'PREPARING',
      label: 'Enviar p/ Preparo',
      buttonClass: 'bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold',
    });
    actions.push({
      nextStatus: 'CANCELLED',
      label: 'Cancelar Pedido',
      buttonClass: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium',
    });
  } else if (status === 'PREPARING') {
    actions.push({
      nextStatus: 'READY',
      label: 'Marcar como Pronto',
      buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white font-extrabold',
    });
    actions.push({
      nextStatus: 'CANCELLED',
      label: 'Cancelar Pedido',
      buttonClass: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium',
    });
  } else if (status === 'READY') {
    if (order.origin === 'DELIVERY' || order.fulfillmentType === 'DELIVERY') {
      actions.push({
        nextStatus: 'OUT_FOR_DELIVERY',
        label: 'Saiu para Entrega',
        buttonClass: 'bg-purple-600 hover:bg-purple-700 text-white font-extrabold',
      });
      actions.push({
        nextStatus: 'COMPLETED',
        label: 'Concluir Pedido',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold',
      });
    } else {
      actions.push({
        nextStatus: 'COMPLETED',
        label: 'Concluir Pedido',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold',
      });
    }
    actions.push({
      nextStatus: 'CANCELLED',
      label: 'Cancelar Pedido',
      buttonClass: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium',
    });
  } else if (status === 'OUT_FOR_DELIVERY') {
    actions.push({
      nextStatus: 'DELIVERED',
      label: 'Marcar como Entregue',
      buttonClass: 'bg-teal-600 hover:bg-teal-700 text-white font-extrabold',
    });
    actions.push({
      nextStatus: 'COMPLETED',
      label: 'Concluir Pedido',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold',
    });
    actions.push({
      nextStatus: 'CANCELLED',
      label: 'Cancelar Pedido',
      buttonClass: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-medium',
    });
  } else if (status === 'DELIVERED') {
    actions.push({
      nextStatus: 'COMPLETED',
      label: 'Concluir Pedido',
      buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold',
    });
  }

  return actions;
}

/**
 * Returns label, color styling and info for OrderOrigin.
 */
export function getOrderOriginConfig(origin: OrderOrigin): { label: string; colorClass: string } {
  switch (origin) {
    case 'CATALOG':
      return { label: 'Catálogo', colorClass: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'TABLE':
      return { label: 'Mesa', colorClass: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'COUNTER':
      return { label: 'Balcão', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'DELIVERY':
      return { label: 'Delivery', colorClass: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'WHATSAPP':
      return { label: 'WhatsApp', colorClass: 'bg-green-50 text-green-700 border-green-200' };
    case 'INTERNAL':
      return { label: 'Interno', colorClass: 'bg-slate-100 text-slate-700 border-slate-300' };
    default:
      return { label: origin, colorClass: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

/**
 * Returns label and color styling for OrderStatus.
 */
export function getOrderStatusConfig(status: OrderStatus): { label: string; colorClass: string } {
  switch (status) {
    case 'DRAFT':
      return { label: 'Rascunho', colorClass: 'bg-slate-100 text-slate-700 border-slate-200' };
    case 'PENDING':
      return { label: 'Pendente', colorClass: 'bg-amber-100 text-amber-900 border-amber-300' };
    case 'CONFIRMED':
      return { label: 'Confirmado', colorClass: 'bg-blue-100 text-blue-900 border-blue-300' };
    case 'PREPARING':
      return { label: 'Em Preparo', colorClass: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
    case 'READY':
      return { label: 'Pronto', colorClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
    case 'OUT_FOR_DELIVERY':
      return { label: 'Saiu p/ Entrega', colorClass: 'bg-purple-100 text-purple-900 border-purple-300' };
    case 'DELIVERED':
      return { label: 'Entregue', colorClass: 'bg-teal-100 text-teal-900 border-teal-300' };
    case 'COMPLETED':
      return { label: 'Concluído', colorClass: 'bg-green-100 text-green-900 border-green-300' };
    case 'CANCELLED':
      return { label: 'Cancelado', colorClass: 'bg-red-100 text-red-900 border-red-300' };
    default:
      return { label: status, colorClass: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
}

/**
 * Returns label and color styling for PaymentStatus.
 */
export function getPaymentStatusConfig(paymentStatus: PaymentStatus): { label: string; colorClass: string } {
  switch (paymentStatus) {
    case 'PENDING':
      return { label: 'Pend. Pagamento', colorClass: 'bg-amber-50 text-amber-800 border-amber-200' };
    case 'PARTIAL':
      return { label: 'Pag. Parcial', colorClass: 'bg-blue-50 text-blue-800 border-blue-200' };
    case 'PAID':
      return { label: 'Pago', colorClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    case 'REFUNDED':
      return { label: 'Reembolsado', colorClass: 'bg-purple-50 text-purple-800 border-purple-200' };
    case 'CANCELLED':
      return { label: 'Cancelado', colorClass: 'bg-red-50 text-red-800 border-red-200' };
    default:
      return { label: paymentStatus, colorClass: 'bg-slate-50 text-slate-700 border-slate-200' };
  }
}

/**
 * Safely executes order status changes with re-fetching and concurrency checks.
 */
export async function changeOrderStatusSafely(orderId: string, nextStatus: OrderStatus): Promise<Order> {
  const freshOrder = await ordersRepository.getById(orderId);
  if (!freshOrder) {
    throw new Error('Pedido não encontrado no IndexedDB.');
  }

  if (!canTransitionOrderStatus(freshOrder.status, nextStatus)) {
    throw new Error(`Transição inválida de status: ${freshOrder.status} -> ${nextStatus}`);
  }

  const now = new Date().toISOString();
  freshOrder.status = nextStatus;
  freshOrder.updatedAt = now;

  if (nextStatus === 'COMPLETED') {
    freshOrder.completedAt = now;
  } else if (nextStatus === 'CANCELLED') {
    freshOrder.cancelledAt = now;
  }

  // Update order in IndexedDB (automatically handles outbox + KDS ticket synchronization)
  await ordersRepository.update(freshOrder);

  return freshOrder;
}
